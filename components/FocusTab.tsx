'use client';

import { useState } from 'react';
import { useStore } from '../lib/store';
import { useTasks } from '../lib/contexts/TaskContext';
import { differenceInDays, format, subDays, parseISO, isSameDay } from 'date-fns';
import { Flame, Trophy, Clock, CalendarDays, History } from 'lucide-react';
import SessionSetup from './focus/SessionSetup';
import TimerOverlay from './focus/TimerOverlay';
import SessionOutcomeModal from './focus/SessionOutcomeModal';
import FocusHeatmap from './focus/FocusHeatmap';

export default function FocusTab() {
  const { focusSessions, addFocusSession, goals } = useStore();
  const { tasks } = useTasks();
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  
  const [sessionConfig, setSessionConfig] = useState({
    durationMinutes: 25,
    type: 'Deep Work',
    intention: '',
    linkedTask: null as string | null,
    linkedGoal: null as string | null,
    breakMinutes: 5,
    numBreaks: 1
  });

  const handleStartSession = (
    durationMinutes: number, 
    type: string, 
    intention: string, 
    linkedTask: string | null, 
    linkedGoal: string | null, 
    breakMinutes: number,
    numBreaks: number
  ) => {
    setSessionConfig({ durationMinutes, type, intention, linkedTask, linkedGoal, breakMinutes, numBreaks });
    setIsSessionActive(true);
  };

  const handleSessionComplete = () => {
    setIsSessionActive(false);
    setShowOutcome(true);
  };

  const handleSessionCancel = () => {
    setIsSessionActive(false);
  };

  const handleSaveOutcome = (outcome: string, rating: number) => {
    addFocusSession({
      id: crypto.randomUUID(),
      title: sessionConfig.type,
      outcome,
      durationMinutes: sessionConfig.durationMinutes,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: Date.now()
    });
    setShowOutcome(false);
  };

  // Analytics Stats
  const sortedSessions = [...focusSessions].sort((a, b) => b.createdAt - a.createdAt);
  let streak = 0;
  let currentDate = new Date();
  for (let i = 0; i < 365; i++) {
    const d = subDays(currentDate, i);
    const hasSession = sortedSessions.some(s => isSameDay(parseISO(s.date), d));
    if (hasSession) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const bestDay = sortedSessions.reduce((best, s) => {
    const dayMins = sortedSessions.filter(ss => ss.date === s.date).reduce((sum, ss) => sum + ss.durationMinutes, 0);
    return dayMins > best.mins ? { date: s.date, mins: dayMins } : best;
  }, { date: '-', mins: 0 });

  const weeklyMins = sortedSessions.filter(s => differenceInDays(new Date(), parseISO(s.date)) < 7)
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const totalMins = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const linkedTaskObj = sessionConfig.linkedTask ? tasks.find(t => t.id === sessionConfig.linkedTask) : null;
  const linkedGoalObj = sessionConfig.linkedGoal ? goals.find(g => g.id === sessionConfig.linkedGoal) : null;
  const linkedName = linkedTaskObj ? linkedTaskObj.title : (linkedGoalObj ? linkedGoalObj.title : null);

  return (
    <div className="pb-24">
      {isSessionActive && (
        <TimerOverlay 
          durationMinutes={sessionConfig.durationMinutes}
          breakMinutes={sessionConfig.breakMinutes}
          numBreaks={sessionConfig.numBreaks}
          sessionType={sessionConfig.type}
          intention={sessionConfig.intention}
          linkedName={linkedName}
          onComplete={handleSessionComplete}
          onCancel={handleSessionCancel}
        />
      )}

      {showOutcome && (
        <SessionOutcomeModal onSave={handleSaveOutcome} />
      )}

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-h1 font-bold text-text-primary mb-2">Focus</h1>
          <p className="text-text-secondary text-sm">Deep work zone. Everything else can wait.</p>
        </div>
      </div>

      <SessionSetup onStart={handleStartSession} />

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><Flame size={14} className="text-warning" /> Streak</div>
          <div className="text-h3 font-bold text-text-primary">{streak} <span className="text-sm font-medium text-text-secondary">days</span></div>
        </div>
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><Clock size={14} className="text-accent" /> Total</div>
          <div className="text-h3 font-bold text-text-primary">{Math.floor(totalMins/60)}<span className="text-sm font-medium text-text-secondary">h</span> {totalMins%60}<span className="text-sm font-medium text-text-secondary">m</span></div>
        </div>
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><CalendarDays size={14} className="text-success" /> Weekly</div>
          <div className="text-h3 font-bold text-text-primary">{Math.floor(weeklyMins/60)}<span className="text-sm font-medium text-text-secondary">h</span> {weeklyMins%60}<span className="text-sm font-medium text-text-secondary">m</span></div>
        </div>
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2"><Trophy size={14} className="text-warning" /> Best Day</div>
          <div className="text-xl font-bold truncate text-text-primary">{bestDay.mins === 0 ? '-' : `${Math.floor(bestDay.mins/60)}h ${bestDay.mins%60}m`}</div>
        </div>
      </div>

      <FocusHeatmap sessions={focusSessions} />

      {/* Focus History Log Section */}
      <div className="mt-8 bg-surface-1 border border-border rounded-2xl p-6 shadow-1 select-none">
         <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
               <History size={16} className="text-accent" />
               <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">Recent Sessions Log</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-text-muted bg-surface-2 border border-border rounded-full px-2.5 py-0.5">
               Total: {focusSessions.length}
            </span>
         </div>

         {sortedSessions.length > 0 ? (
            <div className="space-y-3">
               {sortedSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-4 bg-surface-2/45 border border-border hover:border-accent/15 rounded-xl transition-all hover:scale-[1.005] flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
                     <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase select-none ${
                              session.title === 'Deep Work' ? 'bg-accent/10 text-accent border border-accent/15' :
                              session.title === 'Creative Work' ? 'bg-violet-900/10 text-violet-400 border border-violet-900/20' :
                              session.title === 'Learning' ? 'bg-success/10 text-success border border-success/15' :
                              'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                           }`}>
                              {session.title || 'Focus Session'}
                           </span>
                           <span className="text-xs font-bold text-text-primary">{session.durationMinutes} min focus</span>
                        </div>
                        {session.outcome && (
                           <p className="text-xs text-text-secondary pl-0.5 pt-1 font-medium italic">
                              "{session.outcome}"
                           </p>
                        )}
                     </div>
                     <span className="text-[10px] text-text-muted font-mono self-end md:self-center font-bold">
                        {format(new Date(session.createdAt), 'MMM d, yyyy · h:mm a')}
                     </span>
                  </div>
               ))}
            </div>
         ) : (
            <div className="py-8 text-center rounded-xl border border-dashed border-border/80 bg-surface-1/50">
               <span className="text-xs text-text-muted italic block">
                  No focus sessions recorded yet. Customize and start your first session above!
               </span>
            </div>
         )}
      </div>
    </div>
  );
}
