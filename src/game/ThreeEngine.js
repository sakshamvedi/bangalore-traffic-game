/**
 * Subway Surfers: Namma Bengaluru Edition - Full 3D WebGL Engine (Three.js)
 * 
 * Features:
 * - 3D Commuter Rider (Young Indian male, 24-27 yrs, office polo shirt, jeans, sneakers, backpack, helmet)
 * - 3D Modern Bangalore Commuter Scooty (Ather/Activa inspired, aerodynamic apron, LED headlight, mirrors, digital dash, rotating alloy wheels)
 * - Realistic seated riding posture: both hands firmly gripping handlebars, feet flat on footboard
 * - Dynamic Smoke & Exhaust puff particle system emitting behind scooty
 * - Correct intuitive controls: Right goes RIGHT and banks right; Left goes LEFT and banks left
 * - Bangalore Traffic:
 *   - Variant A: BMTC Electric Bus (Royal Blue & White, electronic 500D ITPL display, moving in traffic with spinning wheels)
 *   - Oncoming commuter scooters coming from the front
 *   - Yellow-and-Green Auto-Rickshaws
 *   - White Airport Cabs
 *   - Prominent High-Visibility Potholes with yellow hazard warning spray rings & reflective puddles
 *   - BBMP Barricades & Low-hanging overhead fiber cables
 * - Kannada Highway Gantry signs & Roadside Tea Stalls
 * - Primary Mission: "Monday Morning 9:00 AM. Reach the Office!" (3,000m countdown to EcoSpace Tech Park)
 * - Monumental Tech Park Entrance with lifting boom barrier & Victory screen
 */

import * as THREE from 'three';
import { USDLoader } from 'three/examples/jsm/loaders/USDLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { soundManager } from './AudioSynthesizer.js';
import { RouteManager } from './route/RouteManager.js';
import { createSpeedBreaker, createKannadaShop } from './route/SegmentBuilders.js';

export class ThreeEngine {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.callbacks = {
      onScoreUpdate: options.onScoreUpdate || (() => {}),
      onCoinsUpdate: options.onCoinsUpdate || (() => {}),
      onPowerupChange: options.onPowerupChange || (() => {}),
      onPowerupCollected: options.onPowerupCollected || (() => {}),
      onGameOver: options.onGameOver || (() => {}),
      onHoverboardCountChange: options.onHoverboardCountChange || (() => {}),
      onDistanceUpdate: options.onDistanceUpdate || (() => {}),
      onVictory: options.onVictory || (() => {}),
      onAssetsProgress: options.onAssetsProgress || (() => {})
    };

    this.width = containerElement.clientWidth || window.innerWidth;
    this.height = containerElement.clientHeight || window.innerHeight;

    // Lanes: 3 lanes
    // In Three.js with camera at -Z looking towards +Z:
    // Visual Left of screen = World +X (NDC x = -0.217)
    // Visual Center of screen = World 0 (NDC x = 0)
    // Visual Right of screen = World -X (NDC x = +0.217)
    this.laneWidth = 3.8;
    this.lanes = [this.laneWidth, 0, -this.laneWidth];

    // Primary Office Mission State
    this.targetOfficeDistance = 3000; // 3,000 meters to EcoSpace Tech Park
    this.distance = 0;
    this.runTimer = 0;
    this.officeSpawned = false;

    // Gameplay State
    this.gameState = 'ready'; // 'ready', 'playing', 'paused', 'gameover', 'victory'
    this.score = 0;
    this.coins = 0;
    this.multiplier = 10;
    this.baseSpeed = 26; // 3D units per second (~55 km/h)
    this.speed = this.baseSpeed;
    this.maxSpeed = 68; // ~85 km/h

    // Scooty Throttle & Braking Dynamics
    this.throttleInput = false;
    this.brakeInput = false;
    this.autoBrakeAssist = false;
    // Teams Incoming Call Alert on Pothole
    this.teamsCallToastTimer = 0;

    // 3D Commute Fleet Preloader & Model Caches (Maruti Alto, Auto Rickshaw, BMTC Bus, Pulsar Bike, Person Biker)
    this.isAssetsReady = false;
    this.modelsToLoad = 10;
    this.modelsLoadedCount = 0;
    this.altoModelTemplate = null;
    this.kiaModelTemplate = null;
    this.autoModelTemplate = null;
    this.busModelTemplate = null;
    this.pulsarModelTemplate = null;
    this.bikerModelTemplate = null;
    this.bikerModelInstance = null;
    this.bikerRiderNode = null;
    this.bikerRiderInitialRotX = 0;
    this.isLoadingBiker = false;
    this.mapleTreeTemplate = null;
    this.pendingMapleTrees = [];
    this.isLoadingMapleTree = false;

    // 3D Roadside & Destination Building Templates
    this.indianShopTemplate = null;
    this.cleanPlaceTemplate = null;
    this.regOfficeTemplate = null;
    this.mainBuildingTemplate = null;
    this.isLoadingIndianShop = false;
    this.isLoadingCleanPlace = false;
    this.isLoadingRegOffice = false;
    this.isLoadingMainBuilding = false;
    this.pendingRoadsideBuildings = [];
    this.pendingDestinationBuildings = [];
    this.pendingCleanShopBlockers = [];

    this.hondaModelTemplate = null;
    this.boygiModelTemplate = null;
    this.boygiRiderInstance = null;
    this.boygiSpineBone = null;
    this.proceduralRiderGroup = null;
    this.pendingAltoCabs = [];
    this.pendingKiaCabs = [];
    this.pendingAutoRickshaws = [];
    this.pendingBuses = [];
    this.pendingBikes = [];

    // Master Bangalore Route Manager
    this.routeManager = new RouteManager(this);

    this.hoverboardStock = 3;
    this.selectedBoard = 'ather';
    this.upgradeLevels = {
      magnet: 1,
      sneakers: 1,
      multiplier: 1,
      jetpack: 1
    };

    // Player State
    this.player = {
      lane: 1, // index 0, 1, 2 (1 = Center)
      x: 0,
      targetX: 0,
      y: 0,
      vy: 0,
      z: 0,
      isGrounded: true,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      hasHoverboard: false,
      hoverboardTimer: 0,
      hasMagnet: false,
      magnetTimer: 0,
      hasSneakers: false,
      sneakersTimer: 0,
      hasMultiplier: false,
      multiplierTimer: 0,
      hasJetpack: false,
      jetpackTimer: 0,
      invulnerableTimer: 0
    };

    // Chaser: Traffic Police Mama & Indie Dog
    this.chaser = {
      distance: 8.5,
      isLunge: false
    };

    // Three.js Core Objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.rafId = null;

    // Meshes & Entity Pools
    this.playerGroup = null;
    this.vehicleGroup = null;
    this.torsoGroup = null;
    this.headGroup = null;
    this.wheels = [];
    this.smokeParticles = [];
    this.smokeTimer = 0;

    this.chaserGroup = null;
    this.roadSegments = [];
    this.obstacles = []; // 3D buses, autos, cabs, oncoming scooters, potholes, barricades
    this.collectibles = []; // 3D ₹ coins, powerups
    this.billboardMeshes = [];
    this.decorations = [];

    // Camera shake & tilt
    this.cameraShake = 0;
    this.cameraTilt = 0;
    this.comboCounter = 0;
    this.lastCoinTime = 0;    // Dynamic Camera Presets (xFollow tracks player directly so scooty stays centered on screen!)
    this.cameraPresets = {
      chase: { y: 2.7, zOffset: -5.2, lookAtY: 1.15, lookAtZ: 12, xFollow: 0.92, yPlayerFactor: 0.35 },
      close: { y: 1.85, zOffset: -3.8, lookAtY: 0.95, lookAtZ: 10, xFollow: 0.94, yPlayerFactor: 0.3 },
      classic: { y: 4.5, zOffset: -6.8, lookAtY: 1.8, lookAtZ: 16, xFollow: 0.88, yPlayerFactor: 0.35 }
    };
    this.currentCameraPreset = 'chase';    // Street Gantry Signs
    this.gantrySigns = [
      { kannada: 'MARATHAHALLI', english: 'MARATHAHALLI', dist: '2.5 KM', arrow: '➔' },
      { kannada: 'SILK BOARD JN', english: 'SILK BOARD JN', dist: '1.8 KM', arrow: '➔' },
      { kannada: 'BELLANDUR (ORR)', english: 'BELLANDUR (ORR)', dist: '1.2 KM', arrow: '➔' },
      { kannada: 'MAHADEVAPURA', english: 'MAHADEVAPURA', dist: '800 M', arrow: '➔' },
      { kannada: 'WHITEFIELD IT CORRIDOR', english: 'WHITEFIELD IT CORRIDOR', dist: '3.0 KM', arrow: '➔' },
      { kannada: 'ECOSPACE TECH PARK', english: 'ECOSPACE TECH PARK', dist: '500 M', arrow: '⬆' }
    ];
    this.gantryIndex = 0;

    // Billboard Data: AI Startup quotes & city banners
    this.startupQuotes = [
      { brand: 'SARVAM AI', tag: 'INDIC LLM', text: 'Building Indic LLMs while waiting at Silk Board junction.', color: '#0077b6' },
      { brand: 'NAMMA EXPRESS', tag: 'CITY EXPRESS', text: 'Express commute to Silk Board Junction!', color: '#d97706' },
      { brand: 'KRUTRIM AI', tag: 'INDIA AGI', text: '100 Billion Parameters, 0 Bangalore Parking Spots.', color: '#00a86b' },
      { brand: 'FILTER COFFEE & AI', tag: 'FILTER KAAPI', text: 'Sip hot Filter Kaapi and ship code! 100% Pure Chicory blend.', color: '#b45309' },
      { brand: 'OPENAI BLR', tag: 'AGI 2026', text: 'AGI will arrive before the Silk Board flyover completes.', color: '#059669' },
      { brand: 'NAMMA METRO', tag: 'METRO PURPLE', text: 'Next Station: Indiranagar // Fast Track Commute', color: '#8e24aa' },
      { brand: 'PERPLEXITY AI', tag: 'AI SEARCH', text: 'Why is Bangalore traffic so bad? Sources: 42 Citations.', color: '#0284c7' },
      { brand: 'ANTHROPIC CLAUDE', tag: 'CONSTITUTIONAL AI', text: 'Prompt Engineering our way out of BBMP potholes.', color: '#ea580c' }
    ];

