// Sound for the backlight lab. Everything is synthesised with the Web Audio API: no files,
// no samples. A slow pad of detuned sines and triangles through a lowpass, a feedback-delay
// room, a faint band of air noise, and glass pings with inharmonic partials.
// The light position drives the filter and the upper voices, so the sound moves as slowly
// as the light does.

const VOLUME = 0.12;
// Open fifths on A, with an added ninth. The two upper voices fade in as the light rises.
const PAD = [55, 82.41, 110, 164.81, 246.94];
const BRIGHT = [277.18, 329.63];
// A major pentatonic, two octaves up, for the pings.
export const PING_NOTES = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77];
// Partials of a free glass bar: 1, 2.756, 5.404.
const PARTIALS = [[1, 1, 3.6], [2.756, 0.32, 1.6], [5.404, 0.12, 0.7]];

/** Builds the whole graph on any BaseAudioContext, so the same code runs offline for timing. */
export function buildGraph(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Room: two cross-fed delays with a lowpass in the loop.
  const roomIn = ctx.createGain(), wet = ctx.createGain();
  wet.gain.value = 0.55;
  const d1 = ctx.createDelay(2), d2 = ctx.createDelay(2), f1 = ctx.createGain(), f2 = ctx.createGain(), damp = ctx.createBiquadFilter();
  d1.delayTime.value = 0.41; d2.delayTime.value = 0.67; f1.gain.value = 0.46; f2.gain.value = 0.42;
  damp.type = 'lowpass'; damp.frequency.value = 2200;
  roomIn.connect(d1); roomIn.connect(d2);
  d1.connect(damp); damp.connect(f1); f1.connect(d2);
  d2.connect(f2); f2.connect(d1);
  d1.connect(wet); d2.connect(wet); wet.connect(master);
  const dry = ctx.createGain();
  dry.gain.value = 0.8;
  dry.connect(master);

  // Pad.
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.value = 500;
  lp.connect(dry); lp.connect(roomIn);
  const oscs = [];
  const voice = (f, level, i) => {
    const g = ctx.createGain();
    g.gain.value = level;
    // Breathing: a very slow LFO on each voice, at a different rate.
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 0.031 + i * 0.013;
    depth.gain.value = level * 0.35;
    lfo.connect(depth); depth.connect(g.gain);
    oscs.push(lfo);
    for (const [type, cents] of [['sine', -5], ['triangle', 6]]) {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = f; o.detune.value = cents;
      o.connect(g);
      oscs.push(o);
    }
    g.connect(lp);
    return g;
  };
  PAD.forEach((f, i) => voice(f, 0.07 / (1 + i * 0.35), i));
  const bright = BRIGHT.map((f, i) => voice(f, 0, i + PAD.length));

  // Air: looped noise through a narrow band.
  const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < n; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
  const noise = ctx.createBufferSource(), band = ctx.createBiquadFilter(), air = ctx.createGain();
  noise.buffer = buf; noise.loop = true;
  band.type = 'bandpass'; band.frequency.value = 900; band.Q.value = 1.4;
  air.gain.value = 0.012;
  noise.connect(band); band.connect(air); air.connect(roomIn);
  oscs.push(noise);
  oscs.forEach(o => o.start());

  const pingBus = ctx.createGain();
  pingBus.gain.value = 1;
  pingBus.connect(dry); pingBus.connect(roomIn);

  return {
    master,
    /** fx, fy: eased light position as viewport fractions (0..1). */
    setLight(fx, fy, t = ctx.currentTime) {
      lp.frequency.setTargetAtTime(240 * Math.pow(2, 3.2 * Math.min(1, Math.max(0, fx))), t, 0.4);
      const up = 1 - Math.min(1, Math.max(0, fy));
      bright.forEach((g, i) => g.gain.setTargetAtTime(0.022 * up * (i ? 0.7 : 1), t, 0.6));
      band.frequency.setTargetAtTime(500 + 1600 * fx, t, 0.6);
    },
    ping(freq, level = 0.05, t = ctx.currentTime) {
      for (const [ratio, amp, decay] of PARTIALS) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = freq * ratio;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level * amp, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        o.connect(g); g.connect(pingBus);
        o.start(t); o.stop(t + decay + 0.05);
      }
    },
  };
}

/** The live sound, created on the first user gesture. */
export class Sound {
  ctx = null;
  graph = null;
  on = false;
  last = 0;

  async toggle() {
    this.on = !this.on;
    if (this.on) {
      this.ctx ??= new AudioContext();
      this.graph ??= buildGraph(this.ctx);
      await this.ctx.resume();
      const t = this.ctx.currentTime;
      this.graph.master.gain.cancelScheduledValues(t);
      this.graph.master.gain.setTargetAtTime(VOLUME, t, 1.2); // about 3.5 s to 95 %
    } else if (this.ctx) {
      const t = this.ctx.currentTime;
      this.graph.master.gain.cancelScheduledValues(t);
      this.graph.master.gain.setTargetAtTime(0, t, 0.7);
      setTimeout(() => { if (!this.on) this.ctx.suspend(); }, 4000);
    }
    return this.on;
  }

  /** Called every frame; forwards to the graph ten times a second. */
  light(fx, fy) {
    if (!this.on) return;
    const now = performance.now();
    if (now - this.last < 100) return;
    this.last = now;
    this.graph.setLight(fx, fy);
  }

  ping(freq, level) { if (this.on) this.graph.ping(freq, level); }
}

/** Renders `seconds` of the graph offline, with a ping every two seconds, and times it. */
export async function benchAudio(seconds = 20) {
  const rate = 48000, ctx = new OfflineAudioContext(2, rate * seconds, rate);
  const g = buildGraph(ctx);
  g.master.gain.value = VOLUME;
  for (let s = 0; s < seconds; s += 0.1) g.setLight(0.5 + 0.4 * Math.sin(s / 5), 0.5, s);
  for (let s = 0.5; s < seconds; s += 2) g.ping(PING_NOTES[Math.floor(s) % PING_NOTES.length], 0.05, s);
  const t0 = performance.now();
  await ctx.startRendering();
  const ms = performance.now() - t0;
  return { seconds, renderMs: Math.round(ms), percentOfOneCore: +((ms / (seconds * 1000)) * 100).toFixed(2) };
}
