'use client';

import { useStore, Goal } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckCircle2, Circle, Trash2, AlignLeft, Target, GitCommit, X } from 'lucide-react';
import { useState } from 'react';

export default function GoalsTab() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState<{title: string, category: 'short'|'medium'|'long', targetDate: string, type: 'outcome'|'process', notes: string}>({
    title: '', category: 'short', targetDate: '', type: 'outcome', notes: ''
  });

  const [showMethodologyInfo, setShowMethodologyInfo] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;
    addGoal({
      id: crypto.randomUUID(),
      title: newGoal.title,
      category: newGoal.category,
      status: 'active',
      type: newGoal.type,
      notes: (newGoal as any).methodology ? `Methodology: ${(newGoal as any).methodology}\n${newGoal.notes || ''}` : newGoal.notes || undefined,
      targetDate: newGoal.targetDate || undefined,
      createdAt: Date.now()
    });
    setNewGoal({ title: '', category: 'short', targetDate: '', type: 'outcome', notes: '', ...( { methodology: 'OKR' } as any) });
    setShowAdd(false);
  };

  const METHODOLOGIES: Record<string, { title: string, desc: string, steps: string[] }> = {
    'OKR': {
      title: 'Objectives and Key Results',
      desc: 'Connect ambitious goals (Objectives) to measurable outcomes (Key Results).',
      steps: ['Set 1 inspiring Objective', 'Define 2-3 measurable Key Results', 'Update progress weekly']
    },
    '12 Week Year': {
      title: 'The 12 Week Year',
      desc: 'Treat the next 12 weeks as a full year to build extreme urgency.',
      steps: ['Ditch annual planning', 'Break goal into 12 weeks of tactics', 'Score execution weekly']
    },
    'Inversion': {
      title: 'Inversion (Anti-Goals)',
      desc: 'Instead of thinking about what you want, think about what you want to avoid.',
      steps: ['Define the worst-case scenario', 'List habits that lead there', 'Build goals that prevent those habits']
    }
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
              <div key={goal.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                <button 
                  onClick={() => updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed' })}
                  className={`mt-1 ${goal.status === 'completed' ? 'text-[#34d399]' : 'text-[#71717a] hover:text-[#34d399]'} transition-colors flex-shrink-0`}
                >
                  {goal.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span title={goal.type === 'process' ? 'Process Goal' : 'Outcome Goal'} className="text-[#a1a1aa] flex-shrink-0">
                      {goal.type === 'process' ? <GitCommit size={14} /> : <Target size={14} />}
                    </span>
                    <p className={`font-medium truncate ${goal.status === 'completed' ? 'text-white/50 line-through' : 'text-white/90'}`}>
                      {goal.title}
                    </p>
                  </div>
                  {goal.notes && (
                    <div className="flex gap-2 items-start text-xs text-[#a1a1aa] mt-2 bg-white/5 p-2 rounded-lg break-words">
                      <AlignLeft size={12} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-3">{goal.notes}</span>
                    </div>
                  )}
                  {goal.targetDate && (
                    <p className="text-xs font-mono text-[#a1a1aa] mt-2">Due: {new Date(goal.targetDate).toLocaleDateString()}</p>
                  )}
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-[#71717a] hover:text-red-400 transition-all rounded-full hover:bg-white/5 flex-shrink-0"
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
            <div className="bg-[#12131a] border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">New Goal</h3>
                <button onClick={() => setShowAdd(false)} className="text-[#a1a1aa] hover:text-white"><X size={20} /></button>
              </div>
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
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Type</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setNewGoal({...newGoal, type: 'outcome'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${newGoal.type === 'outcome' ? 'bg-[#a78bfa]/20 border-[#a78bfa] text-[#a78bfa]' : 'border-white/10 bg-white/5 text-[#a1a1aa] hover:bg-white/10'}`}
                      >
                        <Target size={16} /> Outcome
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewGoal({...newGoal, type: 'process'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-colors ${newGoal.type === 'process' ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]' : 'border-white/10 bg-white/5 text-[#a1a1aa] hover:bg-white/10'}`}
                      >
                        <GitCommit size={16} /> Process
                      </button>
                    </div>
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
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Methodology</label>
                    <div className="flex gap-2">
                      <select 
                        value={(newGoal as any).methodology || 'OKR'} onChange={e => setNewGoal({...newGoal, methodology: e.target.value} as any)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors appearance-none"
                      >
                        {Object.keys(METHODOLOGIES).map(m => (
                          <option key={m} value={m} className="bg-[#12131a]">{m}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setShowMethodologyInfo((newGoal as any).methodology || 'OKR')}
                        className="px-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors text-sm font-semibold"
                      >
                        Guide
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Target Date (Optional)</label>
                    <input 
                      type="date"
                      value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#a1a1aa] block mb-1 uppercase tracking-wider font-semibold">Notes (Optional)</label>
                    <textarea 
                      value={newGoal.notes} onChange={e => setNewGoal({...newGoal, notes: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors min-h-[80px]"
                      placeholder="Context, breaking it down, why it matters..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold bg-[#a78bfa] text-white hover:bg-[#8b5cf6] transition-colors shadow-[0_0_20px_rgba(167,139,250,0.3)]">Create Goal</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMethodologyInfo && METHODOLOGIES[showMethodologyInfo] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#12131a] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
              <button 
                onClick={() => setShowMethodologyInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors text-sm"
              >
                <X size={16} />
              </button>
              <h3 className="text-xl font-bold mb-2 text-white/90">{METHODOLOGIES[showMethodologyInfo].title}</h3>
              <p className="text-[#a1a1aa] mb-6 text-sm">{METHODOLOGIES[showMethodologyInfo].desc}</p>
              
              <div className="space-y-3">
                {METHODOLOGIES[showMethodologyInfo].steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                    <div className="w-5 h-5 rounded-full bg-[#a78bfa]/20 text-[#a78bfa] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium text-white/90">{step}</p>
                  </div>
                ))}
              </div>
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
