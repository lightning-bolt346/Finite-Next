'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';
import { useStore } from '../../lib/store';
import { saveBrainDumpToFirestore, deleteBrainDumpFromFirestore } from '../../lib/firebaseSync';

export default function BrainDumpCard() {
  const brainDumps = useStore((state) => state.brainDumps);
  const addBrainDumpByState = useStore((state) => state.addBrainDump);
  const removeBrainDumpByState = useStore((state) => state.removeBrainDump);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleAddDump = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newDump = {
      id: crypto.randomUUID(),
      text: inputText.trim(),
      createdAt: Date.now(),
    };

    addBrainDumpByState(newDump);
    setInputText('');

    try {
      await saveBrainDumpToFirestore('', newDump);
    } catch (err) {
      console.warn('Silent local fallback: ', err);
    }
  };

  const handleDeleteDump = async (id: string) => {
    removeBrainDumpByState(id);
    try {
      await deleteBrainDumpFromFirestore('', id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    const dumpsCopy = [...brainDumps];
    for (const d of dumpsCopy) {
      removeBrainDumpByState(d.id);
      try {
        await deleteBrainDumpFromFirestore('', d.id);
      } catch (err) {
         console.warn(err);
      }
    }
    setShowConfirmClear(false);
  };

  return (
    <div className="mt-6 bg-surface-1 text-text-primary border border-border rounded-2xl shadow-1 overflow-hidden font-sans transition-all duration-300">
      {/* Card Header clickable for collapse */}
      <div 
        onClick={() => setIsMinimized(prev => !prev)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer select-none bg-surface-2/15 hover:bg-surface-2/30 transition-colors border-b border-border/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] animate-pulse" />
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-text-primary">Brain Dump Compartment</h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Offload sudden distractions instantly to keep focus space pristine.</p>
          </div>
        </div>
        <button 
          title={isMinimized ? 'Expand' : 'Collapse'}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(prev => !prev);
          }}
          className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors cursor-pointer"
        >
          {isMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Card Body with Animations */}
      <AnimatePresence initial={false}>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4 font-sans">
              {/* Input Form */}
              <form onSubmit={handleAddDump} className="flex gap-2">
                <input 
                  type="text"
                  value={inputText}
                  title="Brain Dump Input"
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Drop a brief task or thought (e.g. check phone, wash car)..."
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent shadow-inner transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl flex items-center justify-center text-text-primary hover:text-accent transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  title="Unload Thought"
                >
                  <Plus size={14} />
                </button>
              </form>

              {/* Dumps List */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {brainDumps.length > 0 ? (
                  brainDumps.map(dump => (
                    <motion.div
                      key={dump.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="group flex justify-between items-center bg-surface-2/20 border border-border hover:border-border-strong px-3 py-2.5 rounded-xl gap-3 text-xs leading-normal transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-text-secondary select-text block break-words font-medium">{dump.text}</span>
                        <span className="text-[9px] text-text-muted font-mono mt-1 block select-none">
                          {new Date(dump.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDump(dump.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-danger rounded-md transition-all cursor-pointer flex-shrink-0"
                        title="Delete dump element"
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-7 text-center border border-dashed border-border bg-surface-2/5 rounded-xl select-none">
                    <Sparkles size={16} className="text-text-muted mx-auto mb-2 opacity-50" />
                    <span className="text-xs text-text-muted italic block">Your mind space is perfectly clear. No saved thoughts.</span>
                  </div>
                )}
              </div>

              {/* Clear All Tool Bar */}
              {brainDumps.length > 0 && (
                <div className="pt-3 border-t border-border flex justify-between items-center text-[10px] text-text-muted font-mono select-none">
                  <span>UNLOADED OBJECTS: {brainDumps.length}</span>
                  {showConfirmClear ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleClearAll}
                        className="text-danger hover:text-danger/80 font-bold uppercase cursor-pointer"
                      >
                        Confirm Clear
                      </button>
                      <button 
                        onClick={() => setShowConfirmClear(false)}
                        className="text-text-muted hover:text-text-primary uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowConfirmClear(true)}
                      className="text-text-muted hover:text-danger transition-colors uppercase font-bold cursor-pointer"
                    >
                      Empty Cabinet
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
