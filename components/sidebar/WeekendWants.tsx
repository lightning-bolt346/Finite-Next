'use client';

import { useState } from 'react';
import { useStore } from '../../lib/store';
import { saveWeekendWantToFirestore, deleteWeekendWantFromFirestore } from '../../lib/firebaseSync';
import { Plus, X, History, Sparkles, Check, Trash2, Calendar, Clock, Smile, Heart, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function WeekendWants() {
  const { weekendWants, addWeekendWant, updateWeekendWant, removeWeekendWant } = useStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newWantText, setNewWantText] = useState("");
  const [newWantDate, setNewWantDate] = useState("");
  const [newWantTime, setNewWantTime] = useState("");

  const [reflectingWantId, setReflectingWantId] = useState<string | null>(null);
  const [enjoyText, setEnjoyText] = useState("");
  const [feelText, setFeelText] = useState("");

  const [showHistory, setShowHistory] = useState(false);

  const activeWants = weekendWants.filter(w => w.status === 'open');
  const pastWants = weekendWants.filter(w => w.status !== 'open').sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));

  const handleAddWant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWantText.trim()) return;
    if (activeWants.length >= 5) {
      alert("Weekend wants are capped at a cozy list of 5 things to keep things simple and pressure-free.");
      return;
    }

    const wantData = {
      id: crypto.randomUUID(),
      text: newWantText.trim(),
      status: 'open' as const,
      createdAt: Date.now(),
      date: newWantDate || undefined,
      time: newWantTime || undefined,
    };

    addWeekendWant(wantData);
    saveWeekendWantToFirestore(wantData);

    setNewWantText("");
    setNewWantDate("");
    setNewWantTime("");
    setIsAdding(false);
  };

  const handleWantAction = (id: string, action: 'done' | 'missed') => {
    if (action === 'done') {
      setReflectingWantId(id);
      setEnjoyText('');
      setFeelText('');
    } else {
      const existingWant = weekendWants.find(w => w.id === id);
      if (existingWant) {
        const updated = { ...existingWant, status: 'missed' as const, closedAt: Date.now() };
        updateWeekendWant(id, { status: 'missed', closedAt: Date.now() });
        saveWeekendWantToFirestore(updated);
      }
    }
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectingWantId) return;

    const existingWant = weekendWants.find(w => w.id === reflectingWantId);
    if (existingWant) {
      const updated = {
        ...existingWant,
        status: 'done' as const,
        closedAt: Date.now(),
        enjoy: enjoyText.trim() || undefined,
        feel: feelText.trim() || undefined,
      };
      updateWeekendWant(reflectingWantId, {
        status: 'done',
        closedAt: Date.now(),
        enjoy: enjoyText.trim() || undefined,
        feel: feelText.trim() || undefined,
      });
      saveWeekendWantToFirestore(updated);
    }

    setReflectingWantId(null);
  };

  return (
    <div className="p-6 bg-surface-1 border border-border rounded-xl flex flex-col gap-4 select-none">
      
      {/* Header Container */}
      <div className="flex items-center justify-between z-10 relative">
        <h2 className="text-base font-medium text-text-primary tracking-tight">Weekend</h2>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* History Button */}
          <button 
             onClick={() => setShowHistory(true)}
             title="Logs History"
             className="p-1.5 rounded-full hover:bg-surface-2 text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
             <History size={14} />
          </button>
          
          {/* Mono Live Count Badge */}
          <span className="text-xs text-text-muted">
             {activeWants.length} / 5
          </span>
        </div>
      </div>

      {/* List / Empty State */}
      <div className="space-y-2.5 relative z-10 flex-1">
        <AnimatePresence initial={false}>
          {activeWants.map((want) => (
            <motion.div 
              key={want.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group/item bg-surface-2/40 hover:bg-surface-2/80 border border-border p-3.5 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="min-w-0 pr-4">
                 <span className="text-sm font-medium text-text-primary leading-tight block truncate">{want.text}</span>
                 {(want.date || want.time) && (
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted font-mono">
                      {want.date && (
                         <span className="flex items-center gap-1">
                            <Calendar size={10} className="text-text-muted" /> {want.date}
                         </span>
                      )}
                      {want.time && (
                         <span className="flex items-center gap-1">
                            <Clock size={10} className="text-text-muted" /> {want.time}
                         </span>
                      )}
                    </div>
                 )}
              </div>

              {/* Action options - visible on hover of group/item only */}
              <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-fast">
                 {/* Done button */}
                 <button 
                    onClick={() => handleWantAction(want.id, 'done')}
                    className="p-1 rounded-full text-text-muted hover:text-success hover:bg-surface-3 transition-colors cursor-pointer"
                    title="Mark as done"
                 >
                    <Check size={14} />
                 </button>
                 {/* Delete button */}
                 <button 
                    onClick={() => (() => {
                       removeWeekendWant(want.id);
                       deleteWeekendWantFromFirestore(want.id);
                     })()}
                    className="p-1 rounded-full text-text-muted hover:text-danger hover:bg-surface-3 transition-colors cursor-pointer"
                    title="Remove item"
                 >
                    <Trash2 size={14} />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activeWants.length === 0 && (
           <div className="py-12 px-4 text-center rounded-xl border border-dashed border-border bg-surface-1/50 flex flex-col items-center justify-center gap-2">
              <Calendar size={20} className="text-text-muted" />
              <p className="text-xs text-text-muted">
                 Nothing planned yet.
              </p>
           </div>
        )}
      </div>

      {/* Expandable Add trigger */}
      <div className="z-10 relative">
        <AnimatePresence>
          {isAdding ? (
             <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddWant} 
                className="space-y-3 bg-surface-2 p-4 rounded-xl border border-border"
             >
                <div className="space-y-1">
                   <input 
                      type="text"
                      required
                      value={newWantText}
                      onChange={e => setNewWantText(e.target.value)}
                      placeholder="What do you want to do this weekend?"
                      className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-all font-medium"
                   />
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Optional Date</label>
                      <input 
                         type="date"
                         value={newWantDate}
                         onChange={e => setNewWantDate(e.target.value)}
                         className="w-full bg-surface-1 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-all cursor-pointer font-medium"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Optional Time</label>
                      <input 
                         type="time"
                         value={newWantTime}
                         onChange={e => setNewWantTime(e.target.value)}
                         className="w-full bg-surface-1 border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-all cursor-pointer font-medium"
                      />
                   </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1.5">
                   <button 
                      type="button" 
                      onClick={() => {
                        setIsAdding(false);
                        setNewWantText("");
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                   >
                      Cancel
                   </button>
                   <button 
                      type="submit"
                      className="px-4 py-1.5 bg-accent text-bg hover:opacity-90 text-xs font-extrabold rounded-lg transition-colors cursor-pointer shadow-xs"
                   >
                      Save Want
                   </button>
                </div>
             </motion.form>
          ) : (
             activeWants.length < 5 && (
                <button 
                   onClick={() => setIsAdding(true)}
                   className="w-full py-2.5 bg-surface-2/40 hover:bg-surface-2/75 border border-dashed border-border text-center rounded-xl flex items-center justify-center gap-1.5 text-text-secondary hover:text-text-primary text-xs font-bold transition-all cursor-pointer hover:scale-[1.002] active:scale-95"
                >
                   <Plus size={14} /> Add Weekend Want
                </button>
             )
          )}
        </AnimatePresence>
      </div>

      {/* REFLECTION INPUT DIALOG PANEL */}
      <AnimatePresence>
         {reflectingWantId && (() => {
            const reflectedWant = weekendWants.find(w => w.id === reflectingWantId);
            if (!reflectedWant) return null;

            return (
               <div className="fixed inset-0 z-[110] bg-bg/85 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 15 }}
                     className="w-full max-w-md bg-surface-1 border border-border rounded-2xl shadow-2 p-6 overflow-hidden relative select-none"
                     onClick={e => e.stopPropagation()}
                  >
                     {/* Background Color Glow */}
                     <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-success-soft/30 to-transparent blur-xl rounded-full pointer-events-none" />

                     <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2 items-center">
                           <div className="w-8 h-8 rounded-full bg-success-soft/35 flex items-center justify-center text-success">
                              <Smile size={16} />
                           </div>
                           <div>
                              <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">Cozy Reflection</h3>
                              <p className="text-[11px] text-text-muted">A moment of self-discovery.</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setReflectingWantId(null)} 
                           className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                           <X size={16} />
                        </button>
                     </div>

                     <div className="bg-surface-2 p-3.5 rounded-xl border border-border/80 text-xs text-text-primary mb-5 font-medium italic block text-center">
                        "{reflectedWant.text}"
                     </div>

                     <form onSubmit={handleReflectionSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-micro text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                              <Heart size={10} className="text-success" /> What did you enjoy?
                           </label>
                           <textarea
                              required
                              rows={2}
                              value={enjoyText}
                              onChange={e => setEnjoyText(e.target.value)}
                              placeholder="e.g. Loved smelling the fresh basil, chatting with neighbors..."
                              className="w-full bg-surface-2 border border-border focus:border-success/80 rounded-xl p-3 text-xs text-text-primary focus:outline-none resize-none transition-colors"
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-micro text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                              <MessageCircle size={10} className="text-accent" /> How did you feel?
                           </label>
                           <textarea
                              required
                              rows={2}
                              value={feelText}
                              onChange={e => setFeelText(e.target.value)}
                              placeholder="e.g. Grounded, pressure-free, completely refreshed..."
                              className="w-full bg-surface-2 border border-border focus:border-accent/80 rounded-xl p-3 text-xs text-text-primary focus:outline-none resize-none transition-colors"
                           />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                           <button 
                              type="button" 
                              onClick={() => setReflectingWantId(null)}
                              className="px-3.5 py-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                           >
                              Dismiss
                           </button>
                           <button 
                              type="submit"
                              className="px-5 py-2 bg-success text-surface-1 hover:bg-success/90 text-xs font-extrabold rounded-full transition-colors cursor-pointer shadow-sm active:scale-95"
                           >
                              Save Reflection
                           </button>
                        </div>
                     </form>
                  </motion.div>
               </div>
            );
         })()}
      </AnimatePresence>

      {/* HISTORIC DIARY DRAWER/MODAL */}
      <AnimatePresence>
         {showHistory && (
            <div className="fixed inset-0 z-[110] bg-bg/85 backdrop-blur-sm flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-lg bg-surface-1 border border-border rounded-2xl shadow-2 p-6 relative max-h-[85vh] flex flex-col select-none"
                  onClick={e => e.stopPropagation()}
               >
                  <div className="flex items-start justify-between mb-4 border-b border-border/70 pb-3 flex-shrink-0">
                     <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-warning-soft/30 flex items-center justify-center text-warning">
                           <History size={16} />
                        </div>
                        <div>
                           <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-tight">Weekend Wants History</h3>
                           <p className="text-[11px] text-text-muted">A collection of cozy past memories.</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setShowHistory(false)} 
                        className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface-2 transition-colors cursor-pointer"
                     >
                        <X size={16} />
                     </button>
                  </div>

                  {/* History Logs Scroll List */}
                  <div className="overflow-y-auto space-y-4 pr-1 flex-1 py-1 scrollbar-none">
                     {pastWants.length > 0 ? (
                        pastWants.map(want => {
                          const isDone = want.status === 'done';
                          return (
                             <div 
                                key={want.id} 
                                className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:scale-[1.005] ${isDone ? 'bg-surface-2/45 border-success/15 hover:border-success/30' : 'bg-surface-2/15 border-border/80 opacity-70'}`}
                             >
                                <div className="flex items-start justify-between gap-4">
                                   <div>
                                      <h4 className="text-sm font-bold text-text-primary">{want.text}</h4>
                                      {(want.date || want.time) && (
                                         <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted font-mono">
                                            {want.date && <span className="flex items-center gap-0.5"><Calendar size={10} /> {want.date}</span>}
                                            {want.time && <span className="flex items-center gap-0.5"><Clock size={10} /> {want.time}</span>}
                                         </div>
                                      )}
                                   </div>

                                   <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase select-none tracking-wider ${isDone ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                                      {isDone ? 'Done' : 'Missed'}
                                   </span>
                                </div>

                                {/* Completed reflections details */}
                                {isDone && (want.enjoy || want.feel) && (
                                   <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border/50 bg-surface-1/40 p-3 rounded-lg">
                                      {want.enjoy && (
                                         <div className="space-y-0.5">
                                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                                               <Smile size={10} className="text-success" /> Enjoyed
                                            </span>
                                            <p className="text-xs text-text-secondary italic leading-relaxed">
                                               "{want.enjoy}"
                                            </p>
                                         </div>
                                      )}
                                      {want.feel && (
                                         <div className="space-y-0.5">
                                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                                               <Heart size={10} className="text-accent" /> Felt
                                            </span>
                                            <p className="text-xs text-text-secondary italic leading-relaxed">
                                               "{want.feel}"
                                            </p>
                                         </div>
                                      )}
                                   </div>
                                )}
                             </div>
                          );
                        })
                     ) : (
                        <div className="py-12 text-center">
                           <p className="text-xs text-text-muted italic">No past weekend memories logged yet.</p>
                        </div>
                     )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-border/70 flex-shrink-0">
                     <button 
                        onClick={() => setShowHistory(false)}
                        className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
                     >
                        Close History
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
