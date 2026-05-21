'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Quote as QuoteIcon, Bookmark, Trash2, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

const RANDOM_QUOTES = [
  { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Thinking is difficult, that is why most people judge.", author: "Carl Jung" }
];

export default function QuotesTab() {
  const { quotes, addQuote, deleteQuote } = useStore();
  const [currentQuote, setCurrentQuote] = useState(RANDOM_QUOTES[0]);

  const fetchNewQuote = () => {
    const available = RANDOM_QUOTES.filter(q => q.text !== currentQuote.text);
    const random = available[Math.floor(Math.random() * available.length)];
    setCurrentQuote(random);
  };

  const handleSaveQuote = () => {
    // Only save if not already saved
    if (quotes.some(q => q.text === currentQuote.text)) return;
    
    addQuote({
      id: crypto.randomUUID(),
      text: currentQuote.text,
      author: currentQuote.author,
      savedAt: new Date().toISOString()
    });
  };

  const isSaved = quotes.some(q => q.text === currentQuote.text);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Quotes</h1>
          <p className="text-[#a1a1aa] text-sm">Save quotes that hit hard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-6 text-white/90">Current Quote</h2>
          <div className="p-8 md:p-10 bg-gradient-to-br from-[#a78bfa]/10 to-transparent border border-[#a78bfa]/20 rounded-3xl relative overflow-hidden group">
            <QuoteIcon className="absolute top-6 right-6 text-[#a78bfa]/20 w-24 h-24 transform rotate-12" />
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentQuote.text}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="relative z-10"
              >
                <p className="text-2xl md:text-3xl font-serif leading-tight text-white/90 mb-6 italic tracking-tight">&quot;{currentQuote.text}&quot;</p>
                <p className="text-[#a1a1aa] font-semibold uppercase tracking-wider text-sm mb-8">— {currentQuote.author}</p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleSaveQuote}
                    disabled={isSaved}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isSaved ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#a78bfa] text-white hover:bg-[#8b5cf6] shadow-[0_0_20px_rgba(167,139,250,0.3)]'
                    }`}
                  >
                    <Bookmark size={16} /> {isSaved ? 'Saved' : 'Save Quote'}
                  </button>
                  <button 
                    onClick={fetchNewQuote}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <RefreshCcw size={16} /> Next
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6 text-white/90">Saved Quotes</h2>
          {quotes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl">
              <Bookmark className="mx-auto text-[#71717a] mb-3" size={24} />
              <p className="text-[#71717a] text-sm">No saved quotes yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {quotes.map(quote => (
                <div key={quote.id} className="group p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-white/[0.04] transition-colors relative">
                  <p className="text-lg font-serif italic text-white/80 mb-3 leading-snug">&quot;{quote.text}&quot;</p>
                  <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">— {quote.author}</p>
                  <button 
                    onClick={() => deleteQuote(quote.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#71717a] hover:text-red-400 transition-all rounded-full hover:bg-white/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
