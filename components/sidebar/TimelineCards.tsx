'use client';

import { useStore } from '../../lib/store';
import { Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TimelineCards() {
  const { events, pinnedTimelineCards, togglePinTimelineCard } = useStore();
  
  // Create a combined list of timeline events (could be expanded to tasks/focus)
  const timelineItems = events.map(e => ({
    id: e.id,
    title: e.title,
    time: `${e.startTime} - ${e.endTime}`,
    type: 'event' as const
  }));

  const pinnedItems = timelineItems.filter(item => pinnedTimelineCards.includes(item.id));
  const unpinnedItems = timelineItems.filter(item => !pinnedTimelineCards.includes(item.id))
    .sort((a, b) => a.time.localeCompare(b.time));

  const displayItems = [...pinnedItems, ...unpinnedItems];

  if (displayItems.length === 0) {
    return (
      <div className="bg-surface-1 rounded-lg p-5 shadow-1 border border-border">
        <h3 className="text-label text-text-muted mb-2">Today&apos;s Timeline</h3>
        <p className="text-sm text-text-secondary italic">Nothing scheduled. Own the day.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 rounded-lg p-5 shadow-1 border border-border flex flex-col gap-4">
      <h3 className="text-label text-text-muted font-semibold uppercase tracking-wider">Today&apos;s Timeline</h3>
      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {displayItems.map((item) => {
            const isPinned = pinnedTimelineCards.includes(item.id);
            return (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative p-3 rounded-sm border border-border flex flex-col gap-1 group transition-colors duration-fast ${
                  isPinned ? 'bg-accent-soft' : 'bg-surface-2 hover:bg-surface-3'
                }`}
                style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--color-accent)' }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-micro text-text-muted font-mono">{item.time}</span>
                  <button 
                    onClick={() => togglePinTimelineCard(item.id)}
                    className={`p-1 rounded-xs transition-opacity duration-fast ${isPinned ? 'opacity-100 text-accent' : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary'}`}
                  >
                    <Pin size={12} className={isPinned ? "fill-current" : ""} />
                  </button>
                </div>
                <div className="text-sm font-semibold text-text-primary line-clamp-2">
                  {item.title}
                </div>
                <div className="mt-1 flex items-center">
                  <span className="px-1.5 py-0.5 rounded-xs bg-surface-1 text-micro text-text-secondary uppercase tracking-widest border border-border-subtle">
                    {item.type}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
