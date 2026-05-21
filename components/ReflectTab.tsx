'use client';

import { useStore } from '../lib/store';
import { motion } from 'motion/react';
import { useState } from 'react';
import { differenceInDays, format } from 'date-fns';

export default function ReflectTab() {
  const { reflections, addReflection } = useStore();
  const [text, setText] = useState('');
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  
  const todayReflection = reflections.find(r => r.date === todayDate);
  const pastReflections = reflections.filter(r => r.date !== todayDate).sort((a, b) => b.date.localeCompare(a.date));

  const handleSave = () => {
    if (!text.trim()) return;
    addReflection({
      id: crypto.randomUUID(),
      text,
      date: todayDate,
      createdAt: Date.now()
    });
    setText('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Reflect</h1>
          <p className="text-[#a1a1aa] text-sm">One honest note for the day.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <div className="mb-10 p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
          <h2 className="text-xl font-semibold mb-4 text-white/90">Today&apos;s Reflection</h2>
          
          {todayReflection ? (
            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{todayReflection.text}</p>
              <p className="text-xs text-[#a1a1aa] mt-4 font-mono">{new Date(todayReflection.createdAt).toLocaleTimeString()}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <textarea 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What did you learn today? What are you grateful for?"
                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-[#a78bfa] transition-colors resize-none placeholder:text-[#71717a]"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={!text.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[#a78bfa] text-white hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(167,139,250,0.3)]"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6 text-white/90">Reflection history</h2>
          
          {pastReflections.length === 0 ? (
            <p className="text-[#71717a] italic text-sm">No past reflections.</p>
          ) : (
            <div className="space-y-4">
              {pastReflections.map(ref => (
                <div key={ref.id} className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-sm font-bold text-[#a78bfa]">{ref.date}</span>
                    <span className="text-xs text-[#71717a] uppercase tracking-wider">{differenceInDays(new Date(), new Date(ref.date))} days ago</span>
                  </div>
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{ref.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
