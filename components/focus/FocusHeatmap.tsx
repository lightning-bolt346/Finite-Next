'use client';

import { useState } from 'react';
import { format, subDays, isSameDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';

interface FocusHeatmapProps {
  sessions: any[];
}

export default function FocusHeatmap({ sessions }: FocusHeatmapProps) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  const renderWeekView = () => {
    const today = new Date();
    const daysToShow = 84; 
    const startDate = subDays(today, daysToShow - 1);
    
    // Calculate empty padding cells for the first column to align with day of week (Sunday = 0)
    const paddingStart = startDate.getDay();
    const totalCells = paddingStart + daysToShow;

    return (
      <div className="flex gap-2 mt-6 overflow-x-auto pb-4 scrollbar-none items-end">
        <div className="flex flex-col gap-1 md:gap-[5px] text-[10px] text-text-muted font-bold text-right pr-2">
            <span className="h-4 md:h-5">Sun</span>
            <span className="h-4 md:h-5 opacity-0">Mon</span>
            <span className="h-4 md:h-5">Tue</span>
            <span className="h-4 md:h-5 opacity-0">Wed</span>
            <span className="h-4 md:h-5">Thu</span>
            <span className="h-4 md:h-5 opacity-0">Fri</span>
            <span className="h-4 md:h-5">Sat</span>
        </div>
        <div className="grid grid-rows-7 grid-flow-col gap-1 md:gap-[5px]">
        {Array.from({ length: totalCells }).map((_, i) => {
          if (i < paddingStart) {
             return <div key={`empty-${i}`} className="w-4 h-4 md:w-5 md:h-5" />;
          }
          
          const d = subDays(startDate, -(i - paddingStart));
          const mins = sessions.filter(s => isSameDay(parseISO(s.date), d)).reduce((sum, s) => sum + s.durationMinutes, 0);
          const intensity = Math.min(mins / 120, 1);
          
          return (
            <div 
              key={i} 
              className="w-4 h-4 md:w-5 md:h-5 rounded-[3px] border border-border/50 relative group cursor-crosshair transition-transform hover:scale-110"
              style={{
                backgroundColor: mins > 0 ? `color-mix(in srgb, var(--color-accent) ${Math.max(20, intensity * 100)}%, transparent)` : 'var(--color-surface-2)'
              }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-1 border border-border rounded-md text-micro text-text-primary whitespace-nowrap z-50 pointer-events-none shadow-2 transition-opacity">
                 {format(d, 'MMM d')}: {mins} mins
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    // 24 hour bar chart. Aggregated over last 30 days.
    const hours = Array(24).fill(0);
    const last30 = subDays(new Date(), 30);
    
    sessions.forEach(s => {
       const fd = new Date(s.createdAt); // use createdAt for hour
       if (fd >= last30) {
          hours[fd.getHours()] += s.durationMinutes;
       }
    });

    const max = Math.max(...hours, 1);

    return (
      <div className="flex items-end gap-1 h-48 pt-4 border-b border-border mt-6">
         {hours.map((mins, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
               <div 
                 className="w-full bg-accent rounded-t-sm transition-all"
                 style={{ height: `${(mins / max) * 100}%`, opacity: 0.3 + (mins/max)*0.7 }}
               />
               <span className="text-[8px] text-text-muted mt-2 absolute top-full">{i%2===0 ? String(i).padStart(2,'0') : ''}</span>
               
               {mins > 0 && (
                 <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface-1 border border-border rounded-md text-micro text-text-primary whitespace-nowrap z-50 pointer-events-none shadow-2 transition-opacity">
                    {String(i).padStart(2,'0')}:00 - {mins} mins total
                 </div>
               )}
            </div>
         ))}
      </div>
    );
  };
  
  const renderMonthView = () => {
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const startDayOfWeek = start.getDay();
    const daysInMonth = end.getDate();
    const cells = Array(startDayOfWeek).fill(null).concat(Array.from({ length: daysInMonth }).map((_, i) => i + 1));
    
    return (
      <div className="grid grid-cols-7 gap-2 md:gap-3 mt-6">
         {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
           <div key={d} className="text-center text-[10px] text-text-muted font-bold uppercase tracking-widest">{d}</div>
         ))}
         {cells.map((dayNum, i) => {
           if (!dayNum) return <div key={`empty-${i}`} className="aspect-square" />;
           const d = new Date(today.getFullYear(), today.getMonth(), dayNum);
           const mins = sessions.filter(s => isSameDay(parseISO(s.date), d)).reduce((sum, s) => sum + s.durationMinutes, 0);
           const intensity = Math.min(mins / 120, 1);
           
           return (
             <div 
               key={dayNum} 
               className="aspect-square rounded-lg border border-border/30 relative group cursor-pointer transition-transform hover:-translate-y-1 p-2 flex flex-col justify-between"
               style={{
                 backgroundColor: mins > 0 ? `color-mix(in srgb, var(--color-accent) ${Math.max(20, intensity * 100)}%, transparent)` : 'var(--color-surface-2)'
               }}
             >
               <span className={`text-xs font-semibold ${mins > 0 ? 'text-bg mix-blend-difference' : 'text-text-primary/50'}`}>{dayNum}</span>
               {mins > 0 && <span className="text-[10px] font-bold text-bg mix-blend-difference justify-self-end mt-auto align-bottom">{Math.floor(mins/60)}h</span>}
               
               <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface-1 border border-border border-b-2 border-b-accent rounded-md text-xs font-medium text-text-primary whitespace-nowrap z-50 pointer-events-none shadow-2 transition-opacity">
                  {format(d, 'MMM d')}: <span className="font-bold text-accent">{mins}</span> mins
               </div>
             </div>
           );
         })}
      </div>
    );
  };

  const renderConsistencyRing = () => {
    const today = new Date();
    let daysWithFocus = 0;
    for(let i=0; i<7; i++) {
        const d = subDays(today, i);
        const hasSession = sessions.some(s => isSameDay(parseISO(s.date), d));
        if (hasSession) daysWithFocus++;
    }
    const goal = 7;
    const progress = Math.min(1, daysWithFocus / goal);
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    
    return (
        <div className="flex items-center gap-6 p-5 bg-surface-2 rounded-2xl border border-border mt-8 shadow-sm">
            <svg width="84" height="84" className="-rotate-90 flex-shrink-0">
                <circle cx="42" cy="42" r={radius} fill="none" stroke="var(--color-surface-1)" strokeWidth="6" />
                <circle cx="42" cy="42" r={radius} fill="none" stroke="var(--color-accent)" strokeWidth="6" 
                   strokeDasharray={circ} strokeDashoffset={circ - circ * progress} className="transition-all duration-1000 ease-out" 
                />
            </svg>
            <div>
                <h4 className="text-sm font-bold text-text-primary mb-1 uppercase tracking-wider">Weekly Consistency</h4>
                <p className="text-sm text-text-muted mb-2 font-medium">You hit your focus goal <span className="text-text-primary font-bold">{daysWithFocus}/{goal}</span> days this rolling week. Let's aim for no days off!</p>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-border p-6 rounded-2xl shadow-1 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
           <h3 className="text-h3 font-semibold text-text-primary">Focus Heatmap</h3>
           <p className="text-sm text-text-secondary mt-1">Consistency over time.</p>
        </div>
        <div className="flex bg-surface-2 rounded-lg p-1 border border-border">
          <button onClick={() => setView('day')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'day' ? 'bg-surface-1 text-text-primary shadow-1' : 'text-text-muted hover:text-text-primary'}`}>Day</button>
          <button onClick={() => setView('week')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'week' ? 'bg-surface-1 text-text-primary shadow-1' : 'text-text-muted hover:text-text-primary'}`}>Week</button>
          <button onClick={() => setView('month')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'month' ? 'bg-surface-1 text-text-primary shadow-1' : 'text-text-muted hover:text-text-primary'}`}>Month</button>
        </div>
      </div>
      
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
      {view === 'month' && renderMonthView()}

      {renderConsistencyRing()}
    </div>
  );
}
