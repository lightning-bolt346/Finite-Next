'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Quote as QuoteIcon, Bookmark, Trash2, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getQuote } from '../lib/quoteEngine';

export default function QuotesTab() {
  const { quotes, addQuote, deleteQuote } = useStore();
  const [currentQuote, setCurrentQuote] = useState<{text: string, author: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNewQuote = async (bypass = false) => {
    setLoading(true);
    const q = await getQuote(bypass);
    setCurrentQuote(q);
    setLoading(false);
  };

  useEffect(() => {
    fetchNewQuote();
  }, []);

  const handleSaveQuote = () => {
    if (!currentQuote) return;
    if (quotes.some(q => q.text === currentQuote.text)) return;
    
    addQuote({
      id: crypto.randomUUID(),
      text: currentQuote.text,
      author: currentQuote.author,
      savedAt: new Date().toISOString()
    });
  };

  const isSaved = currentQuote ? quotes.some(q => q.text === currentQuote.text) : false;

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
                key={currentQuote?.text || 'loading'}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="relative z-10 min-h-[200px] flex flex-col justify-end"
              >
                {loading && !currentQuote ? (
                  <div className="flex-1 flex flex-col justify-center animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
                    <div className="h-3 bg-white/10 rounded w-1/4"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl md:text-3xl font-serif leading-tight text-white/90 mb-6 italic tracking-tight">&quot;{currentQuote?.text}&quot;</p>
                    <p className="text-[#a1a1aa] font-semibold uppercase tracking-wider text-sm mb-8">— {currentQuote?.author}</p>
                    
                    <div className="flex gap-3 mt-auto">
                      <button 
                        onClick={handleSaveQuote}
                        disabled={isSaved || loading}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isSaved ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-[#a78bfa] text-white hover:bg-[#8b5cf6] shadow-[0_0_20px_rgba(167,139,250,0.3)]'
                        }`}
                      >
                        <Bookmark size={16} /> {isSaved ? 'Saved' : 'Save Quote'}
                      </button>
                      <button 
                        onClick={() => fetchNewQuote(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Next
                      </button>
                    </div>
                  </>
                )}
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
