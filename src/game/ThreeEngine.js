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
import { soundManager } from './AudioSynthesizer.js';

export class ThreeEngine {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.callbacks = {
      onScoreUpdate: options.onScoreUpdate || (() => {}),
      onCoinsUpdate: options.onCoinsUpdate || (() => {}),
      onPowerupChange: options.onPowerupChange || (() => {}),
      onGameOver: options.onGameOver || (() => {}),
      onHoverboardCountChange: options.onHoverboardCountChange || (() => {}),
      onDistanceUpdate: options.onDistanceUpdate || (() => {}),
      onVictory: options.onVictory || (() => {})
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
    this.lastCoinTime = 0;

    // Bilingual Kannada & English Street Gantry Signs
    this.gantrySigns = [
      { kannada: 'ಮಾರತ್ತಹಳ್ಳಿ', english: 'MARATHAHALLI', dist: '2.5 KM', arrow: '➔' },
      { kannada: 'ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಜಂಕ್ಷನ್', english: 'SILK BOARD JN', dist: '1.8 KM', arrow: '➔' },
      { kannada: 'ಬೆಳ್ಳಂದೂರು - ಔಟರ್ ರಿಂಗ್ ರೋಡ್', english: 'BELLANDUR (ORR)', dist: '1.2 KM', arrow: '➔' },
      { kannada: 'ಮಹಾದೇವಪುರ', english: 'MAHADEVAPURA', dist: '800 M', arrow: '➔' },
      { kannada: 'ವೈಟ್‌ಫೀಲ್ಡ್ ಐಟಿ ಕಾರಿಡಾರ್', english: 'WHITEFIELD IT CORRIDOR', dist: '3.0 KM', arrow: '➔' },
      { kannada: 'ಎಕೋಸ್ಪೇಸ್ ಟೆಕ್ ಪಾರ್ಕ್', english: 'ECOSPACE TECH PARK', dist: '500 M', arrow: '⬆' }
    ];
    this.gantryIndex = 0;

    // Billboard Data: Tamil & AI Startup quotes
    this.startupQuotes = [
      { brand: 'SARVAM AI', tag: 'INDIC LLM', text: 'Building Indic LLMs while waiting at Silk Board junction.', color: '#0077b6' },
      { brand: 'வணக்கம் பெங்களூரு', tag: 'TAMIL EXPRESS', text: 'சென்னை To சில்க் போர்டு Express! (Vanakkam Bengaluru)', color: '#d97706' },
      { brand: 'KRUTRIM AI', tag: 'INDIA AGI', text: '100 Billion Parameters, 0 Bangalore Parking Spots.', color: '#00a86b' },
      { brand: 'டீ & AI', tag: 'FILTER KAAPI', text: 'டீ குடிச்சிட்டு Coding பண்ணುங்க! 100% Pure Chicory Filter Kaapi', color: '#b45309' },
      { brand: 'OPENAI BLR', tag: 'AGI 2026', text: 'AGI will arrive before the Silk Board flyover completes.', color: '#059669' },
      { brand: 'ನಮ್ಮ ஊரு METRO', tag: 'METRO PURPLE', text: 'அடுத்த ಸ್ಟೇಷನ್ இந்திரா நகர்! (Next Station: Indiranagar)', color: '#8e24aa' },
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

    this.camera = new THREE.PerspectiveCamera(58, this.width / this.height, 0.1, 850);
    this.camera.position.set(0, 5.0, -7.2);
    this.camera.lookAt(0, 2.0, 15);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Daylight Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x4d7c0f, 0.65);
    hemiLight.position.set(0, 60, 0);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff6d6, 1.85);
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

    this.handleResize = () => this.resize();
    window.addEventListener('resize', this.handleResize);

    this.render();
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
    this.comboCounter = 0;
    this.lastCoinTime = 0;
    this.cameraShake = 0;
    this.cameraTilt = 0;

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

