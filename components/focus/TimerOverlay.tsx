'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import { Minimize2, Maximize2, Edit3, Play, Pause, X, ChevronRight, Trash2, AlertCircle, Sun, Moon } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { saveBrainDumpToFirestore, deleteBrainDumpFromFirestore } from '../../lib/firebaseSync';

interface TimerOverlayProps {
  sessionId: string;
  durationMinutes: number;
  breakMinutes: number;
  numBreaks: number;
  sessionType: string;
  intention: string;
  linkedName: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

export default function TimerOverlay({ 
  sessionId,
  durationMinutes, 
  breakMinutes, 
  numBreaks, 
  sessionType, 
  intention, 
  linkedName, 
  onComplete, 
  onCancel 
}: TimerOverlayProps) {
  
  const brainDumps = useStore((state) => state.brainDumps);
  const addBrainDump = useStore((state) => state.addBrainDump);
  const removeBrainDumpByState = useStore((state) => state.removeBrainDump);
  const theme = useStore((state) => state.theme);
  const isPlatformDark = theme !== 'light' && theme !== 'sepia' && theme !== 'lavender' && theme !== 'sage';
  
  const removeBrainDump = (id: string) => {
    removeBrainDumpByState(id);
  };
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  
  // Custom theme toggle inside the dark room: supports pure dark and elegant light mode
  const [isDarkTheme, setIsDarkTheme] = useState(isPlatformDark);

  const hasDraggedRef = useRef(false);

  // Sync local dark room theme when platform theme changes
  useEffect(() => {
    setIsDarkTheme(isPlatformDark);
  }, [isPlatformDark]);

  // Show early termination warning sheet
  const [showEarlyExitPane, setShowEarlyExitPane] = useState(false);

  // Invoke high-accuracy wall-clock timer hook
  const {
    segments,
    currentSegmentIndex,
    currentSegment,
    currentSegmentElapsed,
    remainingSeconds,
    isPaused,
    startTimer,
    pauseTimer,
    skipSegment,
  } = useFocusTimer({
    durationMinutes,
    breakMinutes,
    numBreaks,
    onComplete,
  });

  const totalSegmentSeconds = currentSegment.durationSeconds;
  const progressRatio = totalSegmentSeconds > 0 ? (remainingSeconds / totalSegmentSeconds) : 0;
  
  const mins = Math.max(0, Math.floor(remainingSeconds / 60));
  const secs = Math.max(0, remainingSeconds % 60);

  // Keyboard Shortcuts Handler: space to pause/resume, escape for brain dump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in a textarea/input
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        if (isPaused) {
          startTimer();
        } else {
          pauseTimer();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowBrainDump(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, startTimer, pauseTimer]);

  const handleAddBrainDump = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainDumpText.trim()) return;
    
    const dumpId = crypto.randomUUID();
    const newDump = {
      id: dumpId,
      text: brainDumpText.trim(),
      createdAt: Date.now(),
    };

    // 1. Write locally
    addBrainDump(newDump);
    setBrainDumpText('');

