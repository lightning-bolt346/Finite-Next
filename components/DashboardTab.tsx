'use client';

import { useStore } from '../lib/store';
import { saveTodayGoalToFirestore } from '../lib/firebaseSync';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Clock, Target, Plus, X, Pin } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { differenceInWeeks, parseISO } from 'date-fns';
import TimelineCards from './sidebar/TimelineCards';
import PerspectiveCard from './sidebar/PerspectiveCard';
import WeekendWants from './sidebar/WeekendWants';
import BrainDumpWidget from './sidebar/BrainDumpWidget';
import { getQuote } from '../lib/quoteEngine';
import { useTasks } from '../lib/contexts/TaskContext';

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
  const { userName, goals, birthDate, reflections, todayGoals, setTodayGoal, archiveTodayGoal, rollTodayGoal } = useStore();
  const [randomQuote, setRandomQuote] = useState<{text: string, author: string} | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    getQuote().then(setRandomQuote);
    
    // Slight delay to avoid synchronous setState inside effect warning
    setTimeout(() => setNow(new Date()), 0);
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { tasks } = useTasks();

  const activeGoals = goals.filter(g => g.status === 'active');
  const outcomeCount = goals.filter(g => g.type === 'outcome').length;
  const processCount = goals.filter(g => g.type === 'process').length;

  const closestDeadline = useMemo(() => {
    const dates: Array<{ title: string; date: Date; type: 'Goal' | 'Task' }> = [];

    // Process goal target dates
    for (const g of activeGoals) {
      if (g.targetDate) {
        try {
          const parsed = new Date(g.targetDate + 'T23:59:59');
          if (!isNaN(parsed.getTime())) {
            dates.push({ title: g.title, date: parsed, type: 'Goal' });
          }
        } catch {}
      }
    }

    // Process active task deadlines
    for (const t of tasks) {
      if (!t.completed && t.deadline) {
        try {
          const parsed = new Date(t.deadline);
          if (!isNaN(parsed.getTime())) {
            dates.push({ title: t.title, date: parsed, type: 'Task' });
          }
        } catch {}
      }
    }

    // Sort chronologically and find the first one that is either in the future or active today
    const nowMs = Date.now() - 2 * 60 * 60 * 1000; // allow a tiny buffer for recent past
    const upcoming = dates
      .filter(item => item.date.getTime() >= nowMs)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming[0] || null;
  }, [activeGoals, tasks]);

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
  const todayGoal = todayGoals[todayDate] && !todayGoals[todayDate].archived ? todayGoals[todayDate] : null;
  
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

  const { pinnedWidgets, togglePinWidget } = useStore();
  
  const statCards = [
    { 
      id: 'Life', label: 'Life remaining', pct: `${lifeRemaining.toFixed(1)}% remaining`, 
      value: (4160 - livedWeeks).toLocaleString(), 
      meta: `${((4160 - livedWeeks)*7).toLocaleString()} days · ${Math.floor((4160-livedWeeks)/52)} years · ${Math.floor((4160-livedWeeks)/4.33)} months`, 
      footer: 'Based on 80 years.', isCurrent: false, progress: 100 - lifeRemaining,
      fillColor: 'bg-accent'
    },
    { 
      id: 'Year', label: 'Year remaining', pct: `${yearRemaining.toFixed(1)}% remaining`, 
      value: `${365 - dayOfYear}d ${24 - now.getHours()}h`, 
      meta: `${Math.floor((365-dayOfYear)/7)} weeks left in ${now.getFullYear()}`, 
      footer: `${(100 - yearRemaining).toFixed(1)}% of the year is complete.`, isCurrent: false, progress: 100 - yearRemaining,
      fillColor: 'bg-accent'
    },
    { 
      id: 'Month', label: 'Month remaining', pct: `${monthRemaining.toFixed(1)}% remaining`, 
      value: `${daysInMonth - now.getDate()}d ${24 - now.getHours()}h`, 
      meta: `${monthRemaining.toFixed(1)}% left in ${now.toLocaleDateString('en-US', {month:'long'})}`, 
      footer: `${(100 - monthRemaining).toFixed(1)}% of the month is complete.`, isCurrent: false, progress: 100 - monthRemaining,
      fillColor: 'bg-accent'
    },
    { 
      id: 'Week', label: 'Week remaining', pct: `${weekRemaining.toFixed(1)}% remaining`, 
      value: `${weekRemaining.toFixed(1)}%`, 
      meta: `${7 - dayOfWeek} days ${24 - now.getHours()} hours left this week`, 
      footer: 'Week starts on Monday.', isCurrent: false, progress: 100 - weekRemaining,
      fillColor: 'bg-accent'
    },
    { 
      id: 'Today', label: 'Today remaining', pct: `${todayRemaining.toFixed(1)}% remaining`, 
      value: `${String(23 - now.getHours()).padStart(2, '0')}:${String(59 - now.getMinutes()).padStart(2, '0')}:${String(59 - now.getSeconds()).padStart(2, '0')}`, 
      meta: `${todayRemaining.toFixed(1)}% of today remaining`, 
      footer: 'Spend the next hour deliberately.', isCurrent: true, progress: 100 - todayRemaining,
      fillColor: 'bg-accent'
    },
    { 
      id: 'Age', label: 'Live age', pct: `${(100 - lifeRemaining).toFixed(1)}% lived`, 
      value: `${Math.floor(livedWeeks / 52)}y ${Math.floor((livedWeeks % 52) / 4.33)}m`, 
      meta: `${livedWeeks.toLocaleString()} weeks · ${(livedWeeks * 7).toLocaleString()} days lived`, 
      footer: 'A private dashboard for your finite days.', isCurrent: false, progress: 100 - lifeRemaining,
      fillColor: 'bg-accent'
    }
  ];

  const renderNowCard = () => (
    <div key="Now-card" className="p-5 bg-surface-1 border border-border rounded-lg relative flex flex-col gap-1 w-full md:min-w-[300px] md:max-w-[380px] flex-grow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-h3 font-semibold text-text-primary">Now</h2>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-danger-soft text-danger border border-danger/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" /> Live
          </span>
          <button 
            type="button"
            onClick={() => togglePinWidget('Now')}
            className={`p-1.5 rounded-sm border transition-colors duration-fast ${
              pinnedWidgets.includes('Now') ? 'bg-accent text-bg border-accent' : 'bg-surface-2 text-text-muted border-border hover:bg-surface-3 hover:text-text-primary'
            }`}
          >
            <Pin size={12} className={pinnedWidgets.includes('Now') ? "fill-current" : ""} />
          </button>
        </div>
      </div>
      <div className="text-display font-mono text-text-primary">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>
      <div className="text-sm font-mono text-text-muted mt-1">
        {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );

  const renderStatCard = (card: typeof statCards[0]) => (
    <div 
      key={card.id} 
      className="p-6 bg-surface-1 border border-border rounded-2xl shadow-1 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <strong className="text-sm text-text-muted font-bold">{card.label}</strong>
          <span className="text-sm text-text-muted">{card.pct}</span>
        </div>
        <div className="text-[42px] font-mono leading-none tracking-tight text-text-primary mb-3">
          {card.value}
        </div>
        <div className="text-sm text-text-muted mb-6">
          {card.meta}
        </div>
      </div>
      
      <div>
        <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden mb-3 border border-border/50">
          <div className={`h-full ${card.fillColor} transition-all duration-700 ease-spring`} style={{ width: `${card.progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-sm text-text-muted">
          <span>{card.footer}</span>
          <button 
            onClick={() => togglePinWidget(card.id)}
            className={`p-2 rounded-xl border transition-colors ${
              pinnedWidgets.includes(card.id) ? 'bg-danger text-bg border-none hover:bg-danger-soft hover:text-danger' : 'bg-surface-2 border-border text-text-muted hover:bg-surface-3 hover:text-text-primary'
            }`}
          >
            <Pin size={14} className={pinnedWidgets.includes(card.id) ? "fill-current" : "rotate-45"} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div 
        className="mb-10"
        style={{ 
          display: pinnedWidgets.length > 0 ? 'flex' : 'none', 
          flexDirection: 'column',
          gap: 'var(--space-3)'
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-full bg-surface-2 text-micro text-text-muted mb-4 uppercase tracking-wider font-semibold self-start">
          Pinned Metrics
        </div>
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 'var(--space-3)' 
          }}
          className="w-full"
        >
          {pinnedWidgets.includes('Now') && renderNowCard()}
          {statCards.filter(c => pinnedWidgets.includes(c.id)).map(c => (
            <div key={c.id} className="w-full md:min-w-[300px] md:max-w-[380px] flex-grow">
              {renderStatCard(c)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-full bg-surface-2 text-micro text-text-muted mb-4 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_12px_var(--color-success)]" />
            One week at a time
          </div>
          <h1 className="text-h1 font-bold text-text-primary">
            Good {greeting}, {userName || 'friend'}.
          </h1>
          <p className="text-text-secondary mt-2 text-sm flex items-center gap-1.5 font-medium">
            Here is your today&apos;s timeline, <span className="font-semibold text-accent underline underline-offset-4 decoration-accent/40">{now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        
        {/* LEFT COLUMN: Main content */}
        <div className="lg:col-span-8 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-surface-1 border border-border hover:bg-surface-2 transition-colors duration-fast rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <span className="text-micro text-text-muted uppercase tracking-wider">Today&apos;s focus</span>
                <span className="text-micro px-2.5 py-1 border border-border rounded-full text-text-muted whitespace-nowrap">—</span>
              </div>
              <div className="text-h3 font-medium tracking-tight mb-2 text-text-primary line-clamp-2">
                {todayGoal ? todayGoal.title : "—"}
              </div>
              <p className="text-sm text-text-muted">{todayGoal ? "Active objective" : "Set a goal on the Today page."}</p>
            </div>

            <div className="p-6 bg-surface-1 border border-border hover:bg-surface-2 transition-colors duration-fast rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <span className="text-micro text-text-muted uppercase tracking-wider">Next deadline</span>
                <span className="text-micro px-2.5 py-1 border border-border rounded-full text-text-muted whitespace-nowrap">
                  {closestDeadline ? closestDeadline.type : "Upcoming"}
                </span>
              </div>
              <div className="text-h3 font-medium tracking-tight mb-2 text-text-primary line-clamp-2">
                {closestDeadline ? closestDeadline.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
              </div>
              <p className="text-sm text-text-muted">{closestDeadline ? closestDeadline.title : "No deadlines yet."}</p>
            </div>
          </div>

          <div className="p-6 bg-surface-2 rounded-xl border border-border flex flex-col sm:flex-row gap-6 justify-between items-center sm:items-start shadow-1">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-full bg-surface-1 text-micro text-text-secondary mb-4 uppercase tracking-wider font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
                Today&apos;s Execution
              </div>
              <h2 className="text-h3 font-bold text-text-primary mb-2">
                {todayGoal ? todayGoal.title : "No goal set for today."}
              </h2>
              <p className="text-text-secondary text-sm">
                {todayGoal 
                  ? `${todayGoal.doneText || 'Definition of done not specified.'} · ${todayGoal.minutes} focus mins · ${todayGoal.priority} priority` 
                  : "Set one main goal and schedule blocks around it."}
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {todayGoal && (
                <button 
                  onClick={() => {
                    if (todayGoal) {
                      const nextCompleted = !todayGoal.completed;
                      setTodayGoal(todayDate, { completed: nextCompleted });
                      saveTodayGoalToFirestore({ ...todayGoal, completed: nextCompleted });
                    }
                  }}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-1 ${
                    todayGoal.completed 
                    ? 'bg-surface-3 text-text-secondary' 
                    : 'bg-accent text-bg hover:opacity-90 hover:-translate-y-0.5'
                  }`}
                >
                  {todayGoal.completed ? 'Mark Open' : 'Mark Done'}
                </button>
              )}
            </div>
          </div>
          
          <WeekendWants />

          {rolloverCandidates.length > 0 && (
            <div className="p-6 bg-warning-soft border border-warning/20 rounded-xl shadow-1">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-h3 font-bold text-text-primary mb-1">Unfinished previous</h2>
                  <p className="text-text-secondary text-sm">Move useful ones forward.</p>
                </div>
                <span className="px-3 py-1 bg-warning/20 text-warning rounded-md text-xs font-bold">{rolloverCandidates.length}</span>
              </div>
              <div className="space-y-3 mt-4">
                {rolloverCandidates.map(goal => (
                  <div key={goal.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-surface-1 border border-border items-start sm:items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary">{goal.title}</h3>
                      <p className="text-xs text-text-muted mt-1">From {goal.date}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button 
                        onClick={() => {
                          rollTodayGoal(goal.date, todayDate);
                          saveTodayGoalToFirestore({ ...goal, rolledToDate: todayDate });
                          setTimeout(() => {
                            const newGoal = useStore.getState().todayGoals[todayDate];
                            if (newGoal) {
                              saveTodayGoalToFirestore(newGoal);
                            }
                          }, 50);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-accent-soft text-accent hover:bg-accent/30 rounded-md text-sm font-medium transition-colors"
                      >
                        Keep
                      </button>
                      <button 
                        onClick={() => {
                          archiveTodayGoal(goal.date);
                          saveTodayGoalToFirestore({ ...goal, archived: true });
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary rounded-md text-sm font-medium transition-colors"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 md:p-10 bg-surface-1 border border-border rounded-xl shadow-1">
            <div className="mb-2 flex justify-between items-end">
              <h2 className="text-h2 font-semibold text-text-primary">Life in weeks</h2>
            </div>
            <p className="text-text-muted text-sm mb-6">Each square is one week. Filled squares are lived. Empty squares are still ahead.</p>
            
            <div className="flex gap-4 flex-wrap text-micro text-text-muted mb-8">
              <div className="flex items-center gap-2"><div className="w-[9px] h-[9px] rounded-sm bg-accent/80" /> Lived</div>
              <div className="flex items-center gap-2"><div className="w-[9px] h-[9px] rounded-sm bg-accent ring-2 ring-accent/40" /> Now</div>
              <div className="flex items-center gap-2"><div className="w-[9px] h-[9px] rounded-sm bg-surface-2" /> Remaining</div>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[600px] flex">
                {/* Y-axis labels for decades */}
                <div className="flex flex-col justify-between text-micro text-text-muted pr-4 sticky left-0 bg-surface-1 z-10" style={{ height: '878px' }}>
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(decade => (
                    <div key={decade} className="-mt-1.5 leading-none">{decade}</div>
                  ))}
                </div>

                <div 
                  className="grid grid-cols-[repeat(52,_9px)] grid-rows-[repeat(80,_9px)] gap-[2px]"
                >
                  {Array.from({ length: totalWeeks }).map((_, i) => {
                    const isLived = i < livedWeeks;
                    const isCurrent = i === livedWeeks;
                    return (
                      <div 
                        key={i} 
                        className={`
                          w-[9px] h-[9px] rounded-[2px] transition-all duration-300 group relative
                          ${isCurrent ? 'bg-accent shadow-[0_0_0_2px_var(--color-accent-soft)] animate-pulse z-10 text-transparent hover:text-text-primary' : 
                            isLived ? 'bg-accent/80' : 
                            'bg-surface-2/40'}
                        `}
                      >
                         <div className="absolute opacity-0 group-hover:opacity-100 bg-surface-1 border border-border px-2 py-1 rounded text-micro text-text-primary -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none shadow-2 transition-opacity">
                            Week {i + 1} &middot; Age {Math.floor(i / 52)}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar widgets */}
        <div className="lg:col-span-4 space-y-4">
          <PerspectiveCard />
          <TimelineCards />

          {/* Current Moment Snippet - Hide from sidebar if pinned */}
          {!pinnedWidgets.includes('Now') && renderNowCard()}

          <div className="p-5 bg-surface-1 border border-border rounded-lg flex flex-col gap-2">
            <span className="text-micro font-bold text-text-secondary uppercase tracking-wider block mb-1">Today&apos;s Prompt</span>
            <p className="font-medium text-text-primary text-sm leading-relaxed">{promptText}</p>
            <div className="text-right mt-2 w-full">
              {todayReflection ? (
                <div className="text-sm text-text-primary italic truncate bg-surface-2 p-2 rounded">&quot;{todayReflection.text.slice(0, 80)}{todayReflection.text.length > 80 && '...'}&quot;</div>
              ) : (
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'reflect' }))} className="text-xs text-accent hover:text-accent-soft cursor-pointer inline-flex items-center gap-1 transition-colors bg-transparent border-none">Write today&apos;s reflection &rarr;</button>
              )}
            </div>
          </div>

          <BrainDumpWidget />

          <div className="flex flex-col gap-6">
             {statCards.filter(c => !pinnedWidgets.includes(c.id)).map(renderStatCard)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
