import * as THREE from 'three';

/**
 * SegmentBuilders.js
 * 3D procedural architectural builders for the authentic Bangalore commute:
 * 1. Sobha Sentosa Residential Community Exit
 * 2. Local Panathur High Street & Kannada Shops
 * 3. Panathur Railway Underpass & Retaining Walls
 * 4. Outer Ring Road Highway Corridor & Signal Gantry
 * 5. RMZ Ecospace Business Park Arrival Campus
 */

// Helper to create high-resolution text canvas textures
function createTextTexture(text, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = options.width || 512;
  canvas.height = options.height || 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = options.bg || '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (options.border) {
    ctx.strokeStyle = options.borderColor || '#f59e0b';
    ctx.lineWidth = options.borderWidth || 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  }

  ctx.fillStyle = options.textColor || '#ffffff';
  ctx.font = options.font || 'bold 36px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  if (options.subText) {
    ctx.font = options.subFont || 'bold 18px "Segoe UI", sans-serif';
    ctx.fillStyle = options.subColor || '#cbd5e1';
    ctx.fillText(options.subText, canvas.width / 2, canvas.height / 2 + 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─── 1. SOBHA SENTOSA RESIDENTIAL EXIT (0 - 500m) ───────────────────────────
export function createSobhaSentosaGate(z = 15) {
  const group = new THREE.Group();
  group.position.set(0, 0, z);

  // Grand Entrance Pillars (Travertine stone & beige stucco)
  const pillarGeo = new THREE.BoxGeometry(1.6, 6.5, 1.6);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xdfd7cb, roughness: 0.85 });

  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.set(-8.5, 3.25, 0);
  leftPillar.castShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  rightPillar.position.set(8.5, 3.25, 0);
  rightPillar.castShadow = true;
  group.add(rightPillar);

  // Overhead Arch
  const archGeo = new THREE.BoxGeometry(18.6, 1.2, 1.4);
  const archMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.2 });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, 6.2, 0);
  group.add(arch);

  // Large Arch Sign: "SOBHA SENTOSA"
  const signTex = createTextTexture('SOBHA SENTOSA', {
    bg: '#0f172a',
    textColor: '#f8fafc',
    subText: 'PANATHUR, BENGALURU // RESIDENTIAL EXIT',
    subColor: '#38bdf8',
    borderColor: '#38bdf8',
    border: true
  });
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10.5, 1.6),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, 6.2, 0.72);
  group.add(signMesh);

  // Security Guard Cabin on the left
  const cabinGeo = new THREE.BoxGeometry(2.8, 3.2, 3.2);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-10.8, 1.6, 2.5);
  cabin.castShadow = true;
  group.add(cabin);

  // Security Glass window
  const glassMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 })
  );
  glassMesh.position.set(-9.38, 1.8, 2.5);
  glassMesh.rotation.y = Math.PI / 2;
  group.add(glassMesh);

  // Exit Boom Barrier (Red/White stripes)
  const barrierPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 7.5, 12);
  const barrierPoleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
  const barrierPole = new THREE.Mesh(barrierPoleGeo, barrierPoleMat);
  barrierPole.rotation.z = Math.PI / 2;
  barrierPole.position.set(-4.5, 1.1, 0.4);
  group.add(barrierPole);

  // Background Apartment Highrises (Sobha towers)
  [-24, 24].forEach((sideX, i) => {
    const towerGeo = new THREE.BoxGeometry(18, 48, 20);
    const towerMat = new THREE.MeshStandardMaterial({
      color: i === 0 ? 0xd4c5b9 : 0xb8a898,
      roughness: 0.85
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(sideX, 24, 35 + i * 25);
    group.add(tower);

    // Balconies
    for (let floor = 4; floor < 44; floor += 4) {
      const balcGeo = new THREE.BoxGeometry(4.5, 0.8, 1.2);
      const balcMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const balc = new THREE.Mesh(balcGeo, balcMat);
      balc.position.set(sideX > 0 ? sideX - 9 : sideX + 9, floor, 35 + i * 25);
      group.add(balc);
    }
  });

  return group;
}

// ─── 2. LOCAL PANATHUR HIGH STREET & SHOPS (500 - 1200m) ────────────────────
export function createSpeedBreaker(x = 0, z = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  // Rounded rubber/asphalt hump geometry across lane (width 3.6m, depth 1.2m, height 0.18m)
  const humpGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.6, 16, 1, false, 0, Math.PI);
  const humpMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const hump = new THREE.Mesh(humpGeo, humpMat);
  hump.rotation.z = Math.PI / 2;
  hump.rotation.x = -Math.PI / 2;
  group.add(hump);

  // Yellow warning stripes on speed breaker
  const stripeGeo = new THREE.PlaneGeometry(0.35, 1.1);
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  [-1.2, -0.4, 0.4, 1.2].forEach(dx => {
    const stripe = new THREE.Mesh(stripeGeo, yellowMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(dx, 0.12, 0);
    group.add(stripe);
  });

  return group;
}

export function createKannadaShop(side = 1, z = 0, type = 'nandini', engine = null) {
  const group = new THREE.Group();
  const sideX = side * 10.5;
  group.position.set(sideX, 0, z);

  // 3D Indian Shop Model
  if (engine && engine.createRoadsideBuilding) {
    const shop3D = engine.createRoadsideBuilding('shop', side);
    group.add(shop3D);
  } else {
    // Fallback Building Block
    const bldgGeo = new THREE.BoxGeometry(4.8, 5.2, 6.2);
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
    const bldg = new THREE.Mesh(bldgGeo, bldgMat);
    bldg.position.y = 2.6;
    group.add(bldg);
  }

  // Shop Signboard with Kannada + English text
  let titleText = 'NANDINI MILK';
  let subText = 'NANDINI MILK PARLOUR';
  let bgColor = '#1d4ed8'; // Blue for Nandini
  let textColor = '#ffffff';

  if (type === 'bakery') {
    titleText = 'SRI SAI BAKERY';
    subText = 'SRI SAI BAKERY & SWEETS';
    bgColor = '#b91c1c';
  } else if (type === 'kaapi') {
    titleText = 'BENGALURU FILTER COFFEE';
    subText = 'AUTHENTIC FILTER COFFEE & TIFFIN';
    bgColor = '#78350f';
  }

  const signTex = createTextTexture(titleText, {
    width: 384,
    height: 128,
    bg: bgColor,
    textColor: textColor,
    subText: subText,
    font: 'bold 28px "Segoe UI", sans-serif',
    subFont: 'bold 15px "Segoe UI", sans-serif'
  });

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.2),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(side > 0 ? -2.42 : 2.42, 3.8, 0);
  signMesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  group.add(signMesh);

  // Shop Awning / Chajja
  const awningGeo = new THREE.BoxGeometry(1.2, 0.15, 4.4);
  const awningMat = new THREE.MeshStandardMaterial({
    color: type === 'nandini' ? 0x2563eb : (type === 'bakery' ? 0xdc2626 : 0x92400e)
  });
  const awning = new THREE.Mesh(awningGeo, awningMat);
  awning.position.set(side > 0 ? -2.6 : 2.6, 3.1, 0);
  group.add(awning);

  // Concrete Utility Pole with hanging black cables
  const poleGeo = new THREE.CylinderGeometry(0.14, 0.18, 7.8, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(side > 0 ? -4.2 : 4.2, 3.9, 3.2);
  group.add(pole);

  return group;
}

// ─── 3. PANATHUR RAILWAY UNDERPASS (1200 - 1800m) ───────────────────────────
export function createPanathurUnderpass(z = 0, length = 130) {
  const group = new THREE.Group();
  group.position.set(0, 0, z);

  // Weathered Concrete materials for Bangalore railway underpass
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x52525b, // Heavy weathered Bangalore railway concrete
    roughness: 0.95,
    metalness: 0.05
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46, // Darker smoke-stained ceiling
    roughness: 0.98,
    metalness: 0.02
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.8
  });

  // 1. Concrete Retaining Walls on Left and Right (height: 5.6m)
  const wallGeo = new THREE.BoxGeometry(1.2, 5.6, length);

  const leftWall = new THREE.Mesh(wallGeo, wallMat);
  leftWall.position.set(-7.4, 2.8, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, wallMat);
  rightWall.position.set(7.4, 2.8, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // 2. Continuous Overhead Tunnel Roof / Ceiling Slab (Enclosed Underpass Experience!)
  const roofGeo = new THREE.BoxGeometry(16.0, 0.7, length);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 5.65, 0);
  roof.receiveShadow = true;
  group.add(roof);

  // 3. Transverse Structural Concrete Ceiling Girders & Side Pilasters every 14m
  const ribGeo = new THREE.BoxGeometry(14.8, 0.55, 1.4);
  const pilasterGeo = new THREE.BoxGeometry(0.5, 5.4, 1.2);
  const hazardPillarMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });

  for (let rz = -length / 2 + 10; rz <= length / 2 - 10; rz += 14) {
    // Ceiling girder beam
    const rib = new THREE.Mesh(ribGeo, wallMat);
    rib.position.set(0, 5.25, rz);
    group.add(rib);

    // Left pilaster
    const leftPilaster = new THREE.Mesh(pilasterGeo, wallMat);
    leftPilaster.position.set(-6.7, 2.7, rz);
    group.add(leftPilaster);

    // Right pilaster
    const rightPilaster = new THREE.Mesh(pilasterGeo, wallMat);
    rightPilaster.position.set(6.7, 2.7, rz);
    group.add(rightPilaster);

    // Hazard yellow/black striping at column base
    const colBaseGeo = new THREE.BoxGeometry(0.55, 1.2, 1.25);
    const leftBase = new THREE.Mesh(colBaseGeo, hazardPillarMat);
    leftBase.position.set(-6.68, 0.6, rz);
    group.add(leftBase);

    const rightBase = new THREE.Mesh(colBaseGeo, hazardPillarMat);
    rightBase.position.set(6.68, 0.6, rz);
    group.add(rightBase);
  }

  // 4. Yellow & Black Hazard Chevron Warning Bands along wall bases
  const chevronGeo = new THREE.PlaneGeometry(0.75, length);
  const chevronCanvas = document.createElement('canvas');
  chevronCanvas.width = 128;
  chevronCanvas.height = 512;
  const cctx = chevronCanvas.getContext('2d');
  cctx.fillStyle = '#eab308'; // Bangalore Hazard Yellow
  cctx.fillRect(0, 0, 128, 512);
  cctx.fillStyle = '#09090b'; // Black Chevrons
  for (let y = -64; y < 512; y += 64) {
    cctx.beginPath();
    cctx.moveTo(0, y);
    cctx.lineTo(128, y + 48);
    cctx.lineTo(128, y + 80);
    cctx.lineTo(0, y + 32);
    cctx.closePath();
    cctx.fill();
  }
  const chevronTex = new THREE.CanvasTexture(chevronCanvas);
  chevronTex.wrapS = THREE.RepeatWrapping;
  chevronTex.wrapT = THREE.RepeatWrapping;
  chevronTex.repeat.set(1, length / 12);

  const leftChevron = new THREE.Mesh(chevronGeo, new THREE.MeshBasicMaterial({ map: chevronTex }));
  leftChevron.rotation.y = Math.PI / 2;
  leftChevron.position.set(-6.78, 1.2, 0);
  group.add(leftChevron);

  const rightChevron = new THREE.Mesh(chevronGeo, new THREE.MeshBasicMaterial({ map: chevronTex }));
  rightChevron.rotation.y = -Math.PI / 2;
  rightChevron.position.set(6.78, 1.2, 0);
  group.add(rightChevron);

  // 5. Massive Overhead South Western Railway Bridge (Crossing over the center at z = 0)
  const bridgeDeckGeo = new THREE.BoxGeometry(16.8, 3.2, 28);
  const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }));
  bridgeDeck.position.set(0, 7.3, 0);
  group.add(bridgeDeck);

  // Ballast stone gravel bed
  const ballastGeo = new THREE.BoxGeometry(11.0, 0.4, 27.6);
  const ballastMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.95 });
  const ballast = new THREE.Mesh(ballastGeo, ballastMat);
  ballast.position.set(0, 8.95, 0);
  group.add(ballast);

  // Twin Steel Railway Tracks across bridge
  const railGeo = new THREE.BoxGeometry(0.12, 0.22, 27.6);
  const trackSteelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  [-2.8, -1.8, 1.8, 2.8].forEach(rx => {
    const rail = new THREE.Mesh(railGeo, trackSteelMat);
    rail.position.set(rx, 9.2, 0);
    group.add(rail);
  });

  // Railway sleepers (cross-ties)
  const sleeperGeo = new THREE.BoxGeometry(3.2, 0.16, 0.4);
  const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
  for (let sz = -13; sz <= 13; sz += 1.2) {
    [-2.3, 2.3].forEach(sx => {
      const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.set(sx, 9.1, sz);
      group.add(sleeper);
    });
  }

  // 6. Authentic Indian Railways Passenger Train on the Bridge!
  const trainGroup = new THREE.Group();
  trainGroup.position.set(2.3, 9.3, 0);

  // Red & Cream WAP-7 Locomotive
  const locoBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 3.4, 11.5),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 }) // Indian Railways Red
  );
  locoBody.position.set(0, 1.9, 0);
  trainGroup.add(locoBody);

  // White center stripe on locomotive
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.04, 0.4, 11.52),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  stripe.position.set(0, 1.9, 0);
  trainGroup.add(stripe);

  // Pantograph on locomotive roof
  const pantoGeo = new THREE.BoxGeometry(1.6, 1.2, 1.8);
  const panto = new THREE.Mesh(pantoGeo, steelMat);
  panto.position.set(0, 4.0, 3.0);
  trainGroup.add(panto);

  // Indian Railways emblem sign on locomotive
  const trainSignTex = createTextTexture('INDIAN RAILWAYS', {
    bg: '#991b1b',
    textColor: '#fef08a',
    subText: 'WAP-7 30201 • SOUTH WESTERN RAILWAY • BENGALURU',
    subColor: '#ffffff',
    borderColor: '#fef08a',
    border: true,
    width: 512,
    height: 128
  });
  const trainSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 1.6),
    new THREE.MeshBasicMaterial({ map: trainSignTex })
  );
  trainSign.position.set(-1.54, 2.1, 0);
  trainSign.rotation.y = -Math.PI / 2;
  trainGroup.add(trainSign);

  group.add(trainGroup);

  // 7. Height Restriction Steel Gantry Portals at Entrance and Exit
  [-length / 2, length / 2].forEach((portalZ, pIdx) => {
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, portalZ);

    // Heavy concrete portal arch
    const archTop = new THREE.Mesh(
      new THREE.BoxGeometry(16.8, 1.8, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 })
    );
    archTop.position.set(0, 5.8, 0);
    portalGroup.add(archTop);

    // Yellow & Black diagonal striped height restriction beam
    const gantryBeam = new THREE.Mesh(
      new THREE.BoxGeometry(14.8, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.6 })
    );
    gantryBeam.position.set(0, 4.25, pIdx === 0 ? -1.2 : 1.2);
    portalGroup.add(gantryBeam);

    // Height Warning Signboard
    const signTex = createTextTexture('⚠️ PANATHUR RAILWAY UNDERPASS', {
      bg: '#dc2626',
      textColor: '#ffffff',
      subText: 'MAX CLEARANCE 3.2M // SOUTH WESTERN RAILWAY // NO HEAVY VEHICLES',
      subColor: '#fef08a',
      borderColor: '#fef08a',
      border: true,
      width: 512,
      height: 128
    });
    const portalSign = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 1.5),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    portalSign.position.set(0, 5.6, pIdx === 0 ? -1.3 : 1.3);
    if (pIdx > 0) portalSign.rotation.y = Math.PI;
    portalGroup.add(portalSign);

    group.add(portalGroup);
  });

  // 8. Warm Sodium Tunnel Lamps along Ceiling with Light Pools
  for (let lz = -length / 2 + 15; lz <= length / 2 - 15; lz += 18) {
    [-6.3, 6.3].forEach(lx => {
      // Light housing fixture
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.2, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      fixture.position.set(lx, 5.0, lz);
      group.add(fixture);

      // Warm sodium amber point light
      const light = new THREE.PointLight(0xf59e0b, 1.6, 18);
      light.position.set(lx > 0 ? 4.8 : -4.8, 4.6, lz);
      group.add(light);
    });
  }

  // 9. Bangalore Monsoon Water Puddles (Iconic Panathur Underpass Waterlogging)
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85
  });

  [-35, 0, 35].forEach((pz, i) => {
    const puddle = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 8.5),
      puddleMat
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(i % 2 === 0 ? -2.2 : 2.2, 0.02, pz);
    group.add(puddle);

    // Drainage grate on side curb
    const grate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.4 })
    );
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(i % 2 === 0 ? -6.2 : 6.2, 0.03, pz);
    group.add(grate);
  });

  return group;
}

