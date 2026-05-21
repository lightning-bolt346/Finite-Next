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
    },
    'Atomic Habits': {
      title: '1% Compounding',
      desc: 'Focus on small, daily 1% improvements instead of massive transformations.',
      steps: ['Identify the process needed', 'Make the cue obvious', 'Improve it by 1% daily']
    },
    'WOOP': {
      title: 'WOOP Method',
      desc: 'Wish, Outcome, Obstacle, Plan. A scientifically backed strategy for goal attainment.',
      steps: ['Define the Wish', 'Visualize the Best Outcome', 'Identify the internal Obstacle', 'Make a then/if Plan']
    },
    'North Star': {
      title: 'North Star Metric',
      desc: 'Distill your focus down to a single crucial metric that captures your core value.',
      steps: ['Identify the core value delivered', 'Define the single metric tracking it', 'Align all actions to move the metric']
    },
    'Ikigai': {
      title: 'Ikigai Alignment',
      desc: 'Find the intersection of what you love, what you are good at, what the world needs, and what pays.',
      steps: ['Map your passions', 'Identify your skills', 'Find market needs', 'Locate the intersection']
    }
  };

  const renderGoalSection = (category: 'short' | 'medium' | 'long', title: string) => {
    const sectionGoals = goals.filter(g => g.category === category);
    
    return (
      <div className="mb-8 p-6 bg-surface-1 border border-border rounded-xl shadow-1">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-text-primary">
          {title}
          <span className="text-micro bg-surface-2 border border-border px-2 py-0.5 rounded-full text-text-muted font-mono">{sectionGoals.length}</span>
        </h2>
        
        {sectionGoals.length === 0 ? (
          <p className="text-sm text-text-muted italic">No goals set.</p>
        ) : (
          <div className="space-y-3">
            {sectionGoals.map(goal => (
              <div key={goal.id} className="group flex items-start gap-4 p-4 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 shadow-1 transition-colors">
                <button 
                  onClick={() => updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed' })}
                  className={`mt-1 ${goal.status === 'completed' ? 'text-success' : 'text-text-muted hover:text-success'} transition-colors flex-shrink-0`}
                >
                  {goal.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span title={goal.type === 'process' ? 'Process Goal' : 'Outcome Goal'} className="text-text-muted flex-shrink-0">
                      {goal.type === 'process' ? <GitCommit size={14} /> : <Target size={14} />}
                    </span>
                    <p className={`font-medium truncate ${goal.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                      {goal.title}
                    </p>
                  </div>
                  {goal.notes && (
                    <div className="flex gap-2 items-start text-xs text-text-secondary mt-2 bg-surface-1 p-2 border border-border rounded-sm break-words">
                      <AlignLeft size={12} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-3">{goal.notes}</span>
                    </div>
                  )}
                  {goal.targetDate && (
                    <p className="text-xs font-mono text-text-muted mt-2">Due: {new Date(goal.targetDate).toLocaleDateString()}</p>
                  )}
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-surface-3 transition-all rounded-sm flex-shrink-0"
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
          <h1 className="text-h1 font-bold tracking-tight text-text-primary mb-2">Goals</h1>
          <p className="text-text-secondary text-sm">Outcomes and repeatable actions.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border text-text-primary rounded-sm text-sm font-medium transition-colors shadow-1"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
          >
            <div className="bg-surface-1 border border-border p-6 rounded-lg w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">New Goal</h3>
                <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Title</label>
                    <input 
                      type="text" required autoFocus
                      value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors"
                      placeholder="What is the objective?"
                    />
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Type</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setNewGoal({...newGoal, type: 'outcome'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm border text-sm font-medium transition-colors ${newGoal.type === 'outcome' ? 'bg-accent-soft border-accent text-accent' : 'border-border bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text-primary'}`}
                      >
                        <Target size={16} /> Outcome
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewGoal({...newGoal, type: 'process'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm border text-sm font-medium transition-colors ${newGoal.type === 'process' ? 'bg-accent-soft border-accent text-accent' : 'border-border bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text-primary'}`}
                      >
                        <GitCommit size={16} /> Process
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Category</label>
                    <select 
                      value={newGoal.category} onChange={e => setNewGoal({...newGoal, category: e.target.value as any})}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
                    >
                      <option value="short" className="bg-bg">Short Term (Today / This Week)</option>
                      <option value="medium" className="bg-bg">Medium Term (This Month / Quarter)</option>
                      <option value="long" className="bg-bg">Long Term (Yearly / Life)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Methodology</label>
                    <div className="flex gap-2">
                      <select 
                        value={(newGoal as any).methodology || 'OKR'} onChange={e => setNewGoal({...newGoal, methodology: e.target.value} as any)}
                        className="flex-1 bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
                      >
                        {Object.keys(METHODOLOGIES).map(m => (
                          <option key={m} value={m} className="bg-bg">{m}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setShowMethodologyInfo((newGoal as any).methodology || 'OKR')}
                        className="px-4 bg-surface-2 border border-border rounded-sm text-text-primary hover:bg-surface-3 transition-colors text-sm font-semibold"
                      >
                        Guide
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Target Date (Optional)</label>
                    <input 
                      type="date"
                      value={newGoal.targetDate} onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Notes (Optional)</label>
                    <textarea 
                      value={newGoal.notes} onChange={e => setNewGoal({...newGoal, notes: e.target.value})}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors min-h-[80px]"
                      placeholder="Context, breaking it down, why it matters..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="submit" className="w-full py-3 rounded-sm text-sm font-bold bg-accent text-bg hover:opacity-90 transition-opacity shadow-[0_0_20px_var(--color-accent-soft)]">Create Goal</button>
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
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
          >
            <div className="bg-surface-1 border border-border p-6 rounded-lg w-full max-w-sm shadow-2xl relative">
              <button 
                onClick={() => setShowMethodologyInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-sm bg-surface-2 hover:bg-surface-3 text-text-primary transition-colors text-sm"
              >
                <X size={16} />
              </button>
              <h3 className="text-xl font-bold mb-2 text-text-primary">{METHODOLOGIES[showMethodologyInfo].title}</h3>
              <p className="text-text-secondary mb-6 text-sm">{METHODOLOGIES[showMethodologyInfo].desc}</p>
              
              <div className="space-y-3">
                {METHODOLOGIES[showMethodologyInfo].steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-surface-2 p-3 rounded-sm border border-border">
                    <div className="w-5 h-5 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium text-text-primary">{step}</p>
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
