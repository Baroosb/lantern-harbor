// audio.js — every sound in Lantern Harbor is synthesized here with the
// Web Audio API: short oscillator tones with shaped gain envelopes. There
// are no audio files. The context is created lazily on the first user
// gesture (a click or a key), and every player guards on it existing, so
// the game is silent rather than broken where audio is unavailable.

let ctx = null;
let master = null;

export const SoundKit = {
  // ensure() opens the audio context; call it from a user gesture handler.
  ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  },

  // tone(freq, delay, seconds, type, volume, slideTo) plays one shaped note.
  tone(freq, delay, seconds, type = 'sine', volume = 0.3, slideTo = null) {
    if (!ctx || !master) return;
    try {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.05);
    } catch {
      // A failed note is not worth breaking the game over.
    }
  },

  // pop() — the satisfying two-note chirp of a difference found.
  pop() {
    this.tone(620, 0, 0.1, 'sine', 0.32, 880);
    this.tone(930, 0.055, 0.16, 'sine', 0.3, 1240);
    this.tone(1860, 0.055, 0.1, 'triangle', 0.1);
  },

  // miss() — a low dull thud for a wrong click.
  miss() {
    this.tone(150, 0, 0.16, 'square', 0.12, 90);
    this.tone(75, 0, 0.14, 'sine', 0.22, 55);
  },

  // hintBlip() — a soft bell that says "look over here".
  hintBlip() {
    this.tone(1174, 0, 0.22, 'sine', 0.2);
    this.tone(1568, 0.07, 0.26, 'sine', 0.14);
  },

  // tick() — the last-seconds countdown click.
  tick() {
    this.tone(1250, 0, 0.045, 'square', 0.07);
  },

  // levelClear() — a small rising arpeggio when a picture pair is finished.
  levelClear() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => this.tone(n, i * 0.09, 0.22, 'triangle', 0.24));
  },

  // winFanfare() — the harbor-master fanfare for finishing the third level.
  winFanfare() {
    const notes = [392, 523, 659, 784, 659, 784, 1046];
    notes.forEach((n, i) => this.tone(n, i * 0.11, 0.3, 'triangle', 0.26));
    this.tone(1318, notes.length * 0.11, 0.5, 'sine', 0.22);
  },

  // timeUp() — two falling notes when the clock runs out.
  timeUp() {
    this.tone(440, 0, 0.25, 'triangle', 0.24, 415);
    this.tone(415, 0.22, 0.45, 'triangle', 0.24, 311);
  },
};
