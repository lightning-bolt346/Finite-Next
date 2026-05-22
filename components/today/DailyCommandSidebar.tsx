'use client';

import { useTasks, Task } from '../../lib/contexts/TaskContext';
import { useStore } from '../../lib/store';
import { saveTodayGoalToFirestore } from '../../lib/firebaseSync';
import { Flame, Clock, Check } from 'lucide-react';
import { differenceInDays, isSameDay, parseISO, subDays } from 'date-fns';
import { useState, useEffect } from 'react';

export default function DailyCommandSidebar() {
  const { tasks, intention, setIntention } = useTasks();
  const { focusSessions, todayGoals, setTodayGoal } = useStore();

  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isAfter6PM, setIsAfter6PM] = useState(false);

  const todayDate = new Date().toLocaleDateString('en-CA');
  const todayGoal = todayGoals[todayDate] && !todayGoals[todayDate].archived ? todayGoals[todayDate] : null;

  const [inputValue, setInputValue] = useState('');

  // Hydrate inputValue from todayGoal title or fallback to context intention
  useEffect(() => {
    setInputValue(todayGoal ? todayGoal.title : intention || '');
  }, [todayGoal, intention]);

  const handleIntentionChange = (text: string) => {
    setInputValue(text);
    setIntention(text);

    if (text.trim()) {
      if (!todayGoal) {
        const newGoal = {
          id: crypto.randomUUID(),
          title: text.trim(),
          doneText: 'Definition of done',
          priority: 'Normal' as const,
          minutes: 60,
          completed: false,
          date: todayDate,
          createdAt: Date.now()
        };
        setTodayGoal(todayDate, newGoal);
        saveTodayGoalToFirestore(newGoal);
      } else {
        const updated = { ...todayGoal, title: text.trim() };
        setTodayGoal(todayDate, updated);
        saveTodayGoalToFirestore(updated);
      }
    } else {
      if (todayGoal) {
        const updated = { ...todayGoal, title: '', archived: true };
        setTodayGoal(todayDate, updated);
        saveTodayGoalToFirestore(updated);
      }
    }
  };

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

  const deadlinesToday = tasks.filter(t => !t.completed && t.deadline?.startsWith(todayDate)).length;

  return (
    <div className="w-full lg:w-[260px] flex-shrink-0 space-y-6">
      
      {/* Daily Intention */}
      <div className="bg-surface-1 border border-border rounded-xl p-5 shadow-1 group hover:border-accent/40 transition-colors">
        <div className="flex items-start gap-3">
          <button 
            onClick={() => {
              if (todayGoal) {
                const nextCompleted = !todayGoal.completed;
                setTodayGoal(todayDate, { completed: nextCompleted });
                saveTodayGoalToFirestore({ ...todayGoal, completed: nextCompleted });
              } else if (inputValue.trim()) {
                const newGoal = {
                  id: crypto.randomUUID(),
                  title: inputValue.trim(),
                  doneText: 'Definition of done',
                  priority: 'Normal' as const,
                  minutes: 60,
                  completed: true,
                  date: todayDate,
                  createdAt: Date.now()
                };
                setTodayGoal(todayDate, newGoal);
                saveTodayGoalToFirestore(newGoal);
              }
            }}
            className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 flex items-center justify-center cursor-pointer mt-1 ${
              todayGoal?.completed 
                ? 'bg-success border-success text-white' 
                : 'border-text-muted/60 hover:border-accent'
            }`}
          >
            {todayGoal?.completed && <Check size={14} className="stroke-[3px]" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <textarea 
              value={inputValue}
              onChange={(e) => handleIntentionChange(e.target.value)}
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
              className={`w-full bg-transparent border-none text-h3 font-semibold focus:outline-none placeholder:text-text-muted transition-all resize-none scrollbar-none ${
                todayGoal?.completed ? 'text-text-muted line-through decoration-[2px]' : 'text-text-primary focus:border-l-4 focus:border-accent focus:pl-3'
              }`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className={`text-xs font-bold tracking-tight rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 ${isAfter6PM ? 'bg-warning/20 text-warning' : 'bg-surface-2 text-text-secondary'}`}>
             <Clock size={12} /> {timeLeftStr}
          </div>
          {todayGoal && (
            <span className="text-[10px] font-bold text-accent/80 font-mono tracking-wider">
              {todayGoal.completed ? 'COMPLETED' : 'ACTIVE FOCUS'}
            </span>
          )}
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
