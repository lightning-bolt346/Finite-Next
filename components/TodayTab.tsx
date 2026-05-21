'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Clock, Target, CalendarDays, X, CheckCircle2, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';

const START_HOUR = 6;
const END_HOUR = 24;
const HOURS_COUNT = END_HOUR - START_HOUR;
const TIMELINE_HEIGHT = HOURS_COUNT * 60; // 60px per hour

export default function TodayTab() {
  const { events, addEvent, deleteEvent, goals, updateGoal, todayGoals, setTodayGoal, archiveTodayGoal } = useStore();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '09:00', endTime: '10:00' });
  const [now, setNow] = useState(new Date());

  const todayDate = now.toLocaleDateString('en-CA');
  const [todayGoalForm, setTodayGoalForm] = useState<{title: string, doneText: string, priority: 'Normal'|'High'|'Critical', minutes: number}>({ title: '', doneText: '', priority: 'Normal', minutes: 60 });
  const todayGoal = todayGoals[todayDate] && !todayGoals[todayDate].archived ? todayGoals[todayDate] : null;

  useEffect(() => {
    setTimeout(() => setNow(new Date()), 0);
    const interval = setInterval(() => setNow(new Date()), 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    addEvent({
      id: crypto.randomUUID(),
      title: newEvent.title,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      createdAt: Date.now()
    });
    setNewEvent({ title: '', startTime: '09:00', endTime: '10:00' });
    setShowAddEvent(false);
  };

  const handleSetTodayGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayGoalForm.title.trim()) return;
    setTodayGoal(todayDate, {
      ...todayGoalForm,
      completed: false,
      date: todayDate,
      createdAt: Date.now(),
      id: crypto.randomUUID()
    });
  };

  const todayEvents = events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const activeGoals = goals.filter(g => g.status === 'active' && g.category === 'short');

  const getEventStyle = (start: string, end: string) => {
    const [shr, smin] = start.split(':').map(Number);
    const [ehr, emin] = end.split(':').map(Number);
    
    let startMins = Math.max(0, (shr - START_HOUR) * 60 + smin);
    let endMins = (ehr - START_HOUR) * 60 + emin;
    if (ehr === 0) endMins = (24 - START_HOUR) * 60 + emin; // handle midnight
    
    const duration = Math.max(20, endMins - startMins); // min 20px height
    
    return {
      top: `${startMins}px`,
      height: `${duration}px`
    };
  };

  // Calculate stats
  const totalEventsCount = todayEvents.length;
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();
  const openDeadlinesMins = todayEvents.reduce((acc, ev) => {
    const [ehr, emin] = ev.endTime.split(':').map(Number);
    const endMins = ehr * 60 + emin;
    if (endMins > currentTotalMins) {
      const [shr, smin] = ev.startTime.split(':').map(Number);
      const startMins = shr * 60 + smin;
      const effectiveStart = Math.max(startMins, currentTotalMins);
      acc += Math.max(0, endMins - effectiveStart);
    }
    return acc;
  }, 0);
  const completedGoalsCount = goals.filter(g => g.status === 'completed' && g.category === 'short').length;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const showCurrentTimeLine = currentHour >= START_HOUR && currentHour < END_HOUR;
  const currentTimeTop = (currentHour - START_HOUR) * 60 + currentMinute;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Today</h1>
          <p className="text-[#a1a1aa] text-sm">Personal command center.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center gap-3">
          <CalendarDays size={20} className="text-[#38bdf8]" />
          <div>
            <div className="text-xl font-bold text-white/90">{totalEventsCount}</div>
            <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Events Today</div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center gap-3">
          <Clock size={20} className="text-[#a78bfa]" />
          <div>
            <div className="text-xl font-bold text-white/90">{openDeadlinesMins}m</div>
            <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Open Deadlines</div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center gap-3">
          <Target size={20} className="text-[#34d399]" />
          <div>
            <div className="text-xl font-bold text-white/90">{completedGoalsCount}</div>
            <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Goals Completed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Agenda Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays size={18} className="text-[#38bdf8]" /> Agenda Timeline
              </h2>
              <button 
                onClick={() => setShowAddEvent(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <AnimatePresence>
              {showAddEvent && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddEvent}
                  className="mb-6 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.05] overflow-hidden"
                >
                  <input 
                    type="text" 
                    placeholder="Event title" 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full bg-transparent border-none text-white focus:outline-none placeholder:text-[#71717a] font-medium mb-4"
                    autoFocus
                  />
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Start</label>
                      <input 
                        type="time" 
                        value={newEvent.startTime}
                        onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">End</label>
                      <input 
                        type="time" 
                        value={newEvent.endTime}
                        onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddEvent(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-[#a78bfa] text-white hover:bg-[#8b5cf6] transition-colors">Add Block</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="relative border-l border-white/5 ml-14 sm:ml-16 mt-4" style={{ height: TIMELINE_HEIGHT }}>
              {/* Hour Grid Lines */}
              {Array.from({ length: HOURS_COUNT + 1 }).map((_, i) => (
                <div key={i} className="absolute w-full border-t border-white/5" style={{ top: i * 60 }}>
                  <span className="absolute -left-14 sm:-left-16 -top-3 w-12 text-right text-xs font-mono text-[#71717a]">
                    {String(START_HOUR + i).padStart(2, '0')}:00
                  </span>
                </div>
              ))}

              {/* Current Time Line */}
              {showCurrentTimeLine && (
                <div 
                  className="absolute left-0 right-0 z-20 border-t border-[#34d399] shadow-[0_0_8px_#34d399]"
                  style={{ top: currentTimeTop }}
                >
                  <div className="absolute -left-[5px] -top-[5px] w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                </div>
              )}

              {/* Event Blocks */}
              {todayEvents.map(event => {
                const style = getEventStyle(event.startTime, event.endTime);
                return (
                  <div 
                    key={event.id}
                    className="absolute left-2 right-2 sm:right-6 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 overflow-hidden group hover:bg-[#38bdf8]/20 hover:border-[#38bdf8]/50 transition-colors z-10 p-2 sm:p-3 shadow-md"
                    style={style}
                  >
                    <div className="flex justify-between items-start h-full">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs sm:text-sm font-bold text-[#38bdf8] truncate">{event.title}</span>
                        <span className="text-[10px] sm:text-xs font-mono text-[#38bdf8]/70 mt-0.5">{event.startTime} - {event.endTime}</span>
                      </div>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2 p-1 text-[#38bdf8]/70 hover:text-red-400 hover:bg-white/10 rounded transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Focus */}
        <div className="space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-white/90">
              <Target size={18} className="text-[#a78bfa]" /> Today&apos;s Goal
            </h2>

            {todayGoal ? (
              <div className="p-5 rounded-2xl border border-[#a78bfa]/30 bg-gradient-to-br from-[#a78bfa]/10 to-transparent">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]">{todayGoal.priority} Priority</span>
                  <span className="text-[10px] font-mono text-[#a1a1aa] bg-white/10 px-2 py-0.5 rounded-full">{todayGoal.minutes}m focus</span>
                </div>
                <h3 className={`text-xl font-bold mb-2 transition-all ${todayGoal.completed ? 'text-white/50 line-through' : 'text-white/90'}`}>
                  {todayGoal.title}
                </h3>
                <p className="text-sm text-[#a1a1aa] mb-5">Done means: {todayGoal.doneText || 'Not specified'}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTodayGoal(todayDate, { completed: !todayGoal.completed })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      todayGoal.completed ? 'bg-white/10 text-white/90 hover:bg-white/20' : 'bg-[#a78bfa] text-white hover:bg-[#8b5cf6]'
                    }`}
                  >
                    {todayGoal.completed ? 'Mark Open' : 'Mark Done'}
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("Reset today's goal?")) {
                        archiveTodayGoal(todayDate);
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#a1a1aa] transition-colors"
                    title="Reset Goal"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSetTodayGoal} className="space-y-4">
                <div>
                  <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">One Main Goal</label>
                  <input 
                    required 
                    value={todayGoalForm.title} onChange={e => setTodayGoalForm({...todayGoalForm, title: e.target.value})}
                    placeholder="e.g. Finish the homepage"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Definition of Done</label>
                  <input 
                    value={todayGoalForm.doneText} onChange={e => setTodayGoalForm({...todayGoalForm, doneText: e.target.value})}
                    placeholder="What exactly counts as done?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Priority</label>
                    <select 
                      value={todayGoalForm.priority} onChange={e => setTodayGoalForm({...todayGoalForm, priority: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa] appearance-none"
                    >
                      <option className="bg-[#12131a]">Normal</option>
                      <option className="bg-[#12131a]">High</option>
                      <option className="bg-[#12131a]">Critical</option>
                    </select>
                  </div>
                  <div className="w-[100px]">
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Mins</label>
                    <input 
                      type="number" min="5" value={todayGoalForm.minutes} onChange={e => setTodayGoalForm({...todayGoalForm, minutes: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 mt-2 bg-[#a78bfa] text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:bg-[#8b5cf6] transition-colors">
                  Set Today&apos;s Goal
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
