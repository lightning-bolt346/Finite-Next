'use client';

import { motion } from 'motion/react';
import { useEffect, useState, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Minimize2, Maximize2, Edit3, Play, Pause, X, ChevronRight, Trash2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { audioEngine } from '../../lib/audioEngine';

interface TimerOverlayProps {
  durationMinutes: number;
  breakMinutes: number;
  numBreaks: number;
  sessionType: string;
  intention: string;
  linkedName: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

interface TimerSegment {
  type: 'focus' | 'break';
  durationSeconds: number;
  indexInType: number;
  totalOfType: number;
}

export default function TimerOverlay({ 
  durationMinutes, 
  breakMinutes, 
  numBreaks, 
  sessionType, 
  intention, 
  linkedName, 
  onComplete, 
  onCancel 
}: TimerOverlayProps) {
  
  const { brainDumps, addBrainDump, removeBrainDump } = useStore();
  
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Brain dump floating window state
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  
  // Build the list of segments (Focus alternating with Break)
  const segments = useMemo(() => {
    const list: TimerSegment[] = [];
    if (numBreaks === 0 || breakMinutes === 0) {
      list.push({ 
        type: 'focus', 
        durationSeconds: durationMinutes * 60, 
        indexInType: 1, 
        totalOfType: 1 
      });
    } else {
      const parts = numBreaks + 1;
      const baseFocusSeconds = Math.floor((durationMinutes * 60) / parts);
      
      for (let i = 1; i <= parts; i++) {
        list.push({
          type: 'focus',
          durationSeconds: baseFocusSeconds,
          indexInType: i,
          totalOfType: parts
        });
        
        if (i < parts) {
          list.push({
            type: 'break',
            durationSeconds: breakMinutes * 60,
            indexInType: i,
            totalOfType: numBreaks
          });
        }
      }
    }
    return list;
  }, [durationMinutes, breakMinutes, numBreaks]);

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [segmentElapsed, setSegmentElapsed] = useState(0);
  
  // Safety guard range checking
  const currentSegment = useMemo(() => {
    return segments[currentSegmentIndex] || segments[segments.length - 1];
  }, [segments, currentSegmentIndex]);

  const totalSegmentSeconds = currentSegment.durationSeconds;
  const remainingSeconds = Math.max(0, totalSegmentSeconds - segmentElapsed);
  
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Countdown clock tick
  useEffect(() => {
    if (isPaused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();
    
    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      
      if (delta >= 1000) {
        setSegmentElapsed(prev => {
          const next = prev + Math.floor(delta / 1000);
          lastTickRef.current = now - (delta % 1000); // preserve fractional offsets
          
          if (next >= totalSegmentSeconds) {
            // Segment finished!
            audioEngine.playBell();
            
            if (currentSegmentIndex < segments.length - 1) {
              // Transition to next segment
              setCurrentSegmentIndex(prevIndex => prevIndex + 1);
              return 0;
            } else {
              // All segments finished!
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
              });
              onComplete();
              return totalSegmentSeconds;
            }
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPaused, currentSegmentIndex, totalSegmentSeconds, segments.length, onComplete]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleSkipSegment = () => {
    audioEngine.playBell();
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
      setSegmentElapsed(0);
    } else {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onComplete();
    }
  };

  const handleAddBrainDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainDumpText.trim()) return;
    addBrainDump({
      id: crypto.randomUUID(),
      text: brainDumpText.trim(),
      createdAt: Date.now()
    });
    setBrainDumpText('');
  };

  const isWarning = currentSegment.type === 'focus' && remainingSeconds <= 60 && !isPaused;
  const progress = Math.max(0, remainingSeconds / totalSegmentSeconds);
  
  const mins = Math.max(0, Math.floor(remainingSeconds / 60));
  const secs = Math.max(0, remainingSeconds % 60);

  // Minimized bubble widget for multitasking support
  if (isMinimized) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed bottom-6 right-6 z-[100] bg-surface-1/95 border border-border shadow-2 rounded-2xl p-4 pr-16 flex items-center gap-4 cursor-pointer hover:border-accent/40 transition-all backdrop-blur-md max-w-sm select-none"
        onClick={(e) => {
           const target = e.target as HTMLElement;
           if (!target.closest('button')) {
               setIsMinimized(false);
           }
        }}
      >
         <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="20" fill="none" stroke="var(--color-surface-2)" strokeWidth="3" />
                <circle cx="50%" cy="50%" r="20" fill="none" stroke={currentSegment.type === 'break' ? 'var(--color-success)' : 'var(--color-accent)'} strokeWidth="3" strokeDasharray={20*2*Math.PI} strokeDashoffset={(20*2*Math.PI) - progress*(20*2*Math.PI)} className="transition-all duration-1000 ease-linear" />
             </svg>
             <span className="text-[10px] font-mono font-bold text-text-primary z-10">{mins}:{String(secs).padStart(2,'0')}</span>
         </div>
         
         <div className="flex flex-col gap-0.5 min-w-0 pr-2">
            <span className="text-sm font-bold text-text-primary leading-tight truncate">{intention || sessionType}</span>
            <span className="text-xs text-text-muted leading-tight">
              {currentSegment.type === 'break' ? `Break (${currentSegment.indexInType}/${currentSegment.totalOfType})` : `Focus (${currentSegment.indexInType}/${currentSegment.totalOfType})`}
            </span>
         </div>
         
         <button 
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }} 
            className="absolute right-4 w-9 h-12 bg-surface-2 hover:bg-surface-3 rounded-full flex items-center justify-center text-text-primary hover:text-accent transition-all cursor-pointer shadow-sm border border-border/40 hover:scale-105"
            title={isPaused ? 'Resume' : 'Pause'}
         >
            {isPaused ? <Play size={12} className="fill-current text-text-primary" /> : <Pause size={12} className="fill-current text-text-primary" />}
         </button>
         
         <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }} 
            className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-surface-1 border border-border shadow-md rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:scale-110 transition-all cursor-pointer"
            title="Expand"
         >
            <Maximize2 size={12} />
         </button>
      </motion.div>
    );
  }

  const circleRadius = 135;
  const circumference = circleRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-1000 ${
        currentSegment.type === 'break' 
          ? 'bg-gradient-to-b from-success/5 to-bg/98' 
          : 'bg-gradient-to-b from-accent/5 via-bg/99 to-bg/98'
      } backdrop-blur-xl`}
    >
      {/* Top Banner & Control Rail */}
      <button 
        onClick={() => setIsMinimized(true)} 
        className="absolute top-8 right-8 text-text-muted hover:text-text-primary p-3 bg-surface-1 border border-border rounded-xl transition-all shadow-1 hover:scale-105"
        title="Minimize to Widget"
      >
         <Minimize2 size={20} />
      </button>

      <div className="absolute top-12 text-center flex flex-col items-center select-none">
        <span className="text-text-muted text-[11px] font-bold tracking-widest uppercase mb-2">
          {sessionType}
        </span>
        
        {/* Segment Steps Progression Dots */}
        <div className="flex items-center gap-1.5 mt-1 bg-surface-2/40 px-3 py-1.5 rounded-full border border-border/40">
           {segments.map((seg, idx) => {
             const isCurrent = idx === currentSegmentIndex;
             const isPassed = idx < currentSegmentIndex;
             return (
               <div 
                 key={idx} 
                 className={`h-2.5 rounded-full transition-all duration-500 ${
                   isCurrent 
                     ? (seg.type === 'break' ? 'w-6 bg-success' : 'w-6 bg-accent') 
                     : (isPassed ? 'w-2.5 bg-text-muted/65' : 'w-2.5 bg-surface-3')
                 }`}
                 title={`${seg.type === 'break' ? 'Break' : 'Focus'} Block ${seg.indexInType}/${seg.totalOfType}`}
               />
             );
           })}
        </div>
      </div>

      {/* Main Clock Circle Indicator */}
      <div className="relative flex flex-col items-center justify-center mb-6 w-[340px] h-[340px]">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
           <circle
             cx="50%" cy="50%" r={circleRadius}
             fill="none"
             stroke="var(--color-surface-2)"
             strokeWidth="3.5"
             className="opacity-40"
           />
           <circle
             cx="50%" cy="50%" r={circleRadius}
             fill="none"
             stroke={
               currentSegment.type === 'break' 
                 ? 'var(--color-success)' 
                 : (isWarning ? 'var(--color-warning)' : 'var(--color-accent)')
             }
             strokeWidth="4"
             strokeDasharray={circumference}
             strokeDashoffset={strokeDashoffset}
             className="transition-all duration-1000 ease-linear"
             strokeLinecap="round"
           />
        </svg>

        <div className="text-center z-10 select-none">
          {/* Action description inside circle */}
          <span className={`text-[10px] font-extrabold tracking-widest uppercase block mb-1 ${
            currentSegment.type === 'break' ? 'text-success animate-pulse' : 'text-accent'
          }`}>
            {currentSegment.type === 'break' ? 'Rest in Progress' : `Session Sprint ${currentSegment.indexInType}/${currentSegment.totalOfType}`}
          </span>
          
          <div 
            className={`text-[84px] font-mono leading-none tracking-[0.03em] font-medium text-text-primary ${
              !isPaused && isWarning ? 'animate-pulse text-warning' : ''
            } ${isPaused ? 'opacity-40' : ''}`} 
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          
          <span className="text-[11px] text-text-muted font-bold block mt-3 font-mono">
            {isPaused ? 'Paused' : `${currentSegment.type === 'break' ? 'Relax & Breathe' : 'Distraction-Free Focus'}`}
          </span>
        </div>
      </div>

      {/* Linked Task Context Header */}
      <div className="text-center max-w-lg px-6 mb-12 select-none">
        {linkedName && (
           <h3 className="text-xs font-bold text-text-muted mb-2 tracking-wider uppercase">Linked task</h3>
        )}
        {linkedName && (
           <p className="text-sm font-semibold text-text-secondary bg-surface-2/30 px-3 py-1.5 rounded-lg border border-border/40 inline-block mb-3 max-w-md truncate">{linkedName}</p>
        )}
        {intention && (
           <p className="text-lg font-bold text-text-primary leading-snug tracking-tight">“ {intention} ”</p>
        )}
      </div>

      {/* Floating Brain Dump Panel */}
      {showBrainDump && (
          <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.95 }} 
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="absolute left-8 bottom-8 w-[350px] bg-surface-1 border border-border p-5 rounded-2xl shadow-2 max-h-[80vh] flex flex-col z-[110]"
          >
             <div className="flex justify-between items-center mb-3 flex-shrink-0">
               <div>
                 <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Brain Dump Compartment</h4>
                 <p className="text-[10px] text-text-muted">Empty distractions immediately to focus better.</p>
               </div>
               <button onClick={() => setShowBrainDump(false)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                 <X size={14} />
               </button>
             </div>
             
             <form onSubmit={handleAddBrainDump} className="flex flex-col gap-2 mb-4 flex-shrink-0">
               <textarea 
                 value={brainDumpText}
                 onChange={e => setBrainDumpText(e.target.value)}
                 placeholder="Drop any distracting thought popping up (e.g., 'Check mail', 'Buy groceries')..."
                 className="w-full h-24 bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-primary placeholder-text-muted/70 focus:outline-none focus:border-accent resize-none shadow-inner"
               />
               <button 
                 type="submit" 
                 disabled={!brainDumpText.trim()}
                 className="w-full py-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-lg text-xs font-bold text-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
               >
                 Unload Distraction
               </button>
             </form>
             
             {/* Saved distraction logger right inside screen */}
             <div className="border-t border-border/60 pt-3 flex-1 overflow-y-auto">
               <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest block mb-1.5">Captured thoughts ({brainDumps?.length || 0})</span>
               <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                 {brainDumps?.map((dump) => (
                   <div key={dump.id} className="flex justify-between items-start group bg-surface-2/40 border border-border/40 rounded-lg px-2.5 py-2 gap-2 text-[11px] hover:border-border transition-colors">
                     <span className="text-text-secondary leading-normal break-words flex-1 font-medium">{dump.text}</span>
                     <button onClick={() => removeBrainDump(dump.id)} className="p-1 text-text-muted hover:text-danger rounded transition-colors" title="Delete thought">
                       <Trash2 size={12} />
                     </button>
                   </div>
                 ))}
                 {(!brainDumps || brainDumps.length === 0) && (
                   <span className="text-xs text-text-muted italic block py-4 text-center">Your mind is perfectly clear.</span>
                 )}
               </div>
             </div>
          </motion.div>
      )}

      {/* Control Actions Panel */}
      <div className={`absolute bottom-16 flex items-center gap-6 transition-transform ${showBrainDump ? 'translate-x-12' : ''} select-none`}>
        {/* Toggle Brain Dump Button */}
        <button 
          onClick={() => setShowBrainDump(!showBrainDump)} 
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-105 shadow-sm cursor-pointer ${
            showBrainDump 
              ? 'bg-accent/15 border-accent text-accent' 
              : 'bg-surface-1 border-border text-text-muted hover:text-text-primary hover:bg-surface-2'
          }`} 
          title="Brain Dump"
        >
          <Edit3 size={16} />
        </button>
        
        {/* Terminate Early */}
        <button 
          onClick={onCancel} 
          className="text-xs uppercase tracking-widest font-extrabold text-text-muted hover:text-danger hover:underline transition-colors px-4 py-3 cursor-pointer"
        >
          Absolve Early
        </button>
        
        {/* Play / Break Controller */}
        <button 
          onClick={togglePause} 
          className="px-8 py-3.5 rounded-full text-xs uppercase tracking-widest font-extrabold bg-surface-1 text-text-primary border border-border/80 hover:bg-surface-2 transition-all shadow-md flex items-center justify-center min-w-[160px] hover:scale-105 cursor-pointer active:scale-95"
        >
          {isPaused ? <Play size={12} className="mr-2 fill-current" /> : <Pause size={12} className="mr-2 fill-current" />}
          {isPaused ? 'Resume Loop' : 'Freeze Time'}
        </button>
        
        {/* Skip Sprint / Segment */}
        <button 
          onClick={handleSkipSegment} 
          className="text-xs uppercase tracking-widest font-extrabold text-text-muted hover:text-text-primary hover:underline transition-colors px-4 py-3 cursor-pointer flex items-center gap-1"
          title="Skip to Next Segment"
        >
          Skip segment <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}
