export const SOUND_TRACKS = [
  { id: 'rain', name: 'Rain on window', icon: 'zap', url: '/api/sounds?track=rain' },
  { id: 'heavy_rain', name: 'Heavy rain + thunder', icon: 'zap', url: '/api/sounds?track=heavy_rain' },
  { id: 'cafe', name: 'Café ambient', icon: 'coffee', url: '/api/sounds?track=cafe' },
  { id: 'fireplace', name: 'Fireplace crackling', icon: 'flame', url: '/api/sounds?track=fireplace' },
  { id: 'brown_noise', name: 'Brown noise', icon: 'activity', url: '/api/sounds?track=brown_noise' },
  { id: 'white_noise', name: 'White noise', icon: 'activity', url: '/api/sounds?track=white_noise' },
  { id: 'pink_noise', name: 'Pink noise', icon: 'activity', url: '/api/sounds?track=pink_noise' },
  { id: 'binaural', name: 'Binaural focus (40Hz)', icon: 'headphones', url: '/api/sounds?track=binaural' },
  { id: 'forest', name: 'Forest morning', icon: 'tree-pine', url: '/api/sounds?track=forest' },
  { id: 'ocean', name: 'Ocean waves', icon: 'waves', url: '/api/sounds?track=ocean' },
  { id: 'lofi', name: 'Lo-fi hip-hop', icon: 'music', url: '/api/sounds?track=lofi' },
  { id: 'space', name: 'Deep space drone', icon: 'moon', url: '/api/sounds?track=space' },
  { id: 'library', name: 'Library silence', icon: 'book', url: '/api/sounds?track=library' },
  { id: 'chimes', name: 'Wind chimes', icon: 'wind', url: '/api/sounds?track=chimes' },
  { id: 'tibetan', name: 'Tibetan bowl', icon: 'circle-dot', url: '/api/sounds?track=tibetan' }
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private nodes: Map<string, { source: AudioBufferSourceNode | OscillatorNode | null, gain: GainNode, volume: number }> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private ensureContext() {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx!;
  }

  private synthesizeNoise(type: 'brown' | 'white' | 'pink') {
    const ctx = this.ensureContext();
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        if (type === 'brown') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // (roughly) compensate for gain
        } else if (type === 'pink') {
           // Simple pink noise approx
           let b0, b1, b2, b3, b4, b5, b6;
           b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
           b0 = 0.99886 * b0 + white * 0.0555179;
           b1 = 0.99332 * b1 + white * 0.0750759;
           b2 = 0.96900 * b2 + white * 0.1538520;
           b3 = 0.86650 * b3 + white * 0.3104856;
           b4 = 0.55000 * b4 + white * 0.5329522;
           b5 = -0.7616 * b5 - white * 0.0168980;
           output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
           output[i] *= 0.11; // (roughly) compensate for gain
           b6 = white * 0.115926;
        } else {
           output[i] = white;
        }
    }
    return buffer;
  }

  private async fetchOrSynthBuffer(trackId: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(trackId)) return this.buffers.get(trackId)!;
    
    const ctx = this.ensureContext();
    if (trackId === 'brown_noise') {
        const buf = this.synthesizeNoise('brown');
        this.buffers.set(trackId, buf);
        return buf;
    }
    if (trackId === 'white_noise') {
        const buf = this.synthesizeNoise('white');
        this.buffers.set(trackId, buf);
        return buf;
    }
    if (trackId === 'pink_noise') {
        const buf = this.synthesizeNoise('pink');
        this.buffers.set(trackId, buf);
        return buf;
    }
    
    // For binaural, we will use oscillators directly in playTrack
    if (trackId === 'binaural') return null;

    // For other tracks, normally fetch from URL
    try {
       const track = SOUND_TRACKS.find(t => t.id === trackId);
       if (!track) return null;
       const response = await fetch(track.url);
       if (!response.ok) return null;
       const arrayBuffer = await response.arrayBuffer();
       const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
       this.buffers.set(trackId, audioBuffer);
       return audioBuffer;
    } catch (e) {
       console.error("Failed to load track", trackId, e);
       return null;
    }
  }

  playBell() {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    // Resonant physical bell
    const frequencies = [440, 554.37, 659.25, 880]; // A major bell
    frequencies.forEach((f, idx) => {
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       osc.frequency.setValueAtTime(f, ctx.currentTime);
       osc.connect(gain);
       gain.connect(ctx.destination);
       
       gain.gain.setValueAtTime(0, ctx.currentTime);
       gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), ctx.currentTime + 0.05);
       gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4.0 - idx * 0.5);
       
       osc.start();
       setTimeout(() => {
          try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch(e){}
       }, 5000);
    });
  }

  private createSyntheticFireplace(ctx: AudioContext, destination: AudioNode) {
    const humOsc = ctx.createOscillator();
    const humFilter = ctx.createBiquadFilter();
    humOsc.type = 'sawtooth';
    humOsc.frequency.value = 55;
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 80;
    
    const humGain = ctx.createGain();
    humGain.gain.value = 0.4;
    
    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(destination);
    humOsc.start();
    
    let isStopped = false;
    const triggerCrackle = () => {
      if (isStopped) return;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2000 + Math.random() * 4000, ctx.currentTime);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, ctx.currentTime);
      filter.Q.value = 10;
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.05, ctx.currentTime + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01 + Math.random() * 0.04);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      osc.start();
      
      setTimeout(() => {
        try { osc.stop(); osc.disconnect(); filter.disconnect(); gain.disconnect(); } catch(e){}
      }, 100);
      
      setTimeout(triggerCrackle, 50 + Math.random() * 400);
    };
    
    triggerCrackle();
    
    return {
      stop: () => {
        isStopped = true;
        try {
          humOsc.stop();
          humOsc.disconnect();
          humFilter.disconnect();
          humGain.disconnect();
        } catch(e){}
      }
    };
  }

  private createSyntheticChimes(ctx: AudioContext, destination: AudioNode) {
    let isStopped = false;
    const triggerChime = () => {
      if (isStopped) return;
      const frequencies = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760];
      const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
      modGain.gain.setValueAtTime(20, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.07, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3 + Math.random() * 4);
      
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      
      osc.connect(gain);
      gain.connect(destination);
      
      mod.start();
      osc.start();
      
      setTimeout(() => {
        try { 
          osc.stop(); osc.disconnect(); 
          mod.stop(); mod.disconnect(); 
          modGain.disconnect(); gain.disconnect(); 
        } catch(e){}
      }, 8000);
      
      setTimeout(triggerChime, 2000 + Math.random() * 5000);
    };
    
    triggerChime();
    
    return {
      stop: () => {
        isStopped = true;
      }
    };
  }

  private createSyntheticTibetan(ctx: AudioContext, destination: AudioNode) {
    const frequencies = [144, 144.5, 288, 432, 576];
    const oscs: any[] = [];
    const gains: GainNode[] = [];
    
    frequencies.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.05 + idx * 0.02, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);
      
      const baseGain = 0.1 / (idx + 1);
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      
      osc.connect(gain);
      gain.connect(destination);
      
      lfo.start();
      osc.start();
      
      oscs.push(osc, lfo);
      gains.push(gain, lfoGain);
    });
    
    return {
      stop: () => {
        oscs.forEach(o => { try{ o.stop(); o.disconnect(); } catch(e){} });
        gains.forEach(g => g.disconnect());
      }
    };
  }

  private createSyntheticSpace(ctx: AudioContext, destination: AudioNode) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(65, ctx.currentTime);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(65.4, ctx.currentTime);
    
    filter.type = 'bandpass';
    filter.Q.value = 4.0;
    
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); 
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);
    
    osc1.connect(filter);
    osc2.connect(filter);
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.5, ctx.currentTime);
    
    filter.connect(droneGain);
    droneGain.connect(destination);
    
    osc1.start();
    osc2.start();
    lfo.start();
    
    return {
      stop: () => {
        try {
          osc1.stop(); osc1.disconnect();
          osc2.stop(); osc2.disconnect();
          lfo.stop(); lfo.disconnect();
          filter.disconnect();
          lfoGain.disconnect();
          droneGain.disconnect();
        } catch(e){}
      }
    };
  }

  private createSyntheticLofi(ctx: AudioContext, destination: AudioNode) {
    let isStopped = false;
    const chords = [
      [130.81, 195.99, 246.94, 293.66], 
      [110.00, 164.81, 220.00, 261.63], 
      [146.83, 220.00, 261.63, 311.13], 
      [116.54, 174.61, 233.08, 277.18]  
    ];
    let chordIndex = 0;
    
    const playNextChord = () => {
      if (isStopped) return;
      const notes = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;
      
      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];
      
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04 - idx*0.005, ctx.currentTime + 1.0);
        gain.gain.setValueAtTime(0.04 - idx*0.005, ctx.currentTime + 4.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 7.5);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        
        osc.start();
        oscs.push(osc);
        gains.push(gain);
      });
      
      setTimeout(() => {
        oscs.forEach(o => { try{ o.stop(); o.disconnect(); } catch(e){} });
        gains.forEach(g => g.disconnect());
      }, 8000);
      
      setTimeout(playNextChord, 7000);
    };
    
    playNextChord();
    return {
      stop: () => {
        isStopped = true;
      }
    };
  }

  private createSyntheticCafe(ctx: AudioContext, destination: AudioNode) {
    const murmur = ctx.createOscillator();
    const murmurFilter = ctx.createBiquadFilter();
    murmur.type = 'sawtooth';
    murmur.frequency.value = 110;
    murmurFilter.type = 'lowpass';
    murmurFilter.frequency.value = 150;
    
    const murmurGain = ctx.createGain();
    murmurGain.gain.setValueAtTime(0.2, ctx.currentTime);
    
    murmur.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(destination);
    murmur.start();
    
    let isStopped = false;
    const triggerClink = () => {
      if (isStopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500 + Math.random() * 2500, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(destination);
      osc.start();
      
      setTimeout(() => {
        try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch(e){}
      }, 200);
      
      setTimeout(triggerClink, 1000 + Math.random() * 5000);
    };
    
    triggerClink();
    return {
      stop: () => {
        isStopped = true;
        try {
          murmur.stop();
          murmur.disconnect();
          murmurFilter.disconnect();
          murmurGain.disconnect();
        } catch(e){}
      }
    };
  }

  private createSyntheticForest(ctx: AudioContext, destination: AudioNode) {
    const wind = this.synthesizeNoise('pink');
    const windSource = ctx.createBufferSource();
    windSource.buffer = wind;
    windSource.loop = true;
    
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(200, ctx.currentTime);
    
    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.frequency.setValueAtTime(0.05, ctx.currentTime);
    windLfoGain.gain.setValueAtTime(120, ctx.currentTime);
    
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    
    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.25, ctx.currentTime);
    
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(destination);
    
    windLfo.start();
    windSource.start();
    
    let isStopped = false;
    const triggerChirp = () => {
      if (isStopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500 + Math.random() * 800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(4500, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      
      osc.connect(gain);
      gain.connect(destination);
      osc.start();
      
      setTimeout(() => {
        try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch(e){}
      }, 300);
      
      setTimeout(triggerChirp, 1500 + Math.random() * 4000);
    };
    
    triggerChirp();
    return {
      stop: () => {
        isStopped = true;
        try {
          windSource.stop();
          windSource.disconnect();
          windFilter.disconnect();
          windLfo.stop();
          windLfo.disconnect();
          windLfoGain.disconnect();
          windGain.disconnect();
        } catch(e){}
      }
    };
  }

  private createSyntheticLibrary(ctx: AudioContext, destination: AudioNode) {
    const hum = ctx.createOscillator();
    const humFilter = ctx.createBiquadFilter();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(60, ctx.currentTime);
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(70, ctx.currentTime);
    
    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.1, ctx.currentTime);
    
    hum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(destination);
    hum.start();
    
    let isStopped = false;
    const triggerPage = () => {
      if (isStopped) return;
      const noiseBuf = this.synthesizeNoise('white');
      const source = ctx.createBufferSource();
      source.buffer = noiseBuf;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      source.start();
      
      setTimeout(() => {
        try { source.stop(); source.disconnect(); filter.disconnect(); gain.disconnect(); } catch(e){}
      }, 500);
      
      setTimeout(triggerPage, 4000 + Math.random() * 10000);
    };
    
    triggerPage();
    return {
      stop: () => {
        isStopped = true;
        try {
          hum.stop();
          hum.disconnect();
          humFilter.disconnect();
          humGain.disconnect();
        } catch(e){}
      }
    };
  }

  async play(trackId: string, volume: number = 0.5) {
    const ctx = this.ensureContext();
    
    if (!this.nodes.has(trackId)) {
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.connect(ctx.destination);
        this.nodes.set(trackId, { source: null, gain: gainNode, volume });
    }
    
    const nodeData = this.nodes.get(trackId)!;
    nodeData.volume = volume;
    
    if (nodeData.source) {
       nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
       return;
    }

    if (trackId === 'binaural') {
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);
        oscL.frequency.setValueAtTime(200, ctx.currentTime);
        oscR.frequency.setValueAtTime(240, ctx.currentTime);
        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(nodeData.gain);
        oscL.start();
        oscR.start();
        const customSource: any = { stop: () => { oscL.stop(); oscR.stop(); merger.disconnect(); } };
        nodeData.source = customSource;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'fireplace') {
        nodeData.source = this.createSyntheticFireplace(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'chimes') {
        nodeData.source = this.createSyntheticChimes(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'tibetan') {
        nodeData.source = this.createSyntheticTibetan(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'space') {
        nodeData.source = this.createSyntheticSpace(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'lofi') {
        nodeData.source = this.createSyntheticLofi(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'cafe') {
        nodeData.source = this.createSyntheticCafe(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'forest') {
        nodeData.source = this.createSyntheticForest(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'library') {
        nodeData.source = this.createSyntheticLibrary(ctx, nodeData.gain) as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }

    if (trackId === 'ocean' || trackId === 'rain' || trackId === 'heavy_rain') {
        const type = trackId === 'heavy_rain' ? 'brown' : 'pink';
        const buffer = this.buffers.get(type + '_noise') || this.synthesizeNoise(type as any);
        this.buffers.set(type + '_noise', buffer);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        
        if (trackId === 'ocean') {
           filter.frequency.setValueAtTime(800, ctx.currentTime);
           const lfo = ctx.createOscillator();
           lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
           const lfoGain = ctx.createGain();
           lfoGain.gain.setValueAtTime(600, ctx.currentTime);
           lfo.connect(lfoGain);
           lfoGain.connect(filter.frequency);
           
           const ampLfo = ctx.createOscillator();
           ampLfo.frequency.setValueAtTime(0.1, ctx.currentTime);
           const ampGain = ctx.createGain();
           ampGain.gain.setValueAtTime(0.5, ctx.currentTime);
           ampLfo.connect(ampGain);
           
           const baseGain = ctx.createGain();
           baseGain.gain.setValueAtTime(0.5, ctx.currentTime);
           source.connect(filter);
           filter.connect(baseGain);
           ampGain.connect(baseGain.gain);
           baseGain.connect(nodeData.gain);
           
           lfo.start();
           ampLfo.start();
           source.start();
           nodeData.source = { stop: () => { source.stop(); lfo.stop(); ampLfo.stop(); filter.disconnect(); } } as any;
        } else {
           filter.frequency.setValueAtTime(trackId === 'heavy_rain' ? 1200 : 2500, ctx.currentTime);
           source.connect(filter);
           filter.connect(nodeData.gain);
           source.start();
           nodeData.source = source;
        }
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
        return;
    }
    const buffer = await this.fetchOrSynthBuffer(trackId);
    if (!buffer) return;
    
    if (nodeData.source) return;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(nodeData.gain);
    source.start();
    
    nodeData.source = source;
    nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
  }

  stop(trackId: string) {
    const ctx = this.ctx;
    if (!ctx) return;
    const nodeData = this.nodes.get(trackId);
    if (!nodeData || !nodeData.source) return;
    
    // Fade out over 1.5s
    nodeData.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    
    const source = nodeData.source;
    nodeData.source = null;
    
    setTimeout(() => {
        try {
            source.stop();
        } catch (e) {}
    }, 1500);
  }

  setVolume(trackId: string, volume: number) {
    const nodeData = this.nodes.get(trackId);
    if (nodeData) {
       nodeData.volume = volume;
       if (nodeData.source && this.ctx) {
           nodeData.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
       }
    }
  }
}

export const audioEngine = new AudioEngine();

if (typeof window !== 'undefined') {
    document.addEventListener('click', () => { 
        audioEngine.init(); 
        if (audioEngine['ctx']?.state === 'suspended') {
            audioEngine['ctx'].resume();
        }
    }, { once: true });
}
