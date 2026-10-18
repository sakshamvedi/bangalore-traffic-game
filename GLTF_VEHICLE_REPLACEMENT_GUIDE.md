# GLTF Vehicle Pipeline & Optimization Guide
## Blueprint for Adding 3D Vehicles (BMTC Bus, Auto-Rickshaw, Cabs) in Subway Surfers

When importing raw 3D models (from Sketchfab, Blender, TurboSquid, etc.), models often come with hundreds of thousands of internal polygons (engine blocks, seat upholstery, screws, pedals, airbags) and dozens of unmerged draw calls that cause browser WebGL lag.

Here is the exact battle-tested pipeline used to optimize the **2024 Kia Picanto GT-Line** from **458,000 polygons / 354 draw calls** down to **~85,000 polygons / 16 draw calls** running at a locked **60 FPS**.

---

### Phase 1: High-Poly Ingestion & Interior Pruning
Raw models contain massive invisible interior geometry that is never seen from the third-person gameplay camera.

**How to filter on load:**
```javascript
const isInteriorRegex = /int_|interior|seat|carpet|stitch|pedal|console|engine|gear|speaker|dial|airbag|boot_static|wiper_in|mirror_in|fabrics|steeringwheel|caliper|discbrake/i;

const interiorNodes = [];
root.traverse((child) => {
  let curr = child;
  let isInt = false;
  while (curr && curr !== root) {
    if (isInteriorRegex.test(curr.name)) {
      isInt = true;
      break;
    }
    curr = curr.parent;
  }
  if (isInt && child.parent) {
    interiorNodes.push(child);
  }
});

// Detach & dispose
interiorNodes.forEach((node) => {
  if (node.parent) node.parent.remove(node);
  if (node.geometry) node.geometry.dispose();
});
```

---

### Phase 2: Geometry Merging by Material (`BufferGeometryUtils`)
Instead of having 50 separate draw calls for 50 separate body panels, group all exterior meshes by material and merge them into a single geometry per material.

```javascript
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// 1. Group exterior meshes by material
const materialBuckets = new Map();
// 2. Normalize attributes before merging (position, normal, uv)
geom.deleteAttribute('color');
geom.deleteAttribute('tangent');
geom.deleteAttribute('uv2');
if (!geom.attributes.uv && geom.attributes.position) {
  geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geom.attributes.position.count * 2), 2));
}

// 3. Merge geometries
const mergedGeom = BufferGeometryUtils.mergeGeometries(bucket.geometries, false);
const mergedMesh = new THREE.Mesh(mergedGeom, mat);
bodyGroup.add(mergedMesh);
```

---

### Phase 3: Shadow Map Optimization (The 95% GPU Saver)
**Never enable `castShadow = true` on every sub-mesh!**
- Only enable `castShadow = true` on:
  1. The merged exterior body paint shell.
  2. The 4 road wheels.
- Set `castShadow = false` on glass, chrome trims, grills, and lights.
- This cuts directional light shadow passes from 350+ passes down to only 5 passes per vehicle!

---

### Phase 4: Wheel Isolation & Active Spinning Physics
To make vehicles look actively alive and driving (not stationary):
1. **Isolate Wheel Roots**: Detach the wheels into dedicated container groups (`Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR`).
2. **Assign to Obstacle**:
   ```javascript
   obs.wheelMeshes = carMesh.userData.wheelMeshes;
   obs.wheelRadius = 0.32; // meters
   ```
3. **Animate in Game Loop**:
   ```javascript
   if (obs.wheelMeshes && obs.wheelMeshes.length > 0) {
     const spin = deltaZ / (obs.wheelRadius || 0.4);
     obs.wheelMeshes.forEach(w => {
       w.rotation.x -= spin;
     });
   }
   ```
4. **Subtle Engine / Road Suspension Vibration**:
   ```javascript
   if (!obs.isStationary && obs.mesh) {
     obs.mesh.position.y = (obs.baseY || 0) + Math.sin(this.runTimer * 16 + (obs.z || 0) * 0.2) * 0.015;
   }
   ```

---

### Phase 5: Dynamic Traffic Speeds
To eliminate the perception of "cars look stationary":
- **Oncoming Traffic (`isOncoming: true`)**:
  - `speed = +18` (moves towards player).
  - Headlights illuminated (`emissive: 0xffffff, emissiveIntensity: 2.0`).
  - Total closing velocity = Player speed (26) + Car speed (18) = **44 units/sec**.
- **Cruising Forward Traffic (`isOncoming: false, isStationary: false`)**:
  - `speed = -14` (cruising forward down the road).
  - Glowing red taillights (`emissive: 0xef4444, emissiveIntensity: 1.8`).
  - If player brakes, the car visibly pulls ahead into the distance!
- **Stationary Queues (`isStationary: true`)**:
  - Only spawn in designated queues (Signal Red Light at 2150m, Panathur Underpass bottleneck).
  - Accelerate forward when signal turns green.

---

### How to Apply This to BMTC Bus & Auto-Rickshaw Next:

1. **Auto-Rickshaw (Bajaj / Piaggio 3-Wheeler)**:
   - Target size: Length ~2.6m, Width ~1.4m, Height ~1.8m.
   - Wheels: 3 wheels (`frontWheel`, `rearLeft`, `rearRight`).
   - Materials: Yellow top roof (`#f59e0b`), Green lower body (`#15803d`), Fare meter glowing red.
2. **BMTC Electric Bus (Tata Starbus / Ashok Leyland)**:
   - Target size: Length ~11.2m, Width ~2.8m, Height ~3.65m.
   - Wheels: 4 or 6 wheels (Front axle, dual rear axle).
   - Roof coins: Coins spawned on top of the bus roof for jump-on mechanics (`y = 3.8m`).
   - Destination LED sign board ("500D • ITPL ⇄ BANASHANKARI").
