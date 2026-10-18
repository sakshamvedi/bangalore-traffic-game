import * as THREE from 'three';
import { soundManager } from '../AudioSynthesizer.js';
import {
  createSobhaSentosaGate,
  createSpeedBreaker,
  createKannadaShop,
  createPanathurUnderpass,
  createTrafficSignalJunction,
  createEcospaceArrivalCampus
} from './SegmentBuilders.js';
import { TrafficSignalController } from './TrafficSignal.js';

/**
 * RouteManager.js
 * Master orchestrator for the 5-stage Bangalore weekday commute:
 * - Segment 1: Sobha Sentosa Residential Exit (0 - 500m)
 * - Segment 2: Local Panathur Roads (500 - 1200m)
 * - Segment 3: Panathur Railway Underpass Bottleneck (1200 - 1800m)
 * - Segment 4: Connecting Roads to Outer Ring Road & Traffic Signal (1800 - 2600m)
 * - Segment 5: RMZ Ecospace Business Park Arrival (2600 - 3000m)
 */
export class RouteManager {
  constructor(engine) {
    this.engine = engine;

    // Segment definitions
    this.segments = [
      {
        id: 1,
        name: 'Sobha Sentosa Exit',
        kannadaName: 'SOBHA SENTOSA EXIT',
        startM: 0,
        endM: 500,
        density: 'low',
        speedTarget: 50,
        desc: 'Morning Commute: Leave Sobha Sentosa and head towards Panathur'
      },
      {
        id: 2,
        name: 'Panathur Local Roads',
        kannadaName: 'PANATHUR LOCAL ROADS',
        startM: 500,
        endM: 1200,
        density: 'medium',
        speedTarget: 45,
        desc: 'Bustling shops, speed breakers, and slow-moving auto-rickshaws'
      },
      {
        id: 3,
        name: 'Panathur Railway Underpass',
        kannadaName: 'PANATHUR UNDERPASS',
        startM: 1200,
        endM: 1800,
        density: 'high',
        speedTarget: 35,
        desc: 'Signature bottleneck! Descending ramp, retaining walls, heavy queue'
      },
      {
        id: 4,
        name: 'Outer Ring Road Junction',
        kannadaName: 'ORR TRAFFIC SIGNAL',
        startM: 1800,
        endM: 2600,
        density: 'high',
        speedTarget: 60,
        desc: 'Bellandur ORR corridor, BMTC Electric buses & working Traffic Signal'
      },
      {
        id: 5,
        name: 'Ecospace Business Park',
        kannadaName: 'ECOSPACE TECH PARK',
        startM: 2600,
        endM: 3000,
        density: 'arrival',
        speedTarget: 30,
        desc: 'Gate 1 arrival zone! Clock in at 8:58 AM'
      }
    ];

    this.currentSegmentIndex = 0;
    this.trafficStops = 0;
    this.trafficRuleBonus = 0;
    this.underpassAcousticsActive = false;

    // Traffic Signal controller at Segment 4 (ORR)
    this.trafficSignal = null;
    this.trafficSignalSpawned = false;
    this.signalZ = null;

    // Milestone tracking
    this.lastAnnouncedSegment = -1;
    this.activeMilestoneMessage = null;
    this.milestoneTimer = 0;

    // Static spawned landmark groups
    this.landmarkGroups = [];
  }

  get scene() {
    return this.engine ? this.engine.scene : null;
  }

  reset() {
    this.currentSegmentIndex = 0;
    this.trafficStops = 0;
    this.trafficRuleBonus = 0;
    this.lastAnnouncedSegment = -1;
    this.activeMilestoneMessage = null;
    this.milestoneTimer = 0;
    this.trafficSignalSpawned = false;
    this.trafficSignal = null;
    this.signalZ = null;

    if (this.underpassAcousticsActive) {
      soundManager.setUnderpassAcoustics(false);
      this.underpassAcousticsActive = false;
    }

    this.clearLandmarks();
    this.spawnStartLandmarks();
  }

  clearLandmarks() {
    if (this.scene) {
      this.landmarkGroups.forEach(g => {
        this.scene.remove(g);
      });
    }
    this.landmarkGroups = [];
  }

  spawnStartLandmarks() {
    if (!this.scene) return;
    // Spawn Sobha Sentosa Gated Entrance right at the starting line (z = 18m)
    const sobhaGate = createSobhaSentosaGate(20);
    this.scene.add(sobhaGate);
    this.landmarkGroups.push(sobhaGate);
  }

