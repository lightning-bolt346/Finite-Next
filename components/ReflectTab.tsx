'use client';

import { useStore } from '../lib/store';
import { saveReflectionToFirestore } from '../lib/firebaseSync';
import { motion } from 'motion/react';
import { useState } from 'react';
import { differenceInDays, format } from 'date-fns';

const PROMPTS = [
  "What deserves your attention today?",
  "What did you learn today?",
  "What are you grateful for right now?",
  "What is one thing you want to let go of?",
  "What made you proud today?",
  "Where did your time actually go today?",
  "What would make tomorrow better than today?",
  "What assumption did you challenge today?",
  "Who or what deserves more of your energy?",
  "What would your best self do differently?"
];

export default function ReflectTab() {
  const { reflections, addReflection } = useStore();
  const [text, setText] = useState('');
  const [now, setNow] = useState(new Date());

  const todayDate = format(now, 'yyyy-MM-dd');
  
  const todayReflection = reflections.find(r => r.date === todayDate);
  const pastReflections = reflections.filter(r => r.date !== todayDate).sort((a, b) => b.date.localeCompare(a.date));

  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const promptText = PROMPTS[dayOfYear % PROMPTS.length];

  const handleSave = () => {
    if (!text.trim()) return;
    const reflectionData = {
      id: crypto.randomUUID(),
      text,
      date: todayDate,
      createdAt: Date.now()
    };
    addReflection(reflectionData);
    saveReflectionToFirestore(reflectionData);
    setText('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-h1 font-bold tracking-tight text-text-primary mb-2">Reflect</h1>
          <p className="text-text-secondary text-sm">One honest note for the day.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="mb-10 p-6 md:p-8 bg-surface-1 border border-border rounded-xl shadow-1">
          <h2 className="text-h3 font-semibold mb-4 text-text-primary">Today&apos;s Reflection</h2>
          
          {todayReflection ? (
            <div className="p-5 bg-surface-2 rounded-sm border border-border">
              <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{todayReflection.text}</p>
              <p className="text-xs text-text-muted mt-4 font-mono">{new Date(todayReflection.createdAt).toLocaleTimeString()}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-2">
                <span className="text-micro text-text-muted uppercase tracking-wider font-semibold">Prompt</span>
                <p className="text-text-primary text-sm">{promptText}</p>
              </div>
              <textarea 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write your reflection here..."
                className="w-full h-40 bg-surface-2 border border-border rounded-sm p-5 text-text-primary focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-text-muted"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={!text.trim()}
                  className="px-6 py-2.5 rounded-sm text-sm font-bold bg-accent text-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_var(--color-accent-soft)]"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-h3 font-semibold mb-6 text-text-primary">Reflection history</h2>
          
          {pastReflections.length === 0 ? (
            <p className="text-text-muted italic text-sm">No past reflections.</p>
          ) : (
            <div className="space-y-4">
              {pastReflections.map(ref => (
                <div key={ref.id} className="p-6 bg-surface-1 border border-border rounded-xl hover:bg-surface-2 transition-colors shadow-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-sm font-bold text-accent">{ref.date}</span>
                    <span className="text-micro text-text-muted uppercase tracking-wider">{differenceInDays(new Date(), new Date(ref.date))} days ago</span>
                  </div>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{ref.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
