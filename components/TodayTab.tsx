'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Clock, Target, CalendarDays, X, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

export default function TodayTab() {
  const { events, addEvent, deleteEvent, goals, updateGoal } = useStore();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '09:00', endTime: '10:00' });

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

  const todayEvents = events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const activeGoals = goals.filter(g => g.status === 'active' && g.category === 'short'); // using 'short' as today proxy

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Today</h1>
          <p className="text-[#a1a1aa] text-sm">Personal command center.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Agenda */}
        <div className="space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays size={18} className="text-[#38bdf8]" /> Agenda
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
                  className="mb-6 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.05]"
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

            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="text-center py-8 text-[#71717a] text-sm">
                  No events scheduled for today.
                </div>
              ) : (
                todayEvents.map(event => (
                  <div key={event.id} className="group relative flex items-stretch gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                    <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-[#38bdf8]" />
                    <div className="flex flex-col justify-center min-w-[60px]">
                      <span className="text-sm font-mono text-white/80">{event.startTime}</span>
                      <span className="text-xs font-mono text-[#71717a]">{event.endTime}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="font-medium text-white/90">{event.title}</span>
                    </div>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-[#71717a] hover:text-red-400 transition-all rounded-full hover:bg-white/5"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Focus */}
        <div className="space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Target size={18} className="text-[#a78bfa]" /> Today&apos;s Focus
            </h2>

            {activeGoals.length === 0 ? (
              <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                <Target size={32} className="mx-auto mb-3 text-[#71717a]/50" />
                <p className="text-[#71717a] text-sm">No main goal set for today.</p>
                <p className="text-xs text-[#71717a] mt-1">Set one from the Goals tab.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map(goal => (
                  <div key={goal.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                    <button 
                      onClick={() => updateGoal(goal.id, { status: 'completed' })}
                      className="text-[#71717a] hover:text-[#34d399] transition-colors"
                    >
                      <Circle size={20} />
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-white/90">{goal.title}</p>
                      <p className="text-xs text-[#a1a1aa] uppercase tracking-wider mt-1">{goal.category} term</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
