/**
 * Subway Surfers - Bengaluru Edition Audio Synthesizer
 * Synthesizes upbeat daylight tech-city beats, Auto-rickshaw horns,
 * BMTC bus air brakes, Filter Kaapi sips, Rupee dings, and Traffic Mama whistle.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.currentStep = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
    }
    if (this.isMuted && this.teamsAudio) {
      this.teamsAudio.pause();
    }
    return this.isMuted;
  }

  // Microsoft Teams Ringtone when scooty hits pothole ("Standup is starting!")
  playTeamsAudio() {
    if (this.isMuted) return;
    try {
      if (!this.teamsAudio) {
        this.teamsAudio = new Audio('/microsoft_teams_defaul.mp3');
      }
      this.teamsAudio.currentTime = 0;
      this.teamsAudio.volume = 0.95;
      const playPromise = this.teamsAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn('Teams ringtone play prevented:', e));
      }
    } catch (e) {
      console.warn('Teams ringtone error:', e);
    }
  }

  stopTeamsAudio() {
    if (this.teamsAudio) {
      try {
        this.teamsAudio.pause();
        this.teamsAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  // --- Sound Effects ---

  // Rupee Coin collect: sparkling high bell chime with ascending combo
  playCoin(combo = 0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freqs = [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
    const freq = freqs[combo % freqs.length];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Jump: athletic spring whoosh
  playJump() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.16);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Ather Warp super jump
  playSuperJump() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Slide under cable: road friction swoosh
  playSlide() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Lane switch: swift dodge
  playLaneSwitch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Auto Horn: classic Bangalore sharp auto-rickshaw horn "PEEP-PEEP!"
  playAutoHorn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, t + offset);

      gain.gain.setValueAtTime(0.22, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + offset);
      osc.stop(t + offset + 0.09);
    });
  }

  // BMTC Bus Air Horn: resonant deep bus horn "POOOOOON-POON!"
  playBusHorn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(340, t);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(425, t); // Major third chord

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.48);
    osc2.stop(t + 0.48);
  }

  // Scooty Horn: sharp authentic Indian commuter dual-tone electric horn "PEEEP-PEEEEP!"
  playScooterHorn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.11].forEach((offset) => {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(520, t + offset);
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(587, t + offset);

      gain.gain.setValueAtTime(0.28, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.09);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t + offset);
      osc2.start(t + offset);
      osc1.stop(t + offset + 0.09);
      osc2.stop(t + offset + 0.09);
    });
  }

  // Random Ambient Bangalore Traffic Horn
  playTrafficHorn() {
    if (this.isMuted) return;
    const roll = Math.random();
    if (roll < 0.45) {
      this.playAutoHorn();
    } else if (roll < 0.8) {
      this.playBusHorn();
    } else {
      this.playScooterHorn();
    }
  }

  // Progressive Braking Sound: hydraulic disc brake friction / tire bite
  playBrake() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High frequency brake pad friction squeak with low rumble
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.25);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // Traffic Signal Chime
  playTrafficSignalChime(isGreen = true) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isGreen ? 587.33 : 440.0; // D5 for green, A4 for amber/red
    const endFreq = isGreen ? 880.0 : 330.0;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Commuter Traffic Rule Compliance Bonus
  playTrafficBonus() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C arpeggio!
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.22, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, t + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.2);
    });
  }

  // Panathur Underpass Reverberation / Filter Toggle
  setUnderpassAcoustics(enabled) {
    if (!this.ctx) return;
    try {
      if (enabled && !this.underpassFilter) {
        this.underpassFilter = this.ctx.createBiquadFilter();
        this.underpassFilter.type = 'lowpass';
        this.underpassFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
        this.underpassFilter.Q.setValueAtTime(2.5, this.ctx.currentTime); // resonance bump for tunnel echo

        // Disconnect and route through filter
        this.masterGain.disconnect();
        this.masterGain.connect(this.underpassFilter);
        this.underpassFilter.connect(this.ctx.destination);
      } else if (!enabled && this.underpassFilter) {
        this.masterGain.disconnect();
        this.underpassFilter.disconnect();
        this.masterGain.connect(this.ctx.destination);
        this.underpassFilter = null;
      }
    } catch (e) {
      // Graceful fallback if audio graph is in transition
    }
  }

  // Auto Shield / Scooter deploy sound
  playHoverboard() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.linearRampToValueAtTime(720, t + 0.22);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Filter Kaapi Power-up Fanfare (cheerful South Indian energetic ding)
  playPowerup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.25, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.16);
    });
  }

  // Pothole stumble: splash/crunch
  playStumble() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);

    // Followed by Traffic Police whistle
    setTimeout(() => {
      this.playTrafficPoliceWhistle();
    }, 120);
  }

  // Crash / Challan Issued!
  playCrash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.45);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);

    setTimeout(() => {
      this.playTrafficPoliceWhistle();
    }, 100);
  }

  // Bangalore Traffic Police Mama Whistle: "TWEET-TWEET-TWEEEEET!"
  playTrafficPoliceWhistle() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2600, t);
    for (let i = 0; i < 7; i++) {
      osc.frequency.setValueAtTime(2600 + (i % 2 === 0 ? 250 : -250), t + i * 0.04);
    }

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Office Arrival Victory: triumphant tech punch-in fanfare!
  playVictory() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C - E - G - C - E
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);
      gain.gain.setValueAtTime(0.35, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.1 + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.6);
    });
  }

  // --- Daylight Bangalore Indie Groove ---
  startMusic() {
    if (this.isPlayingMusic) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isPlayingMusic = true;
    this.currentStep = 0;
    this.scheduleNextBeat();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    this.stopTeamsAudio();
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  scheduleNextBeat() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const bpm = 126;
    const stepDuration = 60 / bpm / 2;

    this.playBeatStep(this.currentStep);
    this.currentStep = (this.currentStep + 1) % 32;

    this.musicTimer = setTimeout(() => {
      this.scheduleNextBeat();
    }, stepDuration * 1000);
  }

  playBeatStep(step) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Kick on four-on-the-floor
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.09);
    }

    // 2. Light Tabla-style rim hits on steps 2, 6, 10, 14, 18, 22, 26, 30
    if (step % 4 === 2) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(190, t + 0.05);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.06);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.06);
    }

    // 3. Cheerful Techie Bassline (Daylight groove in D major: D -> G -> A -> Bm)
    const bassline = [
      146.83, 0, 146.83, 185.00, 146.83, 0, 220.00, 0, // D, F#, A
      196.00, 0, 196.00, 246.94, 196.00, 0, 293.66, 0, // G, B, D
      220.00, 0, 220.00, 277.18, 220.00, 0, 329.63, 0, // A, C#, E
      246.94, 0, 246.94, 293.66, 220.00, 196.00, 164.81, 146.83 // Bm turnaround
    ];

    const freq = bassline[step];
    if (freq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.12);
    }
  }
}

export const soundManager = new AudioSynthesizer();