  getCurrentSegment(distance = this.engine.distance) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (distance >= seg.startM && distance < seg.endM) {
        return seg;
      }
    }
    return this.segments[this.segments.length - 1];
  }

  getSegmentProgress(distance = this.engine.distance) {
    const seg = this.getCurrentSegment(distance);
    const range = seg.endM - seg.startM;
    const progress = Math.min(1, Math.max(0, (distance - seg.startM) / range));
    return { segment: seg, progress };
  }

  update(dt, distance, playerSpeed, playerZ) {
    const currentSeg = this.getCurrentSegment(distance);
    const segIdx = currentSeg.id - 1;

    // Announce new milestone when transitioning between segments
    if (segIdx !== this.lastAnnouncedSegment) {
      this.lastAnnouncedSegment = segIdx;
      this.activeMilestoneMessage = {
        title: currentSeg.name.toUpperCase(),
        subtitle: currentSeg.desc,
        kannada: currentSeg.kannadaName
      };
      this.milestoneTimer = 4.0; // show toast for 4s
    }

    if (this.milestoneTimer > 0) {
      this.milestoneTimer -= dt;
      if (this.milestoneTimer <= 0) {
        this.activeMilestoneMessage = null;
      }
    }

    // Toggle Underpass Dimming & Echo Acoustics in Segment 3 (1200 - 1800m)
    const inUnderpass = distance >= 1200 && distance < 1800;
    if (inUnderpass && !this.underpassAcousticsActive) {
      this.underpassAcousticsActive = true;
      soundManager.setUnderpassAcoustics(true);
      // Dim ambient lighting slightly for tunnel atmosphere
      if (this.engine.ambientLight) {
        this.engine.ambientLight.intensity = 0.55;
      }
      if (this.engine.directionalLight) {
        this.engine.directionalLight.intensity = 0.85;
      }
    } else if (!inUnderpass && this.underpassAcousticsActive) {
      this.underpassAcousticsActive = false;
      soundManager.setUnderpassAcoustics(false);
      // Restore vibrant daylight lighting
      if (this.engine.ambientLight) {
        this.engine.ambientLight.intensity = 1.05;
      }
      if (this.engine.directionalLight) {
        this.engine.directionalLight.intensity = 1.45;
      }
    }

    // Traffic Signal controller update (at Segment 4: 1800 - 2600m)
    if (this.trafficSignal) {
      this.trafficSignal.update(dt, playerZ, playerSpeed);
    }

    // Track full stop when speed is 0 km/h in congestion / red light
    if (playerSpeed < 0.2 && !this.isPlayerCurrentlyStopped) {
      this.isPlayerCurrentlyStopped = true;
      this.trafficStops++;
    } else if (playerSpeed > 2.0 && this.isPlayerCurrentlyStopped) {
      this.isPlayerCurrentlyStopped = false;
    }
  }

  // Called when spawning obstacles / landmarks ahead
  onSpawnSegment(furthestZ) {
    if (!this.scene) return;
    const dist = this.engine.distance;

    // 1. Panathur Underpass landmark spawn at ~1200m
    if (dist >= 1050 && dist < 1400 && !this.underpassSpawned) {
      this.underpassSpawned = true;
      const underpassGroup = createPanathurUnderpass(furthestZ + 30, 140);
      this.scene.add(underpassGroup);
      this.landmarkGroups.push(underpassGroup);
    }

    // 2. ORR Traffic Signal Junction at ~2100m
    if (dist >= 1950 && dist < 2350 && !this.trafficSignalSpawned) {
      this.trafficSignalSpawned = true;
      const signalData = createTrafficSignalJunction(furthestZ + 45);
      this.scene.add(signalData.group);
      this.landmarkGroups.push(signalData.group);

      this.trafficSignal = new TrafficSignalController(signalData, {
        onStateChange: (state) => {
          // Trigger signal HUD updates
        },
        onBonusAwarded: (pts, reason) => {
          this.trafficRuleBonus += pts;
          this.engine.score += pts;
          this.engine.callbacks.onScoreUpdate(this.engine.score);
        }
      });
      this.signalZ = signalData.stopLineZ;
    }

    // 3. RMZ Ecospace Arrival Campus at ~2850m
    if (dist >= 2750 && !this.ecospaceSpawned) {
      this.ecospaceSpawned = true;
      const ecospaceGroup = createEcospaceArrivalCampus(furthestZ + 40, this.engine);
      this.scene.add(ecospaceGroup);
      this.landmarkGroups.push(ecospaceGroup);
    }
  }

  // Get current traffic signal state for HUD
  getSignalStatus(playerZ) {
    if (!this.trafficSignal || this.trafficSignal.isGreen()) return null;

    const stopLineZ = this.trafficSignal.getStopLineWorldZ ? this.trafficSignal.getStopLineWorldZ() : this.trafficSignal.stopLineZ;
    const distToLine = Math.round(stopLineZ - playerZ);
    if (distToLine > 80 || distToLine < -10) return null;

    return {
      state: this.trafficSignal.state,
      distToLine: Math.max(0, distToLine),
      hasAwardedBonus: this.trafficSignal.hasAwardedBonus
    };
  }
}