// ─── 4. OUTER RING ROAD TRAFFIC SIGNAL JUNCTION (1800 - 2600m) ──────────────
export function createTrafficSignalJunction(z = 0) {
  const group = new THREE.Group();
  group.position.set(0, 0, z);

  // Heavy Green Steel Gantry Frame across road
  const gantryMat = new THREE.MeshStandardMaterial({ color: 0x166534, metalness: 0.4, roughness: 0.6 });
  const postGeo = new THREE.CylinderGeometry(0.24, 0.28, 8.5, 12);

  const leftPost = new THREE.Mesh(postGeo, gantryMat);
  leftPost.position.set(-7.5, 4.25, 0);
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, gantryMat);
  rightPost.position.set(7.5, 4.25, 0);
  group.add(rightPost);

  const crossBeamGeo = new THREE.BoxGeometry(15.8, 0.6, 0.6);
  const crossBeam = new THREE.Mesh(crossBeamGeo, gantryMat);
  crossBeam.position.set(0, 8.2, 0);
  group.add(crossBeam);

  // ORR Bellandur Highway Direction Board
  const dirSignTex = createTextTexture('OUTER RING ROAD (ORR)', {
    bg: '#15803d',
    textColor: '#ffffff',
    subText: 'BELLANDUR ➔ ECOSPACE TECH PARK (800M)',
    subColor: '#fef08a',
    borderColor: '#ffffff',
    border: true
  });
  const dirSign = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 1.8),
    new THREE.MeshBasicMaterial({ map: dirSignTex })
  );
  dirSign.position.set(0, 7.8, -0.32);
  group.add(dirSign);

  // 3-Aspect Traffic Signal Heads for each lane (Left, Center, Right)
  const signalHeads = [];
  [-3.8, 0, 3.8].forEach(laneX => {
    const headGroup = new THREE.Group();
    headGroup.position.set(laneX, 6.2, -0.4);

    // Black housing
    const boxGeo = new THREE.BoxGeometry(0.7, 1.8, 0.45);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    headGroup.add(box);

    // Red lens (top)
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
    const redLens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), redMat);
    redLens.rotation.x = Math.PI / 2;
    redLens.position.set(0, 0.52, -0.22);
    headGroup.add(redLens);

    // Amber lens (middle)
    const amberMat = new THREE.MeshStandardMaterial({
      color: 0x332200,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.2
    });
    const amberLens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), amberMat);
    amberLens.rotation.x = Math.PI / 2;
    amberLens.position.set(0, 0, -0.22);
    headGroup.add(amberLens);

    // Green lens (bottom)
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x003311,
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.2
    });
    const greenLens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), greenMat);
    greenLens.rotation.x = Math.PI / 2;
    greenLens.position.set(0, -0.52, -0.22);
    headGroup.add(greenLens);

    group.add(headGroup);
    signalHeads.push({ headGroup, redMat, amberMat, greenMat });
  });

  // Thick White Thermoplastic Stop Line on Road (at z = -6m before gantry)
  const stopLineGeo = new THREE.PlaneGeometry(12.5, 0.9);
  const stopLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const stopLine = new THREE.Mesh(stopLineGeo, stopLineMat);
  stopLine.rotation.x = -Math.PI / 2;
  stopLine.position.set(0, 0.02, -6);
  group.add(stopLine);

  return { group, signalHeads, stopLineZ: z - 6 };
}

