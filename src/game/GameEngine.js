/**
 * Subway Surfers - Namma Bengaluru Edition Game Engine
 * Features:
 * - Vintage Scooter Boy runner using the custom uploaded character sprite (helmet, sunglasses, moustache, retro scooter)
 * - 3D Perspective Projection with pleasant daylight Indian sun & atmosphere
 * - Sudden Bangalore Traffic rushes with lane-cutting Autos, BMTC buses, and loud honks
 * - Floating comic-style honk bubbles ("PEEP PEEP!", "HORN OK PLEASE", "PAAM PAAM!")
 * - Authentic Tamil billboards & cutting-edge AI Startup boards (Sarvam AI, Krutrim, OpenAI BLR, Perplexity, Anthropic)
 * - Potholes, BBMP hurdles, hanging cables, Golden ₹ Rupee coins
 * - Traffic Police Mama & Indie Dog chasing behind
 */

import { soundManager } from './AudioSynthesizer.js';

export class GameEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = {
      onScoreUpdate: options.onScoreUpdate || (() => {}),
      onCoinsUpdate: options.onCoinsUpdate || (() => {}),
      onPowerupChange: options.onPowerupChange || (() => {}),
      onGameOver: options.onGameOver || (() => {}),
      onHoverboardCountChange: options.onHoverboardCountChange || (() => {})
    };

    this.width = canvas.width;
    this.height = canvas.height;

    // Perspective Projection Settings
    this.focalLength = 320;
    this.maxZ = 1200;
    this.laneSpacing = 220; // 3 lanes (-1, 0, 1)
    this.groundY = 320;

    // Gameplay State
    this.gameState = 'ready';
    this.score = 0;
    this.coins = 0;
    this.multiplier = 10;
    this.distance = 0;
    this.baseSpeed = 230;
    this.speed = this.baseSpeed;
    this.maxSpeed = 580;

    // Upgrades & Inventory
    this.hoverboardStock = 3;
    this.selectedBoard = 'ather';
    this.upgradeLevels = {
      magnet: 1,
      sneakers: 1,
      multiplier: 1,
      jetpack: 1
    };

    // Runner Sprite Image (Custom uploaded scooter boy)
    this.playerImage = new Image();
    this.playerImageLoaded = false;
    this.playerCanvas = null; // Processed transparent canvas

    this.loadPlayerSprite();

    // Scooter Boy Player State
    this.player = {
      lane: 0,
      x: 0,
      targetX: 0,
      y: 0,
      vy: 0,
      z: 50,
      width: 60,
      height: 75,
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

    // Traffic Police Mama & Stray Indie Dog
    this.chaser = {
      distance: 85,
      isLunge: false
    };

    // World Entities
    this.roadDashes = [];
    this.obstacles = [];
    this.collectibles = [];
    this.billboards = [];
    this.trees = [];
    this.particles = [];
    this.honkBubbles = []; // Comic honk bubbles

    // Sudden traffic event timers
    this.suddenTrafficTimer = 3.5;
    this.suddenWarning = null; // { text, time }

    // Camera
    this.cameraShake = 0;
    this.cameraTilt = 0;

    this.lastTime = 0;
    this.rafId = null;
    this.comboCounter = 0;
    this.lastCoinTime = 0;

    // Dual Tamil & AI Startup Billboards
    this.startupQuotes = [
      // Tamil & Culture Boards
      { brand: 'வணக்கம் பெங்களூரு', lang: 'TAMIL', text: 'சென்னை To சில்க் போர்டு Express! (Vanakkam Bengaluru)', color: '#d97706', tag: 'CHENNAI EXPRESS' },
      { brand: 'டீ & AI', lang: 'TAMIL', text: 'டீ குடிச்சிட்டு Coding பண்ணுங்க! 100% Pure Chicory Filter Kaapi', color: '#b45309', tag: 'FILTER KAAPI' },
      { brand: 'நம்ம ஊரு METRO', lang: 'TAMIL', text: 'அடுத்த ஸ்டேஷன் இந்திரா நகர்! (Next Station: Indiranagar)', color: '#8e24aa', tag: 'METRO PURPLE' },
      { brand: 'ஸ்டார்ட்அப் வாழ்க', lang: 'TAMIL', text: 'டிராபிக்-ல சிக்கினாலும் Startup ஜெயிக்கும்! (Hustle Never Dies)', color: '#dc2626', tag: 'TAMIL TECHIE' },

      // AI Startup Boards
      { brand: 'SARVAM AI', lang: 'AI', text: 'Building Indic LLMs while waiting at Silk Board junction.', color: '#0077b6', tag: 'INDIC LLM' },
      { brand: 'KRUTRIM AI', lang: 'AI', text: '100 Billion Parameters, 0 Bangalore Parking Spots.', color: '#00a86b', tag: 'INDIA AGI' },
      { brand: 'OPENAI BENGALURU', lang: 'AI', text: 'AGI will arrive before the Silk Board flyover completes.', color: '#059669', tag: 'AGI 2026' },
      { brand: 'PERPLEXITY AI', lang: 'AI', text: 'Why is Bangalore traffic so bad? Sources: 42 Citations.', color: '#0284c7', tag: 'AI SEARCH' },
      { brand: 'ANTHROPIC CLAUDE', lang: 'AI', text: 'Prompt Engineering our way out of BBMP potholes.', color: '#d97706', tag: 'CONSTITUTIONAL AI' },
      { brand: 'NVIDIA H100 CLUSTER', lang: 'AI', text: 'AI GPU Cluster cooled by pleasant Bangalore evening breeze.', color: '#16a34a', tag: 'GPU CLOUD' },
      { brand: 'CURSOR & V0', lang: 'AI', text: 'Wrote 10,000 lines of code at the Marathahalli signal.', color: '#4f46e5', tag: 'AI PAIR CODER' },
      { brand: 'Y COMBINATOR', lang: 'AI', text: 'Pitch your Agentic AI on a vintage Chetak scooter.', color: '#ea580c', tag: 'YC BENGALURU' }
    ];

    this.initRoad();
  }

  loadPlayerSprite() {
    this.playerImage.src = '/runner_scooter.png';
    this.playerImage.onload = () => {
      // Create offscreen canvas to process pure white background to transparent
      const offscreen = document.createElement('canvas');
      offscreen.width = this.playerImage.width;
      offscreen.height = this.playerImage.height;
      const oCtx = offscreen.getContext('2d');
      oCtx.drawImage(this.playerImage, 0, 0);

      try {
        const imgData = oCtx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;
        // Key out white / near-white background
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0; // Transparent
          }
        }
        oCtx.putImageData(imgData, 0, 0);
        this.playerCanvas = offscreen;
      } catch (e) {
        // Fallback to direct image
        this.playerCanvas = this.playerImage;
      }

      this.playerImageLoaded = true;
    };
  }

  project(x, y, z) {
    if (z <= -this.focalLength + 1) z = -this.focalLength + 2;
    const scale = this.focalLength / (this.focalLength + z);
    const vx = this.width / 2;
    const vy = this.height * 0.38;

    return {
      x: vx + (x + this.cameraTilt * 40) * scale,
      y: vy + (this.groundY - y) * scale + this.cameraShake * (Math.random() - 0.5) * 8,
      scale: scale,
      visible: z >= 0 && z < this.maxZ
    };
  }

  initRoad() {
    this.roadDashes = [];
    for (let z = 0; z < this.maxZ; z += 50) {
      this.roadDashes.push(z);
    }

    // Billboards alternating sides
    this.billboards = [
      { z: 280, side: -1, quote: this.startupQuotes[0] }, // Tamil
      { z: 540, side: 1, quote: this.startupQuotes[4] },  // Sarvam AI
      { z: 800, side: -1, quote: this.startupQuotes[1] }, // Tamil Filter Kaapi
      { z: 1060, side: 1, quote: this.startupQuotes[6] }  // OpenAI BLR
    ];

    // Trees
    this.trees = [];
    for (let z = 100; z < this.maxZ; z += 180) {
      this.trees.push({ z, side: -1 });
      this.trees.push({ z: z + 90, side: 1 });
    }
  }

  start() {
    this.gameState = 'playing';
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.honkBubbles = [];
    this.chaser.distance = 85;

    this.resetPlayer();
    soundManager.startMusic();
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onCoinsUpdate(this.coins);
    this.callbacks.onHoverboardCountChange(this.hoverboardStock);

    this.spawnInitialObstacles();

    this.lastTime = performance.now();
    if (!this.rafId) {
      this.loop(this.lastTime);
    }
  }

  resetPlayer() {
    this.player.lane = 0;
    this.player.x = 0;
    this.player.targetX = 0;
    this.player.y = 0;
    this.player.vy = 0;
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
  }

  pause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      soundManager.stopMusic();
    }
  }

  resume() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      this.lastTime = performance.now();
      soundManager.startMusic();
      this.loop(this.lastTime);
    }
  }

  // --- Controls ---
  moveLeft() {
    if (this.gameState !== 'playing') return;
    if (this.player.lane > -1) {
      this.player.lane--;
      this.player.targetX = this.player.lane * this.laneSpacing;
      this.cameraTilt = -0.06;
      soundManager.playLaneSwitch();
      this.createScooterTireSkid(-1);
    }
  }

  moveRight() {
    if (this.gameState !== 'playing') return;
    if (this.player.lane < 1) {
      this.player.lane++;
      this.player.targetX = this.player.lane * this.laneSpacing;
      this.cameraTilt = 0.06;
      soundManager.playLaneSwitch();
      this.createScooterTireSkid(1);
    }
  }

  jump() {
    if (this.gameState !== 'playing') return;
    if (this.player.hasJetpack) return;

    if (this.player.isGrounded || this.player.y <= 95) {
      this.player.isGrounded = false;
      this.player.isJumping = true;
      this.player.isSliding = false;

      const jumpPower = this.player.hasSneakers ? 530 : 390;
      this.player.vy = jumpPower;

      if (this.player.hasSneakers) {
        soundManager.playSuperJump();
        this.createJumpParticles();
      } else {
        soundManager.playJump();
      }
    }
  }

  slide() {
    if (this.gameState !== 'playing') return;
    if (this.player.hasJetpack) return;

    if (!this.player.isGrounded) {
      this.player.vy = -620;
    }

    this.player.isSliding = true;
    this.player.slideTimer = 0.75;
    soundManager.playSlide();
    this.createSlideParticles();
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

    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 40,
        y: this.player.y + 5,
        z: this.player.z + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 180,
        vy: Math.random() * 120 + 40,
        vz: -Math.random() * 80,
        color: '#ff9f1c',
        size: Math.random() * 6 + 3,
        life: 0.6
      });
    }
  }

  // --- World Spawning System ---
  spawnInitialObstacles() {
    // 1. Pothole to jump over
    this.obstacles.push({
      type: 'pothole',
      lane: 0,
      x: 0,
      z: 280,
      width: 75,
      height: 10
    });
    this.spawnCoinArc(250, 0, 5);

    // 2. Auto-Rickshaw with comic honk bubble
    this.obstacles.push({
      type: 'auto',
      lane: 1,
      x: this.laneSpacing,
      z: 550,
      length: 120,
      width: 80,
      height: 65,
      speed: 0
    });
    this.addHonkBubble(this.laneSpacing, 550, 'PEEP PEEP!');
    this.spawnCoinLine(530, 1, 5, 0);

    // 3. BMTC Bus in left lane
    this.obstacles.push({
      type: 'bmtc_bus',
      lane: -1,
      x: -this.laneSpacing,
      z: 850,
      length: 290,
      width: 95,
      height: 85,
      speed: 0
    });
    this.addHonkBubble(-this.laneSpacing, 850, 'HORN OK PLEASE');
    this.spawnCoinLine(850, -1, 7, 95);
  }

  spawnNextSegment(minZ) {
    const laneChoices = [-1, 0, 1];
    const roll = Math.random();

    // 1. BMTC Volvo / Electric Bus
    if (roll < 0.3) {
      const busLane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
      this.obstacles.push({
        type: 'bmtc_bus',
        lane: busLane,
        x: busLane * this.laneSpacing,
        z: minZ,
        length: 290,
        width: 95,
        height: 85,
        speed: 0
      });
      this.spawnCoinLine(minZ + 30, busLane, 7, 95);

      if (Math.random() > 0.4) {
        this.addHonkBubble(busLane * this.laneSpacing, minZ, 'BLOW HORN!');
      }

      // Other lane pothole
      const otherLanes = laneChoices.filter(l => l !== busLane);
      const secondLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      if (Math.random() > 0.4) {
        this.obstacles.push({
          type: 'pothole',
          lane: secondLane,
          x: secondLane * this.laneSpacing,
          z: minZ + 80,
          width: 75,
          height: 10
        });
        this.spawnCoinArc(minZ + 50, secondLane, 4);
      }
    }
    // 2. Yellow & Green Auto-Rickshaw (Can be sudden oncoming!)
    else if (roll < 0.6) {
      const autoLane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
      const isOncoming = Math.random() > 0.4 && this.distance > 200;
      this.obstacles.push({
        type: 'auto',
        lane: autoLane,
        x: autoLane * this.laneSpacing,
        z: minZ,
        length: 120,
        width: 80,
        height: 65,
        isOncoming: isOncoming,
        speed: isOncoming ? 160 : 0
      });

      const autoHonks = ['PEEP PEEP!', 'BOSS 50 EXTRA!', 'PAAM PAAM!', 'GOTTILLA!'];
      const chosenHonk = autoHonks[Math.floor(Math.random() * autoHonks.length)];
      this.addHonkBubble(autoLane * this.laneSpacing, minZ, chosenHonk);

      if (isOncoming) {
        soundManager.playAutoHorn();
      }

      this.spawnCoinLine(minZ + 40, autoLane, 4, 18);
    }
    // 3. Potholes & BBMP Hurdles
    else if (roll < 0.85) {
      const lane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
      const isPothole = Math.random() > 0.4;

      if (isPothole) {
        this.obstacles.push({
          type: 'pothole',
          lane: lane,
          x: lane * this.laneSpacing,
          z: minZ,
          width: 75,
          height: 10
        });
        this.spawnCoinArc(minZ - 30, lane, 5);
      } else {
        const isLow = Math.random() > 0.4;
        this.obstacles.push({
          type: isLow ? 'bbmp_barricade' : 'hanging_cables',
          lane: lane,
          x: lane * this.laneSpacing,
          z: minZ,
          width: 80,
          height: 38
        });
        if (isLow) {
          this.spawnCoinArc(minZ - 40, lane, 6);
        } else {
          this.spawnCoinLine(minZ - 40, lane, 5, 0);
        }
      }
    }
    // 4. Bangalore Startup Power-up
    else {
      const pLane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
      const powerups = ['kaapi', 'magnet', 'warp', 'metro_jetpack', 'auto_shield'];
      const chosen = powerups[Math.floor(Math.random() * powerups.length)];

      this.collectibles.push({
        type: 'powerup',
        powerupType: chosen,
        lane: pLane,
        x: pLane * this.laneSpacing,
        y: 28,
        z: minZ,
        size: 26,
        rotation: 0
      });
      this.spawnCoinLine(minZ + 60, pLane, 5);
    }

    // Billboards (Tamil or AI Startup)
    if (Math.random() > 0.45) {
      const quote = this.startupQuotes[Math.floor(Math.random() * this.startupQuotes.length)];
      this.billboards.push({
        z: minZ + 120,
        side: Math.random() > 0.5 ? 1 : -1,
        quote: quote
      });
    }

    this.trees.push({
      z: minZ + 80,
      side: Math.random() > 0.5 ? 1 : -1
    });
  }

  addHonkBubble(x, z, text) {
    this.honkBubbles.push({
      x,
      y: 95,
      z,
      text,
      life: 2.2,
      opacity: 1
    });
  }

  spawnCoinLine(startZ, lane, count, height = 18) {
    for (let i = 0; i < count; i++) {
      this.collectibles.push({
        type: 'coin',
        lane: lane,
        x: lane * this.laneSpacing,
        y: height,
        z: startZ + i * 36,
        size: 15,
        rotation: i * 0.4
      });
    }
  }

  spawnCoinArc(startZ, lane, count) {
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const arcHeight = 18 + Math.sin(progress * Math.PI) * 70;
      this.collectibles.push({
        type: 'coin',
        lane: lane,
        x: lane * this.laneSpacing,
        y: arcHeight,
        z: startZ + i * 32,
        size: 15,
        rotation: i * 0.4
      });
    }
  }

  // --- Update Loop ---
  update(dt) {
    if (this.gameState !== 'playing') return;

    this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * 0.08);
    const moveDist = this.speed * dt;
    this.distance += moveDist / 10;

    const currentMultiplier = this.player.hasMultiplier ? this.multiplier * 2 : this.multiplier;
    this.score += Math.floor((moveDist * 0.5) * (currentMultiplier / 10));
    this.callbacks.onScoreUpdate(this.score);

    this.cameraTilt *= 0.88;
    this.cameraShake *= 0.85;

    // Sudden traffic cut events
    this.updateSuddenTraffic(dt);

    // Smooth horizontal lane transition
    const dx = this.player.targetX - this.player.x;
    this.player.x += dx * 14 * dt;

    // Vertical physics
    if (this.player.hasJetpack) {
      const targetSkyY = 220;
      this.player.y += (targetSkyY - this.player.y) * 8 * dt;
      this.player.isGrounded = false;
      this.createJetpackParticles();
    } else {
      const gravity = -980;
      this.player.vy += gravity * dt;
      this.player.y += this.player.vy * dt;

      // Check if scooter is riding along on top of BMTC bus roof!
      let groundHeight = 0;
      for (const obs of this.obstacles) {
        if (obs.type === 'bmtc_bus') {
          const busFrontZ = obs.z;
          const busBackZ = obs.z + obs.length;
          const isOverBusZ = this.player.z >= busFrontZ - 20 && this.player.z <= busBackZ;
          const isSameLane = Math.abs(this.player.x - obs.x) < 48;

          if (isOverBusZ && isSameLane && this.player.y >= obs.height - 15) {
            groundHeight = obs.height;
            break;
          }
        }
      }

      if (this.player.y <= groundHeight) {
        this.player.y = groundHeight;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.isJumping = false;
      }
    }

    if (this.player.isSliding) {
      this.player.slideTimer -= dt;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
      }
    }

    this.updatePowerups(dt);

    // Chaser
    if (this.chaser.isLunge) {
      this.chaser.distance += (38 - this.chaser.distance) * 2 * dt;
    } else {
      this.chaser.distance += (85 - this.chaser.distance) * 0.4 * dt;
    }

    // Move road
    for (let i = 0; i < this.roadDashes.length; i++) {
      this.roadDashes[i] -= moveDist;
      if (this.roadDashes[i] < -20) {
        this.roadDashes[i] += this.maxZ;
      }
    }

    // Billboards & Trees
    for (let i = this.billboards.length - 1; i >= 0; i--) {
      this.billboards[i].z -= moveDist;
      if (this.billboards[i].z < -60) {
        this.billboards.splice(i, 1);
      }
    }

    for (let i = this.trees.length - 1; i >= 0; i--) {
      this.trees[i].z -= moveDist;
      if (this.trees[i].z < -60) {
        this.trees.splice(i, 1);
      }
    }

    // Honk bubbles
    for (let i = this.honkBubbles.length - 1; i >= 0; i--) {
      const hb = this.honkBubbles[i];
      hb.z -= moveDist;
      hb.life -= dt;
      hb.y += dt * 15;
      if (hb.life <= 0 || hb.z < -20) {
        this.honkBubbles.splice(i, 1);
      }
    }

    // Obstacles
    let furthestZ = 0;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= (moveDist + (obs.speed || 0) * dt);

      if (obs.z > furthestZ) furthestZ = obs.z;

      this.checkObstacleCollision(obs);

      if (obs.z + (obs.length || 80) < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    // Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.z -= moveDist;
      item.rotation += dt * 3.5;

      if (item.type === 'coin' && this.player.hasMagnet) {
        const pz = this.player.z;
        const distZ = Math.abs(item.z - pz);
        if (distZ < 450) {
          item.x += (this.player.x - item.x) * 6 * dt;
          item.y += (this.player.y + 30 - item.y) * 6 * dt;
          item.z += (pz - item.z) * 6 * dt;
        }
      }

      if (this.checkCollectiblePickup(item)) {
        this.collectibles.splice(i, 1);
        continue;
      }

      if (item.z < -40) {
        this.collectibles.splice(i, 1);
      }
    }

    if (furthestZ < this.maxZ - 180) {
      this.spawnNextSegment(Math.max(this.maxZ - 100, furthestZ + 180));
    }

    // Scooter Exhaust Smoke particles while running
    if (this.player.isGrounded && Math.random() > 0.4) {
      this.particles.push({
        x: this.player.x - 14,
        y: this.player.y + 4,
        z: this.player.z - 10,
        vx: -15 + (Math.random() - 0.5) * 10,
        vy: Math.random() * 15 + 5,
        vz: -this.speed * 0.6,
        color: 'rgba(200, 200, 210, 0.5)',
        size: Math.random() * 5 + 3,
        life: 0.35
      });
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      p.z += (p.vz || -this.speed) * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- Sudden Traffic Events ---
  updateSuddenTraffic(dt) {
    this.suddenTrafficTimer -= dt;
    if (this.suddenTrafficTimer <= 0 && this.distance > 150) {
      this.suddenTrafficTimer = 5 + Math.random() * 4;

      // Find an auto ahead of player and make it suddenly switch lanes!
      const aheadAutos = this.obstacles.filter(o => o.type === 'auto' && o.z > this.player.z + 100 && o.z < 600);
      if (aheadAutos.length > 0) {
        const targetAuto = aheadAutos[0];
        const newLane = targetAuto.lane === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        targetAuto.lane = newLane;
        targetAuto.x = newLane * this.laneSpacing;

        soundManager.playAutoHorn();
        this.addHonkBubble(targetAuto.x, targetAuto.z, 'SUDDEN CUT!');

        this.suddenWarning = {
          text: 'SUDDEN AUTO CUT!',
          time: 1.5
        };
      }
    }

    if (this.suddenWarning) {
      this.suddenWarning.time -= dt;
      if (this.suddenWarning.time <= 0) {
        this.suddenWarning = null;
      }
    }
  }

  createScooterTireSkid(direction) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.player.x + direction * 15,
        y: this.player.y + 2,
        z: this.player.z,
        vx: direction * 40,
        vy: Math.random() * 10,
        vz: -this.speed * 0.4,
        color: '#1a1a1a',
        size: Math.random() * 4 + 2,
        life: 0.25
      });
    }
  }

  updatePowerups(dt) {
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    if (this.player.hasHoverboard) {
      this.player.hoverboardTimer -= dt;
      if (this.player.hoverboardTimer <= 0) {
        this.player.hasHoverboard = false;
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

  // --- Collision Detection ---
  checkObstacleCollision(obs) {
    if (this.player.invulnerableTimer > 0) return;
    if (this.player.hasJetpack) return;

    const pz = this.player.z;
    const px = this.player.x;
    const py = this.player.y;

    if (obs.type === 'bmtc_bus') {
      const busFrontZ = obs.z;
      const hitZ = pz >= busFrontZ && pz <= busFrontZ + 35;
      const hitLane = Math.abs(px - obs.x) < 45;

      if (hitZ && hitLane && py < obs.height - 10) {
        this.handleCrash();
      }
    } else if (obs.type === 'auto') {
      const hitZ = pz >= obs.z && pz <= obs.z + 30;
      const hitLane = Math.abs(px - obs.x) < 40;

      if (hitZ && hitLane && py < obs.height - 8) {
        this.handleCrash();
      }
    } else if (obs.type === 'pothole') {
      const hitZ = Math.abs(pz - obs.z) < 22;
      const hitLane = Math.abs(px - obs.x) < 36;

      if (hitZ && hitLane && py < 25) {
        this.handleStumble();
      }
    } else if (obs.type === 'bbmp_barricade') {
      const hitZ = Math.abs(pz - obs.z) < 22;
      const hitLane = Math.abs(px - obs.x) < 40;

      if (hitZ && hitLane) {
        if (py < 30) {
          if (Math.abs(px - obs.x) > 28) this.handleStumble();
          else this.handleCrash();
        }
      }
    } else if (obs.type === 'hanging_cables') {
      const hitZ = Math.abs(pz - obs.z) < 22;
      const hitLane = Math.abs(px - obs.x) < 40;

      if (hitZ && hitLane && !this.player.isSliding) {
        if (Math.abs(px - obs.x) > 28) this.handleStumble();
        else this.handleCrash();
      }
    }
  }

  checkCollectiblePickup(item) {
    const distZ = Math.abs(this.player.z - item.z);
    const distX = Math.abs(this.player.x - item.x);
    const distY = Math.abs((this.player.y + 25) - item.y);

    if (distZ < 28 && distX < 40 && distY < 45) {
      if (item.type === 'coin') {
        this.collectCoin(item);
        return true;
      } else if (item.type === 'powerup') {
        this.collectPowerup(item.powerupType);
        return true;
      }
    }
    return false;
  }

  collectCoin(coin) {
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

    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: coin.x,
        y: coin.y,
        z: coin.z,
        vx: (Math.random() - 0.5) * 60,
        vy: Math.random() * 60 + 20,
        vz: (Math.random() - 0.5) * 40,
        color: '#ffc107',
        size: Math.random() * 4 + 2,
        life: 0.35
      });
    }
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
        this.spawnSkyCoins();
        break;
      case 'auto_shield':
      case 'hoverboard':
        this.hoverboardStock++;
        this.callbacks.onHoverboardCountChange(this.hoverboardStock);
        break;
    }
  }

  spawnSkyCoins() {
    const startZ = this.player.z + 120;
    for (let i = 0; i < 25; i++) {
      const waveLane = Math.sin(i * 0.4) * this.laneSpacing;
      this.collectibles.push({
        type: 'coin',
        lane: 0,
        x: waveLane,
        y: 220,
        z: startZ + i * 35,
        size: 16,
        rotation: i * 0.3
      });
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
      this.chaser.distance = 38;
      setTimeout(() => {
        this.chaser.isLunge = false;
      }, 3500);
    }
  }

  handleCrash() {
    if (this.player.hasHoverboard) {
      this.player.hasHoverboard = false;
      this.player.invulnerableTimer = 2.5;
      this.cameraShake = 2.0;
      soundManager.playCrash();

      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: this.player.x,
          y: this.player.y + 10,
          z: this.player.z,
          vx: (Math.random() - 0.5) * 250,
          vy: Math.random() * 200 + 50,
          vz: -Math.random() * 150,
          color: '#ff9f1c',
          size: Math.random() * 7 + 3,
          life: 0.8
        });
      }
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

  createJumpParticles() {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 30,
        y: this.player.y,
        z: this.player.z + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 80,
        vy: Math.random() * 30 + 10,
        vz: -Math.random() * 60,
        color: '#ff9f1c',
        size: Math.random() * 5 + 3,
        life: 0.4
      });
    }
  }

  createSlideParticles() {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 25,
        y: this.player.y + 4,
        z: this.player.z + 10,
        vx: (Math.random() - 0.5) * 60,
        vy: Math.random() * 25 + 5,
        vz: -this.speed * 0.4,
        color: 'rgba(255, 180, 80, 0.7)',
        size: Math.random() * 4 + 2,
        life: 0.3
      });
    }
  }

  createJetpackParticles() {
    const colors = ['#ff7700', '#ffffff', '#00a86b', '#0077b6'];
    for (let i = 0; i < 3; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: this.player.x + (Math.random() > 0.5 ? -14 : 14),
        y: this.player.y - 10,
        z: this.player.z - 10,
        vx: (Math.random() - 0.5) * 30,
        vy: -Math.random() * 120 - 40,
        vz: -this.speed * 0.8,
        color: color,
        size: Math.random() * 6 + 3,
        life: 0.5
      });
    }
  }

  // --- Rendering: Pleasant 3D Daylight Bengaluru Edition ---
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Daylight Sky
    this.renderDaylightSky(ctx, w, h);

    // 2. Bangalore Skyline & Metro Viaduct
    this.renderBangaloreSkyline(ctx, w, h);

    // 3. Gulmohar Trees
    this.renderTrees(ctx);

    // 4. Highway Tarmac & Bangalore Kerbstones
    this.renderHighway(ctx, w, h);

    // 5. Dual Tamil & AI Startup Billboards
    this.renderBillboards(ctx);

    // 6. World Entities (BMTC buses, Autos, Potholes, Rupee Coins)
    this.renderWorldEntities(ctx);

    // 7. Honk Comic Bubbles
    this.renderHonkBubbles(ctx);

    // 8. Chaser (Traffic Police Mama + Indie Dog)
    this.renderChaser(ctx);

    // 9. Retro Scooter Boy Runner (Custom image sprite)
    this.renderPlayer(ctx);

    // 10. Particles
    this.renderParticles(ctx);

    // 11. Sudden traffic alert overlay
    if (this.suddenWarning) {
      this.renderSuddenWarning(ctx, w, h);
    }
  }

  renderDaylightSky(ctx, w, h) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    skyGrad.addColorStop(0, '#64b5f6'); // Rich pleasant Bangalore sky blue
    skyGrad.addColorStop(0.5, '#bbdefb');
    skyGrad.addColorStop(0.85, '#fef3c7'); // Morning sun golden hue
    skyGrad.addColorStop(1, '#fed7aa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.42);

    // Warm Sun
    const sunX = w * 0.78;
    const sunY = h * 0.15;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 70);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, 'rgba(255, 235, 150, 0.9)');
    sunGrad.addColorStop(0.8, 'rgba(255, 180, 50, 0.2)');
    sunGrad.addColorStop(1, 'rgba(255, 180, 50, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
    ctx.fill();

    // Road verge landscape
    const groundGrad = ctx.createLinearGradient(0, h * 0.38, 0, h);
    groundGrad.addColorStop(0, '#3f6212');
    groundGrad.addColorStop(1, '#1e3a12');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.38, w, h * 0.62);
  }

  renderBangaloreSkyline(ctx, w, h) {
    const horizonY = h * 0.38;

    // 1. Vidhana Soudha Central Dome Silhouette
    ctx.fillStyle = 'rgba(71, 85, 105, 0.35)';
    const vsX = w * 0.45;
    ctx.beginPath();
    ctx.arc(vsX, horizonY - 45, 24, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(vsX - 40, horizonY - 45, 80, 45);
    ctx.fillRect(vsX - 2, horizonY - 60, 4, 15);

    // 2. Glass Tech Park Towers
    const towers = [
      { x: w * 0.05, width: 65, height: 110, color: '#475569' },
      { x: w * 0.13, width: 85, height: 150, color: '#334155' },
      { x: w * 0.24, width: 75, height: 95, color: '#475569' },
      { x: w * 0.68, width: 90, height: 140, color: '#334155' },
      { x: w * 0.80, width: 80, height: 175, color: '#1e293b' },
      { x: w * 0.90, width: 95, height: 105, color: '#475569' }
    ];

    towers.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x, horizonY - t.height, t.width, t.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let wy = horizonY - t.height + 12; wy < horizonY - 10; wy += 18) {
        ctx.fillRect(t.x + 8, wy, t.width - 16, 8);
      }
    });

    // 3. Elevated Namma Metro Viaduct (Purple Line)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, horizonY - 22, w, 8);
    for (let px = 40; px < w; px += 110) {
      ctx.fillRect(px, horizonY - 22, 14, 22);
    }
  }

  renderHighway(ctx, w, h) {
    const leftRoadEdge1 = this.project(-this.laneSpacing * 1.6, 0, 0);
    const rightRoadEdge1 = this.project(this.laneSpacing * 1.6, 0, 0);
    const leftRoadEdge2 = this.project(-this.laneSpacing * 1.6, 0, this.maxZ);
    const rightRoadEdge2 = this.project(this.laneSpacing * 1.6, 0, this.maxZ);

    ctx.fillStyle = '#27272a'; // Dark clean tarmac
    ctx.beginPath();
    ctx.moveTo(leftRoadEdge1.x, leftRoadEdge1.y);
    ctx.lineTo(rightRoadEdge1.x, rightRoadEdge1.y);
    ctx.lineTo(rightRoadEdge2.x, rightRoadEdge2.y);
    ctx.lineTo(leftRoadEdge2.x, leftRoadEdge2.y);
    ctx.closePath();
    ctx.fill();

    // Bangalore Yellow-Black Curbs
    [-this.laneSpacing * 1.6, this.laneSpacing * 1.6].forEach(curbX => {
      for (let z = 0; z < this.maxZ; z += 40) {
        const isYellow = Math.floor(z / 40) % 2 === 0;
        const p1 = this.project(curbX, 0, z);
        const p2 = this.project(curbX, 0, z + 40);
        if (p1.visible) {
          ctx.strokeStyle = isYellow ? '#eab308' : '#09090b';
          ctx.lineWidth = Math.max(2, 6 * p1.scale);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });

    // Dashed White Lane Markings
    [-this.laneSpacing * 0.5, this.laneSpacing * 0.5].forEach(dividerX => {
      this.roadDashes.forEach(dashZ => {
        const p1 = this.project(dividerX, 0, dashZ);
        const p2 = this.project(dividerX, 0, dashZ + 25);
        if (p1.visible) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.5, 5 * p1.scale);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });
  }

  renderTrees(ctx) {
    this.trees.forEach(tree => {
      const treeX = tree.side * (this.laneSpacing * 1.85);
      const base = this.project(treeX, 0, tree.z);
      if (!base.visible) return;

      const scale = base.scale;
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(base.x - 4 * scale, base.y - 70 * scale, 8 * scale, 70 * scale);

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(base.x, base.y - 85 * scale, 30 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(base.x + 8 * scale, base.y - 92 * scale, 16 * scale, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // --- Dual Tamil & AI Startup Billboards ---
  renderBillboards(ctx) {
    this.billboards.forEach(b => {
      const boardX = b.side * (this.laneSpacing * 1.95);
      const postBase = this.project(boardX, 0, b.z);
      const boardTop = this.project(boardX, 120, b.z);
      if (!postBase.visible) return;

      const scale = postBase.scale;
      const w = 160 * scale;
      const h = 70 * scale;

      // Steel Pillar
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = Math.max(2, 6 * scale);
      ctx.beginPath();
      ctx.moveTo(postBase.x, postBase.y);
      ctx.lineTo(boardTop.x, boardTop.y);
      ctx.stroke();

      ctx.save();
      ctx.translate(boardTop.x, boardTop.y - h / 2);

      // 3D Glass Billboard Card
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 12 * scale;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6 * scale);
        ctx.fill();
      } else {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      ctx.shadowBlur = 0;

      // Header Banner (Color based on brand)
      ctx.fillStyle = b.quote.color;
      ctx.fillRect(-w / 2 + 5 * scale, -h / 2 + 5 * scale, w - 10 * scale, 16 * scale);

      // Category Tag (TAMIL or AI)
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, Math.floor(7 * scale))}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(b.quote.tag, -w / 2 + 10 * scale, -h / 2 + 16 * scale);

      // Brand Title
      ctx.textAlign = 'right';
      ctx.fillText(b.quote.brand, w / 2 - 10 * scale, -h / 2 + 16 * scale);

      // Billboard Text (Tamil / English)
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.font = `600 ${Math.max(5, Math.floor(7 * scale))}px sans-serif`;

      const line1 = b.quote.text.substring(0, 30);
      const line2 = b.quote.text.substring(30, 65);
      ctx.fillText(line1, 0, -h / 2 + 34 * scale);
      if (line2) {
        ctx.fillText(line2, 0, -h / 2 + 48 * scale);
      }

      ctx.restore();
    });
  }

  // --- Comic Honk Speech Bubbles ---
  renderHonkBubbles(ctx) {
    this.honkBubbles.forEach(hb => {
      const p = this.project(hb.x, hb.y, hb.z);
      if (!p.visible) return;

      const scale = p.scale;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Comic Bubble Background (Bright Yellow with bold border)
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(1.5, 3 * scale);

      const textW = Math.max(40, hb.text.length * 7 * scale);
      const textH = Math.max(14, 20 * scale);

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(-textW / 2, -textH / 2, textW, textH, 6 * scale);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(-textW / 2, -textH / 2, textW, textH);
        ctx.strokeRect(-textW / 2, -textH / 2, textW, textH);
      }

      // Comic text
      ctx.fillStyle = '#000000';
      ctx.font = `900 ${Math.max(7, Math.floor(9 * scale))}px Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hb.text, 0, 0);

      ctx.restore();
    });
  }

  renderSuddenWarning(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(w / 2 - 120, 75, 240, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.suddenWarning.text, w / 2, 91);
    ctx.restore();
  }

  renderWorldEntities(ctx) {
    const entities = [];
    this.obstacles.forEach(obs => entities.push({ type: 'obstacle', data: obs, z: obs.z }));
    this.collectibles.forEach(col => entities.push({ type: 'collectible', data: col, z: col.z }));
    entities.sort((a, b) => b.z - a.z);

    entities.forEach(ent => {
      if (ent.type === 'obstacle') {
        this.renderObstacle(ctx, ent.data);
      } else if (ent.type === 'collectible') {
        this.renderCollectible(ctx, ent.data);
      }
    });
  }

  renderObstacle(ctx, obs) {
    if (obs.type === 'bmtc_bus') {
      this.renderBMTCBus(ctx, obs);
    } else if (obs.type === 'auto') {
      this.renderAutoRickshaw(ctx, obs);
    } else if (obs.type === 'pothole') {
      this.renderPothole(ctx, obs);
    } else if (obs.type === 'bbmp_barricade') {
      this.renderBBMPBarricade(ctx, obs);
    } else if (obs.type === 'hanging_cables') {
      this.renderHangingCables(ctx, obs);
    }
  }

  renderBMTCBus(ctx, bus) {
    const frontZ = bus.z;
    const backZ = bus.z + bus.length;
    const halfW = bus.width / 2;
    const h = bus.height;

    const fbl = this.project(bus.x - halfW, 0, frontZ);
    const fbr = this.project(bus.x + halfW, 0, frontZ);
    const ftl = this.project(bus.x - halfW, h, frontZ);
    const ftr = this.project(bus.x + halfW, h, frontZ);

    const bbl = this.project(bus.x - halfW, 0, backZ);
    const bbr = this.project(bus.x + halfW, 0, backZ);
    const btl = this.project(bus.x - halfW, h, backZ);
    const btr = this.project(bus.x + halfW, h, backZ);

    if (!fbl.visible && !bbl.visible) return;

    // Roof
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(ftl.x, ftl.y);
    ctx.lineTo(ftr.x, ftr.y);
    ctx.lineTo(btr.x, btr.y);
    ctx.lineTo(btl.x, btl.y);
    ctx.closePath();
    ctx.fill();

    // Side Panels (BMTC Green)
    if (fbl.x > this.width / 2) {
      ctx.fillStyle = '#00703c';
      ctx.beginPath();
      ctx.moveTo(fbl.x, fbl.y);
      ctx.lineTo(ftl.x, ftl.y);
      ctx.lineTo(btl.x, btl.y);
      ctx.lineTo(bbl.x, bbl.y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#00a86b';
      ctx.beginPath();
      ctx.moveTo(fbr.x, fbr.y);
      ctx.lineTo(ftr.x, ftr.y);
      ctx.lineTo(btr.x, btr.y);
      ctx.lineTo(bbr.x, bbr.y);
      ctx.closePath();
      ctx.fill();
    }

    // Bus Back
    ctx.fillStyle = '#00a86b';
    ctx.beginPath();
    ctx.moveTo(fbl.x, fbl.y);
    ctx.lineTo(fbr.x, fbr.y);
    ctx.lineTo(ftr.x, ftr.y);
    ctx.lineTo(ftl.x, ftl.y);
    ctx.closePath();
    ctx.fill();

    // Windows
    const wTopLeft = this.project(bus.x - halfW * 0.8, h * 0.88, frontZ);
    const wBottomRight = this.project(bus.x + halfW * 0.8, h * 0.45, frontZ);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(wTopLeft.x, wTopLeft.y, wBottomRight.x - wTopLeft.x, wBottomRight.y - wTopLeft.y);

    // Route: "500-D SILK BOARD"
    const routeBoard = this.project(bus.x - halfW * 0.7, h * 0.98, frontZ);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(routeBoard.x, routeBoard.y, 80 * ftl.scale, 12 * ftl.scale);
    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold ${Math.max(6, Math.floor(7 * ftl.scale))}px monospace`;
    ctx.fillText('500-D SILK BOARD', routeBoard.x + 4 * ftl.scale, routeBoard.y + 9 * ftl.scale);
  }

  renderAutoRickshaw(ctx, auto) {
    const halfW = auto.width / 2;
    const h = auto.height;
    const frontZ = auto.z;

    const bl = this.project(auto.x - halfW, 0, frontZ);
    const br = this.project(auto.x + halfW, 0, frontZ);
    const tl = this.project(auto.x - halfW, h, frontZ);
    const tr = this.project(auto.x + halfW, h, frontZ);

    if (!bl.visible) return;
    const scale = bl.scale;

    // Green Lower Metal Body
    ctx.fillStyle = '#15803d';
    const bodyH = h * 0.55;
    const midL = this.project(auto.x - halfW, bodyH, frontZ);
    const midR = this.project(auto.x + halfW, bodyH, frontZ);
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(midR.x, midR.y);
    ctx.lineTo(midL.x, midL.y);
    ctx.closePath();
    ctx.fill();

    // Yellow Canopy Top
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(midL.x, midL.y);
    ctx.lineTo(midR.x, midR.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tl.x + 8 * scale, tl.y + 4 * scale, (tr.x - tl.x) - 16 * scale, 22 * scale);

    // Number Plate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((bl.x + br.x) / 2 - 18 * scale, bl.y - 12 * scale, 36 * scale, 10 * scale);
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(5, Math.floor(6 * scale))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('KA 01 F 4200', (bl.x + br.x) / 2, bl.y - 4 * scale);
  }

  renderPothole(ctx, obs) {
    const p = this.project(obs.x, 0, obs.z);
    if (!p.visible) return;

    const scale = p.scale;
    const w = obs.width * scale;
    const h = 24 * scale;

    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(w * 0.4, 4 * scale);
    ctx.lineTo(w * 0.45, -22 * scale);
    ctx.lineTo(w * 0.5, 4 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderBBMPBarricade(ctx, obs) {
    const halfW = obs.width / 2;
    const bl = this.project(obs.x - halfW, 0, obs.z);
    const br = this.project(obs.x + halfW, 0, obs.z);
    const tl = this.project(obs.x - halfW, obs.height, obs.z);
    const tr = this.project(obs.x + halfW, obs.height, obs.z);
    if (!bl.visible) return;

    const scale = bl.scale;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = Math.max(2, 5 * scale);
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.moveTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.stroke();

    const boardH = Math.max(8, 20 * scale);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(tl.x, tl.y, tr.x - tl.x, boardH);

    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(6, Math.floor(9 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('BBMP ROAD WORK', (tl.x + tr.x) / 2, tl.y + boardH * 0.7);
  }

  renderHangingCables(ctx, obs) {
    const halfW = obs.width / 2;
    const bl = this.project(obs.x - halfW, 0, obs.z);
    const br = this.project(obs.x + halfW, 0, obs.z);
    const tl = this.project(obs.x - halfW, 95, obs.z);
    const tr = this.project(obs.x + halfW, 95, obs.z);
    if (!bl.visible) return;

    const scale = bl.scale;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(2, 6 * scale);
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.moveTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.stroke();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(2, 3.5 * scale);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(tl.x, tl.y + i * 4 * scale);
      ctx.quadraticCurveTo((tl.x + tr.x) / 2, tl.y + (20 + i * 5) * scale, tr.x, tr.y + i * 4 * scale);
      ctx.stroke();
    }

    ctx.fillStyle = '#dc2626';
    ctx.fillRect((tl.x + tr.x) / 2 - 16 * scale, tl.y + 16 * scale, 32 * scale, 10 * scale);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(5, Math.floor(6 * scale))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SLIDE ▼', (tl.x + tr.x) / 2, tl.y + 23 * scale);
  }

  renderCollectible(ctx, item) {
    const p = this.project(item.x, item.y, item.z);
    if (!p.visible) return;

    if (item.type === 'coin') {
      const radius = Math.max(4, item.size * p.scale);
      const widthScale = Math.abs(Math.cos(item.rotation));

      ctx.save();
      ctx.translate(p.x, p.y);

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, radius * widthScale), radius, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, radius * 0.8 * widthScale), radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (widthScale > 0.4) {
        ctx.fillStyle = '#78350f';
        ctx.font = `bold ${Math.max(7, Math.floor(radius * 1.1))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₹', 0, 0);
      }

      ctx.restore();
    } else if (item.type === 'powerup') {
      const radius = Math.max(8, item.size * p.scale);
      ctx.save();
      ctx.translate(p.x, p.y);

      const icons = {
        kaapi: '2X',
        multiplier: '2X',
        magnet: 'MAG',
        warp: 'FAST',
        sneakers: 'JUMP',
        metro_jetpack: 'FLY',
        jetpack: 'FLY',
        auto_shield: 'SHLD',
        hoverboard: 'SHLD'
      };

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 119, 182, 0.4)';
      ctx.shadowBlur = 12 * p.scale;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#0077b6';
      ctx.lineWidth = Math.max(2, 3.5 * p.scale);
      ctx.stroke();

      ctx.font = `bold ${Math.max(9, Math.floor(radius * 0.9))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0077b6';
      ctx.fillText(icons[item.powerupType] || '2X', 0, 0);

      ctx.restore();
    }
  }

  // --- Retro Chetak Scooter Boy Runner (Using custom user-provided image) ---
  renderPlayer(ctx) {
    const p = this.project(this.player.x, this.player.y, this.player.z);
    if (!p.visible) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const scale = p.scale;
    const isSliding = this.player.isSliding;
    const hasShield = this.player.hasHoverboard;

    if (this.player.invulnerableTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.restore();
      return;
    }

    // Auto-rickshaw shield aura
    if (hasShield) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(0, -40 * scale, 55 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render using loaded image sprite if available
    if (this.playerImageLoaded && (this.playerCanvas || this.playerImage)) {
      const img = this.playerCanvas || this.playerImage;
      const targetH = 92 * scale;
      const aspect = img.width / img.height;
      const targetW = targetH * aspect;

      // Subtle engine vibration
      const vibY = this.player.isGrounded ? Math.sin(performance.now() * 0.04) * 2 * scale : 0;
      // Lean angle on lane change or slide
      const leanAngle = isSliding ? 0.35 : (this.cameraTilt * 1.2);

      ctx.save();
      ctx.translate(0, -targetH * 0.5 + vibY);
      ctx.rotate(leanAngle);

      // Soft road contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, targetH * 0.5 - 2 * scale, targetW * 0.35, 8 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw the scooter boy sprite centered
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
    } else {
      // Clean fallback vector scooter boy
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -50 * scale, 15 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Bangalore Traffic Police Mama & Stray Indie Dog ---
  renderChaser(ctx) {
    const chaserZ = this.player.z - this.chaser.distance;
    const p = this.project(this.player.x * 0.75, 0, chaserZ);
    if (!p.visible) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const scale = p.scale;
    const anim = Math.sin(performance.now() * 0.018 * (this.speed / 200));

    // 1. Bangalore Traffic Police Mama
    ctx.fillStyle = '#c2a649';
    ctx.fillRect(-16 * scale, -60 * scale, 32 * scale, 34 * scale);

    // Cross-Belt
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-16 * scale, -60 * scale);
    ctx.lineTo(16 * scale, -26 * scale);
    ctx.stroke();

    // Police Cap
    ctx.fillStyle = '#8c7329';
    ctx.fillRect(-15 * scale, -75 * scale, 30 * scale, 12 * scale);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-3 * scale, -73 * scale, 6 * scale, 6 * scale);

    // Face & Moustache
    ctx.fillStyle = '#c68642';
    ctx.beginPath();
    ctx.arc(0, -64 * scale, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-6 * scale, -62 * scale, 12 * scale, 3 * scale);

    // Challan Machine in hand
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(16 * scale, -58 * scale + anim * 10 * scale, 12 * scale, 16 * scale);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(18 * scale, -56 * scale + anim * 10 * scale, 8 * scale, 12 * scale);

    // 2. Stray Indie Dog
    const dogX = -32 * scale;
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(dogX, -12 * scale, 16 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(dogX + 12 * scale, -16 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(dogX - 14 * scale, -14 * scale);
    ctx.lineTo(dogX - 22 * scale, -22 * scale + anim * 6 * scale);
    ctx.stroke();

    ctx.restore();
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      const pt = this.project(p.x, p.y, p.z);
      if (pt.visible) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(1, (p.size || 3) * pt.scale), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  loop(timestamp) {
    if (this.gameState === 'paused' || this.gameState === 'gameover') {
      this.rafId = null;
      return;
    }

    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(t => this.loop(t));
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}
