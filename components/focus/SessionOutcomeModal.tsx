'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

interface SessionOutcomeModalProps {
  onSave: (outcome: string, rating: number) => void;
}

export default function SessionOutcomeModal({ onSave }: SessionOutcomeModalProps) {
  const [outcome, setOutcome] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (outcome.length >= 10 && rating > 0) {
      onSave(outcome, rating);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-surface-1 border border-border shadow-2 rounded-2xl p-8 max-w-lg w-full"
      >
        <h2 className="text-h2 font-bold mb-2 text-text-primary text-center">Session complete.</h2>
        <p className="text-text-secondary text-sm text-center mb-8">What did you accomplish?</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
             <textarea 
               value={outcome}
               onChange={e => setOutcome(e.target.value)}
               placeholder="I finished the rough draft of..."
               className="w-full h-32 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent resize-none custom-scrollbar"
               autoFocus
             />
             <div className="text-right text-xs text-text-muted mt-1">
                {outcome.length}/10 min chars
             </div>
          </div>

          <div className="flex flex-col items-center gap-2">
             <label className="text-micro text-text-muted uppercase tracking-wider font-semibold">How focused were you?</label>
             <div className="flex gap-2">
               {[1,2,3,4,5].map(v => (
                 <button 
                   key={v} type="button"
                   onClick={() => setRating(v)}
                   className={`p-2 transition-transform hover:scale-110 ${rating >= v ? 'text-warning' : 'text-surface-3'}`}
                 >
                   <Star size={32} className={rating >= v ? 'fill-current' : ''} />
                 </button>
               ))}
             </div>
          </div>

          <button 
            type="submit" 
            disabled={outcome.length < 10 || rating === 0}
            className="w-full py-4 mt-4 bg-accent text-bg rounded-xl text-lg font-bold shadow-[0_0_20px_var(--color-accent-soft)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Log Session
          </button>
        </form>
      </motion.div>
    </div>
  );
}
