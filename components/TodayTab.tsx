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
          <h1 className="text-h1 font-bold text-text-primary mb-2">Today</h1>
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
