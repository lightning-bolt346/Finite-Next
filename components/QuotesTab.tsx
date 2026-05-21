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
          <h1 className="text-h1 font-bold tracking-tight m-0 text-text-primary mb-2">Quotes</h1>
          <p className="text-text-muted text-sm">Save quotes that hit hard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-h2 font-semibold mb-6 text-text-primary">Current Quote</h2>
          <div className="p-8 md:p-10 bg-gradient-to-br from-[#a78bfa]/10 to-transparent border border-accent/20 rounded-sm shadow-1 relative overflow-hidden group">
            <QuoteIcon className="absolute top-6 right-6 text-accent/20 w-24 h-24 transform rotate-12" />
            
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
                    <p className="text-2xl md:text-3xl font-serif leading-tight text-text-primary mb-6 italic tracking-tight">&quot;{currentQuote?.text}&quot;</p>
                    <p className="text-text-muted font-semibold uppercase tracking-wider text-sm mb-8">— {currentQuote?.author}</p>
                    
                    <div className="flex gap-3 mt-auto">
                      <button 
                        onClick={handleSaveQuote}
                        disabled={isSaved || loading}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                          isSaved ? 'bg-white/10 text-text-primary/50 cursor-not-allowed' : 'bg-accent text-text-primary hover:opacity-90 shadow-[0_0_20px_rgba(167,139,250,0.3)]'
                        }`}
                      >
                        <Bookmark size={16} /> {isSaved ? 'Saved' : 'Save Quote'}
                      </button>
                      <button 
                        onClick={() => fetchNewQuote(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-text-primary rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
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
          <h2 className="text-h2 font-semibold mb-6 flex items-center justify-between text-text-primary">
            Saved Quotes
            <span className="text-sm font-normal text-text-muted">{quotes.length} total</span>
          </h2>
          {quotes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-lg shadow-1">
              <Bookmark className="mx-auto text-text-secondary mb-3" size={24} />
              <p className="text-text-secondary text-sm">No saved quotes yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(
                quotes.reduce((acc, q) => {
                  acc[q.author] = acc[q.author] || [];
                  acc[q.author].push(q);
                  return acc;
                }, {} as Record<string, typeof quotes>)
              ).map(([author, authorQuotes]) => (
                <div key={author} className="space-y-4 relative">
                  <div className="flex items-center gap-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">{author}</h3>
                     <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <div className="grid gap-4">
                    {authorQuotes.map(quote => (
                      <div key={quote.id} className="group p-6 bg-surface-1 border border-border rounded-xl shadow-1 hover:border-border-strong transition-colors relative">
                        <QuoteIcon className="absolute top-4 right-4 text-surface-2 w-8 h-8" />
                        <p className="text-lg font-serif italic text-text-primary/90 mb-2 leading-relaxed relative z-10">&quot;{quote.text}&quot;</p>
                        <button 
                          onClick={() => deleteQuote(quote.id)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-danger-soft transition-all rounded-md z-20"
                          title="Delete Quote"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
