'use client';

import { useState } from 'react';
import { useStore } from '../../lib/store';
import { Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function WeekendWants() {
  const { weekendWants, addWeekendWant, updateWeekendWant, removeWeekendWant } = useStore();

  const [newWant, setNewWant] = useState("");
  const [reflectingId, setReflectingId] = useState<string | null>(null);
  const [reflectionFeel, setReflectionFeel] = useState("");

  const activeWants = weekendWants.filter(w => w.status === 'open');

  const handleAddWant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWant.trim() && activeWants.length < 5) {
      addWeekendWant({
        id: crypto.randomUUID(),
        text: newWant.trim(),
        status: 'open',
        createdAt: Date.now()
      });
      setNewWant("");
    }
  };

  const handleWantAction = (id: string, action: 'done' | 'missed') => {
    updateWeekendWant(id, { status: action, closedAt: Date.now() });
    if (action === 'done') {
      setReflectingId(id);
      setReflectionFeel('');
    }
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectingId) return;
    updateWeekendWant(reflectingId, { feel: reflectionFeel });
    setReflectingId(null);
  };

  return (
    <div className="p-5 bg-surface-1 border border-warning/20 rounded-lg relative overflow-hidden flex flex-col gap-2">
      <div className="absolute inset-0 bg-gradient-to-br from-warning-soft to-transparent pointer-events-none" />
      <h2 className="text-label font-semibold text-warning">Weekend Wants</h2>
      <p className="text-xs text-text-muted">Not a productivity list.</p>
      
      <div className="space-y-2 mt-2 z-10 relative">
        <AnimatePresence>
          {reflectingId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
              <div className="p-3 bg-surface-2 rounded-md border border-border mt-2">
                <h4 className="text-xs font-bold text-text-primary mb-2">How was it?</h4>
                <form onSubmit={handleReflectionSubmit}>
                  <textarea 
                    autoFocus
                    value={reflectionFeel}
                    onChange={(e) => setReflectionFeel(e.target.value)}
                    placeholder="What did you enjoy?"
                    className="w-full bg-surface-3 border border-border rounded-sm px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-warning resize-none mb-2"
                    rows={2}
                  />
                  <button type="submit" className="px-2 py-1 bg-warning/20 text-warning rounded-sm text-xs font-semibold hover:bg-warning/30 transition-colors">
                    Save
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeWants.map((want) => (
          <div key={want.id} className="flex justify-between items-center group bg-surface-2 rounded-sm px-2 py-1.5 border border-border/50">
            <span className="text-xs text-text-primary">{want.text}</span>
            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
              <button type="button" onClick={() => handleWantAction(want.id, 'done')} className="px-1.5 py-0.5 bg-success-soft text-success rounded-xs text-[9px] font-bold uppercase hover:bg-success/30">Done</button>
              <button type="button" onClick={() => handleWantAction(want.id, 'missed')} className="px-1.5 py-0.5 bg-danger-soft text-danger rounded-xs text-[9px] font-bold uppercase hover:bg-danger/30">Miss</button>
              <button type="button" onClick={() => removeWeekendWant(want.id)} className="p-0.5 text-text-muted hover:text-danger">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        {activeWants.length === 0 && <span className="text-xs text-text-muted italic block py-2">Empty. Add something fun.</span>}
      </div>

      {activeWants.length < 5 && (
        <form onSubmit={handleAddWant} className="flex gap-2 mt-2 z-10 relative">
          <input 
            type="text"
            value={newWant}
            onChange={e => setNewWant(e.target.value)}
            placeholder="e.g. Bake bread"
            className="flex-1 bg-surface-2 border border-border rounded-sm px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-warning transition-colors"
          />
          <button type="submit" className="px-2 py-1.5 bg-warning/20 text-warning rounded-sm hover:bg-warning/30 transition-colors">
            <Plus size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
