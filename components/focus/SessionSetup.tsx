'use client';

import { useState } from 'react';
import { useTasks } from '../../lib/contexts/TaskContext';
import { useStore } from '../../lib/store';
import SoundMixer from '../sound/SoundMixer';

interface SessionSetupProps {
  onStart: (durationMinutes: number, type: string, intention: string, linkedTask: string | null, linkedGoal: string | null) => void;
}

export default function SessionSetup({ onStart }: SessionSetupProps) {
  const [duration, setDuration] = useState<number>(25);
  const [sessionType, setSessionType] = useState<string>('Deep Work');
  const [intention, setIntention] = useState('');
  const [selectedLink, setSelectedLink] = useState<{ type: 'task' | 'goal', id: string } | null>(null);

  const { tasks } = useTasks();
  const { goals } = useStore();

  const activeTasks = tasks.filter(t => !t.completed);
  const activeGoals = goals.filter(g => g.status === 'active');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(
      duration,
      sessionType,
      intention,
      selectedLink?.type === 'task' ? selectedLink.id : null,
      selectedLink?.type === 'goal' ? selectedLink.id : null,
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-surface-1 border border-border p-6 rounded-2xl shadow-1">
          <h2 className="text-h2 font-bold mb-6 text-text-primary">Customize Session</h2>
          <form onSubmit={handleStart} className="space-y-6">
            
            <div>
              <label className="text-micro text-text-muted block mb-2 uppercase tracking-wider font-semibold">What are you working on?</label>
              <select 
                title="What are you working on?"
                value={selectedLink ? `${selectedLink.type}_${selectedLink.id}` : ''}
                onChange={e => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedLink(null);
                    return;
                  }
                  const [type, id] = val.split('_');
                  setSelectedLink({ type: type as 'task'|'goal', id });
                }}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Unlinked session</option>
                {activeTasks.length > 0 && <optgroup label="Today's Tasks">
                  {activeTasks.map(t => <option key={`task_${t.id}`} value={`task_${t.id}`}>{t.title}</option>)}
                </optgroup>}
                {activeGoals.length > 0 && <optgroup label="Active Goals">
                  {activeGoals.map(g => <option key={`goal_${g.id}`} value={`goal_${g.id}`}>{g.title}</option>)}
                </optgroup>}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-micro text-text-muted block mb-2 uppercase tracking-wider font-semibold">Duration</label>
                  <select 
                     title="Duration"
                     value={duration} 
                     onChange={e => setDuration(Number(e.target.value))}
                     className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                  >
                     <option value="25">25 minutes</option>
                     <option value="45">45 minutes</option>
                     <option value="60">60 minutes</option>
                     <option value="90">90 minutes</option>
                     <option value="120">120 minutes</option>
                  </select>
               </div>
               <div>
                  <label className="text-micro text-text-muted block mb-2 uppercase tracking-wider font-semibold">Type</label>
                  <select 
                     title="Type"
                     value={sessionType} onChange={e => setSessionType(e.target.value)}
                     className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                  >
                     <option value="Deep Work">Deep Work</option>
                     <option value="Creative Work">Creative Work</option>
                     <option value="Admin & Tasks">Admin & Tasks</option>
                     <option value="Learning">Learning</option>
                  </select>
               </div>
            </div>

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
