'use client';

import { motion } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Minimize2, Maximize2, Edit3 } from 'lucide-react';

interface TimerOverlayProps {
  durationMinutes: number;
  sessionType: string;
  intention: string;
  linkedName: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

export default function TimerOverlay({ durationMinutes, sessionType, intention, linkedName, onComplete, onCancel }: TimerOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedSeconds, setAddedSeconds] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Break state
  const [breakElapsed, setBreakElapsed] = useState(0);
  const MAX_BREAK_SECONDS = 5 * 60; 
  
  // Brain dump
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  
  const totalSeconds = durationMinutes * 60 + addedSeconds;
  const remaining = totalSeconds - elapsed;
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());
  const pauseTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      const breakInterval = setInterval(() => {
         if (pauseTimeRef.current) {
             const bElapsed = Math.floor((Date.now() - pauseTimeRef.current) / 1000);
             setBreakElapsed(bElapsed);
             if (bElapsed >= MAX_BREAK_SECONDS) {
                 onCancel(); // auto end if break ends
             }
         }
      }, 1000);
      return () => clearInterval(breakInterval);
    }

    const update = () => {
      const now = Date.now();
      const diff = Math.floor((now - startRef.current) / 1000);
      setElapsed(diff);
      
      if (diff >= totalSeconds) {
         confetti({
           particleCount: 100,
           spread: 70,
           origin: { y: 0.6 }
         });
         onComplete();
      } else {
         rafRef.current = requestAnimationFrame(update);
      }
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [totalSeconds, onComplete, isPaused, onCancel]);

  const togglePause = () => {
    if (isPaused) {
      // Resume
      if (pauseTimeRef.current) {
        const pausedDuration = Date.now() - pauseTimeRef.current;
        startRef.current += pausedDuration;
        pauseTimeRef.current = null;
      }
      setIsPaused(false);
      setBreakElapsed(0);
    } else {
      // Pause
      pauseTimeRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const addTime = () => {
    setAddedSeconds(prev => prev + 5 * 60);
  };

  const isWarning = remaining <= 300 && !isPaused; // < 5 mins
  const progress = Math.min(1, elapsed / totalSeconds);
  
  const mins = Math.max(0, Math.floor(remaining / 60));
  const secs = Math.max(0, remaining % 60);
  
  const breakMinsLeft = Math.max(0, Math.floor((MAX_BREAK_SECONDS - breakElapsed) / 60));
  const breakSecsLeft = Math.max(0, (MAX_BREAK_SECONDS - breakElapsed) % 60);

  if (isMinimized) {
      return (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-[100] bg-surface-1 border border-border shadow-2 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-accent/50 transition-colors"
            onClick={(e) => {
               // Ignore if clicked on pause/end
               if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                   setIsMinimized(false);
               }
            }}
          >
             <div className="relative w-12 h-12 flex items-center justify-center">
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="22" fill="none" stroke="var(--color-surface-2)" strokeWidth="3" />
                    <circle cx="50%" cy="50%" r="22" fill="none" stroke={isPaused ? 'var(--color-text-muted)' : 'var(--color-accent)'} strokeWidth="3" strokeDasharray={22*2*Math.PI} strokeDashoffset={(22*2*Math.PI) - progress*(22*2*Math.PI)} className="transition-all duration-1000 ease-linear" />
                 </svg>
                 <span className="text-[10px] font-bold text-text-primary z-10">{mins}:{String(secs).padStart(2,'0')}</span>
             </div>
             <div className="flex flex-col gap-1 pr-6">
                <span className="text-sm font-bold text-text-primary">{intention || sessionType}</span>
                <span className="text-xs text-text-muted">{isPaused ? 'Break Paused' : 'Deep Work Active'}</span>
             </div>
             <button onClick={togglePause} className="absolute right-3 top-3 bottom-3 w-8 bg-surface-2 rounded-lg flex items-center justify-center text-text-primary hover:bg-surface-3 transition-colors text-xs font-bold shadow-sm">
                {isPaused ? '▶' : 'll'}
             </button>
             <button onClick={() => setIsMinimized(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-surface-1 border border-border shadow-1 rounded-full flex items-center justify-center text-text-primary hover:text-accent transition-colors">
                <Maximize2 size={14} />
             </button>
          </motion.div>
      )
  }

  const circleRadius = 140;
  const circumference = circleRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg/98 backdrop-blur-xl"
    >
      <button onClick={() => setIsMinimized(true)} className="absolute top-8 right-8 text-text-muted hover:text-text-primary p-3 bg-surface-1 border border-border rounded-xl transition-all shadow-1 hover:scale-105">
         <Minimize2 size={20} />
      </button>

      <div className="absolute top-12 text-center flex flex-col items-center">
        <span className="text-text-muted text-sm font-semibold tracking-widest uppercase mb-2">Deep Work Mode</span>
        {isPaused && (
           <span className="px-3 py-1 bg-surface-2 border border-border text-xs rounded-full text-text-primary font-bold animate-pulse">
              Break Ends In: {breakMinsLeft}:{String(breakSecsLeft).padStart(2,'0')}
           </span>
        )}
      </div>

      <div className="relative flex items-center justify-center mb-8">
        <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] -rotate-90">
           <circle
             cx="50%" cy="50%" r={circleRadius}
             fill="none"
             stroke="var(--color-surface-2)"
             strokeWidth="4"
           />
           <circle
             cx="50%" cy="50%" r={circleRadius}
             fill="none"
             stroke={isPaused ? 'var(--color-text-muted)' : (isWarning ? 'var(--color-warning)' : 'var(--color-accent)')}
             strokeWidth="4"
             strokeDasharray={circumference}
             strokeDashoffset={strokeDashoffset}
             className="transition-all duration-1000 ease-linear"
           />
        </svg>

        <div className={`text-[72px] font-mono leading-none tracking-[0.1em] text-text-primary ${!isPaused && isWarning ? 'animate-pulse text-warning' : ''} ${isPaused ? 'opacity-50' : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
      </div>

      <div className="text-center max-w-md px-6 mb-12">
        {linkedName && (
           <h3 className="text-lg font-medium text-text-muted mb-2">{linkedName}</h3>
        )}
        {intention && (
           <p className="text-xl font-bold text-text-primary mb-6">{intention}</p>
        )}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 rounded-full border border-border text-xs uppercase tracking-widest font-bold text-text-primary">
           {sessionType}
        </div>
      </div>
      
      {showBrainDump && (
          <div className="absolute left-8 bottom-8 w-[320px] bg-surface-1 border border-border p-4 rounded-xl shadow-2">
             <h4 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Brain Dump</h4>
             <textarea 
               value={brainDumpText}
               onChange={e => setBrainDumpText(e.target.value)}
               placeholder="Write distracting thoughts here..."
               className="w-full h-32 bg-surface-2 border border-border rounded-lg p-3 text-sm text-text-primary shadow-inner focus:outline-none focus:border-accent resize-none"
             />
             <button onClick={() => setShowBrainDump(false)} className="mt-3 text-xs text-text-muted font-bold hover:text-text-primary">Close</button>
          </div>
      )}

      <div className={`absolute bottom-16 flex items-center gap-4 transition-transform ${showBrainDump ? 'translate-x-12' : ''}`}>
        <button onClick={() => setShowBrainDump(!showBrainDump)} className={`px-4 py-3 rounded-full border text-sm font-bold transition-all hover:scale-105 ${showBrainDump ? 'bg-surface-2 border-accent text-accent' : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-2'}`} title="Brain Dump">
          <Edit3 size={18} />
        </button>
        <button onClick={onCancel} className="px-6 py-3 rounded-full text-sm font-bold text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors hover:-translate-y-0.5">
          End Early
        </button>
        <button 
          onClick={togglePause} 
          className="px-8 py-4 rounded-full text-sm font-bold bg-surface-2 text-text-primary border border-border hover:bg-surface-3 transition-colors shadow-1 flex items-center justify-center min-w-[120px] hover:scale-105"
        >
          {isPaused ? 'Resume' : 'Take Break'}
        </button>
        <button onClick={addTime} className="px-6 py-3 rounded-full text-sm font-bold text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors hover:-translate-y-0.5">
          +5 m
        </button>
      </div>
    </motion.div>
  );
}
