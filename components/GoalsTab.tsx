'use client';

import { useStore, Goal } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function GoalsTab() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState<{title: string, category: 'short'|'medium'|'long', targetDate: string}>({
    title: '', category: 'short', targetDate: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;
    addGoal({
      id: crypto.randomUUID(),
      title: newGoal.title,
      category: newGoal.category,
      status: 'active',
      targetDate: newGoal.targetDate || undefined,
      createdAt: Date.now()
    });
    setNewGoal({ title: '', category: 'short', targetDate: '' });
    setShowAdd(false);
  };

  const renderGoalSection = (category: 'short' | 'medium' | 'long', title: string) => {
    const sectionGoals = goals.filter(g => g.category === category);
    
    return (
      <div className="mb-8 p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          {title}
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[#a1a1aa] font-mono">{sectionGoals.length}</span>
        </h2>
        
        {sectionGoals.length === 0 ? (
          <p className="text-sm text-[#71717a] italic">No goals set.</p>
        ) : (
          <div className="space-y-3">
            {sectionGoals.map(goal => (
              <div key={goal.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                <button 
                  onClick={() => updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed' })}
                  className={`${goal.status === 'completed' ? 'text-[#34d399]' : 'text-[#71717a] hover:text-[#34d399]'} transition-colors`}
                >
                  {goal.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${goal.status === 'completed' ? 'text-white/50 line-through' : 'text-white/90'}`}>
                    {goal.title}
                  </p>
                  {goal.targetDate && (
                    <p className="text-xs font-mono text-[#a1a1aa] mt-1">Due: {new Date(goal.targetDate).toLocaleDateString()}</p>
                  )}
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-[#71717a] hover:text-red-400 transition-all rounded-full hover:bg-white/5"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Goals</h1>
          <p className="text-[#a1a1aa] text-sm">Outcomes and repeatable actions.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#12131a] border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-4">New Goal</h3>
              <form onSubmit={handleAdd}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Title</label>
                    <input 
                      type="text" required autoFocus
                      value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors"
                      placeholder="What is the objective?"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Category</label>
                    <select 
                      value={newGoal.category} onChange={e => setNewGoal({...newGoal, category: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors appearance-none"
                    >
                      <option value="short">Short Term (Today / This Week)</option>
                      <option value="medium">Medium Term (This Month / Quarter)</option>
                      <option value="long">Long Term (Yearly / Life)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Target Date (Optional)</label>
                    <input 
                      type="date"
                      value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#a78bfa] text-white hover:bg-[#8b5cf6] transition-colors shadow-[0_0_20px_rgba(167,139,250,0.3)]">Create Goal</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>{renderGoalSection('short', 'Short Term')}</div>
        <div>{renderGoalSection('medium', 'Medium Term')}</div>
        <div>{renderGoalSection('long', 'Long Term')}</div>
      </div>
    </motion.div>
  );
}
