'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../../lib/contexts/TaskContext';
import { useStore } from '../../lib/store';
import SoundMixer from '../sound/SoundMixer';

interface SessionSetupProps {
  onStart: (
    durationMinutes: number, 
    type: string, 
    intention: string, 
    linkedTask: string | null, 
    linkedGoal: string | null, 
    breakMinutes: number,
    numBreaks: number
  ) => void;
}

export default function SessionSetup({ onStart }: SessionSetupProps) {
  const [duration, setDuration] = useState<number>(25);
  const [breakLimit, setBreakLimit] = useState<number>(5);
  const [numBreaks, setNumBreaks] = useState<number>(1);
  const [sessionType, setSessionType] = useState<string>('Deep Work');
  const [intention, setIntention] = useState('');
  const [selectedLink, setSelectedLink] = useState<{ type: 'task' | 'goal', id: string } | null>(null);

  const { tasks } = useTasks();
  const { goals } = useStore();

  const activeTasks = tasks.filter(t => !t.completed);
  const activeGoals = goals.filter(g => g.status === 'active');

  const maxPossibleBreaks = useMemo(() => {
    if (duration < 10) return 0;
    // Each segment must be at least 5 minutes of work
    return Math.min(8, Math.floor(duration / 5) - 1);
  }, [duration]);

  // Keep chosen breaks within limits
  useEffect(() => {
    if (numBreaks > maxPossibleBreaks) {
      setNumBreaks(maxPossibleBreaks);
    }
  }, [maxPossibleBreaks, numBreaks]);

  const maxBreakLimit = useMemo(() => {
    return Math.floor(duration * 0.4);
  }, [duration]);

  useEffect(() => {
    if (breakLimit > maxBreakLimit) {
      setBreakLimit(maxBreakLimit);
    }
  }, [maxBreakLimit, breakLimit]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(
      duration,
      sessionType,
      intention,
      selectedLink?.type === 'task' ? selectedLink.id : null,
      selectedLink?.type === 'goal' ? selectedLink.id : null,
      breakLimit,
      numBreaks
    );
  };

  const renderTimelinePreview = () => {
    if (numBreaks === 0 || breakLimit === 0) {
      return (
        <div className="flex items-center gap-2 w-full bg-surface-2/40 p-4 rounded-xl border border-border/50">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-bold text-text-primary">Fully continuous Focus Segment ({duration} mins)</span>
        </div>
      );
    }
    
    const segmentDuration = Math.floor(duration / (numBreaks + 1));
    const timeline: React.ReactNode[] = [];
    
    for (let i = 0; i < numBreaks; i++) {
      timeline.push(
        <span key={`focus-${i}`} className="flex-1 min-w-[70px] bg-accent/15 border border-accent/20 px-3 py-2 rounded-lg text-center flex flex-col items-center justify-center">
          <span className="text-[10px] font-extrabold uppercase text-accent tracking-widest leading-none">Focus</span>
          <span className="text-xs font-bold text-text-primary mt-1">{segmentDuration}m</span>
        </span>
      );
      timeline.push(
        <span key={`arrow-${i}`} className="text-text-muted text-xs font-bold font-mono px-1 flex-shrink-0">──</span>
      );
      timeline.push(
        <span key={`break-${i}`} className="flex-0 min-w-[65px] bg-success/10 border border-success/15 px-3 py-2 rounded-lg text-center flex flex-col items-center justify-center">
          <span className="text-[10px] font-extrabold uppercase text-success tracking-widest leading-none">Break</span>
          <span className="text-xs font-bold text-text-primary mt-1">{breakLimit}m</span>
        </span>
      );
      timeline.push(
        <span key={`arrow2-${i}`} className="text-text-muted text-xs font-bold font-mono px-1 flex-shrink-0">──</span>
      );
    }
    
    timeline.push(
      <span key={`focus-last`} className="flex-1 min-w-[70px] bg-accent/15 border border-accent/20 px-3 py-2 rounded-lg text-center flex flex-col items-center justify-center">
        <span className="text-[10px] font-extrabold uppercase text-accent tracking-widest leading-none">Focus</span>
        <span className="text-xs font-bold text-text-primary mt-1">{segmentDuration}m</span>
      </span>
    );
    
    return (
      <div className="space-y-2 mt-2 bg-surface-2/10 p-4 rounded-xl border border-border/40">
        <span className="text-[10px] text-text-muted uppercase tracking-widest font-extrabold block">Live Focus Flow Timeline</span>
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {timeline}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-surface-1 border border-border p-6 rounded-2xl shadow-1">
          <h2 className="text-h2 font-bold mb-6 text-text-primary">Customize Session</h2>
          <form onSubmit={handleStart} className="space-y-6">
            
            <div>
              <label className="text-micro text-text-muted block mb-3 uppercase tracking-wider font-semibold">Related Task or Goal</label>
              
              <div className="space-y-4">
                 {activeTasks.length > 0 && (
                   <div>
                     <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2 block">Today's Tasks</span>
                     <div className="flex flex-wrap gap-2">
                        {activeTasks.map(t => {
                          const isSelected = selectedLink?.id === t.id && selectedLink?.type === 'task';
                          return (
                            <button
                              key={`task_${t.id}`}
                              type="button"
                              onClick={() => setSelectedLink(isSelected ? null : { type: 'task', id: t.id })}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${isSelected ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-2 border-border text-text-secondary hover:border-text-muted'}`}
                            >
                              {t.title}
                            </button>
                          );
                        })}
                     </div>
                   </div>
                 )}

                 {activeGoals.length > 0 && (
                   <div>
                     <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2 block">Active Goals</span>
                     <div className="flex flex-wrap gap-2">
                        {activeGoals.map(g => {
                          const isSelected = selectedLink?.id === g.id && selectedLink?.type === 'goal';
                          return (
                            <button
                              key={`goal_${g.id}`}
                              type="button"
                              onClick={() => setSelectedLink(isSelected ? null : { type: 'goal', id: g.id })}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${isSelected ? 'bg-success/10 border-success text-success' : 'bg-surface-2 border-border text-text-secondary hover:border-text-muted'}`}
                            >
                              {g.title}
                            </button>
                          );
                        })}
                     </div>
                   </div>
                 )}
                 
                 {activeTasks.length === 0 && activeGoals.length === 0 && (
                    <div className="text-xs text-text-muted italic">No active tasks or goals available.</div>
                 )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-text-secondary uppercase tracking-wider font-bold">Total Focus time</label>
                    <span className="text-[10px] text-accent font-mono font-bold">{duration} minutes</span>
                  </div>
                  <input 
                    type="number"
                    min="5"
                    max="360"
                    title="Focus duration"
                    value={duration}
                    onChange={e => {
                      const val = Math.max(1, Number(e.target.value));
                      setDuration(val);
                    }}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus:border-accent shadow-inner transition-colors font-mono"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[25, 50, 90, 120].map(m => (
                      <button
                        key={`m-${m}`}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-all font-semibold cursor-pointer ${duration === m ? 'bg-accent/15 border-accent text-accent' : 'bg-surface-2/40 border-border text-text-muted hover:text-text-primary hover:border-text-muted'}`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-text-secondary uppercase tracking-wider font-bold">Break Duration</label>
                    <span className="text-[10px] text-success font-mono font-bold">{breakLimit} minutes each</span>
                  </div>
                  <input 
                    type="number"
                    min="0"
                    max={maxBreakLimit}
                    title="Break duration"
                    value={breakLimit}
                    onChange={e => {
                      const val = Math.max(0, Number(e.target.value));
                      setBreakLimit(Math.min(val, maxBreakLimit));
                    }}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus:border-accent shadow-inner transition-colors font-mono"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-text-muted leading-none">Max allowed (40%): {maxBreakLimit}m</span>
                    <div className="flex gap-1">
                      {[0, 5, 10, 15].map(b => {
                        const isAllowed = b <= maxBreakLimit;
                        return (
                          <button
                            key={`b-${b}`}
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => setBreakLimit(b)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-all font-semibold cursor-pointer ${!isAllowed ? 'opacity-30 cursor-not-allowed' : (breakLimit === b ? 'bg-success/15 border-success text-success' : 'bg-surface-2/40 border-border text-text-muted hover:text-text-primary hover:border-text-muted')}`}
                          >
                            {b === 0 ? 'None' : `${b}m`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-bold block mb-1.5">Number of Breaks</label>
                  <select 
                     title="Number of Breaks"
                     value={numBreaks} 
                     onChange={e => setNumBreaks(Number(e.target.value))}
                     className="w-full bg-surface-2/40 hover:bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-all cursor-pointer shadow-sm font-medium"
                  >
                     {Array.from({ length: maxPossibleBreaks + 1 }, (_, i) => {
                       const blocksCount = i + 1;
                       const blockDuration = Math.floor(duration / blocksCount);
                       return (
                         <option key={i} value={i} className="bg-surface-1">
                           {i === 0 ? 'No breaks (Continuous)' : `${i} break${i > 1 ? 's' : ''} (${blockDuration}m blocks)`}
                         </option>
                       );
                     })}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-bold block mb-1.5">Focus Type</label>
                  <select 
                     title="Session Type"
                     value={sessionType} onChange={e => setSessionType(e.target.value)}
                     className="w-full bg-surface-2/40 hover:bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-all cursor-pointer shadow-sm font-medium"
                  >
                     <option value="Deep Work" className="bg-surface-1">Deep Work (Highly Selective)</option>
                     <option value="Creative Work" className="bg-surface-1">Creative Flow & Sprints</option>
                     <option value="Admin & Tasks" className="bg-surface-1">Admin, Inbox & Tasks</option>
                     <option value="Learning" className="bg-surface-1">Study & Active Recall</option>
                  </select>
                </div>
              </div>
            </div>

            {renderTimelinePreview()}

            <div>
              <label className="text-micro text-text-muted block mb-2 uppercase tracking-wider font-semibold">Intention</label>
              <input 
                type="text" 
                title="Intention"
                placeholder="What will you accomplish this session?"
                value={intention}
                onChange={e => setIntention(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <button type="submit" className="w-full py-4 mt-4 bg-accent text-bg rounded-xl text-lg font-bold shadow-[0_0_20px_var(--color-accent-soft)] hover:opacity-90 transition-opacity">
              Enter the Dark Room
            </button>
          </form>
        </div>
      </div>

      <div>
        <div className="bg-surface-1 border border-border p-6 rounded-2xl shadow-1">
           <SoundMixer />
        </div>
      </div>
    </div>
  );
}
