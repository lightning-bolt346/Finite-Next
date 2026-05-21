'use client';

import { useState, useRef, useEffect } from 'react';
import { useTasks } from '../../lib/contexts/TaskContext';
import { useStore } from '../../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MoreHorizontal, Clock, Plus, X } from 'lucide-react';
import { format, isToday, isPast, parseISO } from 'date-fns';

const START_HOUR = 6;
const END_HOUR = 24;
const HOURS_COUNT = END_HOUR - START_HOUR;
const TIMELINE_HEIGHT = HOURS_COUNT * 52; // 52px per hour

export default function TaskCenter() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { events, addEvent, deleteEvent } = useStore();
  const [newTaskInput, setNewTaskInput] = useState('');
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const updateTimeLeft = () => {
      setNow(new Date());
    };
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const handleAddNew = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskInput.trim()) {
      let title = newTaskInput.trim();
      let priority: 0|1|2 = 0;
      let deadline: string | null = null;
      
      if (title.includes('!p1')) { priority = 2; title = title.replace('!p1', '').trim(); }
      else if (title.includes('!p2')) { priority = 1; title = title.replace('!p2', '').trim(); }
      
      if (title.includes('@tomorrow')) {
         const tomorrow = new Date();
         tomorrow.setDate(tomorrow.getDate() + 1);
         deadline = format(tomorrow, "yyyy-MM-dd'T'17:00:00");
         title = title.replace('@tomorrow', '').trim();
      }

      addTask({
        title,
        priority,
        deadline,
        linkedGoalId: null,
        scheduledTime: null,
        timeEstimate: null
      });
      setNewTaskInput('');
    }
  };

  const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => b.priority - a.priority);
  const completedTasks = tasks.filter(t => t.completed);

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return 'text-text-muted';
    const date = parseISO(deadline);
    if (isPast(date) && !isToday(date)) return 'text-danger';
    if (isToday(date)) return 'text-warning';
    return 'text-text-muted';
  };

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '09:00', endTime: '10:00' });
  
  const [editingTask, setEditingTask] = useState<string | null>(null);

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

  const getEventStyle = (start: string, end: string) => {
    const [shr, smin] = start.split(':').map(Number);
    const [ehr, emin] = end.split(':').map(Number);
    
    let startMins = Math.max(0, (shr - START_HOUR) * 60 + smin);
    let endMins = (ehr - START_HOUR) * 60 + emin;
    if (ehr === 0) endMins = (24 - START_HOUR) * 60 + emin; // handle midnight
    
    const duration = Math.max(20, endMins - startMins); // min 20px height
    
    // Scale from 60px/hour to 52px/hour
    const topPx = (startMins / 60) * 52;
    const heightPx = (duration / 60) * 52;
    
    return {
      top: `${topPx}px`,
      height: `${heightPx}px`
    };
  };

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const showCurrentTimeLine = currentHour >= START_HOUR && currentHour < END_HOUR;
  const currentTimeTop = ((currentHour - START_HOUR) + currentMinute / 60) * 52;
  const isAfter6PM = currentHour >= 18;

  return (
    <div className="flex-1 min-w-0 flex flex-col pt-2 lg:pt-0 pb-24">
      
      {/* Add task */}
      <div className="mb-6">
        <input 
          type="text"
          value={newTaskInput}
          onChange={e => setNewTaskInput(e.target.value)}
          onKeyDown={handleAddNew}
          placeholder="Add a task for today... (press Enter)"
          className="w-full bg-surface-1 border border-border rounded-xl px-5 py-4 text-text-primary shadow-1 focus:outline-none focus:border-accent focus:shadow-[0_0_15px_var(--color-accent-soft)] transition-all font-medium"
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence>
           {activeTasks.map(task => {
             const isOverdue = task.deadline && isPast(parseISO(task.deadline)) && !isToday(parseISO(task.deadline));
             const isP1 = task.priority === 2;

             return (
               <motion.div 
                 key={task.id}
                 layout
                 initial={{ opacity: 0, y: 5 }} 
                 animate={isOverdue ? { opacity: 1, y: 0, x: [0, -3, 3, 0] } : { opacity: 1, y: 0 }}
                 transition={{ duration: 0.3 }}
                 exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                 draggable
                 onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData('taskId', task.id)}
                 className={`flex items-start gap-4 p-4 rounded-xl border relative group cursor-grab active:cursor-grabbing
                   ${isP1 ? 'bg-surface-2 border-accent/40 shadow-sm' : 'bg-surface-1 border-border'}
                   ${isOverdue ? 'bg-danger/5 border-danger/30' : ''}
                 `}
               >
                 {isP1 && (
                   <motion.div 
                     className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-xl shadow-[0_0_8px_var(--color-accent)]"
                     animate={{ opacity: [0.5, 1, 0.5] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   />
                 )}
                 <motion.button 
                   whileTap={{ scale: 0.8 }}
                   onClick={() => updateTask(task.id, { completed: true })}
                   className="mt-0.5 w-5 h-5 rounded-full border-2 border-text-muted hover:border-accent transition-colors flex-shrink-0 flex items-center justify-center overflow-hidden"
                 />

                 <div className="flex-1 min-w-0 pr-8">
                   <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                     {task.title}
                     <button
                       onClick={() => updateTask(task.id, { priority: ((task.priority + 1) % 3) as 0|1|2 })}
                       title="Cycle Priority"
                       className="flex items-center gap-[2px] opacity-20 hover:opacity-100 group-hover:opacity-60 transition-opacity px-1"
                     >
                       <div className={`w-1.5 h-1.5 rounded-full ${task.priority >= 0 ? 'bg-text-secondary' : 'bg-transparent'}`} />
                       <div className={`w-1.5 h-1.5 rounded-full ${task.priority >= 1 ? 'bg-warning' : 'bg-surface-3'}`} />
                       <div className={`w-1.5 h-1.5 rounded-full ${task.priority >= 2 ? 'bg-danger' : 'bg-surface-3'}`} />
                     </button>
                   </div>
                   
                   <div className="flex flex-wrap items-center gap-3 mt-2">
                      {task.deadline && (
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${getDeadlineColor(task.deadline)}`}>
                          <Calendar size={12} /> {format(parseISO(task.deadline), 'MMM d, h:mm a')}
                        </span>
                      )}
                   </div>
                 </div>
                 
                 <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-surface-1 py-1 px-2 rounded-lg shadow-1 border border-border">
                    <div className="relative text-text-muted hover:text-warning p-1" title="Set Deadline">
                      <Clock size={14} />
                      <input 
                        type="datetime-local" 
                        onChange={(e) => updateTask(task.id, { deadline: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-text-muted hover:text-danger p-1" title="Delete">
                      <X size={14} />
                    </button>
                 </div>
               </motion.div>
             );
           })}
        </AnimatePresence>

        {completedTasks.length > 0 && (
          <details className="mt-8 group">
            <summary className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 cursor-pointer select-none">
              Completed ({completedTasks.length})
            </summary>
            <div className="space-y-2 opacity-60">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-1/50 border border-border/50 group/item">
                   <button onClick={() => updateTask(task.id, { completed: false })} className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-success/80 transition-colors" title="Mark Incomplete">
                     <div className="w-2 h-2 bg-bg rounded-full" />
                   </button>
                   <div className="text-sm font-medium text-text-muted line-through flex-1">{task.title}</div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Time Blocking Timeline */}
      <div className="mt-12 bg-surface-1 border border-border rounded-xl p-6 shadow-1 relative">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-label font-semibold text-text-primary flex items-center gap-2">
              <Clock size={16} className="text-accent" /> Time Blocking (Drag Tasks Here)
            </h3>
            <button 
              onClick={() => setShowAddEvent(true)}
              className="w-8 h-8 flex items-center justify-center rounded-sm bg-surface-2 hover:bg-surface-3 transition-colors text-text-primary"
            >
              <Plus size={16} />
            </button>
         </div>

         <AnimatePresence>
            {showAddEvent && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddEvent}
                className="mb-8 p-4 bg-surface-2 rounded-lg border border-border overflow-hidden"
              >
                <input 
                  type="text" 
                  placeholder="Event title" 
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full bg-transparent border-none text-text-primary focus:outline-none placeholder:text-text-muted font-medium mb-4"
                  autoFocus
                />
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Start</label>
                    <input 
                      type="time" 
                      value={newEvent.startTime}
                      onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                      className="w-full bg-surface-1 border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">End</label>
                    <input 
                      type="time" 
                      value={newEvent.endTime}
                      onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="w-full bg-surface-1 border border-border rounded-sm px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddEvent(false)} className="px-4 py-2 rounded-sm text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-sm text-sm font-medium bg-accent text-bg hover:opacity-90 transition-opacity">Add Block</button>
                </div>
              </motion.form>
            )}
         </AnimatePresence>

         <div className="relative ml-14 sm:ml-16 mt-4" style={{ height: TIMELINE_HEIGHT }}>
            {/* Hour Grid Lines - Drop Targets */}
            {Array.from({ length: HOURS_COUNT }).map((_, i) => (
              <div 
                key={i} 
                className="absolute w-full h-[52px] border-t border-border/50 group z-0 transition-colors hover:bg-surface-2" 
                style={{ top: i * 52 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                   e.preventDefault();
                   const taskId = e.dataTransfer.getData('taskId');
                   if (taskId) {
                       const task = tasks.find(t => t.id === taskId);
                       if (task) {
                          const startHour = START_HOUR + i;
                          const start = `${String(startHour).padStart(2,'0')}:00`;
                          const end = `${String(startHour+1).padStart(2,'0')}:00`;
                          addEvent({
                             id: crypto.randomUUID(),
                             title: task.title,
                             startTime: start,
                             endTime: end,
                             createdAt: Date.now()
                          });
                       }
                   }
                }}
              >
                <span className="absolute -left-14 sm:-left-16 -top-2.5 w-12 text-right text-xs font-mono text-text-muted">
                  {String(START_HOUR + i).padStart(2, '0')}:00
                </span>
                <div className="hidden group-hover:flex items-center justify-center h-full opacity-50 text-accent pointer-events-none">
                  <span className="text-xs font-bold uppercase tracking-widest">+ Drop Task</span>
                </div>
              </div>
            ))}
            {/* Last label */}
            <div className="absolute w-full border-t border-border/50" style={{ top: HOURS_COUNT * 52 }}>
                <span className="absolute -left-14 sm:-left-16 -top-2.5 w-12 text-right text-xs font-mono text-text-muted">
                  {String(START_HOUR + HOURS_COUNT).padStart(2, '0')}:00
                </span>
            </div>

            {/* Current Time Line */}
            {showCurrentTimeLine && (
              <div 
                className="absolute left-0 right-0 z-20 border-t border-danger/80 shadow-[0_0_8px_var(--color-danger)] pointer-events-none"
                style={{ top: currentTimeTop }}
              >
                <div className="absolute -left-[5px] -top-[4px] w-2 h-2 rounded-full bg-danger" />
              </div>
            )}

            {/* Event Blocks */}
            {todayEvents.map(event => {
              const style = getEventStyle(event.startTime, event.endTime);
              return (
                <div 
                  key={event.id}
                  className="absolute left-2 right-2 sm:right-6 rounded-md bg-accent-soft border border-accent/30 overflow-hidden group hover:bg-accent/20 hover:border-accent/50 transition-colors z-10 p-2 sm:p-3 shadow-1"
                  style={style}
                >
                  <div className="flex justify-between items-start h-full">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs sm:text-sm font-bold text-accent truncate">{event.title}</span>
                      <span className="text-[10px] sm:text-xs font-mono text-accent/70 mt-0.5">{event.startTime} - {event.endTime}</span>
                    </div>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2 p-1 text-accent/70 hover:text-danger hover:bg-surface-1 rounded-sm transition-all"
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
  );
}
