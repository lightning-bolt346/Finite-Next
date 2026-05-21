'use client';

import { useStore } from '../lib/store';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { differenceInWeeks, parseISO } from 'date-fns';

export default function DashboardTab() {
  const { goals, quotes, birthDate } = useStore();
  const [randomQuote, setRandomQuote] = useState<{text: string, author: string} | null>(null);

  useEffect(() => {
    const fallback = { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" };
    // Defend against synchronous setState warnings
    setTimeout(() => {
      if (quotes.length > 0) {
        setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      } else {
        setRandomQuote(fallback);
      }
    }, 0);
  }, [quotes]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const todayGoal = activeGoals.find(g => g.category === 'short');
  const nextDeadline = activeGoals.find(g => g.targetDate);

  const totalWeeks = 4160;
  const livedWeeks = useMemo(() => {
    try {
      return Math.max(0, differenceInWeeks(new Date(), parseISO(birthDate)));
    } catch {
      return 1560;
    }
  }, [birthDate]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 rounded-full bg-white/5 text-xs text-[#a1a1aa] mb-4 uppercase tracking-wider font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_12px_#34d399]" />
            One week at a time
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90">Here&apos;s your timeline.</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="p-6 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Today&apos;s focus</span>
            <span className="text-xs px-2.5 py-1 border border-white/10 rounded-full text-[#a1a1aa] whitespace-nowrap">—</span>
          </div>
          <div className="text-2xl font-medium tracking-tight mb-2 text-white/90 line-clamp-2">
            {todayGoal ? todayGoal.title : "—"}
          </div>
          <p className="text-sm text-[#71717a]">{todayGoal ? "Active objective" : "Set a goal on the Today page."}</p>
        </div>

        <div className="p-6 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors rounded-3xl backdrop-blur-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Next deadline</span>
            <span className="text-xs px-2.5 py-1 border border-white/10 rounded-full text-[#a1a1aa] whitespace-nowrap">Upcoming</span>
          </div>
          <div className="text-2xl font-medium tracking-tight mb-2 text-white/90 line-clamp-2">
            {nextDeadline && nextDeadline.targetDate ? new Date(nextDeadline.targetDate).toLocaleDateString() : "—"}
          </div>
          <p className="text-sm text-[#71717a]">{nextDeadline ? nextDeadline.title : "No deadlines yet."}</p>
        </div>

        <div className="p-6 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Random perspective</span>
            <Quote size={16} className="text-[#a1a1aa]" />
          </div>
          <div className="text-lg font-serif text-white/90 tracking-tight leading-snug mb-4 italic">
            &quot;{randomQuote?.text}&quot;
          </div>
          <p className="text-xs text-[#71717a] uppercase font-semibold tracking-wider">— {randomQuote?.author}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-6 md:p-10 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
          <h2 className="text-2xl font-semibold tracking-tight mb-2 text-white/90">Life in weeks</h2>
          <p className="text-[#a1a1aa] text-sm mb-6">Each square is one week. Filled squares are lived. Empty squares are still ahead.</p>
          
          <div className="flex gap-4 flex-wrap text-xs font-medium text-[#a1a1aa] mb-8 uppercase tracking-wider">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#a78bfa]" /> Lived</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#34d399]/20 border border-[#34d399] shadow-[0_0_8px_#34d399/50]" /> Current</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-white/10 border border-white/10" /> Ahead</div>
          </div>

          <div className="flex flex-wrap gap-[3px]">
            {Array.from({ length: totalWeeks }).map((_, i) => {
              const isLived = i < livedWeeks;
              const isCurrent = i === livedWeeks;
              return (
                <div 
                  key={i} 
                  className={`
                    w-[6px] h-[6px] md:w-[7px] md:h-[7px] rounded-[2px] transition-all duration-300
                    ${isCurrent ? 'bg-[#34d399] shadow-[0_0_12px_#34d399] scale-125 z-10' : 
                      isLived ? 'bg-[#a78bfa]/60' : 
                      'bg-white/[0.06] border border-white/[0.04]'}
                  `}
                />
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
