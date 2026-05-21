'use client';

import { useStore, FocusSession } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Pause, Flame, Trophy, Clock, CalendarDays, Music } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { differenceInDays, format, subDays, parseISO, isSameDay } from 'date-fns';
import { getQuote } from '../lib/quoteEngine';

export default function FocusTab() {
  const { focusSessions, addFocusSession } = useStore();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // in seconds
  const [quote, setQuote] = useState<{text: string, author: string} | null>(null);
  
  // New configuration states
  const [focusTarget, setFocusTarget] = useState('Manual focus');
  const [focusOutcome, setFocusOutcome] = useState('');
  const [focusDuration, setFocusDuration] = useState(25);
  const [brainDump, setBrainDump] = useState('');
  
  const { addSavedItem } = useStore();

  const handleStartFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (brainDump.trim()) {
      addSavedItem({
        id: crypto.randomUUID(),
        title: brainDump.trim().slice(0, 50) + (brainDump.length > 50 ? '...' : ''),
        category: 'Brain Dump',
        status: 'inbox',
        savedAt: new Date().toISOString(),
        type: 'Thought',
        notes: brainDump
      });
      setBrainDump('');
    }
    setIsRunning(true);
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stats
  const totalMins = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  
  // Simple streak calc: sort dates, count backwards
  const sortedSessions = [...focusSessions].sort((a, b) => b.createdAt - a.createdAt);
  let streak = 0;
  let currentDate = new Date();
  for (let i = 0; i < 365; i++) {
    const d = subDays(currentDate, i);
    const hasSession = sortedSessions.some(s => isSameDay(parseISO(s.date), d));
    if (hasSession) {
      streak++;
    } else if (i > 0) {
      // If we miss today (i=0), it's fine, string continues from yesterday. 
      // But if we miss yesterday (i=1), streak breaks.
      break;
    }
  }

  const bestDay = sortedSessions.reduce((best, s) => {
    const dayMins = sortedSessions.filter(ss => ss.date === s.date).reduce((sum, ss) => sum + ss.durationMinutes, 0);
    return dayMins > best.mins ? { date: s.date, mins: dayMins } : best;
  }, { date: '-', mins: 0 });

  const weeklyMins = sortedSessions.filter(s => differenceInDays(new Date(), parseISO(s.date)) < 7)
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  useEffect(() => {
    getQuote().then(setQuote);
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const stopTimer = () => {
    setIsRunning(false);
    const minutes = Math.floor(elapsed / 60);
    if (minutes < 10) {
      alert(`Session was only ${minutes}m. Needs to be at least 10m to count.`);
    } else {
      addFocusSession({
        id: crypto.randomUUID(),
        title: focusTarget,
        outcome: focusOutcome,
        durationMinutes: minutes,
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: Date.now()
      });
    }
    setElapsed(0);
    setFocusOutcome('');
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todaySessions = focusSessions.filter(s => isSameDay(parseISO(s.date), new Date()));

  // Ambient sound state (mock)
  const [playingSounds, setPlayingSounds] = useState<string[]>([]);

  const handleSound = (name: string) => {
    setPlayingSounds(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Focus</h1>
          <p className="text-[#a1a1aa] text-sm md:w-[60%]">Deep work zone. Everything else can wait. {quote ? `"${quote.text}"` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {!isRunning && (
            <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
              <h3 className="text-lg font-semibold mb-4 text-white/90">Start Focus</h3>
              <form onSubmit={handleStartFocus} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Target</label>
                    <select 
                      value={focusTarget} onChange={e => setFocusTarget(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#a1a1aa] focus:outline-none focus:border-[#a78bfa] appearance-none"
                    >
                      <option className="bg-[#12131a]">Manual focus</option>
                      <option className="bg-[#12131a]">Today&apos;s Goal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Duration (mins)</label>
                    <select 
                      value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#a1a1aa] focus:outline-none focus:border-[#a78bfa] appearance-none"
                    >
                      <option value={10} className="bg-[#12131a]">10</option>
                      <option value={25} className="bg-[#12131a]">25</option>
                      <option value={45} className="bg-[#12131a]">45</option>
                      <option value={60} className="bg-[#12131a]">60</option>
                      <option value={90} className="bg-[#12131a]">90</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Outcome</label>
                  <input 
                    type="text" 
                    value={focusOutcome} onChange={e => setFocusOutcome(e.target.value)}
                    placeholder="What will be done?" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Brain Dump</label>
                  <textarea 
                    value={brainDump} onChange={e => setBrainDump(e.target.value)}
                    placeholder="Drop thoughts quickly before starting..." 
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa] resize-none"
                  />
                </div>
              </form>
            </div>
          )}

          <div className="p-8 md:p-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] relative overflow-hidden group">
            {isRunning && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#a78bfa,transparent_70%)] opacity-5 animate-pulse" />
            )}
            
            {(focusTarget !== 'Manual focus' || focusOutcome) && (
              <div className="absolute top-6 flex flex-col items-center gap-1 z-10">
                <span className="text-xs font-bold text-[#a78bfa] uppercase tracking-wider">{focusTarget}</span>
                {focusOutcome && <span className="text-sm font-medium text-white/80">{focusOutcome}</span>}
              </div>
            )}

            <div className="font-mono text-7xl md:text-[8rem] font-bold tracking-tighter text-white/90 mb-12 relative z-10 tabular-nums">
              {formatTime(elapsed)}
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <button 
                onClick={toggleTimer}
                className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105"
              >
                {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-2" />}
              </button>
              
              <AnimatePresence>
                {elapsed > 0 && !isRunning && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.5, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.5, x: -20 }}
                    onClick={stopTimer}
                    className="w-20 h-20 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center transition-all hover:scale-105"
                  >
                    <Square size={24} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><Flame size={14} className="text-orange-400" /> Streak</div>
              <div className="text-2xl font-bold">{streak} <span className="text-sm font-medium text-[#71717a]">days</span></div>
            </div>
            <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><Clock size={14} className="text-blue-400" /> Total</div>
              <div className="text-2xl font-bold">{Math.floor(totalMins/60)}<span className="text-sm font-medium text-[#71717a]">h</span> {totalMins%60}<span className="text-sm font-medium text-[#71717a]">m</span></div>
            </div>
            <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><CalendarDays size={14} className="text-green-400" /> Weekly</div>
              <div className="text-2xl font-bold">{Math.floor(weeklyMins/60)}<span className="text-sm font-medium text-[#71717a]">h</span> {weeklyMins%60}<span className="text-sm font-medium text-[#71717a]">m</span></div>
            </div>
            <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><Trophy size={14} className="text-yellow-400" /> Best Day</div>
              <div className="text-xl font-bold truncate">{bestDay.mins === 0 ? '-' : `${Math.floor(bestDay.mins/60)}h ${bestDay.mins%60}m`}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h3 className="text-lg font-semibold mb-4 text-white/90">Consistency Heatmap</h3>
            <p className="text-xs text-[#a1a1aa] mb-4">Last 30 days of deep work.</p>
            <div className="flex flex-wrap gap-[4px]">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = subDays(new Date(), 29 - i);
                const mins = focusSessions.filter(s => isSameDay(parseISO(s.date), d)).reduce((sum, s) => sum + s.durationMinutes, 0);
                const maxIntensity = 120; // 2 hours is max color
                const intensity = Math.min(mins / maxIntensity, 1);
                
                return (
                  <div 
                    key={i} 
                    className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-[4px] border border-white/5 relative group"
                    style={{
                      backgroundColor: mins > 0 ? `rgba(167, 139, 250, ${Math.max(0.2, intensity)})` : 'rgba(255,255,255,0.02)'
                    }}
                    title={`${format(d, 'MMM d')}: ${mins} mins`}
                  >
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h3 className="text-lg font-semibold mb-4 text-white/90">Today&apos;s Sessions</h3>
            {todaySessions.length === 0 ? (
              <p className="text-sm text-[#71717a] italic">No deep work sessions yet today.</p>
            ) : (
              <div className="space-y-2 relative border-l border-white/10 ml-2 pl-4">
                {todaySessions.map(s => (
                  <div key={s.id} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#a78bfa] border-2 border-[#12131a]" />
                    <div className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-white/90">Deep Work</span>
                      <span className="text-xs font-mono text-[#a78bfa] bg-[#a78bfa]/10 px-2 py-0.5 rounded">{s.durationMinutes}m</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h3 className="text-lg font-semibold mb-4 text-white/90 flex items-center gap-2"><Music size={18} className="text-[#38bdf8]" /> Ambient Sound</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {['Rain', 'Cafe', 'White Noise', 'Forest', 'Deep Space', 'Library', 'Fireplace', 'Ocean'].map(sound => (
                <button 
                  key={sound}
                  onClick={() => handleSound(sound)}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors border ${playingSounds.includes(sound) ? 'bg-[#38bdf8]/20 border-[#38bdf8]/50 text-[#38bdf8]' : 'bg-white/5 border-white/5 text-[#a1a1aa] hover:bg-white/10 hover:text-white'}`}
                >
                  {sound}
                </button>
              ))}
            </div>
            {playingSounds.length > 0 && (
              <p className="text-xs text-[#38bdf8] text-center mt-4 animate-pulse">Playing {playingSounds.length} sounds...</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
