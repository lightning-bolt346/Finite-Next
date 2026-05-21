'use client';

import { useStore } from '../../lib/store';
import { useTasks } from '../../lib/contexts/TaskContext';
import { isSameDay, parseISO } from 'date-fns';
import { Target, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TodayStatsRight() {
  const { focusSessions, reflections } = useStore();
  const { tasks } = useTasks();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks/totalTasks)*100);

  const isAfter6PM = now.getHours() >= 18;
  const todayDate = now.toLocaleDateString('en-CA');
  const hasReflection = reflections.some(r => r.date === todayDate);

  const handleReflect = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'reflect' }));
  };

  return (
    <div className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
      
      {/* End-Of-Day Review Nudge */}
      {isAfter6PM && !hasReflection && (
        <div className="bg-accent-soft border border-accent/20 rounded-xl p-5 shadow-1 transition-colors">
          <h3 className="text-sm font-bold text-accent mb-2 flex items-center gap-2"><MessageCircle size={16}/> Evening Review</h3>
          <p className="text-xs text-text-primary mb-4 font-medium leading-relaxed">How did today go? Take 2 minutes to log your thoughts.</p>
          <button 
            onClick={handleReflect}
            className="w-full py-2 bg-bg border border-accent/30 text-accent rounded-lg text-sm font-bold hover:bg-accent/10 transition-colors"
          >
            Reflect Now
          </button>
        </div>
      )}

      {/* Task Progress Ring */}
      <div className="bg-surface-1 border border-border rounded-xl p-6 shadow-1 flex flex-col items-center">
         <h3 className="text-micro text-text-muted uppercase tracking-wider font-semibold w-full text-left mb-6">Task Completion</h3>
         
         <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
               <circle cx="50%" cy="50%" r="56" fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
               <circle 
                 cx="50%" cy="50%" r="56" fill="none" 
                 stroke="var(--color-success)" strokeWidth="12" 
                 strokeDasharray={351.8} 
                 strokeDashoffset={351.8 - (351.8 * (taskProgress/100))}
                 className="transition-all duration-1000 ease-out"
               />
            </svg>
            <div className="text-h2 font-bold text-text-primary">{taskProgress}%</div>
         </div>
      </div>

    </div>
  );
}