    // 2. Glass Tech Park Skyscrapers
    const towerGeo = new THREE.BoxGeometry(18, 70, 18);
    const towerColors = [0x334155, 0x1e293b, 0x0f172a, 0x475569];

    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: towerColors[i % towerColors.length],
        metalness: 0.6,
        roughness: 0.2
      });
      const tower = new THREE.Mesh(towerGeo, mat);
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (46 + (i * 8));
      const z = 180 + (i * 15);
      const h = 50 + (i * 12);
      tower.scale.set(1, h / 70, 1);
      tower.position.set(x, h / 2, z);
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

    // 5. Gulmohar & Palm Trees
    for (let z = -this.roadSegmentLength / 2 + 15; z < this.roadSegmentLength / 2; z += 35) {
      const treeLeft = this.createGulmoharTree();
      treeLeft.position.set(-11.5, 0, z);
      group.add(treeLeft);

      const treeRight = this.createPalmTree();
      treeRight.position.set(11.5, 0, z + 16);
      group.add(treeRight);
    }

    return group;
  }

  createGulmoharTree() {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 5.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const crownGeo = new THREE.DodecahedronGeometry(2.9, 1);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.7 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 6.4;
    crown.castShadow = true;
    tree.add(crown);

    return tree;
  }

  createPalmTree() {
    const palm = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 6.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.25;
    trunk.castShadow = true;
    palm.add(trunk);

    for (let i = 0; i < 5; i++) {
      const frondGeo = new THREE.ConeGeometry(1.6, 2.4, 4);
      const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.rotation.z = Math.PI / 4 + (i * 0.1);
      frond.rotation.y = (i * Math.PI * 2) / 5;
      frond.position.set(0, 6.8, 0);
      frond.castShadow = true;
      palm.add(frond);
    }
    return palm;
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

    this.vehicleGroup.add(scootyGroup);

    // --- 2. 3D RIDER (Young Indian male, 24-27 yrs, office attire, backpack, helmet) ---
    const riderGroup = new THREE.Group();
    this.riderGroup = riderGroup;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x9e6540,
      roughness: 0.65,
      metalness: 0.05
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.7
    });

    const jeansMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.85
    });

    const sneakerMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4
    });

    const sneakerSoleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7
    });

    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75
    });

    const backpackStrapMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.3
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.8
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.95
    });

    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.34), jeansMat);
    pelvis.position.set(0, 1.1, -0.22);
    pelvis.castShadow = true;
    riderGroup.add(pelvis);

    // Legs and Feet
    [-0.18, 0.18].forEach(x => {
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.42), jeansMat);
      thigh.position.set(x, 1.05, -0.02);
      thigh.rotation.x = 0.25;
      thigh.castShadow = true;
      riderGroup.add(thigh);

      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), jeansMat);
      knee.position.set(x, 0.98, 0.2);
      riderGroup.add(knee);

      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.14), jeansMat);
      shin.position.set(x, 0.72, 0.22);
      shin.rotation.x = 0.08;
      shin.castShadow = true;
      riderGroup.add(shin);

      const sneakerGroup = new THREE.Group();
      sneakerGroup.position.set(x, 0.46, 0.24);

      const sneakerBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.26), sneakerMat);
      sneakerBody.position.set(0, 0.04, 0.02);
      sneakerBody.castShadow = true;
      sneakerGroup.add(sneakerBody);

      const sneakerSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.28), sneakerSoleMat);
      sneakerSole.position.set(0, 0, 0.02);
      sneakerGroup.add(sneakerSole);

      riderGroup.add(sneakerGroup);
    });

    // Upper Body
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 1.2, -0.2);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.28), shirtMat);
    torso.position.set(0, 0.24, 0);
    torso.rotation.x = 0.12;
    torso.castShadow = true;
    this.torsoGroup.add(torso);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 8), shirtMat);
    collar.position.set(0, 0.5, 0.02);
    this.torsoGroup.add(collar);

    // Office Backpack
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.18), backpackMat);
    backpack.position.set(0, 0.22, -0.19);
    backpack.rotation.x = 0.12;
    backpack.castShadow = true;
    this.torsoGroup.add(backpack);

    const packPocket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.06), bodyDarkMat);
    packPocket.position.set(0, 0.18, -0.29);
    packPocket.rotation.x = 0.12;
    this.torsoGroup.add(packPocket);

    [-0.16, 0.16].forEach(x => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.04), backpackStrapMat);
      strap.position.set(x, 0.26, 0.14);
      strap.rotation.x = 0.12;
      this.torsoGroup.add(strap);
    });

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 8), skinMat);
    neck.position.set(0, 0.55, 0.03);
    this.torsoGroup.add(neck);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.68, 0.05);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), skinMat);
    this.headGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
    hair.position.set(0, 0.03, -0.02);
    this.headGroup.add(hair);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16), helmetMat);
    helmet.position.set(0, 0.04, 0);
    helmet.castShadow = true;
    this.headGroup.add(helmet);

    const helmetStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.212, 0.212, 0.05, 16), tealAccentMat);
    helmetStripe.rotation.z = Math.PI / 2;
    helmetStripe.position.set(0, 0.06, 0);
    this.headGroup.add(helmetStripe);

    const visorGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.12, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, -0.01, 0.04);
    visor.rotation.y = -Math.PI / 2;
    this.headGroup.add(visor);

    const chinStrap = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 8, 12, Math.PI), backpackStrapMat);
    chinStrap.position.set(0, -0.1, 0.02);
    chinStrap.rotation.x = Math.PI / 2;
    this.headGroup.add(chinStrap);

    this.torsoGroup.add(this.headGroup);

    // Arms & Hands gripping Handlebars
    [-1, 1].forEach(side => {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.22, 0.42, 0.03);

      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.32, 8), shirtMat);
      upperArm.position.set(side * 0.06, -0.12, 0.12);
      upperArm.rotation.x = -0.78;
      upperArm.rotation.z = -side * 0.25;
      armGroup.add(upperArm);

      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), shirtMat);
      elbow.position.set(side * 0.09, -0.25, 0.24);
      armGroup.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.36, 8), skinMat);
      forearm.position.set(side * 0.11, -0.36, 0.44);
      forearm.rotation.x = -1.18;
      forearm.rotation.z = -side * 0.15;
      armGroup.add(forearm);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.09), skinMat);
      hand.position.set(side * 0.16, -0.42, 0.64);
      hand.rotation.x = 0.2;
      hand.rotation.z = side * 0.2;
      armGroup.add(hand);

      this.torsoGroup.add(armGroup);
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
    this.spawnPothole(0, 35);
    this.spawnCoinArc(0, 28, 5);

    this.spawnAutoRickshaw(this.laneWidth, 70, false);
    this.spawnCoinLine(this.laneWidth, 65, 5, 0.5);

    this.spawnBMTCBus(-this.laneWidth, 115, false); // Blue & White BMTC Electric Bus moving forward
    this.spawnCoinLine(-this.laneWidth, 110, 7, 3.8); // On bus roof!

    this.spawnKannadaGantry(55, this.gantrySigns[0]);
    this.spawnTeaStall(-10.5, 80);
    this.spawnBillboard(8.5, 95, this.startupQuotes[0]);
  }

  spawnNextSegment(minZ) {
    if (this.distance >= this.targetOfficeDistance - 200 && !this.officeSpawned) {
      this.spawnTechParkEntrance(minZ + 40);
      this.officeSpawned = true;
      return;
    }

    if (this.officeSpawned) return;

    const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
    const roll = Math.random();

    // 1. Variant A: BMTC Electric Bus (Royal Blue & White, Moving in traffic!)
    if (roll < 0.28) {
      const isOncoming = Math.random() < 0.2; // 20% oncoming, 80% moving forward in traffic
      this.spawnBMTCBus(laneX, minZ, isOncoming);
      this.spawnCoinLine(laneX, minZ - 4, 7, 3.8);

      const secondLane = this.lanes.filter(l => l !== laneX)[Math.floor(Math.random() * 2)];
      if (Math.random() < 0.45) {
        this.spawnPothole(secondLane, minZ + 14);
        this.spawnCoinArc(secondLane, minZ + 8, 4);
      }
    }
    // 2. Oncoming Scooter from Front ("some time sccootu come from front")!
    else if (roll < 0.42) {
      this.spawnOncomingScooter(laneX, minZ);
      this.spawnCoinLine(laneX, minZ + 5, 4, 0.6);
    }
    // 3. Yellow & Green Auto-Rickshaw
    else if (roll < 0.60) {
      const isOncoming = Math.random() < 0.25;
      this.spawnAutoRickshaw(laneX, minZ, isOncoming);
      this.spawnCoinLine(laneX, minZ + 5, 4, 0.6);
    }
    // 4. White Hatchback Airport / ORR Cab
    else if (roll < 0.74) {
      this.spawnHatchbackCab(laneX, minZ);
      this.spawnCoinLine(laneX, minZ + 6, 4, 0.7);
    }
    // 5. Pothole / Road Obstruction / Overhead Cables
    else if (roll < 0.88) {
      const hazardRoll = Math.random();
      if (hazardRoll < 0.4) {
        this.spawnPothole(laneX, minZ);
        this.spawnCoinArc(laneX, minZ - 5, 5);
      } else if (hazardRoll < 0.7) {
        this.spawnBBMPBarricade(laneX, minZ);
        this.spawnCoinArc(laneX, minZ - 6, 5);
      } else {
        this.spawnHangingCables(laneX, minZ);
        this.spawnCoinLine(laneX, minZ - 6, 5, 0.5);
      }
    }
    // 6. Bangalore Power-ups
    else {
      const powerups = ['kaapi', 'magnet', 'warp', 'metro_jetpack'];
      const chosen = powerups[Math.floor(Math.random() * powerups.length)];
      this.spawnPowerup(laneX, minZ, chosen);
      this.spawnCoinLine(laneX, minZ + 8, 4, 0.6);
    }

    // Roadside Street Furniture & Signboards
    if (Math.random() < 0.35) {
      const gantryData = this.gantrySigns[this.gantryIndex % this.gantrySigns.length];
      this.gantryIndex++;
      this.spawnKannadaGantry(minZ + 18, gantryData);
    } else if (Math.random() < 0.4) {
      const quote = this.startupQuotes[Math.floor(Math.random() * this.startupQuotes.length)];
      const side = Math.random() < 0.5 ? -8.8 : 8.8;
      this.spawnBillboard(side, minZ + 22, quote);
    } else if (Math.random() < 0.3) {
      const side = Math.random() < 0.5 ? -10.8 : 10.8;
      this.spawnTeaStall(side, minZ + 25);
    }
  }

  // --- 1. VARIANT A: BMTC ELECTRIC BUS (Royal Blue & White, Moving in Traffic) ---
  spawnBMTCBus(x, z, isOncoming = false) {
    const bus = new THREE.Group();

    // Primary Colors: Blue and White inspired by BMTC Bengaluru electric buses
    const evBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0072ce, // BMTC Electric Royal Blue
      roughness: 0.25,
      metalness: 0.2
    });

    const evWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp Clean White
      roughness: 0.25,
      metalness: 0.1
    });

    const evGreenStripeMat = new THREE.MeshStandardMaterial({
      color: 0x00d46a, // Eco-friendly Green Accent Stripe
      emissive: 0x00d46a,
      emissiveIntensity: 0.3
    });

    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark tinted panoramic glass
      roughness: 0.1,
      metalness: 0.8
    });

    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6
    });

    // 1. Lower Blue Skirt Body (2.8m wide, 1.2m tall, 11.2m long)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 11.2), evBlueMat);
    lowerBody.position.y = 0.85;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    bus.add(lowerBody);

    // 2. Green EV Pinstripe
    const greenStripe = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.08, 11.22), evGreenStripeMat);
    greenStripe.position.y = 1.48;
    bus.add(greenStripe);

    // 3. Panoramic Passenger Windows Band with narrow vertical dividers
    const windowBand = new THREE.Mesh(new THREE.BoxGeometry(2.84, 1.35, 10.4), windowGlassMat);
    windowBand.position.set(0, 2.2, -0.1);
    bus.add(windowBand);

    // 4. White Upper Body & Roof (Jumpable flat roof!)
    const roofBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 11.2), evWhiteMat);
    roofBody.position.y = 3.1;
    roofBody.castShadow = true;
    bus.add(roofBody);

    // Flat roof walking surface with yellow warning edges
    const roofWalk = new THREE.Mesh(
      new THREE.BoxGeometry(2.65, 0.05, 10.8),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 })
    );
    roofWalk.position.y = 3.35;
    bus.add(roofWalk);

    // 5. Roof Battery & AC Housing Units (Smooth aerodynamic electric pod)
    const batteryPod = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.35, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    batteryPod.position.set(0, 3.52, 0.5);
    bus.add(batteryPod);

    // 6. Modern Aerodynamic Front: Windshield, Bumper & Headlights
    const frontWindshield = new THREE.Mesh(
      new THREE.BoxGeometry(2.78, 1.45, 0.2),
      windowGlassMat
    );
    frontWindshield.position.set(0, 2.2, 5.58);
    frontWindshield.rotation.x = 0.08;
    bus.add(frontWindshield);

    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.5, 0.4), bumperMat);
    frontBumper.position.set(0, 0.45, 5.62);
    bus.add(frontBumper);

    // Modern LED Headlights (Diamond projector style)
    [-1.05, 1.05].forEach(hx => {
      const headlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.18, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 })
      );
      headlight.position.set(hx, 0.85, 5.75);
      bus.add(headlight);

      const indi = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.08, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 })
      );
      indi.position.set(hx > 0 ? hx + 0.24 : hx - 0.24, 0.85, 5.74);
      bus.add(indi);
    });

    // 7. Electronic LED Destination Display: "500D ITPL ➔ SILK BOARD // BMTC ELECTRIC"
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
    bctx.font = 'bold 28px sans-serif';
    bctx.fillStyle = '#00d46a';
    bctx.fillText('⚡ BMTC ELECTRIC // ಪರಿಸರ ಸ್ನೇಹಿ', 256, 96);

    const boardTex = new THREE.CanvasTexture(boardCanvas);
    const destBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.55),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    destBoard.position.set(0, 3.12, 5.64);
    bus.add(destBoard);

    // Rear Destination Board
    const rearBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.5),
      new THREE.MeshBasicMaterial({ map: boardTex })
    );
    rearBoard.position.set(0, 3.0, -5.62);
    rearBoard.rotation.y = Math.PI;
    bus.add(rearBoard);

    // 8. Rear Design: Vertical LED Taillights & Bangalore Electric Plate "KA 57 EV 2026"
    [-1.15, 1.15].forEach(rx => {
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.2 })
      );
      tail.position.set(rx, 1.2, -5.62);
      bus.add(tail);
    });

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }) // Yellow Commercial Plate
    );
    plate.position.set(0, 0.65, -5.63);
    plate.rotation.y = Math.PI;
    bus.add(plate);

    // 9. Wheels & Visible Wheel Arches
    const wheelMeshes = [];
    const busWheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16);
    const busWheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    busWheelGeo.rotateZ(Math.PI / 2);

    const hubMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.2 });

    [
      [-1.4, 0.48, -3.5],
      [1.4, 0.48, -3.5],
      [-1.4, 0.48, 3.5],
      [1.4, 0.48, 3.5]
    ].forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);

      const tire = new THREE.Mesh(busWheelGeo, busWheelMat);
      tire.castShadow = true;
      wGroup.add(tire);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.39, 12), hubMat);
      hub.rotation.z = Math.PI / 2;
      wGroup.add(hub);

      bus.add(wGroup);
      wheelMeshes.push(wGroup);
    });

    // Side Branding Banners: BMTC ELECTRIC // ಪರಿಸರ ಸ್ನೇಹಿ // Namma Bengaluru
    const sideBannerCanvas = document.createElement('canvas');
    sideBannerCanvas.width = 512;
    sideBannerCanvas.height = 128;
    const sctx = sideBannerCanvas.getContext('2d');
    sctx.fillStyle = '#0072ce'; // BMTC Royal Blue
    sctx.fillRect(0, 0, 512, 128);
    sctx.fillStyle = '#ffffff';
    sctx.font = 'bold 36px sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('ಬಿ.ಎಂ.ಟಿ.ಸಿ. • BMTC ELECTRIC', 256, 48);
    sctx.fillStyle = '#00d46a';
    sctx.font = 'bold 24px sans-serif';
    sctx.fillText('⚡ ಪರಿಸರ ಸ್ನೇಹಿ • NAMMA BENGALURU • ZERO EMISSION', 256, 92);

    const sideBannerTex = new THREE.CanvasTexture(sideBannerCanvas);
    const sideBannerMat = new THREE.MeshBasicMaterial({ map: sideBannerTex });

    const leftBanner = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.7), sideBannerMat);
    leftBanner.position.set(-1.42, 1.25, 0);
    leftBanner.rotation.y = -Math.PI / 2;
    bus.add(leftBanner);

    const rightBanner = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.7), sideBannerMat);
    rightBanner.position.set(1.42, 1.25, 0);
    rightBanner.rotation.y = Math.PI / 2;
    bus.add(rightBanner);

    // Speed & Rotation: Moving in Traffic!
    let speed = 0;
    if (isOncoming) {
      bus.rotation.y = Math.PI; // Front (panoramic windshield & 500D ITPL display) faces oncoming player!
      speed = 14; // Driving toward player on oncoming lane
    } else {
      bus.rotation.y = 0; // Front faces forward in direction of traffic, rear faces player
      speed = -11; // Cruising forward at 11 units/s so player overtakes it!
    }

    bus.position.set(x, 0, z);
    this.scene.add(bus);

    this.obstacles.push({
      type: 'bmtc_bus',
      mesh: bus,
      x,
      z,
      height: 3.65,
      width: 2.85,
      length: 11.2,
      speed,
      wheelMeshes,
      wheelRadius: 0.48
    });
  }

  // --- 2. ONCOMING COMMUTER SCOOTER FROM FRONT ---
  spawnOncomingScooter(x, z) {
    const scootGroup = new THREE.Group();

    const paintColor = Math.random() < 0.5 ? 0xef4444 : 0x0284c7;
    const bodyMat = new THREE.MeshStandardMaterial({ color: paintColor, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.3), bodyMat);
    apron.position.set(0, 0.75, 0.5);
    apron.rotation.x = -0.2;
    scootGroup.add(apron);

    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.12, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 })
    );
    headlight.position.set(0, 0.92, 0.65);
    scootGroup.add(headlight);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 1.2), darkMat);
    seat.position.set(0, 0.65, -0.3);
    scootGroup.add(seat);

    const riderTorso = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    riderTorso.position.set(0, 1.2, -0.2);
    scootGroup.add(riderTorso);

    const riderHelmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
    );
    riderHelmet.position.set(0, 1.62, -0.15);
    scootGroup.add(riderHelmet);

    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    wheelGeo.rotateZ(Math.PI / 2);

    const frontW = new THREE.Mesh(wheelGeo, wheelMat);
    frontW.position.set(0, 0.28, 0.6);
    scootGroup.add(frontW);

    const rearW = new THREE.Mesh(wheelGeo, wheelMat);
    rearW.position.set(0, 0.28, -0.6);
    scootGroup.add(rearW);

    scootGroup.rotation.y = Math.PI; // Front headlight points directly at player!
    scootGroup.position.set(x, 0, z);
    this.scene.add(scootGroup);

    this.obstacles.push({
      type: 'oncoming_scooter',
      mesh: scootGroup,
      x,
      z,
      height: 1.8,
      width: 1.4,
      length: 2.2,
      speed: 16, // Moving toward player!
      wheelMeshes: [frontW, rearW],
      wheelRadius: 0.28
    });
  }

  // --- 3. YELLOW & GREEN AUTO-RICKSHAW ---
  spawnAutoRickshaw(x, z, isOncoming = false) {
    const auto = new THREE.Group();

    const lowerGeo = new THREE.BoxGeometry(1.8, 0.9, 2.6);
    const lowerMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const lower = new THREE.Mesh(lowerGeo, lowerMat);
    lower.position.y = 0.65;
    lower.castShadow = true;
    auto.add(lower);

    const roofGeo = new THREE.BoxGeometry(1.75, 0.85, 2.4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.45;
    roof.castShadow = true;
    auto.add(roof);

    const windGeo = new THREE.BoxGeometry(1.6, 0.6, 0.05);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, transparent: true, opacity: 0.65 });
    const windshield = new THREE.Mesh(windGeo, glassMat);
    windshield.position.set(0, 1.45, -1.18);
    auto.add(windshield);

    const meter = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b })
    );
    meter.position.set(0.35, 1.15, -0.9);
    auto.add(meter);

    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    wheelGeo.rotateZ(Math.PI / 2);

    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.position.set(0, 0.32, -1.15);
    auto.add(frontWheel);

    const rearLeft = new THREE.Mesh(wheelGeo, wheelMat);
    rearLeft.position.set(-0.85, 0.32, 0.9);
    auto.add(rearLeft);

    const rearRight = new THREE.Mesh(wheelGeo, wheelMat);
    rearRight.position.set(0.85, 0.32, 0.9);
    auto.add(rearRight);

    if (isOncoming) {
      auto.rotation.y = 0; // Front windshield faces oncoming player
    } else {
      auto.rotation.y = Math.PI; // Rear faces player as auto drives forward in traffic
    }

    auto.position.set(x, 0, z);
    this.scene.add(auto);

    this.obstacles.push({
      type: 'auto',
      mesh: auto,
      x,
      z,
      height: 1.9,
      width: 1.8,
      length: 2.6,
      speed: isOncoming ? 14 : -6, // Autos also move!
      wheelMeshes: [frontWheel, rearLeft, rearRight],
      wheelRadius: 0.32
    });
  }

  // --- 4. WHITE AIRPORT / ORR HATCHBACK CAB ---
  spawnHatchbackCab(x, z) {
    const cab = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 3.8), bodyMat);
    lower.position.y = 0.55;
    lower.castShadow = true;
    cab.add(lower);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.65, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 })
    );
    cabin.position.set(0, 1.18, -0.15);
    cabin.castShadow = true;
    cab.add(cabin);

    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.1, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    rack.position.set(0, 1.55, -0.15);
    cab.add(rack);

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.09),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    plate.position.set(0, 0.45, 1.92);
    cab.add(plate);

    cab.position.set(x, 0, z);
    this.scene.add(cab);

    this.obstacles.push({
      type: 'auto',
      mesh: cab,
      x,
      z,
      height: 1.65,
      width: 1.9,
      length: 3.8,
      speed: -8
    });
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
    ctx.fillText('ಬಿಬಿಎಂಪಿ ಕಾಮಗಾರಿ / BBMP', 128, 42);

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
    ctx.fillText('ಶ್ರೀ ಕೃಷ್ಣ ಟೀ & ಫಿಲ್ಟರ್ ಕಾಫಿ', 256, 52);
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
    ctx.fillText('ಸ್ವಾಗತ // WELCOME TO ECOSPACE TECH PARK', 512, 85);
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

  spawnPowerup(x, z, type) {
    const group = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: type === 'kaapi' ? 0xb45309 : (type === 'magnet' ? 0xd97706 : 0x00d46a),
      emissive: 0xffaa00,
      emissiveIntensity: 0.55,
      roughness: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    group.position.set(x, 1.2, z);
    this.scene.add(group);

    this.collectibles.push({
      type: 'powerup',
      powerupType: type,
      mesh: group,
      x,
      y: 1.2,
      z,
      radius: 0.95
    });
  }

  // --- Dynamic Exhaust Smoke Emission ---
  emitExhaustSmoke() {
    const isWarp = this.player.hasSneakers;
    const color = isWarp ? 0x00f0ff : 0xf1f5f9; // Soft white-grey smoke or electric warp cyan
    const puffGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const puffMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: isWarp ? 0.85 : 0.65
    });
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.set(
      this.player.x + 0.22 + (Math.random() - 0.5) * 0.06,
      this.player.y + 0.26,
      this.player.z - 0.78
    );
    this.scene.add(puff);

    this.smokeParticles.push({
      mesh: puff,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.4 + Math.random() * 0.35,
      vz: -(this.speed * 0.4 + 4),
      life: 0.7,
      maxLife: 0.7
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

  jump() {
    if (this.gameState !== 'playing') return;
    if (this.player.hasJetpack) return;

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
    this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * 0.012);
    const moveDist = this.speed * dt;
    this.distance += moveDist;

    // Remaining Office Distance Countdown & Speedometer in km/h
    const remainingDistance = Math.max(0, this.targetOfficeDistance - this.distance);
    const speedKmh = Math.round((this.speed / 26) * 55);
    this.callbacks.onDistanceUpdate(this.distance, remainingDistance, speedKmh);

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

    // Rotate Scooty Wheels based on speed
    const wheelSpin = (moveDist / 0.32);
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
      if (this.vehicleGroup) this.vehicleGroup.position.y = -0.25;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
        if (this.torsoGroup) this.torsoGroup.rotation.x = 0.12;
        if (this.vehicleGroup) this.vehicleGroup.position.y = 0;
      }
    } else {
      const engineVibe = Math.sin(this.distance * 10) * 0.015;
      if (this.vehicleGroup) this.vehicleGroup.position.y = engineVibe;
      if (this.torsoGroup) this.torsoGroup.rotation.x = 0.12;
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
      const deltaZ = (moveDist + (obs.speed || 0) * dt);
      obs.z -= deltaZ;
      obs.mesh.position.z = obs.z;

      // Animate obstacle wheels!
      if (obs.wheelMeshes && obs.wheelMeshes.length > 0) {
        const spin = deltaZ / (obs.wheelRadius || 0.4);
        obs.wheelMeshes.forEach(w => {
          w.rotation.x -= spin;
        });
      }

      if (obs.z > furthestZ) furthestZ = obs.z;

      this.checkObstacleCollision(obs);

      if (obs.z < -25) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // Move Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.z -= moveDist;
      item.mesh.position.z = item.z;

      if (item.type === 'coin') {
        item.mesh.rotation.z += 5 * dt;
      } else if (item.type === 'powerup') {
        item.mesh.rotation.y += 3 * dt;
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

    if (furthestZ < 160) {
      this.spawnNextSegment(Math.max(170, furthestZ + 25));
    }

    this.updateCamera(dt);
  }

  updateCamera(dt) {
    if (!this.camera) return;

    const targetCamX = this.player.x * 0.45;
    const targetCamY = 5.0 + (this.player.y * 0.35);
    const targetCamZ = this.player.z - 7.2;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 10 * dt;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 10 * dt;
    this.camera.position.z = targetCamZ;

    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 0.4;
    }

    this.camera.lookAt(this.player.x, this.player.y + 1.8, this.player.z + 18);
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
        this.handleCrash();
      }
    } else if (obs.type === 'pothole') {
      const hitZ = Math.abs(pz - obs.z) < 1.35;
      const hitLane = Math.abs(px - obs.x) < 1.35;

      if (hitZ && hitLane && py < 0.85) {
        this.handleStumble();
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

    switch (type) {
      case 'magnet':
        this.player.hasMagnet = true;
        this.player.magnetTimer = duration;
        this.callbacks.onPowerupChange('magnet', duration);
        break;
      case 'warp':
      case 'sneakers':
        this.player.hasSneakers = true;
        this.player.sneakersTimer = duration;
        this.callbacks.onPowerupChange('sneakers', duration);
        break;
      case 'kaapi':
      case 'multiplier':
        this.player.hasMultiplier = true;
        this.player.multiplierTimer = duration;
        this.callbacks.onPowerupChange('multiplier', duration);
        break;
      case 'metro_jetpack':
      case 'jetpack':
        this.player.hasJetpack = true;
        this.player.jetpackTimer = 10;
        this.callbacks.onPowerupChange('jetpack', 10);
        break;
      case 'auto_shield':
      case 'hoverboard':
        this.hoverboardStock++;
        this.callbacks.onHoverboardCountChange(this.hoverboardStock);
        break;
    }
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

  handleVictory() {
    this.gameState = 'victory';
    soundManager.stopMusic();
    soundManager.playVictory();

    this.callbacks.onVictory({
      score: this.score,
      coins: this.coins,
      distance: Math.floor(this.distance),
      timeTaken: Math.round(this.runTimer)
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

    this.camera.aspect = this.width / this.height;
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
