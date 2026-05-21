const LOCAL_FALLBACKS = [
  { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Thinking is difficult, that is why most people judge.", author: "Carl Jung" }
];

export async function getQuote(bypassCache = false): Promise<{text: string, author: string}> {
  const CACHE_KEY = 'finite_quote_cache';
  
  if (!bypassCache) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const ageHours = (Date.now() - parsed.cachedAt) / (1000 * 60 * 60);
        if (ageHours < 6) {
          return { text: parsed.text, author: parsed.author };
        }
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  const cacheQuote = (quote: {text: string, author: string}) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ...quote, cachedAt: Date.now() }));
    } catch (e) {
      // ignore
    }
    return quote;
  };

  // Try API 1 (DummyJSON)
  try {
    const res = await fetch('https://dummyjson.com/quotes/random', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.quote && data.author) {
        return cacheQuote({ text: data.quote, author: data.author });
      }
    }
  } catch (e) {
    console.error('DummyJSON API failed', e);
  }

  // Try API 2 (Motivational Spark)
  try {
    const res = await fetch('https://motivational-spark-api.vercel.app/api/quotes/random', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.quote && data.author) {
        return cacheQuote({ text: data.quote, author: data.author });
      }
    }
  } catch (e) {
    console.error('Motivational Spark API failed', e);
  }

  // Try API 3 (Type.fit proxy or just skip and rely on fallbacks)

  // Fallback
  const randomFallback = LOCAL_FALLBACKS[Math.floor(Math.random() * LOCAL_FALLBACKS.length)];
  return cacheQuote(randomFallback);
}