    // 2. Write to Firestore globally (not nested in sessionId!)
    try {
      await saveBrainDumpToFirestore('', newDump);
    } catch (err) {
      console.warn('Silent local dump fallback cached: ', err);
    }
  };

  const handleDeleteBrainDump = async (dumpId: string) => {
    removeBrainDump(dumpId);
    try {
       await deleteBrainDumpFromFirestore('', dumpId);
    } catch (err) {
       console.error(err);
    }
  };

  const handleEndSessionClick = () => {
    pauseTimer();
    setShowEarlyExitPane(true);
  };

  const handleResumeClick = () => {
    setShowEarlyExitPane(false);
    startTimer();
  };

  const isActiveFocus = currentSegment.type === 'focus';

  // Minimized bubble widget that is fully draggable to avoid overlapping!
  if (isMinimized) {
    const isThemeLight = theme === 'light' || theme === 'sepia' || theme === 'lavender' || theme === 'sage';
    return (
      <motion.div 
        key="minimized-timer-overlay"
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        drag
        dragMomentum={false}
        dragElastic={0.15}
        onDragStart={() => {
          hasDraggedRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            hasDraggedRef.current = false;
          }, 100);
        }}
        onClick={(e) => {
          if (hasDraggedRef.current) return;
          const target = e.target as HTMLElement;
          if (!target.closest('button')) {
             setIsMinimized(false);
          }
        }}
        className={`fixed bottom-6 right-6 z-[100] border shadow-2xl rounded-2xl p-4 pr-16 flex items-center gap-4 cursor-move active:cursor-grabbing hover:border-accent/40 hover:shadow-accent/5 transition-all backdrop-blur-md max-w-sm select-none ${
          isThemeLight 
            ? 'bg-white border-stone-200 text-zinc-900 shadow-stone-200/50' 
            : 'bg-zinc-950 border-zinc-800 text-white shadow-black/80'
        }`}
        title="Drag anywhere on your screen to move player!"
      >
         <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="20" fill="none" stroke={isThemeLight ? '#e5e7eb' : '#27272a'} strokeWidth="3" />
                <circle cx="50%" cy="50%" r="20" fill="none" stroke={currentSegment.type === 'break' ? '#10b981' : 'var(--color-accent)'} strokeWidth="3" strokeDasharray={20*2*Math.PI} strokeDashoffset={(20*2*Math.PI) - progressRatio*(20*2*Math.PI)} className="transition-all duration-1000 ease-linear" />
             </svg>
             <span className={`text-[10px] font-mono font-bold z-10 ${isThemeLight ? 'text-zinc-900' : 'text-white'}`}>{mins}:{String(secs).padStart(2,'0')}</span>
         </div>
         
         <div className="flex flex-col gap-0.5 min-w-0 pr-2 pointer-events-none">
            <span className={`text-sm font-bold leading-tight truncate ${isThemeLight ? 'text-zinc-900' : 'text-white'}`}>{intention || sessionType}</span>
            <span className={`text-xs leading-tight ${isThemeLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {currentSegment.type === 'break' ? `Break (${currentSegment.indexInType}/${currentSegment.totalOfType})` : `Focus (${currentSegment.indexInType}/${currentSegment.totalOfType})`}
            </span>
         </div>
         
         <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isPaused) startTimer(); else pauseTimer();
            }} 
            className={`absolute right-4 w-9 h-9 border rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 ${
              isThemeLight 
                ? 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-zinc-900 hover:text-accent' 
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-white hover:text-accent'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
         >
            {isPaused ? <Play size={12} className={`fill-current ${isThemeLight ? 'text-zinc-900' : 'text-white'}`} /> : <Pause size={12} className={`fill-current ${isThemeLight ? 'text-zinc-900' : 'text-white'}`} />}
         </button>
         
         <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }} 
            className={`absolute -top-2.5 -right-2.5 w-7 h-7 border shadow-md rounded-full flex items-center justify-center hover:scale-110 transition-all cursor-pointer ${
              isThemeLight 
                ? 'bg-stone-50 border-stone-200 text-zinc-500 hover:text-zinc-900 shadow-stone-200/55' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white shadow-black/60'
            }`}
            title="Expand Room"
         >
            <Maximize2 size={12} />
         </button>
      </motion.div>
    );
  }

  // Dumps are completely global and disconnected from individual sessions (meaning lists persist!).
  const filteredDumps = brainDumps || [];

  return (
    <div key="maximized-container" className="fixed inset-0 z-[100]">
      <motion.div 
        key="maximized-full-screen-timer"
        initial={{ opacity: 0, x: 0, y: 0 }} 
        animate={{ opacity: 1, x: 0, y: 0 }} 
        exit={{ opacity: 0 }}
        className={`w-full h-full flex flex-col items-center justify-center overflow-hidden font-sans transition-colors duration-500 ${
          isDarkTheme ? 'bg-zinc-950 text-white' : 'bg-stone-50 text-zinc-900'
        }`}
      >
      {/* Subtle Background Ambience Blur Grid */}
      <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-500 ${
        isDarkTheme 
          ? 'bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.5)_0%,rgba(9,9,11,1)_100%)]' 
          : 'bg-[radial-gradient(circle_at_center,rgba(245,245,244,0.6)_0%,rgba(250,250,249,1)_100%)]'
      }`} />
      
      {/* Top Controls Bar */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10 select-none">
        <span className={`font-mono text-xs flex items-center gap-2 transition-colors ${
          isDarkTheme ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${isActiveFocus ? 'bg-accent shadow-[0_0_10px_var(--color-accent)]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
          {isActiveFocus ? 'Deep Mode Active' : 'Rest Mode Active'}
        </span>
        
        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button 
            type="button"
            onClick={() => setIsDarkTheme(prev => !prev)}
            className={`p-2 border rounded-xl transition-all shadow-xl hover:scale-105 cursor-pointer flex items-center justify-center ${
              isDarkTheme 
                ? 'text-zinc-400 hover:text-white border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900' 
                : 'text-zinc-600 hover:text-zinc-950 border-stone-200 bg-white hover:bg-stone-100 shadow-sm'
            }`}
            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
             {isDarkTheme ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Minimize element */}
          <button 
            type="button"
            onClick={() => setIsMinimized(true)} 
            className={`p-2 border rounded-xl transition-all shadow-xl hover:scale-105 cursor-pointer flex items-center justify-center ${
              isDarkTheme 
                ? 'text-zinc-400 hover:text-white border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900' 
                : 'text-zinc-600 hover:text-zinc-950 border-stone-200 bg-white hover:bg-stone-100 shadow-sm'
            }`}
            title="Minimize to Floating Player"
          >
             <Minimize2 size={15} />
          </button>
        </div>
      </div>

      {/* Primary Layout Frame */}
      <div className="max-w-2xl w-full flex flex-col items-center justify-center px-6 text-center z-10 select-none">
        
        {/* Session Segment Indicators (Dashes) */}
        <div className={`flex items-center gap-1.5 mb-8 px-4 py-2 rounded-full border transition-colors ${
          isDarkTheme ? 'bg-zinc-900/40 border-zinc-900' : 'bg-stone-200/50 border-stone-200'
        }`}>
          {segments.map((seg, idx) => {
            const isCurrent = idx === currentSegmentIndex;
            const isPassed = idx < currentSegmentIndex;
            return (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent 
                    ? (seg.type === 'break' ? 'w-8 bg-emerald-500' : 'w-8 bg-accent') 
                    : (isPassed ? (isDarkTheme ? 'w-3 bg-zinc-605 bg-zinc-600' : 'w-3 bg-stone-400') : (isDarkTheme ? 'w-3 bg-zinc-800' : 'w-3 bg-stone-200'))
                }`}
                title={`${seg.type === 'break' ? 'Break' : 'Focus'} Block ${seg.indexInType}/${seg.totalOfType}`}
              />
            );
          })}
        </div>

        {/* Minimal Category indicator */}
        <span className={`font-mono text-xs uppercase tracking-widest font-extrabold mb-1 transition-colors ${
          isDarkTheme ? 'text-zinc-400' : 'text-zinc-500'
        }`}>
          {sessionType}
        </span>

        {/* Big Luxury Display Number Timer */}
        <div 
          className={`text-[120px] md:text-[144px] font-mono leading-none tracking-tight font-extralight transition-all duration-300 my-3 ${
            isPaused ? 'opacity-35' : ''
          } ${isDarkTheme ? 'text-white' : 'text-zinc-900'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        {/* Status Text Block */}
        <span className={`text-xs uppercase tracking-wider font-extrabold block mb-6 transition-colors ${
          isActiveFocus ? (isDarkTheme ? 'text-accent/80' : 'text-accent/95 font-bold') : 'text-emerald-500'
        }`}>
          {isActiveFocus ? 'Distraction-Free Focus block' : 'Relax & Breathe'}
        </span>

        {/* Single Thin Progressive Bar */}
        <div className={`w-full max-w-md h-1.5 rounded-full overflow-hidden border mb-10 transition-colors ${
          isDarkTheme ? 'bg-zinc-900 border-zinc-850/20' : 'bg-stone-200 border-stone-300/20'
        }`}>
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${progressRatio * 100}%` }}
            transition={{ ease: 'linear', duration: 1 }}
            className={`h-full ${isActiveFocus ? 'bg-accent' : 'bg-emerald-500'}`}
          />
        </div>

        {/* Context Goal Description */}
        <div className={`w-full max-w-md mb-12 select-text transition-colors ${
          isDarkTheme ? 'text-stone-300' : 'text-stone-750'
        }`}>
          {linkedName && (
             <span className={`text-[10px] uppercase font-mono tracking-widest font-bold block mb-1 ${
               isDarkTheme ? 'text-zinc-500' : 'text-stone-400'
             }`}>Linked target</span>
          )}
          {linkedName && (
             <span className={`text-sm font-semibold px-2.5 py-1 rounded inline-block mb-3 truncate max-w-sm transition-colors ${
               isDarkTheme ? 'text-stone-300 bg-zinc-900/60 border-zinc-800' : 'text-stone-700 bg-stone-200/50 border-stone-250'
             }`}>{linkedName}</span>
          )}
          {intention && (
             <p className={`text-lg font-medium leading-normal italic transition-colors ${
               isDarkTheme ? 'text-stone-200' : 'text-stone-850'
             }`}>“ {intention} ”</p>
          )}
        </div>
      </div>

      {/* Floating sliding Compartment for Brain Dumps (Distractions) */}
      <AnimatePresence>
        {showBrainDump && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed bottom-32 left-6 right-6 md:left-auto md:right-8 md:w-[380px] p-6 rounded-2xl shadow-2xl flex flex-col z-[110] border transition-colors duration-300 ${
              isDarkTheme ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-stone-250'
            }`}
          >
             <div className="flex justify-between items-center mb-4 flex-shrink-0 select-none">
               <div>
                 <h4 className={`text-sm font-extrabold uppercase tracking-wider ${
                   isDarkTheme ? 'text-white' : 'text-zinc-900'
                 }`}>Brain Dump Compartment</h4>
                 <p className={`text-[10px] ${isDarkTheme ? 'text-zinc-400' : 'text-stone-500'}`}>Empty distractions and protect your ongoing focus block.</p>
               </div>
               <button 
                 type="button"
                 onClick={() => setShowBrainDump(false)} 
                 className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                   isDarkTheme ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-500 hover:text-zinc-950 hover:bg-stone-100'
                 }`}
               >
                 <X size={14} />
               </button>
             </div>
             
             <form onSubmit={handleAddBrainDump} className="flex flex-col gap-2 mb-4 flex-shrink-0">
               <textarea 
                 value={brainDumpText}
                 onChange={e => setBrainDumpText(e.target.value)}
                 placeholder="Drop any distraction here immediately (e.g. 'check text message', 'wash mugs')..."
                 className={`w-full h-20 rounded-xl p-3 text-xs resize-none shadow-inner border transition-all focus:outline-none focus:border-accent ${
                   isDarkTheme ? 'bg-zinc-900 border-zinc-805 text-white placeholder-zinc-500' : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400'
                 }`}
               />
               <button 
                 type="submit" 
                 disabled={!brainDumpText.trim()}
                 className={`w-full py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer border ${
                   isDarkTheme ? 'bg-zinc-90 w-full h-9 bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-white' : 'bg-zinc-905 bg-stone-900 text-white hover:bg-stone-850 border-stone-900'
                 }`}
               >
                 Unload Distraction
               </button>
             </form>
             
             {/* Saved distractions logged inside actual panel */}
             <div className={`border-t pt-3 flex-1 overflow-y-auto max-h-[160px] ${
               isDarkTheme ? 'border-zinc-855 border-zinc-900' : 'border-stone-200'
             }`}>
               <span className={`text-[10px] uppercase font-mono font-bold tracking-widest block mb-1.5 ${
                 isDarkTheme ? 'text-zinc-500' : 'text-stone-400'
               }`}>Saved Brain Dumps ({filteredDumps.length})</span>
               
               <div className="space-y-1.5 pr-1">
                 {filteredDumps.map((dump) => (
                   <div 
                     key={dump.id} 
                     className={`flex justify-between items-start border rounded-lg px-2.5 py-2 gap-2 text-[11px] transition-colors ${
                       isDarkTheme ? 'bg-zinc-900/40 border-zinc-850 hover:border-zinc-800' : 'bg-stone-50 border-stone-200 hover:border-stone-250 text-zinc-900'
                     }`}
                   >
                     <div className="flex-1 min-w-0 text-left">
                       <span className={`leading-normal block break-all font-medium ${isDarkTheme ? 'text-zinc-300' : 'text-stone-700'}`}>{dump.text}</span>
                       <span className={`text-[9px] font-mono mt-1 block select-none ${isDarkTheme ? 'text-zinc-500' : 'text-stone-400'}`}>
                         {new Date(dump.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                     </div>
                     <button 
                       type="button"
                       onClick={() => handleDeleteBrainDump(dump.id)} 
                       className={`p-1 rounded transition-colors cursor-pointer ${
                         isDarkTheme ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-red-500 hover:bg-stone-100'
                       }`} 
                       title="Delete thought"
                     >
                       <Trash2 size={12} />
                     </button>
                   </div>
                 ))}
                 {filteredDumps.length === 0 && (
                   <span className="text-xs text-zinc-500 italic block py-2 text-center select-none">Your mind is perfectly clean as of now.</span>
                 )}
               </div>
             </div>
             <span className={`text-[9px] text-center block mt-3 select-none ${
               isDarkTheme ? 'text-zinc-650 text-zinc-650' : 'text-stone-400'
             }`}>Press <kbd className={`px-1 py-0.5 rounded border font-mono ${
               isDarkTheme ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-stone-100 border-stone-200 text-stone-600'
             }`}>Esc</kbd> to toggle panel</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Actions Deck */}
      <div className="absolute bottom-16 flex items-center gap-6 z-10 select-none">
        {remainingSeconds === 0 ? (
          <button 
            type="button"
            onClick={onComplete}
            className={`px-12 py-4 rounded-full text-xs uppercase tracking-widest font-extrabold transition-all shadow-2xl flex items-center justify-center min-w-[240px] hover:scale-105 cursor-pointer active:scale-95 bg-emerald-500 hover:bg-emerald-600 text-white border-none`}
          >
            Mark Complete
          </button>
        ) : (
          <>
            {/* Unload Braindump trigger */}
            <button 
              type="button"
              onClick={() => setShowBrainDump(!showBrainDump)} 
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-105 shadow-xl cursor-pointer ${
                showBrainDump 
                  ? 'bg-accent/15 border-accent text-accent animate-pulse' 
                  : (isDarkTheme 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' 
                      : 'bg-white border-stone-250 text-stone-500 hover:text-stone-900 hover:bg-stone-100 shadow-sm')
              }`}
              title="Brain Dump compartment (Esc)"
            >
              <Edit3 size={16} />
            </button>

            {/* End Session Button Lock */}
            <button 
              type="button"
              onClick={handleEndSessionClick}
              className={`text-xs uppercase tracking-widest font-extrabold transition-colors px-4 py-3 cursor-pointer ${
                isDarkTheme ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-500 hover:text-red-500'
              }`}
            >
              End session
            </button>

            {/* Master Pause / Resume */}
            <button 
              type="button"
              onClick={() => { if (isPaused) startTimer(); else pauseTimer(); }}
              className={`px-8 py-3.5 rounded-full text-xs uppercase tracking-widest font-extrabold border transition-all shadow-xl flex items-center justify-center min-w-[160px] hover:scale-105 cursor-pointer active:scale-95 ${
                isDarkTheme 
                  ? 'bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800' 
                  : 'bg-white text-zinc-950 border-stone-200 hover:bg-stone-100 shadow-sm'
              }`}
            >
              {isPaused ? <Play size={12} className="mr-2 fill-current" /> : <Pause size={12} className="mr-2 fill-current" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            {/* Skip Sprint Block */}
            <button 
              type="button"
              onClick={skipSegment} 
              className={`text-xs uppercase tracking-widest font-extrabold px-4 py-3 cursor-pointer flex items-center gap-1 transition-colors ${
                isDarkTheme ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-950'
              }`}
              title="Skip sector"
            >
              Skip segment <ChevronRight size={14} />
            </button>
          </>
        )}
      </div>

      {/* Modern bottom early exit sliding sheet */}
      <AnimatePresence>
        {showEarlyExitPane && (
          <motion.div 
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            className={`fixed inset-x-0 bottom-0 z-[120] border-t shadow-2xl p-8 flex flex-col items-center justify-center text-center pb-12 select-none ${
              isDarkTheme ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-stone-200'
            }`}
          >
             <div className="max-w-md w-full flex flex-col items-center">
                <AlertCircle size={44} className="text-red-500 mb-4 animate-bounce" />
                <h3 className={`text-xl font-extrabold mb-2 uppercase tracking-wide ${
                  isDarkTheme ? 'text-white' : 'text-zinc-900'
                }`}>Session still running</h3>
                <p className={`text-sm mb-6 max-w-sm ${isDarkTheme ? 'text-zinc-400' : 'text-stone-650'}`}>
                  You have an active focus session in progress. Progress will not be saved if you leave now.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full animate-fade-in">
                  <button 
                    type="button"
                    onClick={onCancel}
                    className={`flex-1 py-3 border rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-[0.99] bg-transparent border-transparent hover:bg-stone-100 dark:hover:bg-zinc-900 ${
                      isDarkTheme ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    End without saving
                  </button>
                  <button 
                    type="button"
                    onClick={handleResumeClick}
                    className={`flex-1 py-3 bg-accent text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer hover:opacity-90 active:scale-[0.99]`}
                  >
                    Resume session
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
}
