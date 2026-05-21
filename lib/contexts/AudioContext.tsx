'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { audioEngine, SOUND_TRACKS } from '../audioEngine';

interface ActiveTrack {
  id: string;
  volume: number;
}

interface AudioContextType {
  activeTracks: ActiveTrack[];
  toggleTrack: (id: string) => void;
  setTrackVolume: (id: string, volume: number) => void;
  stopAll: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [activeTracks, setActiveTracks] = useState<ActiveTrack[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('finiteSounds');
      if (stored) {
        const parsed = JSON.parse(stored);
        setActiveTracks(parsed);
        // We won't auto-play on load as browsers block it until user interaction
      }
    } catch(e) {}
  }, []);

  const saveTracks = (tracks: ActiveTrack[]) => {
    setActiveTracks(tracks);
    localStorage.setItem('finiteSounds', JSON.stringify(tracks));
  };

  const toggleTrack = (id: string) => {
    audioEngine.init();
    const existing = activeTracks.find(t => t.id === id);
    if (existing) {
      audioEngine.stop(id);
      saveTracks(activeTracks.filter(t => t.id !== id));
    } else {
      const newTracks = [...activeTracks, { id, volume: 0.5 }];
      saveTracks(newTracks);
      audioEngine.play(id, 0.5);
    }
  };

  const setTrackVolume = (id: string, volume: number) => {
    audioEngine.setVolume(id, volume);
    saveTracks(activeTracks.map(t => t.id === id ? { ...t, volume } : t));
  };

  const stopAll = () => {
    activeTracks.forEach(t => audioEngine.stop(t.id));
    saveTracks([]);
  };

  return (
    <AudioContext.Provider value={{ activeTracks, toggleTrack, setTrackVolume, stopAll }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
