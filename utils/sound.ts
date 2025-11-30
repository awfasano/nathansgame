// Enhanced audio synthesizer for spy game
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playExplosion = () => {
  const ctx = initAudio();
  if (!ctx) return;

  const t = ctx.currentTime;
  
  // Create noise buffer for explosion
  const bufferSize = ctx.sampleRate * 2.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(2000, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(50, t + 1.5);
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 2);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 2.5);

  // Add multiple sub-bass booms
  [100, 80, 60].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.1);
    osc.frequency.exponentialRampToValueAtTime(20, t + 1 + i * 0.1);
    
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, t + i * 0.1);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 1 + i * 0.1);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + 2);
  });

  // Add crackle
  const crackleBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const crackleData = crackleBuffer.getChannelData(0);
  for (let i = 0; i < crackleBuffer.length; i++) {
    crackleData[i] = Math.random() > 0.98 ? (Math.random() * 2 - 1) * 0.5 : 0;
  }
  
  const crackle = ctx.createBufferSource();
  crackle.buffer = crackleBuffer;
  
  const crackleGain = ctx.createGain();
  crackleGain.gain.setValueAtTime(0.3, t + 0.5);
  crackleGain.gain.exponentialRampToValueAtTime(0.01, t + 2);
  
  crackle.connect(crackleGain);
  crackleGain.connect(ctx.destination);
  crackle.start(t + 0.3);
  crackle.stop(t + 2);
};

export const playSuccess = () => {
  const ctx = initAudio();
  if (!ctx) return;
  
  const t = ctx.currentTime;
  
  // Triumphant arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.25, t + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.6);
    
    // Add slight detune for richness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.002;
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, t + i * 0.08);
    gain2.gain.linearRampToValueAtTime(0.1, t + i * 0.08 + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.7);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + i * 0.08);
    osc2.stop(t + i * 0.08 + 0.6);
  });

  // Final chord
  setTimeout(() => {
    [523.25, 659.25, 783.99].forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    });
  }, 450);
};

export const playBeep = (pitch: number = 800) => {
  const ctx = initAudio();
  if (!ctx) return;
  
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(pitch, t);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
  
  // Add slight filter for less harshness
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
};

export const playTick = () => {
  const ctx = initAudio();
  if (!ctx) return;
  
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, t);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
};

export const playAlarm = () => {
  const ctx = initAudio();
  if (!ctx) return;
  
  const t = ctx.currentTime;
  
  // Two-tone alarm
  for (let i = 0; i < 3; i++) {
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 800;
    
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 600;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, t + i * 0.4);
    gain.gain.setValueAtTime(0.1, t + i * 0.4 + 0.15);
    gain.gain.setValueAtTime(0, t + i * 0.4 + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(t + i * 0.4);
    osc1.stop(t + i * 0.4 + 0.15);
    osc2.start(t + i * 0.4 + 0.15);
    osc2.stop(t + i * 0.4 + 0.3);
  }
};

export const playWireSnip = () => {
  const ctx = initAudio();
  if (!ctx) return;
  
  const t = ctx.currentTime;
  
  // Quick high-pitched snip
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(2000, t);
  osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
};
