/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ambient.ts — synthesized ambient rain via Web Audio.
 * Filtered looping noise with a slow swell LFO. No audio files required,
 * everything is generated on-device.
 */

let ctx: AudioContext | null = null;
let rainNodes: { src: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null;

export function isRainPlaying(): boolean {
  return rainNodes !== null;
}

export function startRain(): void {
  if (rainNodes) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();

    // 3-second pink-ish noise loop
    const len = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        // simple pink noise approximation
        b0 = 0.997 * b0 + 0.029 * white;
        b1 = 0.985 * b1 + 0.032 * white;
        b2 = 0.95 * b2 + 0.048 * white;
        data[i] = (b0 + b1 + b2 + white * 0.05) * 0.35;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    // Rain timbre: soften the hiss
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1100;
    lowpass.Q.value = 0.6;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 250;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    // Slow swell so it breathes like real weather
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    src.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);

    src.start();
    lfo.start();
    rainNodes = { src, gain, lfo };
  } catch (e) {
    console.warn('Ambient rain failed to start:', e);
  }
}

export function stopRain(): void {
  if (!rainNodes || !ctx) return;
  try {
    const { src, gain, lfo } = rainNodes;
    // gentle fade out
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    setTimeout(() => {
      try { src.stop(); lfo.stop(); } catch { /* already stopped */ }
    }, 900);
  } catch { /* noop */ }
  rainNodes = null;
}

// ---------------- Fireplace ----------------
let fireNodes: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
let crackleTimer: ReturnType<typeof setTimeout> | null = null;

export function isFirePlaying(): boolean {
  return fireNodes !== null;
}

function scheduleCrackle() {
  if (!ctx || !fireNodes) return;
  // a short filtered noise burst = one crackle
  try {
    const dur = 0.03 + Math.random() * 0.06;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900 + Math.random() * 2600;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.value = 0.03 + Math.random() * 0.05;
    s.connect(bp); bp.connect(g); g.connect(ctx.destination);
    s.start();
  } catch { /* noop */ }
  crackleTimer = setTimeout(scheduleCrackle, 120 + Math.random() * 500);
}

export function startFire(): void {
  if (fireNodes) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();

    // brown-noise ember base
    const len = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let chn = 0; chn < 2; chn++) {
      const data = buffer.getChannelData(chn);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.0;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = 0.045;
    src.connect(lowpass); lowpass.connect(gain); gain.connect(ctx.destination);
    src.start();
    fireNodes = { src, gain };
    scheduleCrackle();
  } catch (e) {
    console.warn('Fireplace failed to start:', e);
  }
}

export function stopFire(): void {
  if (crackleTimer) { clearTimeout(crackleTimer); crackleTimer = null; }
  if (!fireNodes || !ctx) return;
  try {
    const { src, gain } = fireNodes;
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    setTimeout(() => { try { src.stop(); } catch { /* stopped */ } }, 900);
  } catch { /* noop */ }
  fireNodes = null;
}

export function stopAllAmbient(): void {
  stopRain();
  stopFire();
}
