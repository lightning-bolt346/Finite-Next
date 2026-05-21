'use client';

import { useState } from 'react';
import { useStore } from '../lib/store';
import { differenceInDays, format, subDays, parseISO, isSameDay } from 'date-fns';
import { Flame, Trophy, Clock, CalendarDays } from 'lucide-react';
import SessionSetup from './focus/SessionSetup';
import TimerOverlay from './focus/TimerOverlay';
import SessionOutcomeModal from './focus/SessionOutcomeModal';
import FocusHeatmap from './focus/FocusHeatmap';

export default function FocusTab() {
  const { focusSessions, addFocusSession } = useStore();
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  
  const [sessionConfig, setSessionConfig] = useState({
    durationMinutes: 25,
    type: 'Deep Work 🧠',
    intention: '',
    linkedTask: null as string | null,
    linkedGoal: null as string | null
  });

  const handleStartSession = (durationMinutes: number, type: string, intention: string, linkedTask: string | null, linkedGoal: string | null) => {
    setSessionConfig({ durationMinutes, type, intention, linkedTask, linkedGoal });
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

  return (
    <div className="pb-24">
      {isSessionActive && (
        <TimerOverlay 
          durationMinutes={sessionConfig.durationMinutes}
          sessionType={sessionConfig.type}
          intention={sessionConfig.intention}
          linkedName={null}
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
    </div>
  );
}
