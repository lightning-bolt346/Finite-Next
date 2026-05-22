'use client';

import { useState, useRef } from 'react';
import { useAudio } from '../../lib/contexts/AudioContext';
import { SOUND_TRACKS } from '../../lib/audioEngine';
import { useStore } from '../../lib/store';
import { 
  Music, Volume2, X, Zap, Coffee, Flame, Activity, Headphones, 
  TreePine, Waves, Moon, Book, Wind, CircleDot 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const IconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
  'circle-dot': CircleDot,
};

export default function MiniSoundPlayer() {
  const { activeTracks, toggleTrack, setTrackVolume } = useAudio();
  const [isOpen, setIsOpen] = useState(false);
  const hasDraggedRef = useRef(false);
  const theme = useStore((state) => state.theme);
  const isThemeLight = theme === 'light' || theme === 'sepia' || theme === 'lavender' || theme === 'sage';

  if (activeTracks.length === 0) return null;

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => {
        hasDraggedRef.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 100);
      }}
      className="fixed bottom-6 right-24 z-50 select-none"
      title="Drag anywhere to reposition the volume controller!"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            onPointerDown={(e) => e.stopPropagation()} // Stop bubbling so clicking/dragging sliders doesn't drag the main button
            className={`absolute bottom-16 right-0 mb-2 w-72 border rounded-2xl p-5 shadow-2xl transition-all duration-300 font-sans backdrop-blur-md ${
              isThemeLight 
                ? 'bg-white/95 border-stone-200 text-zinc-900 shadow-stone-300/30' 
                : 'bg-zinc-950/95 border-zinc-850 text-white shadow-black/70'
            }`}
          >
             <div className="flex justify-between items-center mb-4">
                <span className={`text-xs font-extrabold uppercase tracking-wide flex items-center gap-2 ${
                  isThemeLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}><Music size={13} className="text-accent" /> Background Audio</span>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)} 
                  className={`cursor-pointer transition-colors p-1 rounded-full hover:bg-surface-3 ${
                    isThemeLight ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <X size={14} />
                </button>
             </div>
             
             <div className="space-y-4 max-h-64 overflow-y-auto pr-1 scrollbar-none">
                {activeTracks.map(active => {
                   const track = SOUND_TRACKS.find(t => t.id === active.id);
                   if (!track) return null;
                   const TrackIcon = IconMap[track.icon] || Music;
                   return (
                     <div key={active.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md ${
                               isThemeLight ? 'bg-stone-100 text-zinc-650' : 'bg-zinc-900 text-zinc-300'
                             }`}>
                               <TrackIcon size={12} />
                             </span>
                             <span className={`text-xs font-bold truncate max-w-[120px] ${
                               isThemeLight ? 'text-zinc-800' : 'text-zinc-250'
                             }`}>{track.name}</span>
                           </div>
                           <span className={`text-[10px] font-mono font-medium ${isThemeLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                             {Math.round(active.volume * 100)}%
                           </span>
                        </div>
                        
                        <div className="flex items-center gap-2.5">
                           <input 
                             type="range" 
                             min="0" 
                             max="1" 
                             step="0.05" 
                             value={active.volume}
                             onChange={(e) => setTrackVolume(active.id, parseFloat(e.target.value))}
                             className="w-full h-1 bg-surface-3 rounded-full appearance-none accent-accent cursor-pointer"
                           />
                           <button
                             type="button"
                             onClick={() => toggleTrack(active.id)}
                             title="Mute Track"
                             className={`text-[10px] p-1 rounded-md transition-colors ${
                               isThemeLight ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50' : 'text-zinc-500 hover:text-red-400 hover:bg-red-950/30'
                             }`}
                           >
                             <X size={11} />
                           </button>
                        </div>
                     </div>
                   );
                })}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        type="button"
        onClick={(e) => {
          if (hasDraggedRef.current) return;
          setIsOpen(!isOpen);
        }}
        className={`w-12 h-12 border rounded-full shadow-2xl flex items-center justify-center text-accent transition-all relative cursor-move active:cursor-grabbing hover:scale-105 active:scale-95 ${
          isThemeLight 
            ? 'bg-white border-stone-200 hover:bg-stone-50 hover:border-accent/30 shadow-stone-300/40' 
            : 'bg-zinc-950 border-accent/40 hover:bg-zinc-900'
        }`}
      >
        <Volume2 size={18} />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] items-center justify-center flex rounded-full font-bold shadow-md animate-pulse">
          {activeTracks.length}
        </span>
      </button>
    </motion.div>
  );
}