// ─── 5. ECOSPACE ARRIVAL ZONE (2600 - 3000m) ─────────────────────────────────
export function createEcospaceArrivalCampus(z = 0, engine = null) {
  const group = new THREE.Group();
  group.position.set(0, 0, z);

  // Monumental Corporate Entrance Arch
  const pMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 });

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9.2, 2.2), pMat);
  leftPillar.position.set(-8.8, 4.6, 0);
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9.2, 2.2), pMat);
  rightPillar.position.set(8.8, 4.6, 0);
  group.add(rightPillar);

  const topArch = new THREE.Mesh(new THREE.BoxGeometry(19.8, 1.8, 2.4), pMat);
  topArch.position.set(0, 8.8, 0);
  group.add(topArch);

  // Monumental Illuminated 3D Signboard: "ECOSPACE BUSINESS PARK"
  const ecoSignTex = createTextTexture('ECOSPACE BUSINESS PARK', {
    bg: '#0284c7', // RMZ Ecospace Cyan-Blue
    textColor: '#ffffff',
    subText: 'BELLANDUR, OUTER RING ROAD // GATE 1 PUNCH-IN ENTRY',
    subColor: '#bae6fd',
    borderColor: '#ffffff',
    border: true
  });
  const ecoSignMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12.8, 2.2),
    new THREE.MeshBasicMaterial({ map: ecoSignTex })
  );
  ecoSignMesh.position.set(0, 8.8, 1.25);
  group.add(ecoSignMesh);

  // Monumental 3D Main Destination Office Headquarters (RMZ Ecospace Main Building)
  if (engine && engine.createMainBuildingInstance) {
    const mainBuilding = engine.createMainBuildingInstance();
    // Positioned right behind the arrival line as the grand destination
    mainBuilding.position.set(0, 0, 42);
    mainBuilding.rotation.y = Math.PI; // Face approaching player
    group.add(mainBuilding);

    // Flanking campus wings using 3D Regional Office
    if (engine.createRoadsideBuilding) {
      const leftWing = engine.createRoadsideBuilding('office', -1);
      leftWing.position.set(-28, 0, 38);
      group.add(leftWing);

      const rightWing = engine.createRoadsideBuilding('office', 1);
      rightWing.position.set(28, 0, 38);
      group.add(rightWing);
    }
  } else {
    // Fallback if engine is not provided
    [-28, 28].forEach((sideX, i) => {
      const towerGeo = new THREE.BoxGeometry(26, 52, 32);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.85
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(sideX, 26, 40 + i * 20);
      group.add(tower);
    });
  }

  // Checkered Arrival Finish Line on Asphalt
  const finishLineCanvas = document.createElement('canvas');
  finishLineCanvas.width = 512;
  finishLineCanvas.height = 128;
  const fctx = finishLineCanvas.getContext('2d');
  const sq = 32;
  for (let x = 0; x < 512; x += sq) {
    for (let y = 0; y < 128; y += sq) {
      fctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#ffffff' : '#0f172a';
      fctx.fillRect(x, y, sq, sq);
    }
  }
  const finishTex = new THREE.CanvasTexture(finishLineCanvas);
  const finishMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12.8, 2.4),
    new THREE.MeshBasicMaterial({ map: finishTex })
  );
  finishMesh.rotation.x = -Math.PI / 2;
  finishMesh.position.set(0, 0.025, 4.5);
  group.add(finishMesh);

  return group;
}
