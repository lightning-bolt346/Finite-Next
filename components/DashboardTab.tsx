'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Clock, Target, Plus, X } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { differenceInWeeks, parseISO } from 'date-fns';
import { getQuote } from '../lib/quoteEngine';

const PROMPTS = [
  "What deserves your attention today?",
  "What did you learn today?",
  "What are you grateful for right now?",
  "What is one thing you want to let go of?",
  "What made you proud today?",
  "Where did your time actually go today?",
  "What would make tomorrow better than today?",
  "What assumption did you challenge today?",
  "Who or what deserves more of your energy?",
  "What would your best self do differently?"
];

export default function DashboardTab() {
  const { userName, goals, birthDate, reflections, weekendWants, addWeekendWant, updateWeekendWant, removeWeekendWant, todayGoals, setTodayGoal, archiveTodayGoal, rollTodayGoal } = useStore();
  const [randomQuote, setRandomQuote] = useState<{text: string, author: string} | null>(null);
  const [now, setNow] = useState(new Date());
  const [newWant, setNewWant] = useState("");
  const [reflectingId, setReflectingId] = useState<string | null>(null);
  const [reflectionFeel, setReflectionFeel] = useState("");

  const activeWants = weekendWants.filter(w => w.status === 'open');

  useEffect(() => {
    getQuote().then(setRandomQuote);
    
    // Slight delay to avoid synchronous setState inside effect warning
    setTimeout(() => setNow(new Date()), 0);
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeGoals = goals.filter(g => g.status === 'active');
  const nextDeadline = activeGoals.find(g => g.targetDate);
  const outcomeCount = goals.filter(g => g.type === 'outcome').length;
  const processCount = goals.filter(g => g.type === 'process').length;

  const totalWeeks = 4160;
  const livedWeeks = useMemo(() => {
    try {
      return Math.max(0, differenceInWeeks(new Date(), parseISO(birthDate)));
    } catch {
      return 1560;
    }
  }, [birthDate]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const promptText = PROMPTS[dayOfYear % PROMPTS.length];
  
  const todayDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const todayGoal = todayGoals[todayDate];
  
  const rolloverCandidates = useMemo(() => Object.values(todayGoals).filter(
    g => !g.completed && !g.archived && !g.rolledToDate && g.date < todayDate
  ).sort((a, b) => b.createdAt - a.createdAt), [todayGoals, todayDate]);
  const todayReflection = reflections.find(r => r.date === todayDate);

  // Progress Bar Calculations
  const lifeRemaining = Math.max(0, ((80 * 52 - livedWeeks) / (80 * 52)) * 100);
  const yearRemaining = ((365 - dayOfYear) / 365) * 100;
  
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthRemaining = ((daysInMonth - now.getDate()) / daysInMonth) * 100;
  
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const weekRemaining = ((7 - dayOfWeek) / 7) * 100;
  
  const secondsElapsedToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const todayRemaining = ((86400 - secondsElapsedToday) / 86400) * 100;

  const showWeekend = [0, 5, 6].includes(now.getDay()); // Sun, Fri, Sat

  const handleAddWant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWant.trim() && activeWants.length < 5) {
      addWeekendWant({
        id: crypto.randomUUID(),
        text: newWant.trim(),
        status: 'open',
        createdAt: Date.now()
      });
      setNewWant("");
    }
  };

  const handleWantAction = (id: string, action: 'done' | 'missed') => {
    updateWeekendWant(id, { status: action, closedAt: Date.now() });
    if (action === 'done') {
      setReflectingId(id);
      setReflectionFeel('');
    }
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectingId) return;
    updateWeekendWant(reflectingId, { feel: reflectionFeel });
    setReflectingId(null);
  };

  const { pinnedWidgets, togglePinWidget } = useStore();
  const PinnedDict: Record<string, { label: string, value: string, meta: string }> = {
    'Life': { label: 'Life', value: lifeRemaining.toFixed(1) + '%', meta: `${4160 - livedWeeks} weeks left` },
    'Year': { label: 'Year', value: yearRemaining.toFixed(1) + '%', meta: `Day ${dayOfYear} / 365` },
    'Month': { label: 'Month', value: monthRemaining.toFixed(1) + '%', meta: `${daysInMonth - now.getDate()} days left` },
    'Week': { label: 'Week', value: weekRemaining.toFixed(1) + '%', meta: `${7 - dayOfWeek} days left` },
    'Today': { label: 'Today', value: todayRemaining.toFixed(1) + '%', meta: `Ends in ${23 - now.getHours()}h ${59 - now.getMinutes()}m` },
    'Now': { label: 'Now', value: now.toLocaleTimeString([], { hour12: false }), meta: now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {pinnedWidgets.length > 0 && (
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full bg-white/5 text-xs text-[#a1a1aa] mb-4 uppercase tracking-wider font-semibold">
            Pinned widgets
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {pinnedWidgets.map(w => PinnedDict[w]).filter(Boolean).map(widget => (
              <div key={widget.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden group">
                <button 
                  onClick={() => togglePinWidget(widget.label)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#a78bfa] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Unpin"
                >
                  <X size={12} />
                </button>
                <div className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">{widget.label}</div>
                <div className="text-xl font-mono text-white/90 font-bold mb-1">{widget.value}</div>
                <div className="text-[10px] text-[#71717a] truncate">{widget.meta}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full bg-white/5 text-xs text-[#a1a1aa] mb-4 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_12px_#34d399]" />
            One week at a time
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90">
            Good {greeting}, {userName || 'friend'}.
          </h1>
          <p className="text-[#a1a1aa] mt-2">Here&apos;s your timeline.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Today&apos;s focus</span>
            <span className="text-xs px-2.5 py-1 border border-white/10 rounded-full text-[#a1a1aa] whitespace-nowrap">—</span>
          </div>
          <div className="text-2xl font-medium tracking-tight mb-2 text-white/90 line-clamp-2">
            {todayGoal ? todayGoal.title : "—"}
          </div>
          <p className="text-sm text-[#71717a]">{todayGoal ? "Active objective" : "Set a goal on the Today page."}</p>
          <div className="text-xs text-[#4f4f56] mt-4 font-medium border-t border-white/[0.05] pt-4">
            {outcomeCount} outcome goals, {processCount} process goals
          </div>
        </div>

        <div className="p-6 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Next deadline</span>
            <span className="text-xs px-2.5 py-1 border border-white/10 rounded-full text-[#a1a1aa] whitespace-nowrap">Upcoming</span>
          </div>
          <div className="text-2xl font-medium tracking-tight mb-2 text-white/90 line-clamp-2">
            {nextDeadline && nextDeadline.targetDate ? new Date(nextDeadline.targetDate).toLocaleDateString() : "—"}
          </div>
          <p className="text-sm text-[#71717a]">{nextDeadline ? nextDeadline.title : "No deadlines yet."}</p>
        </div>

        <div className="p-6 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Random perspective</span>
            <Quote size={16} className="text-[#a1a1aa]" />
          </div>
          <div className="text-lg font-serif text-white/90 tracking-tight leading-snug mb-4 italic">
            &quot;{randomQuote?.text || 'Loading...'}&quot;
          </div>
          <p className="text-xs text-[#71717a] uppercase font-semibold tracking-wider">— {randomQuote?.author || ''}</p>
        </div>
      </div>

      <div className="mb-6 p-6 bg-[#12131a] rounded-3xl border border-white/10 flex flex-col sm:flex-row gap-6 justify-between items-center sm:items-start shadow-xl">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full bg-white/5 text-xs text-[#a1a1aa] mb-4 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_12px_#a78bfa]" />
            Today&apos;s Execution
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white/90 mb-2">
            {todayGoal ? todayGoal.title : "No goal set for today."}
          </h2>
          <p className="text-[#a1a1aa] text-sm">
            {todayGoal 
              ? `${todayGoal.doneText || 'Definition of done not specified.'} · ${todayGoal.minutes} focus mins · ${todayGoal.priority} priority` 
              : "Set one main goal and schedule blocks around it."}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {todayGoal && (
            <button 
              onClick={() => setTodayGoal(todayDate, { completed: !todayGoal.completed })}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg ${
                todayGoal.completed 
                ? 'bg-white/10 text-white/90 hover:bg-white/20' 
                : 'bg-gradient-to-r from-[#a78bfa] to-[#6366f1] text-white hover:opacity-90 hover:-translate-y-0.5'
              }`}
            >
              {todayGoal.completed ? 'Mark Open' : 'Mark Done'}
            </button>
          )}
        </div>
      </div>

      {rolloverCandidates.length > 0 && (
        <div className="mb-6 p-6 bg-yellow-500/[0.03] border border-yellow-500/20 rounded-3xl shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white/90 mb-1">Unfinished from previous days</h2>
              <p className="text-[#a1a1aa] text-sm">Move useful ones forward; archive stale ones.</p>
            </div>
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs font-bold">{rolloverCandidates.length} pending</span>
          </div>
          <div className="space-y-3 mt-6">
            {rolloverCandidates.map(goal => (
              <div key={goal.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors items-start sm:items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white/90">{goal.title}</h3>
                  <p className="text-xs text-[#a1a1aa] mt-1">From {goal.date} · {goal.doneText || 'No definition'}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button 
                    onClick={() => rollTodayGoal(goal.date, todayDate)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#a78bfa]/20 text-[#a78bfa] hover:bg-[#a78bfa]/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    Move to today
                  </button>
                  <button 
                    onClick={() => archiveTodayGoal(goal.date)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-[#a1a1aa] hover:text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-10 p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider block mb-1">Today&apos;s Prompt</span>
          <p className="font-medium text-white/90">{promptText}</p>
        </div>
        <div className="flex-shrink-0 text-right md:max-w-xs w-full md:w-auto">
          {todayReflection ? (
            <div className="text-sm text-white/70 italic truncate">&quot;{todayReflection.text.slice(0, 80)}{todayReflection.text.length > 80 && '...'}&quot;</div>
          ) : (
            <span className="text-sm text-[#a78bfa] hover:text-[#8b5cf6] cursor-pointer inline-flex items-center gap-1 transition-colors">Write today&apos;s reflection &rarr;</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 p-6 md:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
          <h2 className="text-2xl font-semibold tracking-tight mb-2 text-white/90">Life in weeks</h2>
          <p className="text-[#a1a1aa] text-sm mb-6">Each square is one week. Filled squares are lived. Empty squares are still ahead.</p>
          
          <div className="flex gap-4 flex-wrap text-xs font-medium text-[#a1a1aa] mb-8 uppercase tracking-wider">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#a78bfa]" /> Lived</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#34d399]/20 border border-[#34d399] shadow-[0_0_8px_#34d399/50]" /> Current</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-white/10 border border-white/10" /> Ahead</div>
          </div>

          <div className="flex flex-wrap gap-[3px]">
            {Array.from({ length: totalWeeks }).map((_, i) => {
              const isLived = i < livedWeeks;
              const isCurrent = i === livedWeeks;
              return (
                <div 
                  key={i} 
                  className={`
                    w-[6px] h-[6px] md:w-[7px] md:h-[7px] rounded-[2px] transition-all duration-300
                    ${isCurrent ? 'bg-[#34d399] shadow-[0_0_12px_#34d399] scale-125 z-10' : 
                      isLived ? 'bg-[#a78bfa]/60' : 
                      'bg-white/[0.06] border border-white/[0.04]'}
                  `}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative">
            <button 
              onClick={() => togglePinWidget('Now')}
              className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors ${
                pinnedWidgets.includes('Now') ? 'bg-[#a78bfa] text-white border-[#a78bfa]' : 'bg-white/5 text-[#a1a1aa] border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              📌
            </button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white/90">Current moment</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Live
              </span>
            </div>
            <div className="text-3xl font-mono tracking-tighter text-white/90">
              {now.toLocaleTimeString([], { hour12: false })}
            </div>
            <div className="text-sm font-mono text-[#71717a] mt-1">
              {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h2 className="text-lg font-semibold text-white/90 mb-6">Time remaining</h2>
            <div className="space-y-5">
              {[
                { label: 'Life', value: lifeRemaining, color: 'bg-white/90' },
                { label: 'Year', value: yearRemaining, color: 'bg-[#a78bfa]' },
                { label: 'Month', value: monthRemaining, color: 'bg-[#38bdf8]' },
                { label: 'Week', value: weekRemaining, color: 'bg-[#fbbf24]' },
                { label: 'Today', value: todayRemaining, color: 'bg-[#34d399]' },
              ].map(bar => (
                <div key={bar.label} className="relative group pr-8">
                  <button 
                    onClick={() => togglePinWidget(bar.label)}
                    className={`absolute border right-0 top-0 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-sm text-[10px] ${
                      pinnedWidgets.includes(bar.label) ? 'opacity-100 bg-[#a78bfa] text-white border-[#a78bfa]' : 'bg-white/5 text-[#a1a1aa] border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    📌
                  </button>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">{bar.label}</span>
                    <span className="text-xs font-mono text-[#71717a]">{bar.value.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showWeekend && (
            <div className="p-6 bg-white/[0.02] border border-[#fbbf24]/20 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/5 to-transparent pointer-events-none" />
              <h2 className="text-lg font-semibold text-[#fbbf24] mb-1">Weekend Wants</h2>
              <p className="text-xs text-[#a1a1aa] mb-4">Not a productivity list.</p>
              
              <div className="space-y-2 mb-4">
                <AnimatePresence>
                  {reflectingId && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                        <h4 className="text-sm font-bold text-white/90 mb-2">How was it?</h4>
                        <form onSubmit={handleReflectionSubmit}>
                          <textarea 
                            autoFocus
                            value={reflectionFeel}
                            onChange={(e) => setReflectionFeel(e.target.value)}
                            placeholder="What did you enjoy? How did it feel?"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fbbf24] resize-none mb-2"
                            rows={3}
                          />
                          <button type="submit" className="px-3 py-1.5 bg-[#fbbf24]/20 text-[#fbbf24] rounded-lg text-xs font-semibold hover:bg-[#fbbf24]/30 transition-colors">
                            Save reflection
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeWants.map((want) => (
                  <div key={want.id} className="flex justify-between items-center group bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-sm text-white/90">{want.text}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button onClick={() => handleWantAction(want.id, 'done')} className="px-2 py-0.5 bg-[#34d399]/20 text-[#34d399] rounded text-[10px] font-bold uppercase tracking-wider hover:bg-[#34d399]/30">Done</button>
                      <button onClick={() => handleWantAction(want.id, 'missed')} className="px-2 py-0.5 bg-red-400/20 text-red-400 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-red-400/30">Missed</button>
                      <button onClick={() => removeWeekendWant(want.id)} className="p-1 text-[#71717a] hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {activeWants.length === 0 && <span className="text-xs text-[#71717a] italic">Empty. Add something fun.</span>}
              </div>

              {activeWants.length < 5 && (
                <form onSubmit={handleAddWant} className="flex gap-2">
                  <input 
                    type="text"
                    value={newWant}
                    onChange={e => setNewWant(e.target.value)}
                    placeholder="e.g. Bake bread"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fbbf24] transition-colors"
                  />
                  <button type="submit" className="px-3 py-2 bg-[#fbbf24]/20 text-[#fbbf24] rounded-lg text-sm font-medium hover:bg-[#fbbf24]/30 transition-colors">
                    <Plus size={16} />
                  </button>
                </form>
              )}
              <div className="text-right mt-2"><span className="text-[10px] font-mono text-[#71717a] uppercase">{activeWants.length} / 5</span></div>
            </div>
          )}

          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative overflow-hidden">
            <h2 className="text-lg font-semibold mb-1 text-white/90">Brain Dump</h2>
            <p className="text-xs text-[#a1a1aa] mb-4">Any random thought to revisit later.</p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('dump') as HTMLInputElement;
                if (!input.value.trim()) return;
                useStore.getState().addSavedItem({
                  id: crypto.randomUUID(),
                  title: input.value.trim(),
                  category: 'Brain Dump',
                  status: 'inbox',
                  savedAt: new Date().toISOString(),
                  type: 'Thought',
                  notes: ''
                });
                input.value = '';
                alert("Saved to Inbox!");
              }} 
              className="flex gap-2"
            >
              <input 
                name="dump"
                type="text"
                placeholder="Drop a thought..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a78bfa] transition-colors"
              />
              <button type="submit" className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
