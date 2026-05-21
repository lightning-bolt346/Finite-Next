import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Goal {
  id: string;
  title: string;
  category: 'short' | 'medium' | 'long';
  status: 'active' | 'completed';
  targetDate?: string;
  createdAt: number;
}

export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  createdAt: number;
}

export interface Reflection {
  id: string;
  text: string;
  date: string;
  createdAt: number;
}

export interface QuoteType {
  id: string;
  text: string;
  author: string;
  savedAt: string;
}

interface AppState {
  userId: string | null;
  setUserId: (id: string | null) => void;

  birthDate: string;
  setBirthDate: (date: string) => void;

  goals: Goal[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  events: Event[];
  addEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;

  reflections: Reflection[];
  addReflection: (reflection: Reflection) => void;

  quotes: QuoteType[];
  addQuote: (quote: QuoteType) => void;
  deleteQuote: (id: string) => void;

  clearAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),

      birthDate: '1995-01-01',
      setBirthDate: (date) => set({ birthDate: date }),

      goals: [],
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, updatedFields) => set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g)),
      })),
      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      })),

      events: [],
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      })),

      reflections: [],
      addReflection: (reflection) => set((state) => ({
        reflections: [...state.reflections, reflection],
      })),

      quotes: [],
      addQuote: (quote) => set((state) => ({ quotes: [...state.quotes, quote] })),
      deleteQuote: (id) => set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id),
      })),

      clearAll: () => set({ goals: [], events: [], reflections: [], quotes: [] }),
    }),
    {
      name: 'finite-storage', // local storage key
    }
  )
);
