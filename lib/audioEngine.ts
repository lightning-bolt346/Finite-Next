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

  async play(trackId: string, volume: number = 0.5) {
    const ctx = this.ensureContext();
    
    // Create gain node if not exists
    if (!this.nodes.has(trackId)) {
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // Start at 0 for fade in
        gainNode.connect(ctx.destination);
        this.nodes.set(trackId, { source: null, gain: gainNode, volume });
    }
    
    const nodeData = this.nodes.get(trackId)!;
    nodeData.volume = volume;
    
    if (nodeData.source) {
       // Already playing, just adjust volume
       nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
       return;
    }

    if (trackId === 'binaural') {
        // Binaural beat: 40Hz difference 
        // e.g. Left 200Hz, Right 240Hz
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        
        const merger = ctx.createChannelMerger(2);
        oscL.frequency.value = 200;
        oscR.frequency.value = 240;
        
        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        
        merger.connect(nodeData.gain);
        
        oscL.start();
        oscR.start();
        
        // We'll store the merger/oscillators in a wrapper if needed, 
        // but for simplicity we can just attach stop() to one of them
        const customSource: any = {
           stop: () => { oscL.stop(); oscR.stop(); merger.disconnect(); }
        };
        nodeData.source = customSource as any;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
    } else {
        const buffer = await this.fetchOrSynthBuffer(trackId);
        if (!buffer) return; // Silent fail if fetch failed
        
        if (nodeData.source) return; // In case play was called twice while fetching
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(nodeData.gain);
        source.start();
        
        nodeData.source = source;
        nodeData.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
    }
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
