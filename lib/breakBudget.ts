export interface BreakPlan {
  breakCount: number;
  focusBlockMinutes: number; // actual focus time per block
  totalBreakMinutes: number;
  breakPercentage: number;   // e.g. 24.0
  intervals: Array<{ type: 'focus' | 'break'; minutes: number }>;
}

/**
 * Returns every valid break count (1 -> N) for the given
 * focus duration and break duration, bounded by the 30% rule.
 *
 * Math:
 *   maxBreaks = floor( (focusMinutes * 0.30) / breakMinutes )
 *   focusBlockMinutes = floor( (focusMinutes - breakCount * breakMinutes) / (breakCount + 1) )
 *
 * A break count is only valid if focusBlockMinutes >= 5 (minimum viable focus block).
 * If maxBreaks === 0, return an empty array.
 */
export function computeValidBreakOptions(
  focusMinutes: number,
  breakMinutes: number
): BreakPlan[] {
  if (breakMinutes <= 0 || focusMinutes <= 0) return [];
  
  const maxBreaks = Math.floor((focusMinutes * 0.30) / breakMinutes);
  if (maxBreaks === 0) return [];

  const options: BreakPlan[] = [];
  for (let breakCount = 1; breakCount <= maxBreaks; breakCount++) {
    const focusBlockMinutes = Math.floor(
      (focusMinutes - breakCount * breakMinutes) / (breakCount + 1)
    );
    
    if (focusBlockMinutes >= 5) {
      const totalBreakMinutes = breakCount * breakMinutes;
      const breakPercentage = Math.round((totalBreakMinutes / focusMinutes) * 1000) / 10;
      
      const intervals: Array<{ type: 'focus' | 'break'; minutes: number }> = [];
      for (let i = 0; i < breakCount; i++) {
        intervals.push({ type: 'focus', minutes: focusBlockMinutes });
        intervals.push({ type: 'break', minutes: breakMinutes });
      }
      intervals.push({ type: 'focus', minutes: focusBlockMinutes });

      options.push({
        breakCount,
        focusBlockMinutes,
        totalBreakMinutes,
        breakPercentage,
        intervals
      });
    }
  }

  return options;
}
