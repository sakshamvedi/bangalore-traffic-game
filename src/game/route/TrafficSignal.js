import { soundManager } from '../AudioSynthesizer.js';

/**
 * TrafficSignal.js
 * Deterministic 3-aspect Traffic Signal controller with Red/Amber/Green state machine,
 * Stop-Line detection, safe commuter compliance bonus, and queue release.
 */
export class TrafficSignalController {
  constructor(signalData, callbacks = {}) {
    this.group = signalData.group;
    this.signalHeads = signalData.signalHeads; // Array of { headGroup, redMat, amberMat, greenMat }
    this.stopLineZ = signalData.stopLineZ;

    this.onStateChange = callbacks.onStateChange || (() => {});
    this.onBonusAwarded = callbacks.onBonusAwarded || (() => {});

    // State: 'red', 'amber', 'green'
    this.state = 'red';
    this.timer = 0;
    this.redDuration = 6.5; // seconds to wait at red light
    this.amberDuration = 1.8;
    this.greenDuration = 999; // stays green once released for commute

    this.hasAwardedBonus = false;
    this.playerStoppedAtRed = false;
    this.hasTriggeredChallan = false;

    this.updateLights();
  }

  getStopLineWorldZ() {
    return this.group ? this.group.position.z - 6 : this.stopLineZ;
  }

  updateLights() {
    this.signalHeads.forEach(({ redMat, amberMat, greenMat }) => {
      if (this.state === 'red') {
        redMat.emissive.setHex(0xff0000);
        redMat.emissiveIntensity = 2.5;
        amberMat.emissive.setHex(0x000000);
        amberMat.emissiveIntensity = 0;
        greenMat.emissive.setHex(0x000000);
        greenMat.emissiveIntensity = 0;
      } else if (this.state === 'amber') {
        redMat.emissive.setHex(0x000000);
        redMat.emissiveIntensity = 0;
        amberMat.emissive.setHex(0xf59e0b);
        amberMat.emissiveIntensity = 2.2;
        greenMat.emissive.setHex(0x000000);
        greenMat.emissiveIntensity = 0;
      } else if (this.state === 'green') {
        redMat.emissive.setHex(0x000000);
        redMat.emissiveIntensity = 0;
        amberMat.emissive.setHex(0x000000);
        amberMat.emissiveIntensity = 0;
        greenMat.emissive.setHex(0x10b981);
        greenMat.emissiveIntensity = 2.5;
      }
    });

    this.onStateChange(this.state);
  }

  update(dt, playerZ, playerSpeed) {
    if (this.state === 'green') return;

    this.timer += dt;

    // Check if player stopped safely behind the stop line at red light
    const currentStopLineZ = this.getStopLineWorldZ();
    const distToStopLine = currentStopLineZ - playerZ;
    if (this.state === 'red' && distToStopLine >= -1 && distToStopLine <= 16) {
      if (playerSpeed < 1.0 && !this.hasAwardedBonus) {
        this.playerStoppedAtRed = true;
        this.hasAwardedBonus = true;
        soundManager.playTrafficBonus();
        this.onBonusAwarded(500, 'TRAFFIC RULE COMPLIANCE: RED LIGHT STOP (+500)');
      }
    }

    if (this.state === 'red') {
      // Transition to amber after timer expires or when player has stopped and waited at least 3 seconds
      if (this.timer >= this.redDuration || (this.playerStoppedAtRed && this.timer >= 3.2)) {
        this.state = 'amber';
        this.timer = 0;
        soundManager.playTrafficSignalChime(false);
        this.updateLights();
      }
    } else if (this.state === 'amber') {
      if (this.timer >= this.amberDuration) {
        this.state = 'green';
        this.timer = 0;
        soundManager.playTrafficSignalChime(true);
        this.updateLights();
      }
    }
  }

  isRed() {
    return this.state === 'red';
  }

  isAmber() {
    return this.state === 'amber';
  }

  isGreen() {
    return this.state === 'green';
  }
}
