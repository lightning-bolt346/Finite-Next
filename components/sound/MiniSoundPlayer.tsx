'use client';

import { useState } from 'react';
import { useAudio } from '../../lib/contexts/AudioContext';
import { SOUND_TRACKS } from '../../lib/audioEngine';
import { Music, Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MiniSoundPlayer() {
  const { activeTracks, toggleTrack, setTrackVolume } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  if (activeTracks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95, pointerEvents: 'none' }}
            className="absolute bottom-16 right-0 mb-2 w-64 bg-surface-1 border border-border rounded-2xl shadow-2 p-4"
          >
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2"><Music size={14}/> Background</span>
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
             </div>
             <div className="space-y-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {activeTracks.map(active => {
                  const track = SOUND_TRACKS.find(t => t.id === active.id);
                  if (!track) return null;
                  return (
                    <div key={active.id} className="flex items-center gap-2">
                       <span className="text-lg leading-none">{track.icon}</span>
                       <div className="flex-1">
                          <div className="text-xs font-medium text-text-primary truncate">{track.name}</div>
                          <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={active.volume}
                            onChange={(e) => setTrackVolume(active.id, parseFloat(e.target.value))}
                            className="w-full accent-accent h-1 bg-surface-3 rounded-full appearance-none"
                          />
                       </div>
                    </div>
                  );
                })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-surface-1 border border-accent/30 rounded-full shadow-2 flex items-center justify-center text-accent hover:bg-accent hover:text-bg transition-colors relative"
      >
        <Volume2 size={20} />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] items-center justify-center flex rounded-full font-bold shadow-1">
          {activeTracks.length}
        </span>
      </button>
    </div>
  );
}
