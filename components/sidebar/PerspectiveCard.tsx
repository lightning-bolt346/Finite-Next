'use client';

import { useState } from 'react';
import { PERSPECTIVE_QUOTES } from '../../lib/constants/perspective';
import { differenceInWeeks, parseISO } from 'date-fns';
import { useStore } from '../../lib/store';
import { Infinity } from 'lucide-react';

export default function PerspectiveCard() {
  const { birthDate, quotes } = useStore();
  
  // Mix hardcoded perspectives with user's saved quotes
  const allPerspectives = [
    ...PERSPECTIVE_QUOTES,
    ...quotes.map(q => `${q.text} — ${q.author}`)
  ];
  
  const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * allPerspectives.length));

  const totalWeeks = 4160;
  const livedWeeks = Math.max(0, differenceInWeeks(new Date(), parseISO(birthDate || '1995-01-01')));
  const lifeRemaining = Math.max(0, ((totalWeeks - livedWeeks) / totalWeeks) * 100);

  // Safely index, in case quotes changed
  const currentIndex = quoteIndex < allPerspectives.length ? quoteIndex : 0;
  
  let text = allPerspectives[currentIndex]
    .replace('{lifeRemaining}', lifeRemaining.toFixed(1))
    .replace('{livedWeeks}', livedWeeks.toString());

  const handleNext = () => {
    setQuoteIndex((prev) => (prev + 1) % allPerspectives.length);
  };

  return (
    <div 
      className="bg-surface-1 rounded-lg p-5 shadow-1 border border-border cursor-pointer hover:bg-surface-2 transition-colors duration-medium flex flex-col gap-3 group"
      onClick={handleNext}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-label text-text-primary font-semibold flex items-center gap-2">
          <Infinity size={16} className="text-accent" /> Perspective
        </h3>
      </div>
      <div className="text-body text-text-secondary leading-relaxed italic">
        "{text}"
      </div>
      <div className="text-micro text-text-muted mt-2 group-hover:text-accent transition-colors">Tap for another</div>
    </div>
  );
}
