'use client';

import { useTasks, Task } from '../../lib/contexts/TaskContext';
import { useStore } from '../../lib/store';
import { Flame, Clock } from 'lucide-react';
import { differenceInDays, isSameDay, parseISO, subDays } from 'date-fns';
import { useState, useEffect } from 'react';

export default function DailyCommandSidebar() {
  const { tasks, intention, setIntention } = useTasks();
  const { focusSessions } = useStore();

  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isAfter6PM, setIsAfter6PM] = useState(false);

  useEffect(() => {
    const updateTimeLeft = () => {
      const n = new Date();
      setIsAfter6PM(n.getHours() >= 18);
      const eod = new Date();
      eod.setHours(23, 59, 59, 999);
      const diff = eod.getTime() - n.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeftStr(`${h}h ${m}m left today`);
      } else {
        setTimeLeftStr('Done for today');
      }
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const todaySessions = focusSessions.filter(s => isSameDay(parseISO(s.date), new Date()));
  const focusMinsToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const topPriorityTasks = tasks.filter(t => !t.completed).sort((a, b) => b.priority - a.priority).slice(0, 3);
  const slots = [0, 1, 2].map(i => topPriorityTasks[i] || null);

  const todayDate = new Date().toLocaleDateString('en-CA');
  const deadlinesToday = tasks.filter(t => !t.completed && t.deadline?.startsWith(todayDate)).length;

  return (
    <div className="w-full lg:w-[260px] flex-shrink-0 space-y-6">
      
      {/* Daily Intention */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-1 group hover:border-accent/40 transition-colors">
        <textarea 
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="What matters most today?"
          rows={1}
          style={{ minHeight: '36px' }}
          ref={(el) => {
             if (el) {
                el.style.height = '36px';
                const sh = el.scrollHeight;
                el.style.height = Math.min(sh, 36 * 3) + 'px';
             }
          }}
          className="w-full bg-transparent border-none text-h3 font-semibold text-text-primary focus:outline-none placeholder:text-text-muted transition-all focus:border-l-4 focus:border-accent focus:pl-3 resize-none scrollbar-none"
        />
        <div className={`mt-4 text-xs font-bold tracking-tight rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 ${isAfter6PM ? 'bg-warning/20 text-warning' : 'bg-surface-2 text-text-secondary'}`}>
           <Clock size={12} /> {timeLeftStr}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-1 space-y-4">
         <h3 className="text-micro text-text-muted uppercase tracking-wider font-semibold">Today's Output</h3>
         
         <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-secondary">Focus</span>
            <span className="text-sm font-bold text-text-primary flex items-center gap-1">
               {Math.floor(focusMinsToday/60)}h {focusMinsToday%60}m
            </span>
         </div>
         
         <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-secondary">Tasks</span>
            <span className="text-sm font-bold text-text-primary">
               {completedTasks} / {totalTasks}
            </span>
         </div>

         {deadlinesToday > 0 && (
           <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
              <span className="text-sm font-medium text-danger">Deadlines</span>
              <span className="text-xs font-bold bg-danger text-white px-2 py-0.5 rounded-full">
                 {deadlinesToday}
              </span>
           </div>
         )}
      </div>

      {/* Priority Stack */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-1 space-y-4">
         <h3 className="text-micro text-text-muted uppercase tracking-wider font-semibold">Must Do Today</h3>
         
         <div className="space-y-2">
            {slots.map((task, i) => (
              task ? (
                <div key={task.id} className="p-3 bg-surface-2 border border-border rounded-lg border-l-4 border-l-accent flex items-start gap-2 shadow-sm">
                   <span className="text-sm font-medium text-text-primary leading-tight line-clamp-2">{task.title}</span>
                </div>
              ) : (
                <div key={`empty-${i}`} className="p-3 border border-dashed border-border rounded-lg flex items-center justify-center bg-surface-1/50 text-text-muted text-sm cursor-not-allowed">
                   <span className="opacity-50">+ Add priority</span>
                </div>
              )
            ))}
         </div>
      </div>

    </div>
  );
}
