'use client';

import { useState } from 'react';
import { useStore } from '../lib/store';
import { useTasks } from '../lib/contexts/TaskContext';
import { differenceInDays, format, subDays, parseISO, isSameDay } from 'date-fns';
import { Flame, Trophy, Clock, CalendarDays, History, Trash2, ChevronDown, ChevronUp, FileText, Star } from 'lucide-react';
import SessionSetup from './focus/SessionSetup';
import FocusHeatmap from './focus/FocusHeatmap';
import { saveFocusSessionToFirestore, deleteFocusSessionFromFirestore, deleteBrainDumpFromFirestore } from '../lib/firebaseSync';

export default function FocusTab() {
  const { 
    focusSessions, 
    addFocusSession, 
    deleteFocusSession, 
    brainDumps, 
    removeBrainDump, 
    goals,
    activeFocusSessionId,
    setActiveFocusSessionId,
    activeFocusSessionConfig,
    setActiveFocusSessionConfig,
  } = useStore();
  const { tasks } = useTasks();
  
  // Collapse controller for session notes section
  const [expandedSessionNotesId, setExpandedSessionNotesId] = useState<string | null>(null);
  // Deletion confirmation ID selector
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);

  const handleStartSession = (
    durationMinutes: number, 
    type: string, 
    intention: string, 
    linkedTask: string | null, 
    linkedGoal: string | null, 
    breakMinutes: number,
    numBreaks: number
  ) => {
    const nextId = crypto.randomUUID();
    const linkedTaskObj = linkedTask ? tasks.find(t => t.id === linkedTask) : null;
    const linkedGoalObj = linkedGoal ? goals.find(g => g.id === linkedGoal) : null;
    const linkedName = linkedTaskObj ? linkedTaskObj.title : (linkedGoalObj ? linkedGoalObj.title : null);
    
    setActiveFocusSessionId(nextId);
    setActiveFocusSessionConfig({
      durationMinutes,
      breakMinutes,
      numBreaks,
      type,
      intention,
      linkedName
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    // 1. Call Zustand action (automatically cascades removes associated brain dumps locally)
    deleteFocusSession(sessionId);

    // 2. Call safety Firestore rules deletion
    try {
      await deleteFocusSessionFromFirestore(sessionId);
    } catch (err) {
      console.error('Firestore delete failed: ', err);
    }

    setConfirmDeleteSessionId(null);
  };

  const handleDeleteBrainDump = async (sessionId: string, dumpId: string) => {
    removeBrainDump(dumpId);
    try {
      await deleteBrainDumpFromFirestore(sessionId, dumpId);
    } catch (err) {
      console.error('Firestore dump delete failed: ', err);
    }
  };

  // Analytics Calculations
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
      <div className="flex items-end justify-between mb-8 select-none">
        <div>
          <h1 className="text-h1 font-bold text-text-primary mb-2">Focus</h1>
          <p className="text-text-secondary text-sm">Deep work zone. Everything else can wait.</p>
        </div>
      </div>

      <SessionSetup onStart={handleStartSession} />

      {/* Analytics Dashboard Matrix Grid */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
            <Flame size={14} className="text-warning" /> Streak
          </div>
          <div className="text-h3 font-bold text-text-primary">{streak} <span className="text-sm font-medium text-text-secondary">days</span></div>
        </div>
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
            <Clock size={14} className="text-accent" /> Total
          </div>
          <div className="text-h3 font-bold text-text-primary">{Math.floor(totalMins/60)}<span className="text-sm font-medium text-text-secondary">h</span> {totalMins%60}<span className="text-sm font-medium text-text-secondary">m</span></div>
        </div>
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
            <CalendarDays size={14} className="text-success" /> Weekly
          </div>
          <div className="text-h3 font-bold text-text-primary">{Math.floor(weeklyMins/60)}<span className="text-sm font-medium text-text-secondary">h</span> {weeklyMins%60}<span className="text-sm font-medium text-text-secondary">m</span></div>
        </div>
        <div className="p-5 bg-surface-1 border border-border rounded-xl shadow-1">
          <div className="text-micro text-text-muted uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
            <Trophy size={14} className="text-warning" /> Best Day
          </div>
          <div className="text-xl font-bold truncate text-text-primary">{bestDay.mins === 0 ? '-' : `${Math.floor(bestDay.mins/60)}h ${bestDay.mins%60}m`}</div>
        </div>
      </div>

      <FocusHeatmap sessions={focusSessions} />

      {/* Completed Focus Sessions History list */}
      <div className="mt-8 bg-surface-1 border border-border rounded-2xl p-6 shadow-1">
         <div className="flex items-center justify-between mb-5 select-none">
            <div className="flex items-center gap-2">
               <History size={16} className="text-accent" />
               <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">Recent Sessions Log</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-text-muted bg-surface-2 border border-border rounded-full px-2.5 py-0.5">
               Total: {focusSessions.length}
            </span>
         </div>

         {sortedSessions.length > 0 ? (
            <div className="space-y-4">
               {sortedSessions.slice(0, 10).map((session) => {
                  const relatedDumps = (brainDumps || []).filter(d => d.sessionId === session.id);
                  const isExpanded = expandedSessionNotesId === session.id;
                  const isDeleting = confirmDeleteSessionId === session.id;

                  return (
                    <div 
                      key={session.id} 
                      className="p-4 bg-surface-2/45 border border-border hover:border-accent/15 rounded-xl transition-all shadow-xs relative overflow-hidden"
                    >
                      {/* Interactive Confirmation Panel overlays card when deleting */}
                      {isDeleting ? (
                        <div className="absolute inset-0 bg-surface-1/95 border border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in z-10 select-none">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-primary">Delete Focus Record?</span>
                            <span className="text-[10px] text-text-muted">Associated notes in distractions compartment will also be removed.</span>
                          </div>
                          <div className="flex gap-2.5 self-end md:self-auto flex-shrink-0">
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-[10px] bg-red-500 text-white font-extrabold uppercase px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer text-center"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteSessionId(null)}
                              className="text-[10px] bg-surface-3 border border-border text-text-secondary font-extrabold uppercase px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors cursor-pointer text-center"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0 pr-4">
                           <div className="flex flex-wrap items-center gap-2 select-none">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                 session.title === 'Deep Work' ? 'bg-accent/10 text-accent border border-accent/15' :
                                 session.title === 'Creative Work' ? 'bg-violet-900/10 text-violet-400 border border-violet-900/20' :
                                 session.title === 'Learning' ? 'bg-success/10 text-success border border-success/15' :
                                 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                              }`}>
                                 {session.title || 'Focus Session'}
                              </span>
                              <span className="text-xs font-extrabold text-text-primary">{session.durationMinutes} min focus</span>
                              
                              {/* Display focus score rating stars */}
                              {session.rating && (
                                <div className="flex items-center gap-0.5 bg-surface-2 border border-border/80 px-1.5 py-0.5 rounded-md">
                                  {Array.from({ length: 5 }).map((_, starIdx) => (
                                    <Star 
                                      key={starIdx} 
                                      size={10} 
                                      className={starIdx < (session.rating || 0) ? 'text-warning fill-current' : 'text-surface-3'} 
                                    />
                                  ))}
                                </div>
                              )}
                           </div>
                           
                           {session.outcome && (
                              <p className="text-xs text-text-secondary pl-0.5 pt-1.5 font-medium italic truncate max-w-xl">
                                 “ {session.outcome} ”
                              </p>
                           )}
                        </div>

                        {/* Date indicator and Delete button */}
                        <div className="flex items-center gap-3 self-end md:self-auto select-none">
                          <span className="text-[10px] text-text-muted font-mono font-bold">
                             {format(new Date(session.createdAt), 'MMM d, yyyy · h:mm a')}
                          </span>
                          
                          <button
                            onClick={() => setConfirmDeleteSessionId(session.id)}
                            className="p-1.5 text-text-secondary hover:text-red-400 rounded-lg hover:bg-surface-2/60 transition-colors cursor-pointer"
                            title="Delete session record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Sticky collapsible notes shelf nested safely inside completed block */}
                      {relatedDumps.length > 0 && (
                        <div className="mt-3.5 border-t border-border/40 pt-2 font-sans select-none">
                           <button
                             type="button"
                             onClick={() => setExpandedSessionNotesId(isExpanded ? null : session.id)}
                             className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-text-primary uppercase tracking-wider cursor-pointer"
                           >
                              <FileText size={12} className="text-zinc-400" />
                              {isExpanded ? 'Hide' : 'Show'} captured notes ({relatedDumps.length})
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                           </button>

                           {isExpanded && (
                             <div className="mt-2.5 space-y-2 max-w-xl animate-fade-in pl-1">
                               {relatedDumps.map(dump => (
                                 <div 
                                   key={dump.id}
                                   className="flex items-start justify-between bg-surface-1/40 border border-border/30 rounded-lg p-2 gap-2 hover:border-accent/10 transition-colors group"
                                 >
                                    <span className="text-xs text-text-secondary leading-normal flex-1 font-medium">{dump.text}</span>
                                    <button 
                                      onClick={() => handleDeleteBrainDump(session.id, dump.id)}
                                      className="p-1 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                      title="Delete note"
                                    >
                                       <Trash2 size={11} />
                                    </button>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  );
               })}
            </div>
         ) : (
            <div className="py-12 text-center rounded-xl border border-dashed border-border/80 bg-surface-1/50 select-none">
               <span className="text-xs text-text-muted italic block">
                  No focus sessions recorded yet. Customize and start your first session above!
               </span>
            </div>
         )}
      </div>
    </div>
  );
}
