'use client';

import { motion } from 'motion/react';
import DailyCommandSidebar from './today/DailyCommandSidebar';
import TaskCenter from './today/TaskCenter';
import TodayStatsRight from './today/TodayStatsRight';
import { getQuote } from '../lib/quoteEngine';
import { useState, useEffect } from 'react';

export default function TodayTab() {
  const [quote, setQuote] = useState<{text: string, author: string} | null>(null);

  useEffect(() => {
    getQuote().then(setQuote);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-h1 font-bold text-text-primary">Today</h1>
            <span className="text-sm font-semibold text-accent/80 font-mono tracking-wider">
              · {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-text-secondary text-sm md:w-[60%]">
             Command center. Everything visible, nothing overwhelming. {quote ? `"${quote.text}"` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <DailyCommandSidebar />

        {/* Center Column */}
        <div className="flex-1 min-w-0">
           <TaskCenter />
        </div>

        {/* Right Column */}
        <div className="hidden md:block">
           <TodayStatsRight />
        </div>
      </div>
    </motion.div>
  );
}
