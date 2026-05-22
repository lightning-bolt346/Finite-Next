'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { audioEngine } from '../lib/audioEngine';
import confetti from 'canvas-confetti';

export interface TimerSegment {
  type: 'focus' | 'break';
  durationSeconds: number;
  indexInType: number;
  totalOfType: number;
}

export interface UseFocusTimerProps {
  durationMinutes: number;
  breakMinutes: number;
  numBreaks: number;
  onComplete: () => void;
}

export function useFocusTimer({
  durationMinutes,
  breakMinutes,
  numBreaks,
  onComplete,
}: UseFocusTimerProps) {
  // 1. Calculate the list of segments (Focus alternating with Break)
  const segments = useMemo(() => {
    const list: TimerSegment[] = [];
    if (numBreaks === 0 || breakMinutes === 0) {
      list.push({
        type: 'focus',
        durationSeconds: durationMinutes * 60,
        indexInType: 1,
        totalOfType: 1,
      });
    } else {
      const parts = numBreaks + 1;
      const focusBlockMinutes = Math.max(5, Math.floor((durationMinutes - numBreaks * breakMinutes) / parts));
      const baseFocusSeconds = focusBlockMinutes * 60;
      
      for (let i = 1; i <= parts; i++) {
        list.push({
          type: 'focus',
          durationSeconds: baseFocusSeconds,
          indexInType: i,
          totalOfType: parts,
        });
        
        if (i < parts) {
          list.push({
            type: 'break',
            durationSeconds: breakMinutes * 60,
            indexInType: i,
            totalOfType: numBreaks,
          });
        }
      }
    }
    return list;
  }, [durationMinutes, breakMinutes, numBreaks]);

  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  
  const currentSegment = useMemo(() => {
    return segments[currentSegmentIndex] || segments[segments.length - 1];
  }, [segments, currentSegmentIndex]);

  const totalSeconds = currentSegment.durationSeconds;

  // Refs for high-accuracy wall clock timing
  const startTimestampRef = useRef<number | null>(Date.now()); // Started on mount by default
  const accumulatedSecondsRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);

  // Compute remaining seconds from the wall clock
  const recalculateRemaining = useCallback(() => {
    const total = totalSeconds;
    if (startTimestampRef.current === null) {
      const elapsed = accumulatedSecondsRef.current;
      const remaining = Math.max(0, total - elapsed);
      setRemainingSeconds(remaining);
      return remaining;
    } else {
      const delta = Math.floor((Date.now() - startTimestampRef.current) / 1000);
      const elapsed = accumulatedSecondsRef.current + delta;
      const remaining = Math.max(0, total - elapsed);
      setRemainingSeconds(remaining);
      return remaining;
    }
  }, [totalSeconds]);

  // Tick checker called every 250ms
  const tick = useCallback(() => {
    const remaining = recalculateRemaining();
    if (remaining <= 0) {
      audioEngine.playBell();
      
      if (currentSegmentIndex < segments.length - 1) {
        // Transition to next segment
        setCurrentSegmentIndex((prev) => prev + 1);
        accumulatedSecondsRef.current = 0;
        startTimestampRef.current = isRunning ? Date.now() : null;
        pausedAtRef.current = null;
      } else {
        // All segments finished
        setIsRunning(false);
        startTimestampRef.current = null;
        pausedAtRef.current = null;
        accumulatedSecondsRef.current = totalSeconds;
        setRemainingSeconds(0);
        
        import('canvas-confetti').then((m) => {
          m.default({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        });
        onComplete();
      }
    }
  }, [recalculateRemaining, currentSegmentIndex, segments.length, isRunning, onComplete, totalSeconds]);

  // Register interval & visibility change listener
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(tick, 250);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, tick]);

  // Actions
  const pauseTimer = useCallback(() => {
    if (startTimestampRef.current === null) return;
    const now = Date.now();
    const delta = Math.floor((now - startTimestampRef.current) / 1000);
    accumulatedSecondsRef.current += delta;
    pausedAtRef.current = now;
    startTimestampRef.current = null;
    setIsRunning(false);
    recalculateRemaining();
  }, [recalculateRemaining]);

  const startTimer = useCallback(() => {
    if (startTimestampRef.current !== null) return;
    const now = Date.now();
    if (pausedAtRef.current !== null) {
      startTimestampRef.current = now - (accumulatedSecondsRef.current * 1000);
    } else {
      startTimestampRef.current = now;
    }
    pausedAtRef.current = null;
    setIsRunning(true);
    recalculateRemaining();
  }, [recalculateRemaining]);

  const skipSegment = useCallback(() => {
    audioEngine.playBell();
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      accumulatedSecondsRef.current = 0;
      pausedAtRef.current = null;
      if (isRunning) {
        startTimestampRef.current = Date.now();
      } else {
        startTimestampRef.current = null;
      }
      setTimeout(() => {
        recalculateRemaining();
      }, 0);
    } else {
      setIsRunning(false);
      startTimestampRef.current = null;
      pausedAtRef.current = null;
      accumulatedSecondsRef.current = totalSeconds;
      setRemainingSeconds(0);
      
      import('canvas-confetti').then((m) => {
        m.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      });
      onComplete();
    }
  }, [currentSegmentIndex, segments.length, totalSeconds, isRunning, onComplete, recalculateRemaining]);

  // Sync remaining seconds initially or when segment changes
  useEffect(() => {
    recalculateRemaining();
  }, [currentSegmentIndex, totalSeconds, recalculateRemaining]);

  const currentSegmentElapsed = totalSeconds - remainingSeconds;
  const isPaused = !isRunning;

  return {
    segments,
    currentSegmentIndex,
    currentSegment,
    currentSegmentElapsed,
    remainingSeconds,
    isPaused,
    startTimer,
    pauseTimer,
    skipSegment,
    phase: currentSegment.type,
    phaseIndex: currentSegmentIndex,
    isRunning,
    pause: pauseTimer,
    resume: startTimer,
  };
}