    this.initThree();
  }

  // --- Initialize Three.js Scene, Camera, Lighting & Shaders ---
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Clear Bangalore Morning Sky Blue
    this.scene.fog = new THREE.FogExp2(0xcde8ff, 0.0065); // Pleasant morning atmosphere

    const initialAspect = this.width / this.height;
    const initialFov = initialAspect < 1.0 ? Math.min(75, (58 / initialAspect) * 0.62) : 58;
    this.camera = new THREE.PerspectiveCamera(initialFov, initialAspect, 0.1, 850);
    this.camera.position.set(0, 2.7, -5.2);
    this.camera.lookAt(0, 1.15, 12);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    // Dynamic PMREM Environment Map for physical automotive reflections (Glossy Onyx Ola panels)
    this.setupEnvironmentMap();

    // Daylight Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x4d7c0f, 0.65);
    hemiLight.position.set(0, 60, 0);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff6d6, 1.85);
    this.directionalLight = this.sunLight;
    this.sunLight.position.set(35, 65, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 280;
    this.sunLight.shadow.camera.left = -35;
    this.sunLight.shadow.camera.right = 35;
    this.sunLight.shadow.camera.top = 70;
    this.sunLight.shadow.camera.bottom = -25;
    this.scene.add(this.sunLight);

    this.buildCityBackdrop();
    this.buildRoadSegments();
    this.buildPlayer();
    this.buildChaser();
    this.preloadAllModels();

    this.handleResize = () => this.resize();
    window.addEventListener('resize', this.handleResize);

    this.render();
  }

  // --- MARUTI SUZUKI ALTO HATCHBACK CAB HIGH-PERFORMANCE GLTF PIPELINE ---
  loadAltoModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/alto/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          // 1. Identify and discard heavy interior/invisible meshes (Seats, Dash, Steering, Seatbelts)
          // Strips interior weight to maintain ultra-smooth 60 FPS
          const isInteriorRegex = /interior|cinto|dash|seat|steering/i;
          const interiorNodes = [];
          root.traverse((child) => {
            if (child.isMesh && child.material && isInteriorRegex.test(child.material.name)) {
              interiorNodes.push(child);
            }
          });

          interiorNodes.forEach((node) => {
            if (node.parent) node.parent.remove(node);
            if (node.geometry) node.geometry.dispose();
          });

          // 2. Identify the 4 road wheel assemblies for active rotation physics
          // The 4 wheel nodes in Alto GLTF are named 'roda', 'roda.001', 'roda.002', 'roda.003'
          const wheelNodes = [];
          root.traverse((child) => {
            if (child.name === 'roda' || /^roda\.00[1-3]$/i.test(child.name)) {
              wheelNodes.push(child);
            }
          });

          // 3. Normalization & Draw Call Merging by Material
          root.updateMatrixWorld(true);
          const invRoot = root.matrixWorld.clone().invert();

          const materialBuckets = new Map();
          const exteriorMeshes = [];

          root.traverse((child) => {
            if (child.isMesh && child.geometry) {
              // Check if part of a wheel
              let isWheel = false;
              let p = child;
              while (p && p !== root) {
                if (p.name === 'roda' || /^roda\.00[1-3]$/i.test(p.name) || p.name === 'wheel_rf_dummy') {
                  isWheel = true;
                  break;
                }
                p = p.parent;
              }

              if (!isWheel) {
                exteriorMeshes.push(child);
              }
            }
          });

          // Group exterior body geometries by material
          for (const mesh of exteriorMeshes) {
            const mat = mesh.material;
            if (!mat) continue;

            const matKey = mat.name || mat.uuid;
            if (!materialBuckets.has(matKey)) {
              materialBuckets.set(matKey, { material: mat, geometries: [] });
            }

            // Clone geometry and bake world transform relative to root
            const geom = mesh.geometry.clone();
            const relMatrix = new THREE.Matrix4().multiplyMatrices(invRoot, mesh.matrixWorld);
            geom.applyMatrix4(relMatrix);

            // Normalize vertex attributes so BufferGeometryUtils can merge cleanly
            geom.deleteAttribute('color');
            geom.deleteAttribute('tangent');
            geom.deleteAttribute('uv2');
            if (!geom.attributes.uv && geom.attributes.position) {
              geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geom.attributes.position.count * 2), 2));
            }

            materialBuckets.get(matKey).geometries.push(geom);
          }

          // Build lightweight merged body group
          const optimizedRoot = new THREE.Group();
          const bodyGroup = new THREE.Group();
          bodyGroup.name = 'AltoBody';

          for (const [_, bucket] of materialBuckets.entries()) {
            if (bucket.geometries.length === 0) continue;
            let mergedGeom;
            try {
              mergedGeom = BufferGeometryUtils.mergeGeometries(bucket.geometries, false);
            } catch (mergeErr) {
              console.warn('Fallback merge single geom:', mergeErr);
              mergedGeom = bucket.geometries[0];
            }

            if (mergedGeom) {
              const mat = bucket.material.clone();
              if (mat.roughness !== undefined) {
                mat.roughness = Math.min(mat.roughness, 0.65);
              }

              const mergedMesh = new THREE.Mesh(mergedGeom, mat);
              // Only cast shadow from the main car paint body shell to save GPU shadow passes
              if (/primary|chassis/i.test(mat.name)) {
                mergedMesh.castShadow = true;
                mergedMesh.receiveShadow = true;
              } else {
                mergedMesh.receiveShadow = true;
              }
              bodyGroup.add(mergedMesh);
            }
          }
          optimizedRoot.add(bodyGroup);

          // 4. Attach the 4 isolated wheel groups to optimized car
          for (const wheelNode of wheelNodes) {
            wheelNode.updateMatrixWorld(true);
            const relMat = new THREE.Matrix4().multiplyMatrices(invRoot, wheelNode.matrixWorld);
            const pos = new THREE.Vector3();
            const rot = new THREE.Quaternion();
            const scl = new THREE.Vector3();
            relMat.decompose(pos, rot, scl);

            const wheelContainer = new THREE.Group();
            wheelContainer.name = 'Wheel_' + wheelNode.name;
            wheelContainer.position.copy(pos);
            wheelContainer.quaternion.copy(rot);
            wheelContainer.scale.copy(scl);

            const wheelVisual = wheelNode.clone(true);
            wheelVisual.position.set(0, 0, 0);
            wheelVisual.rotation.set(0, 0, 0);
            wheelVisual.scale.set(1, 1, 1);
            wheelVisual.traverse((wChild) => {
              if (wChild.isMesh) {
                wChild.castShadow = true;
                wChild.receiveShadow = true;
              }
            });

            wheelContainer.add(wheelVisual);
            optimizedRoot.add(wheelContainer);
          }

          // 5. Measure and scale the optimized model to realistic dimensions
          const bbox = new THREE.Box3().setFromObject(optimizedRoot);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const maxHoriz = Math.max(size.x, size.z);
          const targetLength = 3.65;
          const scale = targetLength / maxHoriz;
          optimizedRoot.scale.set(scale, scale, scale);

          // Center the car at x = 0, z = 0, with wheels touching road at y = 0
          const scaledBox = new THREE.Box3().setFromObject(optimizedRoot);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          optimizedRoot.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          const template = new THREE.Group();
          template.add(optimizedRoot);
          this.altoModelTemplate = template;
          this.kiaModelTemplate = template; // Compatibility alias

          console.log('⚡ Maruti Suzuki Alto Hatchback Optimized GLTF Ready!', {
            drawCalls: materialBuckets.size + 4,
            scale,
            targetLength
          });

          // Swap into any placeholder cabs spawned while loading
          const pending = [...this.pendingAltoCabs, ...this.pendingKiaCabs];
          for (const obs of pending) {
            if (obs && obs.mesh && obs.mesh.parent) {
              const oldMesh = obs.mesh;
              const newAlto = this.createAltoInstance(obs.isStationary, obs.isOncoming);
              newAlto.position.copy(oldMesh.position);
              this.scene.remove(oldMesh);
              this.scene.add(newAlto);
              obs.mesh = newAlto;
              obs.wheelMeshes = newAlto.userData.wheelMeshes || [];
            }
          }
          this.pendingAltoCabs = [];
          this.pendingKiaCabs = [];

          this.reportAssetLoaded('Maruti Alto');
        } catch (err) {
          console.error('Error optimizing Maruti Alto GLTF model:', err);
          this.reportAssetLoaded('Maruti Alto (fallback)');
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load Maruti Alto GLTF:', err);
        this.reportAssetLoaded('Maruti Alto (failed)');
      }
    );
  }

  // Backward-compatible loader alias
  loadKiaModel() {
    this.loadAltoModel();
  }

  createAltoInstance(isStationary = false, isOncoming = false, customColor = null) {
    const template = this.altoModelTemplate || this.kiaModelTemplate;
    if (!template) return null;
    const carGroup = template.clone(true);

    const colors = [
      0xf8fafc, // Pure White Cab / Airport Taxi
      0xfacc15, // Yellow Bangalore City Cab
      0xdc2626, // Classic Red
      0x0284c7, // Metallic Blue
      0x64748b  // Granite Silver Grey
    ];
    const color = customColor || colors[Math.floor(Math.random() * colors.length)];

    // Locate the 4 wheel groups for real-time spinning animation
    const wheelMeshes = [];
    carGroup.traverse((child) => {
      if (child.isGroup && /^Wheel_roda/i.test(child.name)) {
        wheelMeshes.push(child);
      }
      if (child.isMesh && child.material) {
        if (/primary/i.test(child.material.name)) {
          child.material = child.material.clone();
          child.material.color.setHex(color);
        }
        // Headlights glow on oncoming cars
        if (isOncoming && (/front_light/i.test(child.material.name) || /headlight/i.test(child.name))) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0xffffff);
          child.material.emissiveIntensity = 2.2;
        }
        // Red taillights glow on forward traffic and stationary cars
        if (!isOncoming && (/rear_light|lanternas|third/i.test(child.material.name) || /taillight/i.test(child.name))) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0xef4444);
          child.material.emissiveIntensity = 2.0;
        }
      }
    });

    carGroup.userData.wheelMeshes = wheelMeshes;

    // Orientation:
    // Raw Alto GLTF front bumper points toward -Z.
    // Moving with traffic / parked facing forward along road (+Z): rotate by Math.PI.
    // Oncoming toward player (approaching from +Z toward -Z): rotate by 0 (front faces player).
    if (isOncoming) {
      carGroup.rotation.y = 0;
    } else {
      carGroup.rotation.y = Math.PI;
    }

    return carGroup;
  }

  // Backward-compatible instance creator alias
  createKiaPicantoInstance(isStationary = false, isOncoming = false, customColor = null) {
    return this.createAltoInstance(isStationary, isOncoming, customColor);
  }

  // --- INDIAN AUTO-RICKSHAW HIGH-PERFORMANCE GLTF PIPELINE ---
  loadAutoRickshawModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/auto_rickshaw/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          // Auto Rickshaw has 2 main meshes:
          // 1. persp5_lambert1_0: Yellow & green Bajaj chassis, passenger cabin, handlebars & 3 wheels
          // 2. persp5_blinn1_0: Front curved glass windshield
          root.traverse((child) => {
            if (child.isMesh) {
              if (/blinn1/i.test(child.name) || /glass/i.test(child.name)) {
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.transparent = true;
                  child.material.opacity = 0.55;
                  child.material.roughness = 0.1;
                  child.material.depthWrite = false;
                }
                child.castShadow = false;
                child.receiveShadow = true;
              } else {
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.roughness = 0.55;
                  child.material.metalness = 0.2;
                }
                child.castShadow = true;
                child.receiveShadow = true;
              }
            }
          });

          // Scale and align: Target length 2.65m, width 1.5m, height 1.85m
          const bbox = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const targetLength = 2.65;
          const maxHoriz = Math.max(size.x, size.z);
          const scale = targetLength / maxHoriz;
          root.scale.set(scale, scale, scale);

          // Center horizontally and put wheels on road (y = 0)
          const scaledBox = new THREE.Box3().setFromObject(root);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          root.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          const template = new THREE.Group();
          template.add(root);
          this.autoModelTemplate = template;

          console.log('⚡ Bajaj Auto-Rickshaw 3D Model Ready!', {
            scale,
            targetLength
          });

          // Hot-swap any placeholder autos spawned while loading
          for (const obs of this.pendingAutoRickshaws) {
            if (obs && obs.mesh && obs.mesh.parent) {
              const oldMesh = obs.mesh;
              const newAuto = this.createAutoRickshawInstance(obs.isStationary, obs.isOncoming);
              newAuto.position.copy(oldMesh.position);
              this.scene.remove(oldMesh);
              this.scene.add(newAuto);
              obs.mesh = newAuto;
            }
          }
          this.pendingAutoRickshaws = [];

          this.reportAssetLoaded('Auto-Rickshaw');
        } catch (err) {
          console.error('Error preparing Auto-Rickshaw GLTF model:', err);
          this.reportAssetLoaded('Auto-Rickshaw (fallback)');
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load Auto-Rickshaw GLTF:', err);
        this.reportAssetLoaded('Auto-Rickshaw (failed)');
      }
    );
  }

  createAutoRickshawInstance(isStationary = false, isOncoming = false) {
    if (!this.autoModelTemplate) return null;
    const autoGroup = this.autoModelTemplate.clone(true);

    // Front headlight glow on oncoming traffic
    if (isOncoming) {
      const headlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 2.2
        })
      );
      headlight.position.set(0, 0.95, 1.32);
      autoGroup.add(headlight);
    } else {
      // Rear red taillights for forward and stationary traffic
      [-0.55, 0.55].forEach(tx => {
        const taillight = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.1, 0.04),
          new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xdc2626,
            emissiveIntensity: 1.8
          })
        );
        taillight.position.set(tx, 0.72, -1.33);
        autoGroup.add(taillight);
      });
    }

    // Glowing digital fare meter inside the cabin
    const meter = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.1, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 2.0
      })
    );
    meter.position.set(0.32, 1.12, 0.45);
    autoGroup.add(meter);

    // Orientation:
    // Raw model front nose is at +Z.
    // Oncoming: rotate Math.PI so front faces player approaching from -Z.
    // Forward / stationary: rotate 0 so rear faces player and front moves away along +Z.
    if (isOncoming) {
      autoGroup.rotation.y = Math.PI;
    } else {
      autoGroup.rotation.y = 0;
    }

    return autoGroup;
  }

  // --- 1989 BMTC INDIAN BUS HIGH-PERFORMANCE GLTF PIPELINE ---
  loadBusModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/bus/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          // Optimize materials and shadows across the bus meshes
          root.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              const matName = mat.name || '';

              if (/HEADLIGHTS/i.test(matName)) {
                child.material = mat.clone();
                child.castShadow = false;
                child.receiveShadow = false;
              } else if (/RED_STOPPING_TAILIGHT|WHITE_REVERSING_TAILIGHTS/i.test(matName)) {
                child.material = mat.clone();
                child.castShadow = false;
                child.receiveShadow = false;
              } else if (/MIRROR_GLASS/i.test(matName)) {
                child.material = mat.clone();
                child.material.transparent = true;
                child.material.opacity = 0.65;
                child.material.roughness = 0.1;
                child.castShadow = false;
                child.receiveShadow = true;
              } else if (/TYRE/i.test(matName)) {
                child.material = mat.clone();
                child.material.roughness = 0.9;
                child.castShadow = true;
                child.receiveShadow = true;
              } else {
                child.material = mat.clone();
                if (child.material.roughness !== undefined) {
                  child.material.roughness = Math.min(child.material.roughness, 0.45);
                }
                child.castShadow = true;
                child.receiveShadow = true;
              }
            }
          });

          // Scale and align: Target length 11.2m, width 2.85m, height 3.65m
          const bbox = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const targetLength = 11.2;
          const maxHoriz = Math.max(size.x, size.z);
          const scale = targetLength / maxHoriz;
          root.scale.set(scale, scale, scale);

          // Center horizontally and put wheels firmly on road (y = 0)
          const scaledBox = new THREE.Box3().setFromObject(root);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          root.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          const template = new THREE.Group();
          template.add(root);

          // Add BMTC Electronic Amber/Green LED Destination Board to the Front
          const boardCanvas = document.createElement('canvas');
          boardCanvas.width = 512;
          boardCanvas.height = 128;
          const bctx = boardCanvas.getContext('2d');
          bctx.fillStyle = '#050505';
          bctx.fillRect(0, 0, 512, 128);
          bctx.fillStyle = '#f59e0b'; // Amber LED matrix
          bctx.font = 'bold 36px sans-serif';
          bctx.textAlign = 'center';
          bctx.fillText('500D ITPL ➔ SILK BOARD', 256, 48);
          bctx.font = 'bold 26px sans-serif';
          bctx.fillStyle = '#00d46a';
          bctx.fillText('⚡ BMTC ELECTRIC // ECO FRIENDLY', 256, 96);

          const boardTex = new THREE.CanvasTexture(boardCanvas);
          const destBoard = new THREE.Mesh(
            new THREE.PlaneGeometry(2.3, 0.58),
            new THREE.MeshBasicMaterial({ map: boardTex })
          );
          // Headlights/front is at +Z (~5.6m)
          destBoard.position.set(0, 3.12, 5.62);
          template.add(destBoard);

          // Rear Destination Board
          const rearBoard = new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 0.5),
            new THREE.MeshBasicMaterial({ map: boardTex })
          );
          rearBoard.position.set(0, 3.0, -5.62);
          rearBoard.rotation.y = Math.PI;
          template.add(rearBoard);

          // Jumpable Flat Roof Walking Surface for rooftop coin runs (at y = 3.65)
          const roofWalk = new THREE.Mesh(
            new THREE.BoxGeometry(2.65, 0.06, 10.6),
            new THREE.MeshStandardMaterial({
              color: 0xf1f5f9,
              roughness: 0.8
            })
          );
          roofWalk.position.set(0, 3.65, 0);
          roofWalk.receiveShadow = true;
          template.add(roofWalk);

          this.busModelTemplate = template;

          console.log('⚡ BMTC 3D Transport Bus Model Ready!', {
            scale,
            targetLength
          });

          // Hot-swap any placeholder buses spawned while loading
          for (const obs of this.pendingBuses) {
            if (obs && obs.mesh && obs.mesh.parent) {
              const oldMesh = obs.mesh;
              const newBus = this.createBMTCBusInstance(obs.isStationary, obs.isOncoming);
              newBus.position.copy(oldMesh.position);
              this.scene.remove(oldMesh);
              this.scene.add(newBus);
              obs.mesh = newBus;
            }
          }
          this.pendingBuses = [];

          this.reportAssetLoaded('BMTC Bus');
        } catch (err) {
          console.error('Error preparing BMTC Bus GLTF model:', err);
          this.reportAssetLoaded('BMTC Bus (fallback)');
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load BMTC Bus GLTF:', err);
        this.reportAssetLoaded('BMTC Bus (failed)');
      }
    );
  }

  createBMTCBusInstance(isStationary = false, isOncoming = false) {
    if (!this.busModelTemplate) return null;
    const busGroup = this.busModelTemplate.clone(true);

    busGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        const matName = child.material.name || '';
        if (isOncoming && /HEADLIGHTS/i.test(matName)) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0xffffff);
          child.material.emissiveIntensity = 2.5;
        }
        if (!isOncoming && /RED_STOPPING_TAILIGHT/i.test(matName)) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0xef4444);
          child.material.emissiveIntensity = 2.0;
        }
      }
    });

    // Orientation:
    // Raw bus model front windshield & headlights are at +Z.
    // Oncoming: rotate Math.PI so front faces oncoming player.
    // Forward / stationary: rotate 0 so rear faces player and bus drives forward along +Z.
    if (isOncoming) {
      busGroup.rotation.y = Math.PI;
    } else {
      busGroup.rotation.y = 0;
    }

    return busGroup;
  }

  // --- DISCONNECT / DECLINE TEAMS CALL ---
  dismissTeamsCall() {
    this.teamsCallToastTimer = 0;
    soundManager.stopTeamsAudio();
    if (this.onDistanceUpdate) {
      this.onDistanceUpdate(
        this.distanceTraveled,
        Math.max(0, this.targetDistance - this.distanceTraveled),
        Math.round(this.playerSpeed * 3.6),
        {
          zoneName: this.currentZoneName,
          teamsCallActive: false,
          isBraking: this.isBraking,
          isAccelerating: this.isAccelerating,
          speedKmh: Math.round(this.playerSpeed * 3.6)
        }
      );
    }
    console.log('📞 Teams call declined/disconnected.');
  }

  // --- 3D BAJAJ PULSAR MOTORCYCLE HIGH-PERFORMANCE GLTF PIPELINE ---
  loadPulsarModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/pulsar/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          root.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              const matName = mat.name || '';

              if (/HeadLight/i.test(matName)) {
                child.material = mat.clone();
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveIntensity = 2.5;
                child.castShadow = false;
              } else if (/tail/i.test(matName)) {
                child.material = mat.clone();
                child.material.emissive = new THREE.Color(0xef4444);
                child.material.emissiveIntensity = 2.0;
                child.castShadow = false;
              } else if (/Glass|Mirror/i.test(matName)) {
                child.material = mat.clone();
                child.material.transparent = true;
                child.material.opacity = 0.6;
                child.material.roughness = 0.1;
                child.castShadow = false;
                child.receiveShadow = true;
              } else if (/main_body|BodyBlack|SEAT|TyreRear|FrontTyre/i.test(matName)) {
                child.material = mat.clone();
                child.castShadow = true;
                child.receiveShadow = true;
              } else {
                child.material = mat.clone();
                child.castShadow = false;
                child.receiveShadow = true;
              }
            }
          });

          // Target dimensions: Length 2.1m, width 0.75m, height 1.25m
          const bbox = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const targetLength = 2.1;
          const maxHoriz = Math.max(size.x, size.z);
          const scale = targetLength / maxHoriz;
          root.scale.set(scale, scale, scale);

          // Center horizontally and put wheels firmly on road (y = 0)
          const scaledBox = new THREE.Box3().setFromObject(root);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          root.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          const template = new THREE.Group();
          template.add(root);

          // Add a sporty commuter rider on the Pulsar
          const riderTorso = new THREE.Mesh(
            new THREE.BoxGeometry(0.36, 0.46, 0.22),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
          );
          riderTorso.position.set(0, 0.98, -0.22);
          riderTorso.rotation.x = 0.32;
          riderTorso.castShadow = true;
          template.add(riderTorso);

          const riderHelmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2, metalness: 0.3 })
          );
          riderHelmet.position.set(0, 1.38, -0.10);
          riderHelmet.castShadow = true;
          template.add(riderHelmet);

          this.pulsarModelTemplate = template;

          console.log('⚡ Bajaj Pulsar 3D Model Ready!', {
            scale,
            targetLength
          });

          // Hot-swap any placeholder bikes spawned while loading
          for (const obs of this.pendingBikes) {
            if (obs && obs.mesh && obs.mesh.parent) {
              const oldMesh = obs.mesh;
              const newBike = this.createPulsarInstance(obs.isStationary, obs.isOncoming);
              newBike.position.copy(oldMesh.position);
              this.scene.remove(oldMesh);
              this.scene.add(newBike);
              obs.mesh = newBike;
            }
          }
          this.pendingBikes = [];

          this.reportAssetLoaded('Pulsar Bike');
        } catch (err) {
          console.error('Error preparing Pulsar GLTF model:', err);
          this.reportAssetLoaded('Pulsar Bike (fallback)');
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load Pulsar GLTF:', err);
        this.reportAssetLoaded('Pulsar Bike (failed)');
      }
    );
  }

  createPulsarInstance(isStationary = false, isOncoming = true) {
    if (!this.pulsarModelTemplate) return null;
    const bikeGroup = this.pulsarModelTemplate.clone(true);

    // Orientation:
    // Front headlight is at +Z.
    // Oncoming: rotate Math.PI so front faces oncoming player at -Z.
    // Forward / stationary: rotate 0 so rear faces player.
    if (isOncoming) {
      bikeGroup.rotation.y = Math.PI;
    } else {
      bikeGroup.rotation.y = 0;
    }

    return bikeGroup;
  }

  // --- OFFICIAL 3D PERSON-BIKER (DEFAULT PLAYER) GLTF PIPELINE ---
  loadPersonBikerModel() {
    if (this.isLoadingBiker || this.bikerModelTemplate) return;
    this.isLoadingBiker = true;

    const loader = new GLTFLoader();
    loader.load(
      '/person-biker/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          // Shadow and material enhancements
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                const matName = child.material.name || child.name || '';
                child.material.roughness = Math.min(0.85, child.material.roughness ?? 0.6);

                // Golden glass headlight lens
                if (/Translucent_Glass_Gold/i.test(matName)) {
                  child.material = child.material.clone();
                  child.material.emissive = new THREE.Color(0xffe082);
                  child.material.emissiveIntensity = 2.0;
                }
                // Red rear taillight lens
                if (/FireBrick|Red/i.test(matName)) {
                  child.material = child.material.clone();
                  child.material.emissive = new THREE.Color(0xef4444);
                  child.material.emissiveIntensity = 2.5;
                }
              }
            }
          });

          // Locate rider node (02-Nafta) for ducking/sliding posture
          let bikerRider = null;
          root.traverse((c) => {
            if (!bikerRider && /02-Nafta/i.test(c.name)) {
              bikerRider = c;
            }
          });
          if (bikerRider) {
            this.bikerRiderNode = bikerRider;
            this.bikerRiderInitialRotX = bikerRider.rotation.x;
          }

          // Real-world human on motorcycle proportions:
          // Raw height is ~6.24m -> scale to 1.68m
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);

          const targetHeight = 1.68;
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);

          // Center horizontally and put tires on road surface (min.y = 0)
          const scaledBox = new THREE.Box3().setFromObject(root);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          root.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          // Pivot group: in raw coordinates, the motorcycle points in +Z (front headlight at +Z, taillight at -Z),
          // matching the game's road direction (+Z) perfectly!
          const bikerPivot = new THREE.Group();
          bikerPivot.add(root);

          this.bikerModelTemplate = bikerPivot;
          this.isLoadingBiker = false;

          // Integrate into vehicle group as player
          this.integrateBikerModel(bikerPivot.clone(true));

          console.log('⚡ 3D Person-Biker Model Loaded & Integrated as Default Player!');
          this.reportAssetLoaded('Person Biker');
        } catch (err) {
          console.error('Error integrating person-biker model:', err);
          this.isLoadingBiker = false;
          this.reportAssetLoaded('Person Biker (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /person-biker/scene.gltf:', err);
        this.isLoadingBiker = false;
        this.reportAssetLoaded('Person Biker (failed)');
      }
    );
  }

  integrateBikerModel(bikerGroup) {
    if (!this.vehicleGroup) return;

    this.isPersonBiker = true;

    // Remove any previous models/placeholders
    if (this.proceduralScooty && this.proceduralScooty.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.proceduralScooty);
    }
    if (this.riderGroup && this.riderGroup.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.riderGroup);
    }
    if (this.hondaModelInstance && this.hondaModelInstance.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.hondaModelInstance);
    }
    if (this.boygiRiderInstance && this.boygiRiderInstance.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.boygiRiderInstance);
    }
    if (this.bikerModelInstance && this.bikerModelInstance.parent === this.vehicleGroup && this.bikerModelInstance !== bikerGroup) {
      this.vehicleGroup.remove(this.bikerModelInstance);
    }

    this.bikerModelInstance = bikerGroup;
    if (bikerGroup.parent !== this.vehicleGroup) {
      this.vehicleGroup.add(bikerGroup);
    }

    // Locate rider node in active clone
    bikerGroup.traverse((c) => {
      if (/02-Nafta/i.test(c.name)) {
        this.bikerRiderNode = c;
        this.bikerRiderInitialRotX = c.rotation.x;
      }
    });

    // Dynamic forward headlight spot projecting down the road
    if (!this.headlightSpot) {
      this.headlightSpot = new THREE.SpotLight(0xfff8db, 4.5, 45, Math.PI / 5, 0.45, 1.2);
      this.headlightSpot.position.set(0, 0.85, 0.65);
      this.headlightSpot.target.position.set(0, 0.2, 22);
      this.vehicleGroup.add(this.headlightSpot);
      this.vehicleGroup.add(this.headlightSpot.target);
    }
  }

  // --- OFFICIAL 3D MAPLE TREE (ROADSIDE FOLIAGE) GLTF PIPELINE ---
  loadMapleTreeModel() {
    if (this.isLoadingMapleTree || this.mapleTreeTemplate) return;
    this.isLoadingMapleTree = true;

    const loader = new GLTFLoader();
    loader.load(
      '/maple_tree/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;
          root.updateMatrixWorld(true);

          // Group the 2,000+ meshes by material and merge into just 4 optimized draw calls
          const groups = {};
          root.traverse((child) => {
            if (child.isMesh && child.geometry) {
              const mat = child.material;
              const key = mat ? (mat.name || 'default') : 'default';
              if (!groups[key]) {
                groups[key] = { material: mat, geoms: [] };
              }
              const geom = child.geometry.clone().applyMatrix4(child.matrixWorld);
              groups[key].geoms.push(geom);
            }
          });

          const templateGroup = new THREE.Group();
          for (const [key, { material, geoms }] of Object.entries(groups)) {
            const mergedGeom = BufferGeometryUtils.mergeGeometries(geoms, false);
            if (mergedGeom) {
              let mat = material ? material.clone() : new THREE.MeshStandardMaterial();
              if (/leaf/i.test(key)) {
                mat.alphaTest = 0.45;
                mat.side = THREE.DoubleSide;
                mat.roughness = 0.65;
                mat.metalness = 0.05;
              } else if (/bark/i.test(key)) {
                mat.roughness = 0.9;
                mat.metalness = 0.05;
              } else {
                mat.roughness = 0.95;
                mat.metalness = 0.0;
              }
              const mesh = new THREE.Mesh(mergedGeom, mat);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              templateGroup.add(mesh);
            }
          }

          // Real-world boulevard tree proportions: height ~8.5m, width ~6.3m
          const box = new THREE.Box3().setFromObject(templateGroup);
          const size = new THREE.Vector3();
          box.getSize(size);
          const scale = 8.5 / size.y;
          templateGroup.scale.set(scale, scale, scale);

          // Center horizontally and place trunk flush on road ground (y = 0)
          templateGroup.position.set(
            -box.min.x * scale - (size.x * scale) / 2,
            -box.min.y * scale,
            -box.min.z * scale - (size.z * scale) / 2
          );

          const finalPivot = new THREE.Group();
          finalPivot.add(templateGroup);

          this.mapleTreeTemplate = finalPivot;
          this.isLoadingMapleTree = false;

          // Hydrate any pending roadside placeholder trees
          if (this.pendingMapleTrees.length > 0) {
            this.pendingMapleTrees.forEach(({ holder, scaleVariation }) => {
              while (holder.children.length > 0) holder.remove(holder.children[0]);
              const treeInstance = finalPivot.clone(true);
              treeInstance.rotation.y = Math.random() * Math.PI * 2;
              const s = scaleVariation || 1.0;
              treeInstance.scale.set(s, s, s);
              holder.add(treeInstance);
            });
            this.pendingMapleTrees = [];
          }

          console.log('⚡ 3D Maple Tree Model Loaded, Merged (4 Draw Calls) & Deployed Along Roadways!');
          this.reportAssetLoaded('Maple Tree');
        } catch (err) {
          console.error('Error optimizing and merging Maple Tree model:', err);
          this.isLoadingMapleTree = false;
          this.reportAssetLoaded('Maple Tree (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /maple_tree/scene.gltf:', err);
        this.isLoadingMapleTree = false;
        this.reportAssetLoaded('Maple Tree (failed)');
      }
    );
  }

  // --- 1. 3D INDIAN SHOP GLTF PIPELINE ---
  loadIndianShopModel() {
    if (this.isLoadingIndianShop || this.indianShopTemplate) return;
    this.isLoadingIndianShop = true;

    const loader = new GLTFLoader();
    loader.load(
      '/indian_shop/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.min(0.9, child.material.roughness ?? 0.7);
              }
            }
          });

          // Scale to realistic Indian street store: height ~5.8m
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const targetHeight = 5.8;
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);

          // Center horizontally and put ground base on y = 0
          root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

          const pivot = new THREE.Group();
          pivot.add(root);

          this.indianShopTemplate = pivot;
          this.isLoadingIndianShop = false;

          this.hydratePendingRoadsideBuildings('shop', pivot);
          console.log('⚡ 3D Indian Shop Model Loaded & Deployed!');
          this.reportAssetLoaded('Indian Shop');
        } catch (err) {
          console.error('Error loading Indian Shop model:', err);
          this.isLoadingIndianShop = false;
          this.reportAssetLoaded('Indian Shop (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /indian_shop/scene.gltf:', err);
        this.isLoadingIndianShop = false;
        this.reportAssetLoaded('Indian Shop (failed)');
      }
    );
  }

  // --- 2. 3D CLEAN PLACE (COMMUNITY COMPLEX) GLTF PIPELINE ---
  loadCleanPlaceModel() {
    if (this.isLoadingCleanPlace || this.cleanPlaceTemplate) return;
    this.isLoadingCleanPlace = true;

    const loader = new GLTFLoader();
    loader.load(
      '/clean_place/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.min(0.9, child.material.roughness ?? 0.7);
              }
            }
          });

          // Rotate clean_place model by 180 degrees around Y axis
          root.rotation.y = Math.PI;
          root.updateMatrixWorld(true);

          // Scale to realistic civic complex: height ~5.8m
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const targetHeight = 5.8;
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);

          // Center horizontally and place base flush on ground
          root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

          const pivot = new THREE.Group();
          pivot.add(root);

          this.cleanPlaceTemplate = pivot;
          this.isLoadingCleanPlace = false;

          this.hydratePendingRoadsideBuildings('clean', pivot);

          // Hydrate any Clean Shop blockers spawned in the roadway
          if (this.pendingCleanShopBlockers && this.pendingCleanShopBlockers.length > 0) {
            this.pendingCleanShopBlockers.forEach((item) => {
              while (item.holder.children.length > 0) item.holder.remove(item.holder.children[0]);
              const clone = pivot.clone(true);
              clone.scale.set(0.36, 0.44, 0.36);
              item.holder.add(clone);

              const barrier = new THREE.Mesh(
                new THREE.BoxGeometry(2.9, 0.35, 0.12),
                new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.7 })
              );
              barrier.position.set(0, 0.2, 1.5);
              item.holder.add(barrier);

              const beacon = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8),
                new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff9900, emissiveIntensity: 1.4 })
              );
              beacon.position.set(0, 2.7, 0);
              item.holder.add(beacon);
            });
            this.pendingCleanShopBlockers = [];
          }

          console.log('⚡ 3D Clean Place Model Loaded & Deployed!');
          this.reportAssetLoaded('Clean Place');
        } catch (err) {
          console.error('Error loading Clean Place model:', err);
          this.isLoadingCleanPlace = false;
          this.reportAssetLoaded('Clean Place (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /clean_place/scene.gltf:', err);
        this.isLoadingCleanPlace = false;
        this.reportAssetLoaded('Clean Place (failed)');
      }
    );
  }

  // --- 3. 3D REGIONAL OFFICE (MID-RISE BUILDING) GLTF PIPELINE ---
  loadRegOfficeModel() {
    if (this.isLoadingRegOffice || this.regOfficeTemplate) return;
    this.isLoadingRegOffice = true;

    const loader = new GLTFLoader();
    loader.load(
      '/regoffice/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.min(0.7, child.material.roughness ?? 0.4);
                child.material.metalness = Math.max(0.2, child.material.metalness ?? 0.25);
              }
            }
          });

          // Scale to tech corridor mid-rise building: height ~22m
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const targetHeight = 22.0;
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);

          // Center horizontally and place base flush on ground
          root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

          const pivot = new THREE.Group();
          pivot.add(root);

          this.regOfficeTemplate = pivot;
          this.isLoadingRegOffice = false;

          this.hydratePendingRoadsideBuildings('office', pivot);
          console.log('⚡ 3D Regional Office Model Loaded & Deployed!');
          this.reportAssetLoaded('Regional Office');
        } catch (err) {
          console.error('Error loading Regional Office model:', err);
          this.isLoadingRegOffice = false;
          this.reportAssetLoaded('Regional Office (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /regoffice/scene.gltf:', err);
        this.isLoadingRegOffice = false;
        this.reportAssetLoaded('Regional Office (failed)');
      }
    );
  }

  // --- 4. 3D MAIN DESTINATION BUILDING GLTF PIPELINE ---
  loadMainBuildingModel() {
    if (this.isLoadingMainBuilding || this.mainBuildingTemplate) return;
    this.isLoadingMainBuilding = true;

    const loader = new GLTFLoader();
    loader.load(
      '/mainbuilding/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.min(0.6, child.material.roughness ?? 0.35);
                child.material.metalness = Math.max(0.3, child.material.metalness ?? 0.4);
              }
            }
          });

          // Monumental corporate headquarters destination: height ~48m, width ~31m
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const targetHeight = 48.0;
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);

          // Center horizontally and place base flush on ground
          root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

          const pivot = new THREE.Group();
          pivot.add(root);

          this.mainBuildingTemplate = pivot;
          this.isLoadingMainBuilding = false;

          // Hydrate any pending destination instances
          if (this.pendingDestinationBuildings.length > 0) {
            this.pendingDestinationBuildings.forEach((holder) => {
              while (holder.children.length > 0) holder.remove(holder.children[0]);
              const inst = pivot.clone(true);
              holder.add(inst);
            });
            this.pendingDestinationBuildings = [];
          }

          // Hydrate all pending roadside main building instances!
          this.hydratePendingRoadsideBuildings('main', pivot);

          console.log('⚡ 3D Main Destination Building Model Loaded & Ready!');
          this.reportAssetLoaded('Main Building');
        } catch (err) {
          console.error('Error loading Main Destination Building model:', err);
          this.isLoadingMainBuilding = false;
          this.reportAssetLoaded('Main Building (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /mainbuilding/scene.gltf:', err);
        this.isLoadingMainBuilding = false;
        this.reportAssetLoaded('Main Building (failed)');
      }
    );
  }

  hydratePendingRoadsideBuildings(type, template) {
    if (!this.pendingRoadsideBuildings || this.pendingRoadsideBuildings.length === 0) return;
    const remaining = [];
    this.pendingRoadsideBuildings.forEach((item) => {
      if (item.type === type) {
        while (item.holder.children.length > 0) item.holder.remove(item.holder.children[0]);
        const clone = template.clone(true);
        if (type === 'main') {
          clone.scale.set(0.75, 0.75, 0.75);
        }
        item.holder.add(clone);
      } else {
        remaining.push(item);
      }
    });
    this.pendingRoadsideBuildings = remaining;
  }

  createRoadsideBuilding(type = 'shop', side = 1) {
    const holder = new THREE.Group();
    let template = null;
    if (type === 'shop') template = this.indianShopTemplate;
    else if (type === 'clean') template = this.cleanPlaceTemplate;
    else if (type === 'office') template = this.regOfficeTemplate;
    else if (type === 'main') template = this.mainBuildingTemplate;

    if (template) {
      const clone = template.clone(true);
      if (type === 'main') {
        clone.scale.set(0.75, 0.75, 0.75);
      }
      holder.add(clone);
    } else {
      // Invisible placeholder until GLTF arrives - NO BLUE BARS OR PLACEHOLDER BLOCKS!
      const placeholder = new THREE.Group();
      holder.add(placeholder);
      this.pendingRoadsideBuildings.push({ holder, type });
    }

    // Orient facing the road
    holder.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    return holder;
  }

  createMainBuildingInstance() {
    const holder = new THREE.Group();
    if (this.mainBuildingTemplate) {
      const clone = this.mainBuildingTemplate.clone(true);
      holder.add(clone);
    } else {
      // Invisible placeholder until GLTF arrives - NO BLUE BARS!
      const placeholder = new THREE.Group();
      holder.add(placeholder);
      this.pendingDestinationBuildings.push(holder);
    }
    return holder;
  }

  // --- OFFICIAL 3D HONDA MAXI-SCOOTER (PLAYER RIDE) GLTF PIPELINE ---
  loadHondaScooterModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/honda/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          root.traverse((child) => {
            if (child.isMesh && child.material) {
              const mat = child.material;
              const matName = mat.name || '';

              if (/bolha|tranparente/i.test(matName)) {
                child.material = mat.clone();
                child.material.transparent = true;
                child.material.opacity = 0.65;
                child.material.roughness = 0.1;
                child.castShadow = false;
                child.receiveShadow = true;
              } else if (/FarolPCX/i.test(matName)) {
                child.material = mat.clone();
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveIntensity = 2.0;
                child.castShadow = false;
              } else if (/LanternaPCX/i.test(matName)) {
                child.material = mat.clone();
                child.material.emissive = new THREE.Color(0xef4444);
                child.material.emissiveIntensity = 2.2;
                child.castShadow = false;
              } else if (/banco/i.test(matName)) {
                child.material = mat.clone();
                child.material.roughness = 0.85;
                child.castShadow = true;
                child.receiveShadow = true;
              } else if (/Body|PCX_AZUL/i.test(matName)) {
                child.material = mat.clone();
                child.material.roughness = 0.3;
                child.material.metalness = 0.2;
                child.castShadow = true;
                child.receiveShadow = true;
              } else {
                child.material = mat.clone();
                child.castShadow = true;
                child.receiveShadow = true;
              }
            }
          });

          // Calibrate to scooter dimensions: Length ~2.0m, height ~1.15m, width ~0.85m
          const bbox = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          bbox.getSize(size);

          const targetLength = 2.0;
          const maxHoriz = Math.max(size.x, size.z);
          const scale = targetLength / maxHoriz;
          root.scale.set(scale, scale, scale);

          // Center horizontally and put wheels on road (y = 0)
          const scaledBox = new THREE.Box3().setFromObject(root);
          const scaledCenter = new THREE.Vector3();
          scaledBox.getCenter(scaledCenter);
          root.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

          // Honda raw GLTF authoring: rotate by -90 deg (-Math.PI / 2) so the scooty faces forward down the track (+Z),
          // showing the taillight and exhaust from behind (from the chase camera).
          const hondaPivot = new THREE.Group();
          hondaPivot.add(root);
          hondaPivot.rotation.y = -Math.PI / 2;

          const template = new THREE.Group();
          template.add(hondaPivot);
          this.hondaModelTemplate = template;

          // Integrate into player vehicle group
          this.integrateHondaScooter(template.clone(true));

          console.log('⚡ 3D Honda Maxi-Scooter Model Successfully Loaded & Integrated!');
          this.reportAssetLoaded('Honda Scooty');
        } catch (err) {
          console.error('Error integrating Honda scooter model:', err);
          this.reportAssetLoaded('Honda Scooty (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /honda/scene.gltf:', err);
        this.reportAssetLoaded('Honda Scooty (failed)');
      }
    );
  }

  integrateHondaScooter(hondaGroup) {
    if (!this.vehicleGroup) return;

    this.isHondaScooter = true;

    // Remove procedural scooty or previous model
    if (this.proceduralScooty && this.proceduralScooty.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.proceduralScooty);
    }
    if (this.hondaModelInstance && this.hondaModelInstance.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.hondaModelInstance);
    }

    this.hondaModelInstance = hondaGroup;
    this.vehicleGroup.add(hondaGroup);

    // Dynamic forward LED headlight beam projecting down the road
    if (!this.headlightSpot) {
      this.headlightSpot = new THREE.SpotLight(0xffffff, 4.0, 38, Math.PI / 6, 0.45, 1.2);
      this.headlightSpot.position.set(0, 0.92, 0.82);
      this.headlightSpot.target.position.set(0, 0, 20);
      this.vehicleGroup.add(this.headlightSpot);
      this.vehicleGroup.add(this.headlightSpot.target);
    }

    // Ergonomically seat the rider on the Honda PCX
    this.adjustRiderForHonda();
  }

  adjustRiderForHonda() {
    if (this.boygiRiderInstance) {
      this.boygiRiderInstance.position.set(0, -0.04, -0.38);
    }
    if (!this.riderPelvis || !this.torsoGroup) return;

    this.riderPelvis.position.set(0, 0.74, -0.38);

    this.torsoGroup.position.set(0, 0.85, -0.34);
    this.torsoGroup.rotation.x = 0.18;

    if (this.riderLegs) {
      this.riderLegs.forEach(({ thigh, knee, shin, sneakerGroup }) => {
        if (thigh) {
          thigh.position.set(0, 0.70, -0.16);
          thigh.rotation.x = 0.34;
        }
        if (knee) knee.position.set(0, 0.58, 0.04);
        if (shin) {
          shin.position.set(0, 0.36, 0.08);
          shin.rotation.x = 0.10;
        }
        if (sneakerGroup) sneakerGroup.position.set(0, 0.16, 0.16);
      });
    }

    if (this.arms) {
      this.arms.forEach(({ armGroup, forearm }) => {
        if (armGroup) {
          armGroup.rotation.x = 0.65;
          armGroup.rotation.z = (armGroup.position.x < 0 ? -0.18 : 0.18);
        }
        if (forearm) forearm.rotation.x = -0.42;
      });
    }
  }

  // --- 3D BOYGI PLAYER CHARACTER GLTF PIPELINE ---
  loadBoygiModel() {
    if (this.isLoadingBoygi || this.boygiModelTemplate) return;
    this.isLoadingBoygi = true;

    const loader = new GLTFLoader();
    loader.load(
      '/boygi/scene.gltf',
      (gltf) => {
        try {
          const root = gltf.scene;

          // 1. Enable dynamic shadows on character meshes
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.min(0.8, child.material.roughness || 0.6);
              }
            }
          });

          // 2. Pose the character bones into an authentic scooter commuter posture (idempotent)
          this.poseBoygiScooterRider(root);

          // 3. Human scale: raw model is ~185.67 units tall -> scaled to 1.72m
          const scale = 1.72 / 185.67;
          root.scale.set(scale, scale, scale);

          // 4. Center horizontally and place flush on scooter seat
          root.position.set(0, -0.04, -0.38);

          const template = new THREE.Group();
          template.add(root);
          this.boygiModelTemplate = template;
          this.isLoadingBoygi = false;

          // Directly integrate into vehicle group
          this.integrateBoygiRider(template);

          console.log('⚡ 3D Boygi Character Model Ready & Seated on Scooter!');
          this.reportAssetLoaded('Boygi Rider');
        } catch (err) {
          console.error('Error integrating Boygi character model:', err);
          this.isLoadingBoygi = false;
          this.reportAssetLoaded('Boygi Rider (fallback)');
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /boygi/scene.gltf:', err);
        this.isLoadingBoygi = false;
        this.reportAssetLoaded('Boygi Rider (failed)');
      }
    );
  }

  poseBoygiScooterRider(root) {
    const findBone = (pattern) => {
      let b = null;
      root.traverse((c) => {
        if (!b && pattern.test(c.name)) b = c;
      });
      return b;
    };

    const bonesToPose = [
      { pattern: /mixamorig:Spine_02/i, rx: 0.18, isSpine: true },
      { pattern: /mixamorig:Spine1_03/i, rx: 0.12 },
      { pattern: /mixamorig:Head_06/i, rx: -0.12 },
      { pattern: /mixamorig:LeftUpLeg/i, rx: 1.30, rz: -0.08 },
      { pattern: /mixamorig:RightUpLeg/i, rx: 1.30, rz: 0.08 },
      { pattern: /mixamorig:LeftLeg/i, rx: -1.30 },
      { pattern: /mixamorig:RightLeg/i, rx: -1.30 },
      { pattern: /mixamorig:LeftFoot/i, rx: 0.35 },
      { pattern: /mixamorig:RightFoot/i, rx: 0.35 },
      { pattern: /mixamorig:LeftArm_012/i, rx: 0.85, rz: 0.80 },
      { pattern: /mixamorig:RightArm_037/i, rx: 0.85, rz: -0.80 },
      { pattern: /mixamorig:LeftForeArm_013/i, rx: 0.35, rz: 0.40 },
      { pattern: /mixamorig:RightForeArm_038/i, rx: 0.35, rz: -0.40 },
      { pattern: /mixamorig:LeftHand_014/i, rx: 0.20 },
      { pattern: /mixamorig:RightHand_039/i, rx: 0.20 }
    ];

    bonesToPose.forEach(({ pattern, rx, rz, isSpine }) => {
      const b = findBone(pattern);
      if (!b) return;
      if (!b.userData.initialQuat) {
        b.userData.initialQuat = b.quaternion.clone();
      }
      // Always reset to initial rest quaternion before applying pose
      b.quaternion.copy(b.userData.initialQuat);
      if (rx) b.rotateX(rx);
      if (rz) b.rotateZ(rz);
      if (isSpine) this.boygiSpineBone = b;
    });

    root.traverse((c) => {
      if (c.isSkinnedMesh && c.skeleton) {
        c.skeleton.update();
      }
    });
    root.updateMatrixWorld(true);
  }

  integrateBoygiRider(boygiGroup) {
    if (!this.vehicleGroup) return;

    this.isBoygiRider = true;

    // Remove procedural rider if attached
    if (this.proceduralRiderGroup && this.proceduralRiderGroup.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.proceduralRiderGroup);
    }
    if (this.riderGroup && this.riderGroup.parent === this.vehicleGroup) {
      this.vehicleGroup.remove(this.riderGroup);
    }
    if (this.boygiRiderInstance && this.boygiRiderInstance.parent === this.vehicleGroup && this.boygiRiderInstance !== boygiGroup) {
      this.vehicleGroup.remove(this.boygiRiderInstance);
    }

    this.boygiRiderInstance = boygiGroup;
    if (boygiGroup.parent !== this.vehicleGroup) {
      this.vehicleGroup.add(boygiGroup);
    }

    // Re-apply pose idempotently and update world matrices
    this.poseBoygiScooterRider(boygiGroup);
  }

  // --- PRELOADER & GPU SHADER PRECOMPILATION (ELIMINATES RUNTIME LAG) ---
  preloadAllModels() {
    this.modelsLoadedCount = 0;
    this.isAssetsReady = false;
    if (this.callbacks.onAssetsProgress) {
      this.callbacks.onAssetsProgress({
        percent: 5,
        loaded: 0,
        total: this.modelsToLoad,
        modelName: 'Starting 3D Commute Fleet Preload...',
        isReady: false
      });
    }

    this.loadAltoModel();
    this.loadAutoRickshawModel();
    this.loadBusModel();
    this.loadPulsarModel();
    this.loadPersonBikerModel();
    this.loadMapleTreeModel();
    this.loadIndianShopModel();
    this.loadCleanPlaceModel();
    this.loadRegOfficeModel();
    this.loadMainBuildingModel();
  }

  reportAssetLoaded(name) {
    this.modelsLoadedCount++;
    console.log(`[AssetLoader] Loaded ${name} (${this.modelsLoadedCount}/${this.modelsToLoad})`);
    const percent = Math.min(95, Math.round((this.modelsLoadedCount / this.modelsToLoad) * 92));
    if (this.callbacks.onAssetsProgress) {
      this.callbacks.onAssetsProgress({
        percent,
        loaded: this.modelsLoadedCount,
        total: this.modelsToLoad,
        modelName: `Loaded ${name}`,
        isReady: false
      });
    }

    if (this.modelsLoadedCount >= this.modelsToLoad) {
      this.precompileShaders();
    }
  }

  precompileShaders() {
    try {
      const precompileGroup = new THREE.Group();
      precompileGroup.position.set(0, -9999, 0);

      if (this.altoModelTemplate || this.kiaModelTemplate) {
        const alto = this.createAltoInstance(false, false);
        if (alto) precompileGroup.add(alto);
      }
      if (this.autoModelTemplate) {
        const auto = this.createAutoRickshawInstance(false, false);
        if (auto) precompileGroup.add(auto);
      }
      if (this.busModelTemplate) {
        const bus = this.createBMTCBusInstance(false, false);
        if (bus) precompileGroup.add(bus);
      }
      if (this.pulsarModelTemplate) {
        precompileGroup.add(this.createPulsarInstance(false, true));
      }
      if (this.bikerModelTemplate) {
        precompileGroup.add(this.bikerModelTemplate.clone(true));
      }
      if (this.mapleTreeTemplate) {
        precompileGroup.add(this.mapleTreeTemplate.clone(true));
      }
      if (this.indianShopTemplate) {
        precompileGroup.add(this.indianShopTemplate.clone(true));
      }
      if (this.cleanPlaceTemplate) {
        precompileGroup.add(this.cleanPlaceTemplate.clone(true));
      }
      if (this.regOfficeTemplate) {
        precompileGroup.add(this.regOfficeTemplate.clone(true));
      }
      if (this.mainBuildingTemplate) {
        precompileGroup.add(this.mainBuildingTemplate.clone(true));
      }

      this.scene.add(precompileGroup);
      this.renderer.compile(this.scene, this.camera);
      this.scene.remove(precompileGroup);

      this.isAssetsReady = true;
      console.log('⚡ All 3D models & WebGL shaders pre-compiled into GPU VRAM! Ready for 60 FPS!');

      if (this.callbacks.onAssetsProgress) {
        this.callbacks.onAssetsProgress({
          percent: 100,
          loaded: this.modelsToLoad,
          total: this.modelsToLoad,
          modelName: 'All 3D Models Preloaded & GPU Cached',
          isReady: true
        });
      }
    } catch (e) {
      console.warn('Precompile shaders note:', e);
      this.isAssetsReady = true;
      if (this.callbacks.onAssetsProgress) {
        this.callbacks.onAssetsProgress({
          percent: 100,
          loaded: this.modelsToLoad,
          total: this.modelsToLoad,
          modelName: 'Ready',
          isReady: true
        });
      }
    }
  }

  setupEnvironmentMap() {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Morning sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 128);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.4, '#38bdf8');
      skyGrad.addColorStop(0.85, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 512, 128);

      // Bright morning sun reflection
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(380, 55, 24, 0, Math.PI * 2);
      ctx.fill();

      // Ground asphalt gradient
      const groundGrad = ctx.createLinearGradient(0, 128, 0, 256);
      groundGrad.addColorStop(0, '#475569');
      groundGrad.addColorStop(0.35, '#1e293b');
      groundGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 128, 512, 128);

      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      envTexture.colorSpace = THREE.SRGBColorSpace;

      const envRenderTarget = pmremGenerator.fromEquirectangular(envTexture);
      this.scene.environment = envRenderTarget.texture;

      envTexture.dispose();
      pmremGenerator.dispose();
    } catch (e) {
      console.warn('Could not generate PMREM environment map:', e);
    }
  }

  toggleCameraView() {
    const modes = ['chase', 'close', 'classic'];
    const nextIdx = (modes.indexOf(this.currentCameraPreset) + 1) % modes.length;
    this.currentCameraPreset = modes[nextIdx];
    return this.currentCameraPreset;
  }

  // --- Game Lifecycle Methods ---
  start() {
    this.gameState = 'playing';
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.runTimer = 0;
    this.officeSpawned = false;
    this.speed = this.baseSpeed;
    this.throttleInput = false;
    this.brakeInput = false;
    this.autoBrakeAssist = false;
    if (this.routeManager) this.routeManager.reset();
    this.comboCounter = 0;
    this.lastCoinTime = 0;
    this.cameraShake = 0;
    this.cameraTilt = 0;
    this.teamsCallToastTimer = 0;
    soundManager.stopTeamsAudio();

    for (const obs of this.obstacles) {
      if (obs.mesh) this.scene.remove(obs.mesh);
    }
    this.obstacles = [];

    for (const col of this.collectibles) {
      if (col.mesh) this.scene.remove(col.mesh);
    }
    this.collectibles = [];

    for (const b of this.billboardMeshes) {
      this.scene.remove(b);
    }
    this.billboardMeshes = [];

    for (const d of this.decorations) {
      if (d.mesh) this.scene.remove(d.mesh);
    }
    this.decorations = [];

    for (const p of this.smokeParticles) {
      if (p.mesh) this.scene.remove(p.mesh);
    }
    this.smokeParticles = [];

    this.roadSegments.forEach((seg, i) => {
      seg.position.z = i * this.roadSegmentLength;
    });

    this.chaser.distance = 8.5;
    this.chaser.isLunge = false;
    if (this.chaserGroup) {
      this.chaserGroup.position.set(0, 0, -this.chaser.distance);
    }

    this.resetPlayer();
    this.spawnInitialObstacles();

    soundManager.startMusic();

    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onCoinsUpdate(this.coins);
    this.callbacks.onHoverboardCountChange(this.hoverboardStock);
    this.callbacks.onDistanceUpdate(0, this.targetOfficeDistance, 55);

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.clock.start();
    this.loop();
  }

  resetPlayer() {
    this.player.lane = 1;
    this.player.x = 0;
    this.player.targetX = 0;
    this.player.y = 0;
    this.player.vy = 0;
    this.player.z = 0;
    this.player.isGrounded = true;
    this.player.isJumping = false;
    this.player.isSliding = false;
    this.player.slideTimer = 0;
    this.player.hasHoverboard = false;
    this.player.hoverboardTimer = 0;
    this.player.hasMagnet = false;
    this.player.magnetTimer = 0;
    this.player.hasSneakers = false;
    this.player.sneakersTimer = 0;
    this.player.hasMultiplier = false;
    this.player.multiplierTimer = 0;
    this.player.hasJetpack = false;
    this.player.jetpackTimer = 0;
    this.player.invulnerableTimer = 0;

    ['magnet', 'sneakers', 'multiplier', 'jetpack'].forEach(p => {
      this.callbacks.onPowerupChange(p, 0);
    });

    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0.0;
    }
    if (this.playerGroup) {
      this.playerGroup.position.set(0, 0, 0);
      this.playerGroup.rotation.z = 0;
    }
    if (this.vehicleGroup) {
      this.vehicleGroup.position.set(0, 0, 0);
      this.vehicleGroup.rotation.z = 0;
    }
    if (this.torsoGroup) {
      this.torsoGroup.rotation.x = 0.12;
    }
  }

  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      soundManager.stopMusic();
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.clock.start();
      soundManager.startMusic();
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.loop();
    }
  }

  resetToReady() {
    this.gameState = 'ready';
    this.throttleInput = false;
    this.brakeInput = false;
    this.autoBrakeAssist = false;
    if (this.routeManager) this.routeManager.reset();
    soundManager.stopMusic();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    for (const obs of this.obstacles) {
      if (obs.mesh) this.scene.remove(obs.mesh);
    }
    this.obstacles = [];

    for (const col of this.collectibles) {
      if (col.mesh) this.scene.remove(col.mesh);
    }
    this.collectibles = [];

    for (const b of this.billboardMeshes) {
      this.scene.remove(b);
    }
    this.billboardMeshes = [];

    for (const d of this.decorations) {
      if (d.mesh) this.scene.remove(d.mesh);
    }
    this.decorations = [];

    for (const p of this.smokeParticles) {
      if (p.mesh) this.scene.remove(p.mesh);
    }
    this.smokeParticles = [];

    this.roadSegments.forEach((seg, i) => {
      seg.position.z = i * this.roadSegmentLength;
    });

    this.chaser.distance = 8.5;
    this.chaser.isLunge = false;
    if (this.chaserGroup) {
      this.chaserGroup.position.set(0, 0, -this.chaser.distance);
    }

    this.resetPlayer();
    this.spawnInitialObstacles();
    this.render();
  }

  // --- 3D Bangalore City Backdrop & Elevated Metro ---
  buildCityBackdrop() {
    const cityGroup = new THREE.Group();

    // 1. Vidhana Soudha Central Dome in distant horizon
    const domeGeo = new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 15, 260);
    cityGroup.add(dome);

    const baseGeo = new THREE.BoxGeometry(45, 20, 30);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 5, 260);
    cityGroup.add(base);

    // 2. 3D Regional Office Tech Towers in Horizon Backdrop
    for (let i = 0; i < 8; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (46 + (i * 8));
      const z = 180 + (i * 15);
      const tower = this.createRoadsideBuilding('office', side);
      tower.scale.set(1.5, 1.5, 1.5);
      tower.position.set(x, 0, z);
      cityGroup.add(tower);
    }

    // 3. Elevated Namma Metro Viaduct along Right Side of Highway
    const metroMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
    const metroBeamGeo = new THREE.BoxGeometry(4.2, 1.8, 320);
    const metroBeamMat = new THREE.MeshStandardMaterial({ color: 0x8e24aa, roughness: 0.5 }); // Namma Metro Purple!
    const metroBeam = new THREE.Mesh(metroBeamGeo, metroBeamMat);
    metroBeam.position.set(15, 11, 100);
    cityGroup.add(metroBeam);

    const metroPillarGeo = new THREE.CylinderGeometry(1.2, 1.2, 11, 16);
    for (let z = -60; z <= 240; z += 35) {
      const pillar = new THREE.Mesh(metroPillarGeo, metroMat);
      pillar.position.set(15, 5.5, z);
      cityGroup.add(pillar);
    }

    // Namma Metro Purple Train Coaches
    const trainGroup = new THREE.Group();
    for (let c = 0; c < 3; c++) {
      const coach = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 2.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.5, roughness: 0.3 })
      );
      coach.position.set(15, 13.2, 80 + c * 18);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(3.64, 0.4, 15.8),
        new THREE.MeshStandardMaterial({ color: 0x8e24aa })
      );
      stripe.position.set(15, 12.8, 80 + c * 18);
      trainGroup.add(coach);
      trainGroup.add(stripe);
    }
    cityGroup.add(trainGroup);

    this.scene.add(cityGroup);
  }

  // --- Endless 3D Highway Road Segments ---
  buildRoadSegments() {
    this.roadSegmentLength = 120;
    this.totalRoadSegments = 3;

    for (let i = 0; i < this.totalRoadSegments; i++) {
      const segment = this.createRoadSegment();
      segment.position.z = i * this.roadSegmentLength;
      this.scene.add(segment);
      this.roadSegments.push(segment);
    }
  }

  createRoadSegment() {
    const group = new THREE.Group();

    // 1. Asphalt Road Bed (13m wide, 3 lanes)
    const roadGeo = new THREE.PlaneGeometry(13.2, this.roadSegmentLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x222429,
      roughness: 0.85,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    group.add(road);

    // 2. Dashed White Lane Dividers (at X = -1.9 and X = 1.9)
    const dashGeo = new THREE.PlaneGeometry(0.22, 4);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let z = -this.roadSegmentLength / 2; z < this.roadSegmentLength / 2; z += 9) {
      [-1.9, 1.9].forEach(dx => {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(dx, 0.015, z);
        group.add(dash);
      });
    }

    // 3. Road Borders & Concrete Curbs (Yellow/Black alternating Bangalore stripes)
    [-6.6, 6.6].forEach(sideX => {
      const curbGeo = new THREE.BoxGeometry(0.5, 0.35, this.roadSegmentLength);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(sideX, 0.175, 0);
      group.add(curb);

      const stripeGeo = new THREE.PlaneGeometry(0.48, 2.5);
      const yellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      for (let z = -this.roadSegmentLength / 2; z < this.roadSegmentLength / 2; z += 5) {
        const stripe = new THREE.Mesh(stripeGeo, yellowMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(sideX, 0.355, z);
        group.add(stripe);
      }
    });

    // 4. Roadside Sidewalks
    [-9.2, 9.2].forEach(sideX => {
      const walkGeo = new THREE.BoxGeometry(4.8, 0.25, this.roadSegmentLength);
      const walkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
      const walk = new THREE.Mesh(walkGeo, walkMat);
      walk.position.set(sideX, 0.125, 0);
      walk.receiveShadow = true;
      group.add(walk);
    });

    // 5. Urban Concrete Base Plaza under roadside buildings (eliminates gaps / ground voids)
    [-30, 30].forEach(sideX => {
      const plazaGeo = new THREE.PlaneGeometry(38, this.roadSegmentLength);
      const plazaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
      const plaza = new THREE.Mesh(plazaGeo, plazaMat);
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.set(sideX, 0.01, 0);
      plaza.receiveShadow = true;
      group.add(plaza);
    });

    // 6. 3D Maple Trees lining both sides along sidewalk outer curb
    for (let z = -this.roadSegmentLength / 2 + 12; z < this.roadSegmentLength / 2; z += 28) {
      const treeLeft = this.createMapleTree(0.95 + ((Math.abs(z) % 7) * 0.03));
      treeLeft.position.set(-11.5, 0, z);
      group.add(treeLeft);

      const treeRight = this.createMapleTree(0.92 + (((Math.abs(z) + 14) % 5) * 0.04));
      treeRight.position.set(11.5, 0, z + 14);
      group.add(treeRight);
    }

    // 7. Continuous Zero-Gap Roadside Buildings:
    // Full of 3D models using mainbuilding ('main') and regoffice ('office') with zero gaps!
    const leftStreet = [
      { type: 'main', z: -48, x: -23.5 },
      { type: 'office', z: -30, x: -17.0 },
      { type: 'main', z: -12, x: -23.5 },
      { type: 'shop', z: 4, x: -16.0 },
      { type: 'office', z: 14, x: -17.0 },
      { type: 'main', z: 32, x: -23.5 },
      { type: 'main', z: 52, x: -23.5 }
    ];

    leftStreet.forEach(item => {
      const bldg = this.createRoadsideBuilding(item.type, -1);
      bldg.position.set(item.x, 0, item.z);
      group.add(bldg);
    });

    const rightStreet = [
      { type: 'office', z: -54, x: 17.0 },
      { type: 'main', z: -36, x: 23.5 },
      { type: 'shop', z: -20, x: 16.0 },
      { type: 'main', z: -4, x: 23.5 },
      { type: 'office', z: 14, x: 17.0 },
      { type: 'main', z: 32, x: 23.5 },
      { type: 'main', z: 52, x: 23.5 }
    ];

    rightStreet.forEach(item => {
      const bldg = this.createRoadsideBuilding(item.type, 1);
      bldg.position.set(item.x, 0, item.z);
      group.add(bldg);
    });

    return group;
  }

  createMapleTree(scaleVariation = 1.0) {
    const holder = new THREE.Group();
    if (this.mapleTreeTemplate) {
      const tree = this.mapleTreeTemplate.clone(true);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.scale.set(scaleVariation, scaleVariation, scaleVariation);
      holder.add(tree);
    } else {
      // Clean fallback placeholder until GLTF template finishes
      const placeholder = this.createFallbackTree();
      holder.add(placeholder);
      this.pendingMapleTrees.push({ holder, scaleVariation });
    }
    return holder;
  }

  createFallbackTree() {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.48, 5.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 })
    );
    trunk.position.y = 2.7;
    trunk.castShadow = true;
    group.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(3.0, 1),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
    );
    crown.position.y = 6.6;
    crown.castShadow = true;
    group.add(crown);
    return group;
  }

  createGulmoharTree() {
    return this.createMapleTree();
  }

  createPalmTree() {
    return this.createMapleTree();
  }

  // --- 3D SCOOTER & RIDER PLAYER MODEL ---
  buildPlayer() {
    this.playerGroup = new THREE.Group();
    this.vehicleGroup = new THREE.Group();
    this.wheels = [];

    const scootyGroup = new THREE.Group();

    const bodyPaintMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pearl Sport White
      roughness: 0.25,
      metalness: 0.15
    });

    const bodyDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3
    });

    const tealAccentMat = new THREE.MeshStandardMaterial({
      color: 0x00d46a,
      emissive: 0x00d46a,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.2
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.15
    });

    // Floorboard Platform
    const floorboardGeo = new THREE.BoxGeometry(0.85, 0.12, 0.95);
    const floorboard = new THREE.Mesh(floorboardGeo, bodyDarkMat);
    floorboard.position.set(0, 0.38, 0.15);
    floorboard.receiveShadow = true;
    floorboard.castShadow = true;
    scootyGroup.add(floorboard);

    for (let i = -0.3; i <= 0.3; i += 0.15) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.02, 0.05), rubberMat);
      rib.position.set(0, 0.45, 0.15 + i);
      scootyGroup.add(rib);
    }

    const bellyGeo = new THREE.BoxGeometry(0.7, 0.22, 1.4);
    const belly = new THREE.Mesh(bellyGeo, bodyDarkMat);
    belly.position.set(0, 0.22, 0);
    belly.castShadow = true;
    scootyGroup.add(belly);

    // Front Apron
    const frontApronGroup = new THREE.Group();
    const apronMainGeo = new THREE.BoxGeometry(0.72, 0.85, 0.28);
    const apronMain = new THREE.Mesh(apronMainGeo, bodyPaintMat);
    apronMain.position.set(0, 0.82, 0.62);
    apronMain.rotation.x = -0.22;
    apronMain.castShadow = true;
    frontApronGroup.add(apronMain);

    const noseGeo = new THREE.ConeGeometry(0.24, 0.45, 4);
    const nose = new THREE.Mesh(noseGeo, tealAccentMat);
    nose.rotation.x = Math.PI / 2 + 0.2;
    nose.position.set(0, 0.65, 0.78);
    frontApronGroup.add(nose);

    const headlightGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });
    const headlight = new THREE.Mesh(headlightGeo, headlightMat);
    headlight.position.set(0, 0.95, 0.76);
    frontApronGroup.add(headlight);

    [-0.24, 0.24].forEach(x => {
      const indiGeo = new THREE.BoxGeometry(0.08, 0.05, 0.04);
      const indiMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6
      });
      const indi = new THREE.Mesh(indiGeo, indiMat);
      indi.position.set(x, 0.88, 0.74);
      frontApronGroup.add(indi);
    });

    scootyGroup.add(frontApronGroup);

    // Handlebars & Cockpit
    const handlebarGroup = new THREE.Group();
    handlebarGroup.position.set(0, 1.25, 0.52);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), chromeMat);
    stem.position.set(0, -0.15, 0);
    handlebarGroup.add(stem);

    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.18), bodyPaintMat);
    cowl.castShadow = true;
    handlebarGroup.add(cowl);

    const dashGeo = new THREE.PlaneGeometry(0.22, 0.09);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 0.075, -0.06);
    dash.rotation.x = -Math.PI / 4;
    handlebarGroup.add(dash);

    const gripBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.92, 12), chromeMat);
    gripBar.rotation.z = Math.PI / 2;
    gripBar.position.set(0, 0.02, -0.02);
    handlebarGroup.add(gripBar);

    [-0.38, 0.38].forEach(x => {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.16, 12), rubberMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(x, 0.02, -0.02);
      handlebarGroup.add(grip);
    });

    [-0.42, 0.42].forEach(x => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 6), chromeMat);
      stalk.position.set(x, 0.1, -0.01);
      stalk.rotation.z = (x < 0 ? 0.35 : -0.35);
      handlebarGroup.add(stalk);

      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.03), bodyDarkMat);
      mirrorHousing.position.set(x + (x < 0 ? -0.05 : 0.05), 0.18, -0.01);
      handlebarGroup.add(mirrorHousing);

      const mirrorGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.055),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.05 })
      );
      mirrorGlass.position.set(x + (x < 0 ? -0.05 : 0.05), 0.18, -0.026);
      mirrorGlass.rotation.y = Math.PI;
      handlebarGroup.add(mirrorGlass);
    });

    scootyGroup.add(handlebarGroup);

    // Rear Under-Seat Body
    const rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.55, 1.1), bodyPaintMat);
    rearBody.position.set(0, 0.68, -0.45);
    rearBody.castShadow = true;
    scootyGroup.add(rearBody);

    [-0.35, 0.35].forEach(x => {
      const sideTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.8), tealAccentMat);
      sideTrim.position.set(x, 0.68, -0.42);
      scootyGroup.add(sideTrim);
    });

    const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.75 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.92), seatMat);
    seat.position.set(0, 0.98, -0.35);
    seat.castShadow = true;
    scootyGroup.add(seat);

    const grabRailGeo = new THREE.TorusGeometry(0.24, 0.025, 8, 16, Math.PI);
    const grabRail = new THREE.Mesh(grabRailGeo, chromeMat);
    grabRail.rotation.x = -Math.PI / 2;
    grabRail.position.set(0, 1.04, -0.85);
    scootyGroup.add(grabRail);

    const tailLightGeo = new THREE.BoxGeometry(0.35, 0.08, 0.06);
    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9
    });
    const tailLight = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLight.position.set(0, 0.78, -1.02);
    scootyGroup.add(tailLight);

    // Exhaust Pipe (where exhaust smoke emits)
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8),
      chromeMat
    );
    exhaust.rotation.x = Math.PI / 2 + 0.1;
    exhaust.position.set(0.22, 0.26, -0.72);
    scootyGroup.add(exhaust);

    // License Plate
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 256;
    plateCanvas.height = 64;
    const pctx = plateCanvas.getContext('2d');
    pctx.fillStyle = '#ffffff';
    pctx.fillRect(0, 0, 256, 64);
    pctx.lineWidth = 4;
    pctx.strokeStyle = '#000000';
    pctx.strokeRect(2, 2, 252, 60);
    pctx.fillStyle = '#000000';
    pctx.font = 'bold 24px monospace';
    pctx.textAlign = 'center';
    pctx.fillText('KA 01 EA 2026', 128, 40);

    const plateTex = new THREE.CanvasTexture(plateCanvas);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.09), new THREE.MeshBasicMaterial({ map: plateTex }));
    plate.position.set(0, 0.62, -1.03);
    plate.rotation.y = Math.PI;
    scootyGroup.add(plate);

    // Wheels
    const createScooterWheel = () => {
      const wheelGroup = new THREE.Group();
      const tireGeo = new THREE.TorusGeometry(0.32, 0.09, 16, 24);
      const tire = new THREE.Mesh(tireGeo, rubberMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rimHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), chromeMat);
      rimHub.rotation.z = Math.PI / 2;
      wheelGroup.add(rimHub);

      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.04), chromeMat);
        spoke.rotation.x = (s * Math.PI * 2) / 5;
        wheelGroup.add(spoke);
      }

      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.015, 16), chromeMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = 0.08;
      wheelGroup.add(disc);

      return wheelGroup;
    };

    const frontFork = new THREE.Group();
    frontFork.position.set(0, 0.42, 0.72);
    [-0.14, 0.14].forEach(x => {
      const forkLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), chromeMat);
      forkLeg.position.set(x, 0.15, 0);
      forkLeg.rotation.x = -0.15;
      frontFork.add(forkLeg);
    });
    this.frontWheel = createScooterWheel();
    this.frontWheel.position.set(0, 0, 0);
    frontFork.add(this.frontWheel);
    scootyGroup.add(frontFork);
    this.wheels.push(this.frontWheel);

    const rearMount = new THREE.Group();
    rearMount.position.set(0, 0.42, -0.68);
    this.rearWheel = createScooterWheel();
    this.rearWheel.position.set(0, 0, 0);
    rearMount.add(this.rearWheel);
    scootyGroup.add(rearMount);
    this.wheels.push(this.rearWheel);

    this.proceduralScooty = scootyGroup;
    this.vehicleGroup.add(scootyGroup);

    // --- 2. 3D RIDER (Young Indian commuter, office attire, sleek backpack, helmet) ---
    const riderGroup = new THREE.Group();
    this.riderGroup = riderGroup;
    this.proceduralRiderGroup = riderGroup;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x9e6540,
      roughness: 0.65,
      metalness: 0.05
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Modern Charcoal Commuter Jacket
      roughness: 0.65,
      metalness: 0.1
    });

    const jeansMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark Navy Indigo Denim
      roughness: 0.8,
      metalness: 0.05
    });

    const sneakerMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35
    });

    const sneakerSoleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7
    });

    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Sleek black tech commuter backpack
      roughness: 0.7
    });

    const backpackStrapMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.8
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.15,
      metalness: 0.6
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.85
    });

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.95
    });

    // Sleek Pelvis seated on vehicle
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.26), jeansMat);
    pelvis.position.set(0, 0.76, -0.42);
    pelvis.castShadow = true;
    riderGroup.add(pelvis);
    this.riderPelvis = pelvis;

    // Legs and Feet
    this.riderLegs = [];
    [-0.13, 0.13].forEach(x => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, 0, 0);

      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.32), jeansMat);
      thigh.position.set(0, 0.72, -0.20);
      thigh.rotation.x = 0.38;
      thigh.castShadow = true;
      legGroup.add(thigh);

      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), jeansMat);
      knee.position.set(0, 0.60, 0.0);
      legGroup.add(knee);

      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.36, 0.10), jeansMat);
      shin.position.set(0, 0.38, 0.06);
      shin.rotation.x = 0.12;
      shin.castShadow = true;
      legGroup.add(shin);

      const sneakerGroup = new THREE.Group();
      sneakerGroup.position.set(0, 0.15, 0.14);

      const sneakerBody = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.22), sneakerMat);
      sneakerBody.position.set(0, 0.04, 0.02);
      sneakerBody.castShadow = true;
      sneakerGroup.add(sneakerBody);

      const sneakerSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 0.24), sneakerSoleMat);
      sneakerSole.position.set(0, 0, 0.02);
      sneakerGroup.add(sneakerSole);

      legGroup.add(sneakerGroup);
      riderGroup.add(legGroup);

      this.riderLegs.push({ legGroup, thigh, knee, shin, sneakerGroup });
    });

    // Upper Body
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.86, -0.38);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.42, 0.20), shirtMat);
    torso.position.set(0, 0.21, 0);
    torso.rotation.x = 0.22;
    torso.castShadow = true;
    this.torsoGroup.add(torso);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 8), shirtMat);
    collar.position.set(0, 0.42, 0.02);
    this.torsoGroup.add(collar);

    // Slim Commuter Backpack
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.12), backpackMat);
    backpack.position.set(0, 0.20, -0.14);
    backpack.rotation.x = 0.22;
    backpack.castShadow = true;
    this.torsoGroup.add(backpack);

    [-0.11, 0.11].forEach(x => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.36, 0.03), backpackStrapMat);
      strap.position.set(x, 0.22, 0.11);
      strap.rotation.x = 0.22;
      this.torsoGroup.add(strap);
    });

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.10, 8), skinMat);
    neck.position.set(0, 0.47, 0.03);
    this.torsoGroup.add(neck);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.58, 0.05);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), skinMat);
    this.headGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
    hair.position.set(0, 0.03, -0.02);
    this.headGroup.add(hair);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16), helmetMat);
    helmet.position.set(0, 0.04, 0);
    helmet.castShadow = true;
    this.headGroup.add(helmet);

    const helmetStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.04, 16), tealAccentMat);
    helmetStripe.rotation.z = Math.PI / 2;
    helmetStripe.position.set(0, 0.06, 0);
    this.headGroup.add(helmetStripe);

    const visorGeo = new THREE.CylinderGeometry(0.155, 0.155, 0.10, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, -0.01, 0.03);
    visor.rotation.y = -Math.PI / 2;
    this.headGroup.add(visor);

    this.torsoGroup.add(this.headGroup);

    // Arms & Hands gripping Handlebars
    this.riderArms = [];
    [-1, 1].forEach(side => {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.15, 0.34, 0.04);

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.26, 8), shirtMat);
      upperArm.position.set(side * 0.04, -0.08, 0.12);
      upperArm.rotation.x = -0.68;
      upperArm.rotation.z = -side * 0.20;
      armGroup.add(upperArm);

      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), shirtMat);
      elbow.position.set(side * 0.07, -0.18, 0.24);
      armGroup.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.26, 8), skinMat);
      forearm.position.set(side * 0.08, -0.26, 0.40);
      forearm.rotation.x = -1.02;
      forearm.rotation.z = -side * 0.10;
      armGroup.add(forearm);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.06), gloveMat);
      hand.position.set(side * 0.09, -0.30, 0.58);
      hand.rotation.x = 0.22;
      hand.rotation.z = side * 0.14;
      armGroup.add(hand);

      this.torsoGroup.add(armGroup);
      this.riderArms.push({ armGroup, upperArm, elbow, forearm, hand, side });
    });

    riderGroup.add(this.torsoGroup);
    this.vehicleGroup.add(riderGroup);

    // Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.4, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.38
    });
    const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.set(0, 0.02, 0.1);
    this.playerGroup.add(groundShadow);

    // Protective Shield
    const shieldGeo = new THREE.SphereGeometry(2.0, 24, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xffbb00,
      emissive: 0xff7700,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(0, 1.1, 0.1);
    this.playerGroup.add(this.shieldMesh);

    this.playerGroup.add(this.vehicleGroup);
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);

    // Asynchronously load the official 3D Person-Biker model (or integrate immediately if preloaded)
    if (this.bikerModelTemplate) {
      this.integrateBikerModel(this.bikerModelTemplate.clone(true));
    } else {
      this.loadPersonBikerModel();
    }
  }

  // --- OLA ELECTRIC SCOOTER (BLACK COLOR) USDZ MODEL INTEGRATION ---
  loadOlaScooterModel() {
    const loader = new USDLoader();
    loader.load(
      '/OLA_Electric_Scooter_Black_Color.usdz',
      (usdzGroup) => {
        try {
          this.integrateOlaScooter(usdzGroup);
          console.log('✅ OLA Electric Scooter (Black Color) 3D model successfully integrated!');
          this.render();
        } catch (err) {
          console.error('Error integrating Ola Electric Scooter model:', err);
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /OLA_Electric_Scooter_Black_Color.usdz, keeping procedural backup:', err);
      }
    );
  }

  integrateOlaScooter(usdzGroup) {
    if (!this.vehicleGroup) return;

    this.isOlaScooter = true;

    // 1. Configure automotive finishes and enable dynamic shadows
    usdzGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          // Keep base color pure white so texture maps (Base_baseColor, Second_baseColor, Wheel_baseColor) display at 100% full fidelity
          child.material.color.set(0xffffff);

          if (child.material.map) {
            child.material.map.colorSpace = THREE.SRGBColorSpace;
            child.material.map.needsUpdate = true;
          }
          if (child.material.roughnessMap) {
            child.material.roughness = 1.0;
          }
          if (child.material.metalnessMap) {
            child.material.metalness = 1.0;
          }

          // Automotive deep clearcoat reflection for the Ola S1 Pro gloss unibody panels
          if (child.material.isMeshPhysicalMaterial) {
            child.material.clearcoat = 0.85;
            child.material.clearcoatRoughness = 0.12;
            child.material.reflectivity = 0.9;
          }

          child.material.needsUpdate = true;
        }
      }
    });

    // 2. Separate Front & Rear Wheels for independent dynamic spinning
    let wheelMesh = null;
    usdzGroup.traverse((c) => {
      if (c.isMesh && c.name.includes('Wheel')) wheelMesh = c;
    });

    if (wheelMesh && wheelMesh.geometry) {
      const origGeo = wheelMesh.geometry;
      const pos = origGeo.attributes.position;
      const norm = origGeo.attributes.normal;
      const uv = origGeo.attributes.uv;

      const fPos = [], fNorm = [], fUv = [];
      const rPos = [], rNorm = [], rUv = [];

      // Pivot points in local mesh coordinates (cm)
      const fPivot = new THREE.Vector3(0, 20.813, 74.428);
      const rPivot = new THREE.Vector3(0, 20.813, -65.895);

      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        if (z > 0) {
          fPos.push(pos.getX(i) - fPivot.x, pos.getY(i) - fPivot.y, pos.getZ(i) - fPivot.z);
          if (norm) fNorm.push(norm.getX(i), norm.getY(i), norm.getZ(i));
          if (uv) fUv.push(uv.getX(i), uv.getY(i));
        } else {
          rPos.push(pos.getX(i) - rPivot.x, pos.getY(i) - rPivot.y, pos.getZ(i) - rPivot.z);
          if (norm) rNorm.push(norm.getX(i), norm.getY(i), norm.getZ(i));
          if (uv) rUv.push(uv.getX(i), uv.getY(i));
        }
      }

      const frontGeo = new THREE.BufferGeometry();
      frontGeo.setAttribute('position', new THREE.Float32BufferAttribute(fPos, 3));
      if (fNorm.length > 0) frontGeo.setAttribute('normal', new THREE.Float32BufferAttribute(fNorm, 3));
      if (fUv.length > 0) frontGeo.setAttribute('uv', new THREE.Float32BufferAttribute(fUv, 2));

      const rearGeo = new THREE.BufferGeometry();
      rearGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
      if (rNorm.length > 0) rearGeo.setAttribute('normal', new THREE.Float32BufferAttribute(rNorm, 3));
      if (rUv.length > 0) rearGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rUv, 2));

      const frontWheelMesh = new THREE.Mesh(frontGeo, wheelMesh.material);
      frontWheelMesh.castShadow = true;
      const rearWheelMesh = new THREE.Mesh(rearGeo, wheelMesh.material);
      rearWheelMesh.castShadow = true;

      const frontPivot = new THREE.Group();
      frontPivot.position.copy(fPivot);
      frontPivot.add(frontWheelMesh);

      const rearPivot = new THREE.Group();
      rearPivot.position.copy(rPivot);
      rearPivot.add(rearWheelMesh);

      wheelMesh.parent.add(frontPivot);
      wheelMesh.parent.add(rearPivot);
      wheelMesh.visible = false;

      // Assign the new rotating wheel pivots to this.wheels
      this.wheels = [frontPivot, rearPivot];
    }

    // 3. Swap the procedural body with the official 3D Ola model
    if (this.proceduralScooty) {
      this.vehicleGroup.remove(this.proceduralScooty);
    }
    this.olaModel = usdzGroup;
    this.vehicleGroup.add(usdzGroup);

    // 4. Headlight beam illuminating the road from the Ola front apron
    const headlightSpot = new THREE.SpotLight(0xffffff, 4.5, 36, Math.PI / 6, 0.45, 1.2);
    headlightSpot.position.set(0, 0.95, 0.82);
    headlightSpot.target.position.set(0, 0, 20);
    this.vehicleGroup.add(headlightSpot);
    this.vehicleGroup.add(headlightSpot.target);

    // 5. Position and seat the Rider with exact ergonomics on the Ola Electric Scooter
    this.adjustRiderForOla();
    this.render();
  }

  adjustRiderForOla() {
    if (!this.riderPelvis || !this.torsoGroup) return;

    // Ground-truth Ola model measurements:
    // Seat surface: y=0.74, z=-0.50
    // Footboard surface: y=0.15, z=0.20
    // Handlebar grips: x=±0.36, y=1.08, z=0.32

    // 1. Seat height on the Ola Electric Scooter:
    this.riderPelvis.position.set(0, 0.76, -0.42);

    // 2. Torso leaned forward naturally towards handlebars
    this.torsoGroup.position.set(0, 0.86, -0.38);
    this.torsoGroup.rotation.x = 0.22;

    // 3. Legs and feet resting firmly on the footboard
    if (this.riderLegs) {
      this.riderLegs.forEach(({ legGroup, thigh, knee, shin, sneakerGroup }) => {
        thigh.position.set(0, 0.72, -0.20);
        thigh.rotation.x = 0.38;

        knee.position.set(0, 0.60, 0.0);

        shin.position.set(0, 0.38, 0.06);
        shin.rotation.x = 0.12;

        sneakerGroup.position.set(0, 0.15, 0.14);
      });
    }

    // 4. Arms gripping the Ola Handlebars
    if (this.riderArms) {
      this.riderArms.forEach(({ armGroup, upperArm, elbow, forearm, hand, side }) => {
        armGroup.position.set(side * 0.15, 0.34, 0.04);

        upperArm.position.set(side * 0.04, -0.08, 0.12);
        upperArm.rotation.x = -0.68;
        upperArm.rotation.z = -side * 0.20;

        elbow.position.set(side * 0.07, -0.18, 0.24);

        forearm.position.set(side * 0.08, -0.26, 0.40);
        forearm.rotation.x = -1.02;
        forearm.rotation.z = -side * 0.10;

        hand.position.set(side * 0.09, -0.30, 0.58);
        hand.rotation.x = 0.22;
        hand.rotation.z = side * 0.14;
      });
    }
  }

  // --- 3D Chaser: Traffic Police Mama & Indie Dog ---
  buildChaser() {
    this.chaserGroup = new THREE.Group();

    const mamaBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xc2a649, roughness: 0.8 })
    );
    mamaBody.position.y = 1.3;
    mamaBody.castShadow = true;
    this.chaserGroup.add(mamaBody);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.42, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    cap.position.y = 2.45;
    this.chaserGroup.add(cap);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x945d37 })
    );
    head.position.y = 2.15;
    this.chaserGroup.add(head);

    const dog = new THREE.Group();
    const dogBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.85),
      new THREE.MeshStandardMaterial({ color: 0xc27838, roughness: 0.9 })
    );
    dogBody.position.y = 0.45;
    dog.add(dogBody);

    const dogHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.32, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xc27838 })
    );
    dogHead.position.set(0, 0.72, 0.45);
    dog.add(dogHead);

    dog.position.set(-1.1, 0, 0);
    this.chaserGroup.add(dog);

    this.chaserGroup.position.set(0, 0, -this.chaser.distance);
    this.scene.add(this.chaserGroup);
  }

  // --- World Spawner ---
  spawnInitialObstacles() {
    // Starting line right outside Sobha Sentosa residential gates
    this.spawnCoinLine(0, 18, 6, 0.6);
    this.spawnSpeedBreaker(0, 42);

    this.spawnOncomingScooter(this.laneWidth, 75);
    this.spawnCoinLine(this.laneWidth, 70, 4, 0.6);

    this.spawnAutoRickshaw(-this.laneWidth, 110, false);
    this.spawnCoinLine(-this.laneWidth, 105, 5, 0.5);

    // Clean Shop blocker in road lane
    this.spawnCleanShopBlocker(0, 135);

    this.spawnKannadaGantry(60, this.gantrySigns[0]);
    this.spawnTeaStall(-10.5, 85);
    this.spawnBillboard(8.5, 105, this.startupQuotes[0]);
  }

  spawnNextSegment(minZ) {
    if (this.routeManager) {
      this.routeManager.onSpawnSegment(minZ);
    }

    if (this.distance >= this.targetOfficeDistance - 150) {
      return; // Ecospace arrival zone reached!
    }

    const currentSeg = this.routeManager ? this.routeManager.getCurrentSegment(this.distance) : { id: 1 };
    const segId = currentSeg.id;
    const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    const roll = Math.random();

    // ─── SEGMENT 1: SOBHA SENTOSA EXIT (0 - 500m) ──────────────────────────
    if (segId === 1) {
      if (roll < 0.18) {
        // 3D Clean Shop / Civic Complex Blocker in middle of road!
        this.spawnCleanShopBlocker(laneX, minZ);
        this.spawnCoinLine(laneX, minZ + 8, 3, 0.6);
      } else if (roll < 0.44) {
        this.spawnOncomingScooter(laneX, minZ);
        this.spawnCoinLine(laneX, minZ + 5, 4, 0.6);
      } else if (roll < 0.68) {
        this.spawnAutoRickshaw(laneX, minZ, false);
        this.spawnCoinLine(laneX, minZ + 5, 4, 0.6);
      } else if (roll < 0.82) {
        this.spawnSpeedBreaker(laneX, minZ);
      } else {
        const powerups = ['kaapi', 'magnet', 'warp'];
        const chosen = powerups[Math.floor(Math.random() * powerups.length)];
        this.spawnPowerup(laneX, minZ, chosen);
        this.spawnCoinLine(laneX, minZ + 6, 4, 0.6);
      }

      if (Math.random() < 0.3) {
        this.spawnTeaStall(Math.random() < 0.5 ? -10.5 : 10.5, minZ + 20);
      }
    }
    // ─── SEGMENT 2: LOCAL PANATHUR ROADS (500 - 1200m) ─────────────────────
    else if (segId === 2) {
      // First traffic slowdown queue before underpass descent (at ~950m)
      if (this.distance >= 920 && this.distance <= 980 && !this.panathurQueueSpawned) {
        this.panathurQueueSpawned = true;
        this.spawnTrafficQueue(minZ, 'jam');
        this.spawnCoinLine(this.laneWidth, minZ + 8, 5, 0.6);
        return;
      }

      if (roll < 0.18) {
        // 3D Clean Shop Blocker in middle of road!
        this.spawnCleanShopBlocker(laneX, minZ);
        this.spawnCoinLine(laneX, minZ + 8, 3, 0.6);
      } else if (roll < 0.38) {
        // Speed breakers on Panathur high street
        this.spawnSpeedBreaker(laneX, minZ);
        this.spawnCoinArc(laneX, minZ - 6, 4);
      } else if (roll < 0.58) {
        // Stopping autos picking up passengers
        this.spawnAutoRickshaw(laneX, minZ, Math.random() < 0.3);
        this.spawnCoinLine(laneX, minZ + 5, 4, 0.6);
      } else if (roll < 0.76) {
        this.spawnPothole(laneX, minZ);
        this.spawnCoinArc(laneX, minZ - 5, 4);
      } else if (roll < 0.90) {
        const isOncoming = Math.random() < 0.45;
        this.spawnHatchbackCab(laneX, minZ, false, isOncoming);
        this.spawnCoinLine(laneX, minZ + 6, 4, 0.7);
      } else {
        this.spawnPowerup(laneX, minZ, 'kaapi');
        this.spawnCoinLine(laneX, minZ + 6, 4, 0.6);
      }

      // Kannada Shops along Panathur Road
      if (Math.random() < 0.45) {
        const shopTypes = ['nandini', 'bakery', 'kaapi'];
        const shopType = shopTypes[Math.floor(Math.random() * shopTypes.length)];
        const side = Math.random() < 0.5 ? 1 : -1;
        const shop = createKannadaShop(side, minZ + 15, shopType, this);
        this.scene.add(shop);
        this.billboardMeshes.push(shop);
      }
    }
    // ─── SEGMENT 3: PANATHUR RAILWAY UNDERPASS (1200 - 1800m) ──────────────
    else if (segId === 3) {
      // Underpass Congestion Queue
      if (roll < 0.18) {
        // 3D Clean Shop Blocker in middle of road!
        this.spawnCleanShopBlocker(laneX, minZ);
        this.spawnCoinLine(laneX, minZ + 8, 3, 0.6);
      } else if (roll < 0.45) {
        // Slow-moving / stopped traffic queue in underpass bottleneck
        const auto = this.spawnAutoRickshaw(laneX, minZ, false, Math.random() < 0.5);
        this.spawnCoinLine(laneX, minZ + 6, 5, 0.6);
      } else if (roll < 0.68) {
        const isQueue = Math.random() < 0.25;
        this.spawnHatchbackCab(laneX, minZ, isQueue, false);
        this.spawnCoinLine(laneX, minZ + 6, 4, 0.7);
      } else if (roll < 0.84) {
        this.spawnPothole(laneX, minZ); // Drainage grate / pothole
        this.spawnCoinArc(laneX, minZ - 5, 4);
      } else {
        this.spawnPowerup(laneX, minZ, 'magnet');
        this.spawnCoinLine(laneX, minZ + 6, 4, 0.6);
      }
    }
    // ─── SEGMENT 4: CONNECTING ROADS TOWARD OUTER RING ROAD (1800 - 2600m) ─
    else if (segId === 4) {
      // Red Light Signal Queue at ~2150m
      if (this.distance >= 2100 && this.distance <= 2180 && !this.signalQueueSpawned) {
        this.signalQueueSpawned = true;
        this.spawnTrafficQueue(minZ, 'signal');
        return;
      }

      if (roll < 0.18) {
        // 3D Clean Shop Blocker in middle of road!
        this.spawnCleanShopBlocker(laneX, minZ);
        this.spawnCoinLine(laneX, minZ + 8, 3, 0.6);
      } else if (roll < 0.44) {
        // BMTC Electric Bus (Royal Blue & White Route 500D ITPL)
        this.spawnBMTCBus(laneX, minZ, Math.random() < 0.15);
        this.spawnCoinLine(laneX, minZ - 4, 7, 3.8); // On bus roof!
      } else if (roll < 0.66) {
        const isOncoming = Math.random() < 0.40;
        this.spawnHatchbackCab(laneX, minZ, false, isOncoming);
        this.spawnCoinLine(laneX, minZ + 6, 4, 0.7);
      } else if (roll < 0.84) {
        this.spawnAutoRickshaw(laneX, minZ, false);
        this.spawnCoinLine(laneX, minZ + 5, 4, 0.6);
      } else {
        const powerups = ['kaapi', 'metro_jetpack', 'warp', 'magnet'];
        const chosen = powerups[Math.floor(Math.random() * powerups.length)];
        this.spawnPowerup(laneX, minZ, chosen);
        this.spawnCoinLine(laneX, minZ + 8, 4, 0.6);
      }

      if (Math.random() < 0.35) {
        const quote = this.startupQuotes[Math.floor(Math.random() * this.startupQuotes.length)];
        this.spawnBillboard(Math.random() < 0.5 ? -8.8 : 8.8, minZ + 22, quote);
      }
    }
    // ─── SEGMENT 5: ECOSPACE ARRIVAL (2600 - 3000m) ────────────────────────
    else {
      if (roll < 0.3) {
        this.spawnAutoRickshaw(laneX, minZ, false);
      }
      this.spawnCoinLine(0, minZ + 5, 6, 0.6);
    }
  }

  // --- 1. VARIANT A: BMTC ELECTRIC BUS (True 3D Model, Moving in Traffic) ---
  spawnBMTCBus(x, z, isOncoming = false, isStationary = false) {
    let busMesh;
    let isPending = false;

    if (this.busModelTemplate) {
      busMesh = this.createBMTCBusInstance(isStationary, isOncoming);
    } else {
      // Lightweight placeholder if spawned before asset finishes loading
      const placeholder = new THREE.Group();
      const lowerBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.2, 11.2),
        new THREE.MeshStandardMaterial({ color: 0x0072ce, roughness: 0.3 })
      );
      lowerBody.position.y = 0.85;
      lowerBody.castShadow = true;
      placeholder.add(lowerBody);

      const roofBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.45, 11.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      roofBody.position.y = 3.1;
      placeholder.add(roofBody);

      placeholder.rotation.y = isOncoming ? Math.PI : 0;
      busMesh = placeholder;
      isPending = true;
    }

    // Speed & Traffic Movement
    let speed = 0;
    if (isStationary) {
      speed = 0;
    } else if (isOncoming) {
      speed = 14; // Approaching oncoming traffic
    } else {
      speed = -11; // Cruising forward in traffic
    }

    busMesh.position.set(x, 0, z);
    this.scene.add(busMesh);

    const obs = {
      type: 'bmtc_bus',
      mesh: busMesh,
      x,
      z,
      height: 3.65,
      width: 2.85,
      length: 11.2,
      speed,
      isStationary: !!isStationary,
      isOncoming: !!isOncoming,
      wheelMeshes: [],
      wheelRadius: 0.48
    };

    if (isPending) {
      this.pendingBuses.push(obs);
    }

    this.obstacles.push(obs);
    return obs;
  }

  // --- 2. ONCOMING COMMUTER MOTORCYCLE (True 3D Bajaj Pulsar Model) ---
  spawnOncomingScooter(x, z) {
    let bikeMesh;
    let isPending = false;

    if (this.pulsarModelTemplate) {
      bikeMesh = this.createPulsarInstance(false, true);
    } else {
      // Sleek fallback while GLTF finishes loading
      const placeholder = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.7, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
      );
      body.position.y = 0.55;
      placeholder.add(body);
      placeholder.rotation.y = Math.PI;
      bikeMesh = placeholder;
      isPending = true;
    }

    bikeMesh.position.set(x, 0, z);
    this.scene.add(bikeMesh);

    const obs = {
      type: 'oncoming_scooter',
      mesh: bikeMesh,
      x,
      z,
      height: 1.6,
      width: 1.2,
      length: 2.1,
      speed: 16, // Moving towards player!
      wheelMeshes: [],
      wheelRadius: 0.32
    };

    if (isPending) {
      this.pendingBikes.push(obs);
    }

    this.obstacles.push(obs);
    return obs;
  }

  // --- 3. YELLOW & GREEN AUTO-RICKSHAW (True 3D Model) ---
  spawnAutoRickshaw(x, z, isOncoming = false, isStationary = false) {
    let autoMesh;
    let isPending = false;

    if (this.autoModelTemplate) {
      autoMesh = this.createAutoRickshawInstance(isStationary, isOncoming);
    } else {
      // Lightweight placeholder if spawned before asset finishes loading
      const placeholder = new THREE.Group();
      const lower = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
      );
      lower.position.y = 0.65;
      lower.castShadow = true;
      placeholder.add(lower);

      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.75, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      roof.position.y = 1.45;
      placeholder.add(roof);

      placeholder.rotation.y = isOncoming ? Math.PI : 0;
      autoMesh = placeholder;
      isPending = true;
    }

    // Speed: Autos cruise at -6 or approach at 14
    let speed = 0;
    if (isStationary) {
      speed = 0;
    } else if (isOncoming) {
      speed = 14;
    } else {
      speed = -6;
    }

    autoMesh.position.set(x, 0, z);
    this.scene.add(autoMesh);

    const obs = {
      type: 'auto',
      mesh: autoMesh,
      x,
      z,
      height: 1.85,
      width: 1.5,
      length: 2.65,
      speed,
      isStationary: !!isStationary,
      isOncoming: !!isOncoming,
      wheelMeshes: [],
      wheelRadius: 0.32
    };

    if (isPending) {
      this.pendingAutoRickshaws.push(obs);
    }

    this.obstacles.push(obs);
    return obs;
  }

  // --- 4. MARUTI SUZUKI ALTO HATCHBACK CAB ---
  spawnHatchbackCab(x, z, isStationary = false, isOncoming = false) {
    let carMesh;
    let isPending = false;
    let wheelMeshes = [];

    const template = this.altoModelTemplate || this.kiaModelTemplate;
    if (template) {
      carMesh = this.createAltoInstance(isStationary, isOncoming);
      wheelMeshes = carMesh.userData.wheelMeshes || [];
    } else {
      // Sleek placeholder while GLTF finishes loading
      const placeholder = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.7, 3.8),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      body.position.y = 0.55;
      body.castShadow = true;
      placeholder.add(body);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.65, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 })
      );
      cabin.position.set(0, 1.18, -0.15);
      cabin.castShadow = true;
      placeholder.add(cabin);

      placeholder.rotation.y = isOncoming ? 0 : Math.PI;
      carMesh = placeholder;
      isPending = true;
    }

    carMesh.position.set(x, 0, z);
    this.scene.add(carMesh);

    // Active Bangalore commute speeds:
    // Oncoming: driving straight at the player with high relative speed (+18)
    // Moving with traffic: cruising forward ahead of player (-14)
    // Stationary: stopped in queue (0)
    let speed = 0;
    if (isStationary) {
      speed = 0;
    } else if (isOncoming) {
      speed = 18;
    } else {
      speed = -14;
    }

    const obs = {
      type: 'auto',
      mesh: carMesh,
      x,
      z,
      height: 1.6,
      width: 1.85,
      length: 3.8,
      speed,
      isStationary: !!isStationary,
      isOncoming: !!isOncoming,
      wheelMeshes,
      wheelRadius: 0.32,
      baseY: 0
    };

    if (isPending) {
      this.pendingAltoCabs.push(obs);
      this.pendingKiaCabs.push(obs);
    }

    this.obstacles.push(obs);
    return obs;
  }

  // --- SPEED BREAKER (Yellow & Black striped road hump) ---
  spawnSpeedBreaker(x, z) {
    const mesh = createSpeedBreaker(x, z);
    this.scene.add(mesh);
    this.obstacles.push({
      mesh,
      type: 'speed_breaker',
      x,
      z,
      width: 3.6,
      height: 0.22,
      length: 1.2
    });
  }

  // --- TRAFFIC QUEUE (Stopped vehicles before junction or bottleneck) ---
  spawnTrafficQueue(z, type = 'signal') {
    this.spawnAutoRickshaw(this.laneWidth, z, false, true);
    this.spawnHatchbackCab(0, z + 5.5, true);
    if (type === 'signal') {
      this.spawnBMTCBus(-this.laneWidth, z + 16, false, true);
    }
  }

  // --- 5. HIGH-VISIBILITY POTHOLE WITH HAZARD PAINT RING & REFLECTIVE PUDDLE ---
  spawnPothole(x, z) {
    const holeGroup = new THREE.Group();

    // Bright Fluorescent Yellow Spray-Painted Hazard Boundary Ring (Unmistakable Bangalore Civic Warning)
    const hazardRingGeo = new THREE.RingGeometry(1.05, 1.55, 24);
    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright Fluorescent Bangalore Yellow
      emissive: 0xfacc15,
      emissiveIntensity: 0.95,
      roughness: 0.2
    });
    const hazardRing = new THREE.Mesh(hazardRingGeo, hazardMat);
    hazardRing.rotation.x = -Math.PI / 2;
    hazardRing.position.y = 0.035;
    holeGroup.add(hazardRing);

    // 3D Bangalore BBMP Fluorescent Traffic Hazard Marker Cone on pothole rim
    const coneGroup = new THREE.Group();
    const coneBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.05, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    coneBase.position.y = 0.025;
    coneGroup.add(coneBase);

    const coneGeo = new THREE.ConeGeometry(0.14, 0.65, 12);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff4500, // Neon Safety Orange
      emissive: 0xff3300,
      emissiveIntensity: 0.65,
      roughness: 0.3
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.35;
    coneGroup.add(cone);

    const coneStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 })
    );
    coneStripe.position.y = 0.35;
    coneGroup.add(coneStripe);

    // Position cone prominently on the outer rim of the pothole
    coneGroup.position.set(1.15, 0, 0);
    holeGroup.add(coneGroup);

    // Dark Broken Asphalt Crater Ring
    const craterGeo = new THREE.RingGeometry(0.75, 1.05, 20);
    const craterMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.95
    });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.rotation.x = -Math.PI / 2;
    crater.position.y = 0.038;
    holeGroup.add(crater);

    // Dark Reflective Muddy Water Puddle with Concentric Ripple Ring
    const puddleGeo = new THREE.CircleGeometry(0.75, 20);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.02
    });
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.y = 0.032;
    holeGroup.add(puddle);

    const rippleGeo = new THREE.RingGeometry(0.35, 0.45, 16);
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 0.034;
    holeGroup.add(ripple);

    holeGroup.position.set(x, 0, z);
    this.scene.add(holeGroup);

    this.obstacles.push({
      type: 'pothole',
      mesh: holeGroup,
      x,
      z,
      height: 0.4,
      width: 2.8,
      length: 2.8
    });
  }

  spawnBBMPBarricade(x, z) {
    const bar = new THREE.Group();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#0f172a';
    for (let i = -64; i < 300; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 16, 0);
      ctx.lineTo(i - 8, 64);
      ctx.lineTo(i - 24, 64);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BBMP WORK IN PROGRESS', 128, 42);

    const tex = new THREE.CanvasTexture(canvas);
    const panelMat = new THREE.MeshBasicMaterial({ map: tex });

    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.08), panelMat);
    panel.position.y = 0.68;
    panel.castShadow = true;
    bar.add(panel);

    [-1.15, 1.15].forEach(lx => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
      );
      leg.position.set(lx, 0.5, 0);
      bar.add(leg);
    });

    bar.position.set(x, 0, z);
    this.scene.add(bar);

    this.obstacles.push({
      type: 'bbmp_barricade',
      mesh: bar,
      x,
      z,
      height: 1.0,
      width: 2.6,
      length: 0.4
    });
  }

  // --- 3D CLEAN SHOP / CIVIC COMPLEX ROADWAY BLOCKER ---
  spawnCleanShopBlocker(x, z) {
    const group = new THREE.Group();

    if (this.cleanPlaceTemplate) {
      const clone = this.cleanPlaceTemplate.clone(true);
      clone.scale.set(0.36, 0.44, 0.36);
      group.add(clone);
    } else {
      // Clean fallback kiosk placeholder until GLTF finishes loading
      const kioskGeo = new THREE.BoxGeometry(2.8, 3.4, 2.8);
      const kioskMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.6 });
      const kiosk = new THREE.Mesh(kioskGeo, kioskMat);
      kiosk.position.y = 1.7;
      kiosk.castShadow = true;
      group.add(kiosk);

      if (!this.pendingCleanShopBlockers) this.pendingCleanShopBlockers = [];
      this.pendingCleanShopBlockers.push({ holder: group });
    }

    // Hazard warning barrier & reflector stripes on the front
    const barrierGeo = new THREE.BoxGeometry(2.9, 0.35, 0.12);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(0, 0.2, 1.5);
    group.add(barrier);

    // Flashing amber construction beacon on top
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xff9900, emissive: 0xff9900, emissiveIntensity: 1.4 })
    );
    beacon.position.set(0, 2.7, 0);
    group.add(beacon);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.obstacles.push({
      type: 'clean_shop_blocker',
      mesh: group,
      x,
      z,
      height: 3.2,
      width: 2.8,
      length: 3.0
    });
  }

  spawnHangingCables(x, z) {
    const cableGroup = new THREE.Group();

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-this.laneWidth * 1.5, 2.8, 0),
      new THREE.Vector3(x, 1.45, 0),
      new THREE.Vector3(this.laneWidth * 1.5, 2.8, 0)
    ]);

    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const cable = new THREE.Mesh(tubeGeo, cableMat);
    cableGroup.add(cable);

    [-this.laneWidth * 1.5, this.laneWidth * 1.5].forEach(px => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
      );
      pole.position.set(px, 3.0, 0);
      cableGroup.add(pole);
    });

    cableGroup.position.set(0, 0, z);
    this.scene.add(cableGroup);

    this.obstacles.push({
      type: 'hanging_cables',
      mesh: cableGroup,
      x,
      z,
      height: 1.45,
      width: 3.8,
      length: 0.4
    });
  }

  // --- Roadside Tea Stall & Kannada Gantry Signs ---
  spawnTeaStall(x, z) {
    const stall = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.4, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
    );
    base.position.y = 1.2;
    base.castShadow = true;
    stall.add(base);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.2, 2.6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
    );
    awning.position.set(0, 2.5, 0.2);
    awning.rotation.x = 0.15;
    stall.add(awning);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SRI KRISHNA TEA & COFFEE', 256, 52);
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('FILTER KAAPI & HOT BUNS', 256, 96);

    const tex = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.75), new THREE.MeshBasicMaterial({ map: tex }));
    sign.position.set(0, 2.9, 0.3);
    stall.add(sign);

    stall.position.set(x, 0, z);
    this.scene.add(stall);
    this.decorations.push({ mesh: stall, z });
  }

  spawnKannadaGantry(z, signData) {
    const gantry = new THREE.Group();

    const archMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    [-7.2, 7.2].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 8.5, 8), archMat);
      pillar.position.set(px, 4.25, 0);
      gantry.add(pillar);
    });

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.45, 0.45), archMat);
    crossBeam.position.set(0, 8.2, 0);
    gantry.add(crossBeam);

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 768, 256);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(10, 10, 748, 236);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText(signData.kannada, 384, 85);

    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(signData.english, 384, 155);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`${signData.arrow} ${signData.dist}`, 384, 215);

    const tex = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.8), new THREE.MeshBasicMaterial({ map: tex }));
    sign.position.set(0, 7.2, -0.25);
    sign.rotation.y = Math.PI;
    gantry.add(sign);

    gantry.position.set(0, 0, z);
    this.scene.add(gantry);
    this.decorations.push({ mesh: gantry, z });
  }

  spawnBillboard(x, z, quote) {
    const billboard = new THREE.Group();

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 7.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 })
    );
    pillar.position.y = 3.75;
    billboard.add(pillar);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 3.4, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    frame.position.y = 6.8;
    billboard.add(frame);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const cCtx = canvas.getContext('2d');
    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, 512, 256);

    cCtx.fillStyle = quote.color;
    cCtx.fillRect(10, 10, 492, 60);

    cCtx.fillStyle = '#ffffff';
    cCtx.font = 'bold 22px sans-serif';
    cCtx.textAlign = 'left';
    cCtx.fillText(quote.tag, 25, 48);

    cCtx.textAlign = 'right';
    cCtx.fillText(quote.brand, 485, 48);

    cCtx.fillStyle = '#0f172a';
    cCtx.textAlign = 'center';
    cCtx.font = 'bold 24px sans-serif';
    const words = quote.text.split(' ');
    const half = Math.ceil(words.length / 2);
    cCtx.fillText(words.slice(0, half).join(' '), 256, 135);
    cCtx.fillText(words.slice(half).join(' '), 256, 185);

    const texture = new THREE.CanvasTexture(canvas);
    const signFace = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 3.2), new THREE.MeshBasicMaterial({ map: texture }));
    signFace.position.set(0, 6.8, -0.19);
    signFace.rotation.y = Math.PI;
    billboard.add(signFace);

    billboard.position.set(x, 0, z);
    this.scene.add(billboard);
    this.billboardMeshes.push(billboard);
  }

  // --- Tech Park Entrance ---
  spawnTechParkEntrance(z) {
    const gateGroup = new THREE.Group();

    const gateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2
    });

    [-8.5, 8.5].forEach(px => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.8, 11, 1.8), gateMat);
      p.position.set(px, 5.5, 0);
      gateGroup.add(p);
    });

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(19.2, 2.2, 2.2), gateMat);
    topBeam.position.set(0, 10.5, 0);
    gateGroup.add(topBeam);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#00d46a';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME TO ECOSPACE TECH PARK', 512, 85);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('OUTER RING ROAD - BELLANDUR // PUNCH-IN GATE 1', 512, 160);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('MONDAY MORNING 9:00 AM STANDUP // ARRIVAL BAY', 512, 215);

    const tex = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(17.5, 4.4), new THREE.MeshBasicMaterial({ map: tex }));
    sign.position.set(0, 10.5, -1.15);
    sign.rotation.y = Math.PI;
    gateGroup.add(sign);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.8, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    cabin.position.set(7.2, 1.4, 3.5);
    gateGroup.add(cabin);

    const boomBarrier = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 8.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 })
    );
    boomBarrier.rotation.z = Math.PI / 3;
    boomBarrier.position.set(4.0, 3.5, 2.2);
    gateGroup.add(boomBarrier);

    gateGroup.position.set(0, 0, z);
    this.scene.add(gateGroup);
    this.decorations.push({ mesh: gateGroup, z, isOfficeGate: true });
  }

  // --- Collectibles ---
  spawnCoinLine(x, startZ, count, y = 0.6) {
    for (let i = 0; i < count; i++) {
      this.spawnSingleCoin(x, y, startZ + i * 4.2);
    }
  }

  spawnCoinArc(x, startZ, count) {
    for (let i = 0; i < count; i++) {
      const arcY = 0.6 + Math.sin((i / (count - 1)) * Math.PI) * 2.8;
      this.spawnSingleCoin(x, arcY, startZ + i * 3.8);
    }
  }

  spawnSingleCoin(x, y, z) {
    const coinGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.1, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff9900,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.2
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(x, y, z);
    this.scene.add(coin);

    this.collectibles.push({
      type: 'coin',
      mesh: coin,
      x,
      y,
      z,
      radius: 0.75
    });
  }

  createPowerupTokenMesh(type) {
    const group = new THREE.Group();

    // 1. Generate high-resolution 2D Canvas Icon Badge
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    let bgGrad;
    let ringColor = 0xf59e0b;

    if (type === 'magnet') {
      bgGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      bgGrad.addColorStop(0, '#dc2626');
      bgGrad.addColorStop(0.7, '#991b1b');
      bgGrad.addColorStop(1, '#1e1b4b');
      ringColor = 0x38bdf8; // Electric cyan magnetic field ring!
    } else if (type === 'kaapi' || type === 'multiplier') {
      bgGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      bgGrad.addColorStop(0, '#f59e0b');
      bgGrad.addColorStop(0.7, '#b45309');
      bgGrad.addColorStop(1, '#451a03');
      ringColor = 0xfbbf24;
    } else if (type === 'warp' || type === 'sneakers') {
      bgGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      bgGrad.addColorStop(0, '#10b981');
      bgGrad.addColorStop(0.7, '#047857');
      bgGrad.addColorStop(1, '#064e3b');
      ringColor = 0x34d399;
    } else {
      // Jetpack
      bgGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      bgGrad.addColorStop(0, '#a855f7');
      bgGrad.addColorStop(0.7, '#7e22ce');
      bgGrad.addColorStop(1, '#3b0764');
      ringColor = 0xc084fc;
    }

    // Draw medallion base circle
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.fill();

    // Metallic golden bezel rim
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Inner glowing ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 104, 0, Math.PI * 2);
    ctx.stroke();

    // Prominent bold typography & icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (type === 'magnet') {
      // BIG BOLD "M" FOR MAGNET!
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 130px "Arial Black", Impact, sans-serif';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.fillText('M', 128, 116);
      ctx.shadowBlur = 0;

      // Sub-label "MAGNET"
      ctx.fillStyle = '#fde047';
      ctx.font = '900 24px "Arial Black", sans-serif';
      ctx.fillText('MAGNET', 128, 192);
    } else if (type === 'kaapi' || type === 'multiplier') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 110px "Arial Black", Impact, sans-serif';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.fillText('2X', 128, 116);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fde047';
      ctx.font = '900 24px "Arial Black", sans-serif';
      ctx.fillText('KAAPI', 128, 192);
    } else if (type === 'warp' || type === 'sneakers') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 130px "Arial Black", Impact, sans-serif';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 18;
      ctx.fillText('⚡', 128, 122);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#6ee7b7';
      ctx.font = '900 24px "Arial Black", sans-serif';
      ctx.fillText('SPEED', 128, 192);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 120px "Arial Black", Impact, sans-serif';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 18;
      ctx.fillText('🚀', 128, 120);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#e9d5ff';
      ctx.font = '900 24px "Arial Black", sans-serif';
      ctx.fillText('JETPACK', 128, 192);
    }

    const badgeTex = new THREE.CanvasTexture(canvas);
    badgeTex.anisotropy = 4;

    // 2. Dual-faced 3D Medallion Mesh
    const discGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.18, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: badgeTex,
      roughness: 0.3,
      metalness: 0.1
    });

    const disc = new THREE.Mesh(discGeo, [rimMat, faceMat, faceMat]);
    disc.rotation.x = Math.PI / 2;
    disc.castShadow = true;
    group.add(disc);

    // 3. Orbiting Energy Torus Ring
    const ringGeo = new THREE.TorusGeometry(1.22, 0.045, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: ringColor,
      emissive: ringColor,
      emissiveIntensity: 1.8,
      roughness: 0.1
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
    group.userData.ring = ring;

    return group;
  }

  spawnPowerup(x, z, type) {
    const group = this.createPowerupTokenMesh(type);
    group.position.set(x, 1.25, z);
    this.scene.add(group);

    this.collectibles.push({
      type: 'powerup',
      powerupType: type,
      mesh: group,
      ring: group.userData.ring,
      x,
      y: 1.25,
      z,
      radius: 0.95
    });
  }

  // --- Dynamic Exhaust / Tire Dust Emission ---
  emitExhaustSmoke() {
    const isWarp = this.player.hasSneakers;
    // For Ola Electric Scooter, emit subtle street dust or cyan electric warp particles!
    const color = isWarp ? 0x00f0ff : (this.isOlaScooter ? 0xe2e8f0 : 0xf1f5f9);
    const puffGeo = new THREE.SphereGeometry(this.isOlaScooter && !isWarp ? 0.08 : 0.12, 8, 8);
    const puffMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isWarp ? 0.85 : (this.isOlaScooter ? 0.45 : 0.65)
    });
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.set(
      this.player.x + (this.isOlaScooter ? 0 : 0.22) + (Math.random() - 0.5) * 0.06,
      this.player.y + (this.isOlaScooter ? 0.08 : 0.26),
      this.player.z - (this.isOlaScooter ? 0.72 : 0.78)
    );
    this.scene.add(puff);

    this.smokeParticles.push({
      mesh: puff,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (this.isOlaScooter && !isWarp ? 0.15 : 0.4) + Math.random() * 0.25,
      vz: -(this.speed * 0.4 + 4),
      life: 0.6,
      maxLife: 0.6
    });
  }

  updateSmokeParticles(dt) {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      const progress = 1 - (p.life / p.maxLife);
      const scale = 1 + progress * 3.4;
      p.mesh.scale.set(scale, scale, scale);
      p.mesh.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.65);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  // --- Controls (INVERTED BUG FIXED: RIGHT GOES RIGHT, LEFT GOES LEFT) ---
  moveLeft() {
    if (this.gameState !== 'playing') return;
    // Moves to the visual LEFT lane
    if (this.player.lane > 0) {
      this.player.lane--;
      this.player.targetX = this.lanes[this.player.lane];
      this.cameraTilt = -0.08; // Lean left
      soundManager.playLaneSwitch();
    }
  }

  moveRight() {
    if (this.gameState !== 'playing') return;
    // Moves to the visual RIGHT lane
    if (this.player.lane < this.lanes.length - 1) {
      this.player.lane++;
      this.player.targetX = this.lanes[this.player.lane];
      this.cameraTilt = 0.08; // Lean right
      soundManager.playLaneSwitch();
    }
  }

  setThrottle(active) {
    this.throttleInput = active;
  }

  setBrake(active) {
    this.brakeInput = active;
    if (active) {
      soundManager.playBrake();
    }
  }

  jump() {
    if (this.gameState !== 'playing') return;
    if (this.player.hasJetpack) return;

    // Disable jumping near Red Light stop line to prevent skipping traffic rules
    if (this.routeManager && this.routeManager.trafficSignal && this.routeManager.trafficSignal.isRed()) {
      const distToLine = this.routeManager.trafficSignal.getStopLineWorldZ() - this.player.z;
      if (distToLine >= -2 && distToLine <= 16) {
        return;
      }
    }

    if (this.player.isGrounded || this.player.y <= 3.8) {
      this.player.isGrounded = false;
      this.player.isJumping = true;
      this.player.isSliding = false;

      const jumpVelocity = this.player.hasSneakers ? 18.5 : 14.0;
      this.player.vy = jumpVelocity;

      if (this.player.hasSneakers) soundManager.playSuperJump();
      else soundManager.playJump();
    }
  }

  slide() {
    if (this.gameState !== 'playing') return;
    if (this.player.hasJetpack) return;

    if (!this.player.isGrounded) {
      this.player.vy = -26; // Fast drop to ground
    }

    this.player.isSliding = true;
    this.player.slideTimer = 0.8;
    soundManager.playSlide();
  }

  // --- Bangalore Horn Sound (Scooty Horn & Traffic Honk-back) ---
  honkHorn() {
    if (this.gameState !== 'playing') return;
    soundManager.playScooterHorn();
    this.cameraShake = 0.25;

    // Reacting traffic: vehicle ahead honks back!
    for (const obs of this.obstacles) {
      if (obs.z > 5 && obs.z < 42 && !obs.hasHonkedBack) {
        obs.hasHonkedBack = true;
        setTimeout(() => {
          if (obs.type === 'bmtc_bus') soundManager.playBusHorn();
          else if (obs.type === 'auto') soundManager.playAutoHorn();
          else soundManager.playScooterHorn();
        }, 220 + Math.random() * 160);
        break;
      }
    }
  }

  activateHoverboard() {
    if (this.gameState !== 'playing') return;
    if (this.player.hasHoverboard) return;
    if (this.hoverboardStock <= 0) return;

    this.hoverboardStock--;
    this.player.hasHoverboard = true;
    this.player.hoverboardTimer = 30;
    this.callbacks.onHoverboardCountChange(this.hoverboardStock);
    soundManager.playHoverboard();

    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = 0.75;
    }
  }

  // --- Main 3D Game Loop ---
  update(dt) {
    if (this.gameState !== 'playing') return;

    this.runTimer += dt;

    // Current route segment target cruising speed
    const currentSeg = this.routeManager ? this.routeManager.getCurrentSegment(this.distance) : { speedTarget: 55 };
    const targetCruiseSpeed = (currentSeg.speedTarget / 55) * this.baseSpeed;

    // Detect stationary obstacles ahead in player's lane
    let closestStationaryObs = null;
    let minObsDist = Infinity;
    for (const obs of this.obstacles) {
      if (Math.abs(this.player.x - obs.x) < 1.6) {
        const d = obs.z - this.player.z;
        if (d > 0 && d < minObsDist) {
          minObsDist = d;
          if (obs.isStationary) closestStationaryObs = obs;
        }
      }
    }

    // Detect Traffic Signal Red Light Stop Line ahead & Challan Violation
    let distToRedLight = Infinity;
    const signal = this.routeManager && this.routeManager.trafficSignal;
    if (signal && signal.isRed()) {
      const stopLineWorldZ = signal.getStopLineWorldZ();
      const lineD = stopLineWorldZ - this.player.z;
      if (lineD > -2 && lineD < 45) {
        distToRedLight = lineD;
      }

      // RED LIGHT JUMP / CHALLAN DETECTION:
      // If player crosses the stop line on RED, trigger Game Over with BTP Challan immediately!
      if (!signal.hasTriggeredChallan) {
        if (lineD <= 0.2 && lineD >= -8.0) {
          signal.hasTriggeredChallan = true;
          this.handleRedLightChallan();
          return;
        }
      }
    }

    // Automatic Braking Assistance
    this.autoBrakeAssist = false;
    // Commuters can override autoBrakeAssist by pressing throttle to rush through
    if (!this.throttleInput) {
      if (distToRedLight < 16 && distToRedLight > 0) {
        this.autoBrakeAssist = true;
      } else if (closestStationaryObs && minObsDist < 12) {
        this.autoBrakeAssist = true;
      }
    }

    // Throttle, Brake, Assist, and Cruise Physics
    if (this.brakeInput) {
      // Manual Braking: aggressive responsive deceleration down to 0
      this.speed = Math.max(0, this.speed - 44 * dt);
    } else if (this.autoBrakeAssist) {
      // Auto Braking Assist: smooth deceleration to avoid crashing
      const targetDist = Math.min(distToRedLight, minObsDist);
      const targetSpeed = Math.max(0, (targetDist - 1.5) * 1.5);
      if (this.speed > targetSpeed) {
        this.speed = Math.max(targetSpeed, this.speed - 32 * dt);
      }
    } else if (this.throttleInput) {
      // Manual Acceleration: progressive throttle up to maxSpeed
      this.speed = Math.min(this.maxSpeed, this.speed + 22 * dt);
    } else {
      // Neutral Cruise / Coasting
      if (this.speed > targetCruiseSpeed) {
        this.speed = Math.max(targetCruiseSpeed, this.speed - 10 * dt);
      } else if (this.speed < targetCruiseSpeed && this.speed > 0.5) {
        this.speed = Math.min(targetCruiseSpeed, this.speed + 14 * dt);
      }
    }

    if (this.speed < 0.1) this.speed = 0;

    const moveDist = this.speed * dt;
    this.distance += moveDist;

    // Remaining Office Distance Countdown & Speedometer in km/h
    const remainingDistance = Math.max(0, this.targetOfficeDistance - this.distance);
    const speedKmh = Math.round((this.speed / 26) * 55);

    if (this.teamsCallToastTimer > 0) {
      this.teamsCallToastTimer -= dt;
      if (this.teamsCallToastTimer < 0) this.teamsCallToastTimer = 0;
    }

    if (this.routeManager) {
      this.routeManager.update(dt, this.distance, this.speed, this.player.z);
    }

    this.callbacks.onDistanceUpdate(this.distance, remainingDistance, speedKmh, {
      currentSegment: currentSeg,
      signalStatus: this.routeManager ? this.routeManager.getSignalStatus(this.player.z) : null,
      milestone: this.routeManager ? this.routeManager.activeMilestoneMessage : null,
      trafficStops: this.routeManager ? this.routeManager.trafficStops : 0,
      trafficRuleBonus: this.routeManager ? this.routeManager.trafficRuleBonus : 0,
      isBraking: this.brakeInput,
      isAccelerating: this.throttleInput,
      autoBrakeAssist: this.autoBrakeAssist,
      teamsCallActive: this.teamsCallToastTimer > 0
    });

    // Office Arrival Victory Check
    if (this.distance >= this.targetOfficeDistance) {
      this.handleVictory();
      return;
    }

    // Valuation Score update
    const currentMultiplier = this.player.hasMultiplier ? this.multiplier * 2 : this.multiplier;
    this.score += Math.floor((moveDist * 4) * (currentMultiplier / 10));
    this.callbacks.onScoreUpdate(this.score);

    this.cameraTilt *= 0.88;
    this.cameraShake *= 0.85;

    // Smooth horizontal lane transition
    const dx = this.player.targetX - this.player.x;
    this.player.x += dx * 14 * dt;

    // Rotate Scooty Wheels based on speed (wheel radius ~0.208m for Ola)
    const wheelRadius = this.isOlaScooter ? 0.208 : 0.32;
    const wheelSpin = (moveDist / wheelRadius);
    this.wheels.forEach(w => {
      w.rotation.x -= wheelSpin;
    });

    // Emit Scooty Exhaust Smoke
    this.smokeTimer += dt;
    if (this.smokeTimer >= 0.038) {
      this.smokeTimer = 0;
      this.emitExhaustSmoke();
    }
    this.updateSmokeParticles(dt);

    // Vertical jump & suspension physics
    if (this.player.hasJetpack) {
      const targetSkyY = 9.5;
      this.player.y += (targetSkyY - this.player.y) * 8 * dt;
      this.player.isGrounded = false;
    } else {
      const gravity = -38;
      this.player.vy += gravity * dt;
      this.player.y += this.player.vy * dt;

      // Check if riding on BMTC bus roof!
      let groundY = 0;
      for (const obs of this.obstacles) {
        if (obs.type === 'bmtc_bus') {
          const busFrontZ = obs.z - obs.length / 2;
          const busBackZ = obs.z + obs.length / 2;
          const isOverBusZ = this.player.z >= busFrontZ - 0.5 && this.player.z <= busBackZ;
          const isSameLane = Math.abs(this.player.x - obs.x) < 1.4;

          if (isOverBusZ && isSameLane && this.player.y >= obs.height - 0.5) {
            groundY = obs.height;
            break;
          }
        }
      }

      if (this.player.y <= groundY) {
        this.player.y = groundY;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.isJumping = false;
      }
    }

    // Ducking / Slide animation
    if (this.player.isSliding) {
      this.player.slideTimer -= dt;
      if (this.torsoGroup) this.torsoGroup.rotation.x = 0.65;
      if (this.boygiSpineBone) this.boygiSpineBone.rotation.x = 0.55;
      if (this.bikerRiderNode && this.bikerRiderInitialRotX !== undefined) {
        this.bikerRiderNode.rotation.x = this.bikerRiderInitialRotX + 0.35;
      }
      if (this.vehicleGroup) this.vehicleGroup.position.y = -0.25;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
        if (this.torsoGroup) this.torsoGroup.rotation.x = 0.12;
        if (this.boygiSpineBone) this.boygiSpineBone.rotation.x = 0.15;
        if (this.bikerRiderNode && this.bikerRiderInitialRotX !== undefined) {
          this.bikerRiderNode.rotation.x = this.bikerRiderInitialRotX;
        }
        if (this.vehicleGroup) this.vehicleGroup.position.y = 0;
      }
    } else {
      const engineVibe = this.speed === 0 ? Math.sin(this.runTimer * 30) * 0.008 : Math.sin(this.distance * 10) * 0.015;
      if (this.vehicleGroup) this.vehicleGroup.position.y = engineVibe;
      if (this.torsoGroup) this.torsoGroup.rotation.x = 0.12;
      if (this.boygiSpineBone) this.boygiSpineBone.rotation.x = 0.15;
      if (this.bikerRiderNode && this.bikerRiderInitialRotX !== undefined) {
        this.bikerRiderNode.rotation.x = this.bikerRiderInitialRotX;
      }
    }

    this.updatePowerups(dt);

    // Update Player 3D Mesh Position & Turn Banking
    if (this.playerGroup) {
      this.playerGroup.position.set(this.player.x, this.player.y, this.player.z);
    }
    if (this.vehicleGroup) {
      const targetLean = this.cameraTilt * 2.2;
      this.vehicleGroup.rotation.z += (targetLean - this.vehicleGroup.rotation.z) * 12 * dt;
    }

    // Police Mama & Dog chaser
    if (this.chaserGroup) {
      const chaserZ = this.player.z - this.chaser.distance;
      this.chaserGroup.position.set(this.player.x * 0.75, 0, chaserZ);
    }

    // Endless Road Segments cycling forward
    this.roadSegments.forEach(seg => {
      seg.position.z -= moveDist;
      if (seg.position.z < -this.roadSegmentLength) {
        seg.position.z += this.totalRoadSegments * this.roadSegmentLength;
      }
    });

    // Move Obstacles towards player & Rotate their wheels
    let furthestZ = 0;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      let deltaZ;
      if (obs.isStationary) {
        if (this.routeManager && this.routeManager.trafficSignal && this.routeManager.trafficSignal.isGreen()) {
          obs.speed = (obs.speed || 0) + 14 * dt;
          deltaZ = moveDist - (obs.speed * dt);
        } else {
          deltaZ = moveDist;
        }
      } else {
        deltaZ = (moveDist + (obs.speed || 0) * dt);
      }
      obs.z -= deltaZ;
      obs.mesh.position.z = obs.z;

      // Animate obstacle wheels!
      if (obs.wheelMeshes && obs.wheelMeshes.length > 0) {
        const spin = deltaZ / (obs.wheelRadius || 0.4);
        obs.wheelMeshes.forEach(w => {
          w.rotation.x -= spin;
        });
      }

      // Dynamic road suspension & engine vibration on moving vehicles
      if (!obs.isStationary && obs.mesh) {
        obs.mesh.position.y = (obs.baseY || 0) + Math.sin(this.runTimer * 16 + (obs.z || 0) * 0.2) * 0.015;
      }

      // Traffic vehicles honk as they approach player in Bangalore traffic!
      if (!obs.hasHonked && obs.z < 36 && obs.z > 8) {
        obs.hasHonked = true;
        if (obs.type === 'bmtc_bus' && Math.random() < 0.7) {
          soundManager.playBusHorn();
        } else if (obs.type === 'auto' && Math.random() < 0.6) {
          soundManager.playAutoHorn();
        } else if (obs.type === 'oncoming_scooter' && Math.random() < 0.7) {
          soundManager.playScooterHorn();
        }
      }

      if (obs.z > furthestZ) furthestZ = obs.z;

      this.checkObstacleCollision(obs);

      if (obs.z < -25) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // Ambient Bangalore Traffic Horns in the distance
    this.hornTimer = (this.hornTimer || 0) + dt;
    if (this.hornTimer > (this.nextHornTime || 7.0)) {
      this.hornTimer = 0;
      this.nextHornTime = 7.0 + Math.random() * 8.0;
      soundManager.playTrafficHorn();
    }

    // Move Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.z -= moveDist;
      item.mesh.position.z = item.z;

      if (item.type === 'coin') {
        item.mesh.rotation.z += 5 * dt;
      } else if (item.type === 'powerup') {
        item.mesh.rotation.y += 3.2 * dt;
        item.mesh.position.y = item.y + Math.sin(this.runTimer * 3.5 + item.z * 0.4) * 0.15;
        if (item.ring) {
          item.ring.rotation.x += 2.2 * dt;
          item.ring.rotation.z += 1.8 * dt;
        }
      }

      // VC Magnet Effect
      if (this.player.hasMagnet && item.type === 'coin') {
        const dx = this.player.x - item.x;
        const dz = this.player.z - item.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 14) {
          item.x += dx * 16 * dt;
          item.y += ((this.player.y + 0.8) - item.y) * 16 * dt;
          item.mesh.position.set(item.x, item.y, item.z);
        }
      }

      if (this.checkCollectiblePickup(item)) {
        this.scene.remove(item.mesh);
        this.collectibles.splice(i, 1);
        continue;
      }

      if (item.z < -10) {
        this.scene.remove(item.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // Move Billboards & Gantries
    for (let i = this.billboardMeshes.length - 1; i >= 0; i--) {
      const b = this.billboardMeshes[i];
      b.position.z -= moveDist;
      if (b.position.z < -25) {
        this.scene.remove(b);
        this.billboardMeshes.splice(i, 1);
      }
    }

    for (let i = this.decorations.length - 1; i >= 0; i--) {
      const d = this.decorations[i];
      d.z -= moveDist;
      d.mesh.position.z = d.z;
      if (d.z < -30) {
        this.scene.remove(d.mesh);
        this.decorations.splice(i, 1);
      }
    }

    // Move RouteManager Landmark Groups (Sobha Gate, Underpass, Signal, Ecospace)
    if (this.routeManager && this.routeManager.landmarkGroups) {
      for (let i = this.routeManager.landmarkGroups.length - 1; i >= 0; i--) {
        const lm = this.routeManager.landmarkGroups[i];
        lm.position.z -= moveDist;
        if (lm.position.z < -160) {
          this.scene.remove(lm);
          this.routeManager.landmarkGroups.splice(i, 1);
        }
      }
    }

    if (furthestZ < 160) {
      this.spawnNextSegment(Math.max(170, furthestZ + 25));
    }

    this.updateCamera(dt);
  }

  updateCamera(dt) {
    if (!this.camera) return;

    const camPreset = this.cameraPresets[this.currentCameraPreset] || this.cameraPresets.chase;

    const targetCamX = this.player.x * camPreset.xFollow;
    const targetCamY = camPreset.y + (this.player.y * camPreset.yPlayerFactor);
    const targetCamZ = this.player.z + camPreset.zOffset;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 14 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 10 * dt;
    this.camera.position.z = targetCamZ;

    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.4;
    }

    this.camera.lookAt(
      this.player.x * (camPreset.xFollow * 0.96),
      this.player.y + camPreset.lookAtY,
      this.player.z + camPreset.lookAtZ
    );
  }

  updatePowerups(dt) {
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    if (this.player.hasHoverboard) {
      this.player.hoverboardTimer -= dt;
      if (this.player.hoverboardTimer <= 0) {
        this.player.hasHoverboard = false;
        if (this.shieldMesh) this.shieldMesh.material.opacity = 0.0;
      }
    }

    if (this.player.hasMagnet) {
      this.player.magnetTimer -= dt;
      if (this.player.magnetTimer <= 0) {
        this.player.hasMagnet = false;
        this.callbacks.onPowerupChange('magnet', 0);
      } else {
        this.callbacks.onPowerupChange('magnet', this.player.magnetTimer);
      }
    }

    if (this.player.hasSneakers) {
      this.player.sneakersTimer -= dt;
      if (this.player.sneakersTimer <= 0) {
        this.player.hasSneakers = false;
        this.callbacks.onPowerupChange('sneakers', 0);
      } else {
        this.callbacks.onPowerupChange('sneakers', this.player.sneakersTimer);
      }
    }

    if (this.player.hasMultiplier) {
      this.player.multiplierTimer -= dt;
      if (this.player.multiplierTimer <= 0) {
        this.player.hasMultiplier = false;
        this.callbacks.onPowerupChange('multiplier', 0);
      } else {
        this.callbacks.onPowerupChange('multiplier', this.player.multiplierTimer);
      }
    }

    if (this.player.hasJetpack) {
      this.player.jetpackTimer -= dt;
      if (this.player.jetpackTimer <= 0) {
        this.player.hasJetpack = false;
        this.callbacks.onPowerupChange('jetpack', 0);
      } else {
        this.callbacks.onPowerupChange('jetpack', this.player.jetpackTimer);
      }
    }
  }

  // --- 3D Collision Detection ---
  checkObstacleCollision(obs) {
    if (this.player.invulnerableTimer > 0) return;
    if (this.player.hasJetpack) return;

    const pz = this.player.z;
    const px = this.player.x;
    const py = this.player.y;

    if (obs.type === 'bmtc_bus') {
      const busFrontZ = obs.z - obs.length / 2;
      const hitZ = pz >= busFrontZ && pz <= busFrontZ + 1.2;
      const hitLane = Math.abs(px - obs.x) < 1.45;

      if (hitZ && hitLane && py < obs.height - 0.4) {
        if (obs.isStationary && this.speed < 6) {
          this.speed = 0; // Safe bumper stop behind stopped bus!
          return;
        }
        this.handleCrash();
      }
    } else if (obs.type === 'oncoming_scooter') {
      const hitZ = Math.abs(pz - obs.z) < 1.4;
      const hitLane = Math.abs(px - obs.x) < 1.2;

      if (hitZ && hitLane && py < 1.2) {
        this.handleCrash();
      }
    } else if (obs.type === 'auto') {
      const hitZ = Math.abs(pz - obs.z) < 1.4;
      const hitLane = Math.abs(px - obs.x) < 1.2;

      if (hitZ && hitLane && py < obs.height - 0.3) {
        if (obs.isStationary && this.speed < 6) {
          this.speed = 0; // Safe bumper stop in traffic queue!
          return;
        }
        this.handleCrash();
      }
    } else if (obs.type === 'speed_breaker') {
      const hitZ = Math.abs(pz - obs.z) < 1.2;
      const hitLane = Math.abs(px - obs.x) < 1.8;

      if (hitZ && hitLane && !obs.hasTriggered) {
        obs.hasTriggered = true;
        if (this.speed > 18) {
          // Riding too fast over speed breaker! Bump & speed penalty
          this.player.vy = 5.2;
          this.player.isGrounded = false;
          this.cameraShake = 0.8;
          this.speed *= 0.65;
          soundManager.playStumble();
        } else {
          // Slowed down properly! Smooth suspension compression & bonus
          this.player.vy = 1.6;
          this.score += 50;
          this.callbacks.onScoreUpdate(this.score);
        }
      }
    } else if (obs.type === 'pothole') {
      const hitZ = Math.abs(pz - obs.z) < 1.35;
      const hitLane = Math.abs(px - obs.x) < 1.35;

      if (hitZ && hitLane && py < 0.85 && !obs.hasTriggered) {
        obs.hasTriggered = true;
        this.handlePotholeHit(obs);
      }
    } else if (obs.type === 'bbmp_barricade') {
      const hitZ = Math.abs(pz - obs.z) < 1.0;
      const hitLane = Math.abs(px - obs.x) < 1.3;

      if (hitZ && hitLane) {
        if (py < 1.1) {
          if (Math.abs(px - obs.x) > 0.9) this.handleStumble();
          else this.handleCrash();
        }
      }
    } else if (obs.type === 'hanging_cables') {
      const hitZ = Math.abs(pz - obs.z) < 1.0;
      const hitLane = Math.abs(px - obs.x) < 1.4;

      if (hitZ && hitLane && !this.player.isSliding) {
        if (Math.abs(px - obs.x) > 1.0) this.handleStumble();
        else this.handleCrash();
      }
    } else if (obs.type === 'clean_shop_blocker') {
      const hitZ = Math.abs(pz - obs.z) < 1.7;
      const hitLane = Math.abs(px - obs.x) < 1.4;

      if (hitZ && hitLane && py < obs.height - 0.2) {
        if (Math.abs(px - obs.x) > 1.05) this.handleStumble();
        else this.handleCrash();
      }
    }
  }

  checkCollectiblePickup(item) {
    const distZ = Math.abs(this.player.z - item.z);
    const distX = Math.abs(this.player.x - item.x);
    const distY = Math.abs((this.player.y + 0.8) - item.y);

    if (distZ < 1.4 && distX < 1.2 && distY < 1.5) {
      if (item.type === 'coin') {
        this.collectCoin();
        return true;
      } else if (item.type === 'powerup') {
        this.collectPowerup(item.powerupType);
        return true;
      }
    }
    return false;
  }

  collectCoin() {
    const now = performance.now();
    if (now - this.lastCoinTime < 350) {
      this.comboCounter++;
    } else {
      this.comboCounter = 0;
    }
    this.lastCoinTime = now;

    this.coins++;
    this.score += 50 * (this.player.hasMultiplier ? 2 : 1);
    this.callbacks.onCoinsUpdate(this.coins);
    this.callbacks.onScoreUpdate(this.score);
    soundManager.playCoin(this.comboCounter);
  }

  collectPowerup(type) {
    soundManager.playPowerup();
    const duration = 15;

    let popupInfo = null;

    switch (type) {
      case 'magnet':
        this.player.hasMagnet = true;
        this.player.magnetTimer = duration;
        this.callbacks.onPowerupChange('magnet', duration);
        popupInfo = {
          type: 'magnet',
          title: 'MAGNET ACTIVATED!',
          subtitle: 'Attracting ₹ Coins From All Lanes',
          icon: '🧲',
          color: '#38bdf8'
        };
        break;
      case 'warp':
      case 'sneakers':
        this.player.hasSneakers = true;
        this.player.sneakersTimer = duration;
        this.callbacks.onPowerupChange('sneakers', duration);
        popupInfo = {
          type: 'sneakers',
          title: 'WARP SPEED ACTIVATED!',
          subtitle: 'Supercharged Commute Dash',
          icon: '⚡',
          color: '#10b981'
        };
        break;
      case 'kaapi':
      case 'multiplier':
        this.player.hasMultiplier = true;
        this.player.multiplierTimer = duration;
        this.callbacks.onPowerupChange('multiplier', duration);
        popupInfo = {
          type: 'multiplier',
          title: '2X KAAPI BOOST ACTIVATED!',
          subtitle: 'Double Startup Valuation Score',
          icon: '☕',
          color: '#f59e0b'
        };
        break;
      case 'metro_jetpack':
      case 'jetpack':
        this.player.hasJetpack = true;
        this.player.jetpackTimer = 10;
        this.callbacks.onPowerupChange('jetpack', 10);
        popupInfo = {
          type: 'jetpack',
          title: 'JETPACK ACTIVATED!',
          subtitle: 'Fly High Above Bangalore Traffic',
          icon: '🚀',
          color: '#c084fc'
        };
        break;
      case 'auto_shield':
      case 'hoverboard':
        this.hoverboardStock++;
        this.callbacks.onHoverboardCountChange(this.hoverboardStock);
        popupInfo = {
          type: 'hoverboard',
          title: 'HOVERBOARD SHIELD ADDED!',
          subtitle: 'Crash Protection Active',
          icon: '🛡️',
          color: '#0ea5e9'
        };
        break;
    }

    if (popupInfo && this.callbacks.onPowerupCollected) {
      this.callbacks.onPowerupCollected(popupInfo);
    }
  }

  // --- POTHOLE HIT: Police will NOT come, instead Microsoft Teams ringtone plays! ---
  handlePotholeHit(_obs) {
    if (this.player.invulnerableTimer > 0) return;
    this.player.invulnerableTimer = 1.2;
    this.cameraShake = 1.2;

    // Scooty jolts into the pothole with muddy suspension bounce
    this.player.vy = 2.6;
    this.player.isGrounded = false;
    this.speed = Math.max(12, this.speed * 0.7);

    // CRITICAL REQUIREMENT: Police will NOT come! Keep police far away
    this.chaser.isLunge = false;
    this.chaser.distance = 8.5;
    if (this.chaserGroup) {
      this.chaserGroup.position.set(0, 0, -8.5);
    }

    // Play puddle splash sound & Microsoft Teams ringtone
    soundManager.playStumble();
    soundManager.playTeamsAudio();

    // Trigger Teams Incoming Call Toast Alert for 4.5 seconds
    this.teamsCallToastTimer = 4.5;
  }

  handleStumble() {
    if (this.player.invulnerableTimer > 0) return;
    this.player.invulnerableTimer = 1.0;
    this.cameraShake = 1.0;
    soundManager.playStumble();

    if (this.chaser.isLunge) {
      this.handleCrash();
    } else {
      this.chaser.isLunge = true;
      this.chaser.distance = 4.0;
      setTimeout(() => {
        this.chaser.isLunge = false;
        this.chaser.distance = 8.5;
      }, 3500);
    }
  }

  handleCrash() {
    if (this.player.hasHoverboard) {
      this.player.hasHoverboard = false;
      this.player.invulnerableTimer = 2.5;
      this.cameraShake = 2.0;
      soundManager.playCrash();

      if (this.shieldMesh) this.shieldMesh.material.opacity = 0.0;
      return;
    }

    this.gameState = 'gameover';
    this.cameraShake = 2.5;
    soundManager.stopMusic();
    soundManager.playCrash();

    this.callbacks.onGameOver({
      score: this.score,
      coins: this.coins,
      distance: Math.floor(this.distance)
    });
  }

  handleRedLightChallan() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'gameover';
    this.cameraShake = 2.5;
    soundManager.stopMusic();
    soundManager.playTrafficPoliceWhistle();

    this.callbacks.onGameOver({
      score: this.score,
      coins: this.coins,
      distance: Math.floor(this.distance),
      reason: 'red_light_challan'
    });
  }

  handleVictory() {
    this.gameState = 'victory';
    soundManager.stopMusic();
    soundManager.playVictory();

    this.callbacks.onVictory({
      score: this.score,
      coins: this.coins,
      distance: 3000,
      timeTaken: Math.round(this.runTimer),
      trafficStops: this.routeManager ? this.routeManager.trafficStops : 1,
      trafficRuleBonus: this.routeManager ? this.routeManager.trafficRuleBonus : 500
    });
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  loop() {
    if (this.gameState !== 'playing') {
      this.rafId = null;
      return;
    }

    const dt = Math.min(0.05, this.clock.getDelta());
    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    const aspect = this.width / this.height;
    this.camera.fov = aspect < 1.0 ? Math.min(75, (58 / aspect) * 0.62) : 58;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.render();
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
