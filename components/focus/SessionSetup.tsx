'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../../lib/contexts/TaskContext';
import { useStore } from '../../lib/store';
import SoundMixer from '../sound/SoundMixer';
import BrainDumpCard from './BrainDumpCard';
import { computeValidBreakOptions, BreakPlan } from '../../lib/breakBudget';
import { ChevronDown, Sparkles } from 'lucide-react';

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

  // Math Limit: Total break minutes cannot exceed 30% of total focus session minutes
  const maxBreakLimit = useMemo(() => {
    return Math.floor(duration * 0.3);
  }, [duration]);

  // Enforce the 30% limit dynamically on the input limit
  useEffect(() => {
    if (breakLimit > maxBreakLimit) {
      setBreakLimit(maxBreakLimit);
    }
  }, [maxBreakLimit, breakLimit]);

  // Compute valid options using the correct mathematical breakdown
  const validPlans = useMemo(() => {
    return computeValidBreakOptions(duration, breakLimit);
  }, [duration, breakLimit]);

  // Dynamically keep numBreaks valid depending on the computed plans
  useEffect(() => {
    if (breakLimit === 0) {
      setNumBreaks(0);
      return;
    }
    const exists = numBreaks === 0 || validPlans.some(p => p.breakCount === numBreaks);
    if (!exists) {
      if (validPlans.length > 0) {
        setNumBreaks(validPlans[0].breakCount);
      } else {
        setNumBreaks(0);
      }
    }
  }, [validPlans, breakLimit, numBreaks]);

  const activePlan = useMemo(() => {
    return validPlans.find(p => p.breakCount === numBreaks);
  }, [validPlans, numBreaks]);

  const isStartDisabled = useMemo(() => {
    if (duration < 5) return true;
    if (numBreaks === 0) return false;
    return !validPlans.some(p => p.breakCount === numBreaks);
  }, [duration, numBreaks, validPlans]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStartDisabled) return;
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
    if (numBreaks === 0 || breakLimit === 0 || !activePlan) {
      return (
        <div className="flex items-center gap-2.5 w-full bg-surface-2/40 p-4 rounded-xl border border-border/50">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-bold text-text-primary">Continuous flow: {duration}m Focus block</span>
        </div>
      );
    }
    
    return (
      <div className="space-y-2 mt-2 bg-surface-2/10 p-4 rounded-xl border border-border/40 select-none">
        <span className="text-[10px] text-text-muted uppercase tracking-widest font-extrabold block">Session Breakdown</span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {activePlan.intervals.map((interval, i) => {
            const isFocus = interval.type === 'focus';
            return (
              <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`px-3 py-2 rounded-lg text-center flex flex-col items-center justify-center min-w-[75px] border ${
                  isFocus ? 'bg-accent/10 border-accent/20' : 'bg-success/10 border-success/15'
                }`}>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest leading-none ${
                    isFocus ? 'text-accent' : 'text-success'
                  }`}>
                    {isFocus ? 'Focus' : 'Break'}
                  </span>
                  <span className="text-xs font-bold text-text-primary mt-1">{interval.minutes}m</span>
                </span>
                {i < activePlan.intervals.length - 1 && (
                  <span className="text-text-muted text-xs font-mono px-0.5">──</span>
                )}
              </div>
            );
          })}
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
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-2 border-border text-text-secondary hover:border-text-muted'}`}
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
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected ? 'bg-success/10 border-success text-success' : 'bg-surface-2 border-border text-text-secondary hover:border-text-muted'}`}
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
                    <label className="text-xs text-text-secondary uppercase tracking-wider font-bold">Total Work block</label>
                    <span className="text-[10px] text-accent font-mono font-bold">{duration} minutes</span>
                  </div>
                  <input 
                    type="number"
                    min="5"
                    max="360"
                    title="Focus duration"
                    value={duration}
                    onChange={e => {
                      const val = Math.max(5, Number(e.target.value));
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
                    <label className="text-xs text-text-secondary uppercase tracking-wider font-bold">Each Break</label>
                    <span className="text-[10px] text-success font-mono font-bold">{breakLimit} minutes</span>
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
                  <div className="flex justify-between mt-1.5 flex-col md:flex-row gap-1">
                    <span className="text-[10px] text-text-muted leading-none">Max breaks budget (30%): {maxBreakLimit}m</span>
                    <div className="flex gap-1 self-end md:self-auto">
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

              <div className="space-y-4">
                {/* Visual ADHD-friendly Break Count Selector Cards */}
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-bold block mb-2">Available Sprints & Breaks Options</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Always allow 0 breaks */}
                    <button
                      type="button"
                      onClick={() => setNumBreaks(0)}
                      className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        numBreaks === 0
                          ? 'bg-accent/10 border-accent text-accent shadow-sm'
                          : 'bg-surface-2/40 border-border hover:border-text-muted text-text-secondary'
                      }`}
                    >
                      <span className="text-xs font-bold text-text-primary">Continuous Sprint</span>
                      <span className="text-[10px] text-text-muted mt-1 font-medium">Single focusing block of {duration}m.</span>
                    </button>

                    {validPlans.map((plan) => (
                      <button
                        key={plan.breakCount}
                        type="button"
                        onClick={() => setNumBreaks(plan.breakCount)}
                        className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          numBreaks === plan.breakCount
                            ? 'bg-success/10 border-success text-success shadow-sm'
                            : 'bg-surface-2/40 border-border hover:border-text-muted text-text-secondary'
                        }`}
                      >
                        <span className="text-xs font-bold text-text-primary flex items-center justify-between">
                          <span>{plan.breakCount} Break{plan.breakCount > 1 ? 's' : ''}</span>
                          <span className="text-[10px] font-mono text-success font-bold bg-success/10 px-1.5 py-0.5 rounded">{plan.breakPercentage}% rest</span>
                        </span>
                        <span className="text-[10px] text-text-muted mt-1 font-medium italic">
                          {plan.breakCount + 1} focus blocks of {plan.focusBlockMinutes}m each.
                        </span>
                      </button>
                    ))}
                  </div>

                  {breakLimit > 0 && validPlans.length === 0 && (
                    <div className="text-xs text-warning border border-warning/15 bg-warning/5 px-3 py-2 rounded-xl mt-2 flex items-center gap-1.5 font-medium leading-normal animate-fade-in select-none">
                      <Sparkles size={14} className="flex-shrink-0" />
                      No valid breaking intervals fit within the 30% rule. Only continuous blocks are allowed at this duration.
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wider font-bold block mb-1.5">Focus Type</label>
                  <div className="relative">
                    <select 
                       title="Session Type"
                       value={sessionType} onChange={e => setSessionType(e.target.value)}
                       className="w-full bg-surface-2/40 hover:bg-surface-2 border border-border rounded-xl px-4 py-3 pr-10 text-sm text-text-primary focus:outline-none focus:border-accent transition-all cursor-pointer shadow-sm font-medium appearance-none"
                    >
                       <option value="Deep Work" className="bg-surface-1">Deep Work (Highly Selective)</option>
                       <option value="Creative Work" className="bg-surface-1">Creative Flow & Sprints</option>
                       <option value="Admin & Tasks" className="bg-surface-1">Admin, Inbox & Tasks</option>
                       <option value="Learning" className="bg-surface-1">Study & Active Recall</option>
                    </select>
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-text-muted">
                      <ChevronDown size={14} />
                    </div>
                  </div>
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

            <button 
              type="submit" 
              disabled={isStartDisabled}
              className="w-full py-4 mt-4 bg-accent text-bg rounded-xl text-lg font-bold shadow-[0_0_20px_var(--color-accent-soft)] hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enter the Dark Room
            </button>
          </form>
        </div>
      </div>

      <div>
        <div className="bg-surface-1 border border-border p-6 rounded-2xl shadow-1 font-sans">
           <SoundMixer />
         </div>
         <BrainDumpCard />
      </div>
    </div>
  );
}
