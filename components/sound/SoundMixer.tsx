'use client';

import { useAudio } from '../../lib/contexts/AudioContext';
import { SOUND_TRACKS } from '../../lib/audioEngine';
import { VolumeX, Zap, Coffee, Flame, Activity, Headphones, TreePine, Waves, Music, Moon, Book, Wind, CircleDot } from 'lucide-react';
import React from 'react';

const IconMap: Record<string, React.ElementType> = {
  'zap': Zap,
  'coffee': Coffee,
  'flame': Flame,
  'activity': Activity,
  'headphones': Headphones,
  'tree-pine': TreePine,
  'waves': Waves,
  'music': Music,
  'moon': Moon,
  'book': Book,
  'wind': Wind,
  'circle-dot': CircleDot
};

export default function SoundMixer() {
  const { activeTracks, toggleTrack, setTrackVolume } = useAudio();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary tracking-wider uppercase mb-3">Soundscape</h3>
      
      {/* Active Mixer */}
      {activeTracks.length > 0 && (
        <div className="bg-surface-2 p-4 rounded-xl space-y-3 mb-6">
          {activeTracks.map(active => {
            const track = SOUND_TRACKS.find(t => t.id === active.id);
            if (!track) return null;
            const Icon = IconMap[track.icon] || Music;
            return (
              <div key={active.id} className="flex items-center gap-3">
                <span className="text-accent"><Icon size={20} /></span>
                <span className="flex-1 text-sm font-medium text-text-primary truncate">{track.name}</span>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={active.volume}
                  onChange={(e) => setTrackVolume(active.id, parseFloat(e.target.value))}
                  className="w-24 accent-accent"
                />
                <button onClick={() => toggleTrack(active.id)} className="text-text-muted hover:text-danger p-1">
                  <VolumeX size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Sounds */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {SOUND_TRACKS.map(track => {
          const isActive = activeTracks.some(t => t.id === track.id);
          const Icon = IconMap[track.icon] || Music;
          return (
            <button 
              key={track.id}
              onClick={() => toggleTrack(track.id)}
              className={`p-3 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${
                isActive 
                  ? 'bg-accent-soft border-accent text-accent shadow-[0_0_15px_var(--color-accent-soft)]' 
                  : 'bg-surface-1 border-border text-text-muted hover:bg-surface-2 hover:border-text-muted'
              }`}
            >
              <span className="text-xl"><Icon size={16} /></span>
              <span className="truncate">{track.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
}
