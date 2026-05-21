import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Goal {
  id: string;
  title: string;
  category: 'short' | 'medium' | 'long';
  status: 'active' | 'completed';
  type?: 'outcome' | 'process';
  notes?: string;
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

export interface FocusSession {
  id: string;
  title?: string;
  outcome?: string;
  durationMinutes: number;
  date: string;
  createdAt: number;
}

export type SavedItemCategory = 'YouTube' | 'Blogs' | 'Books' | 'Courses' | 'Movies' | 'TV Shows' | 'Podcasts' | 'Music' | 'Games';

export interface SavedItem {
  id: string;
  title: string;
  category: SavedItemCategory | string;
  status: 'inbox' | 'current' | 'done';
  savedAt: string;
  url?: string;
  type?: string;
  tags?: string[];
  notes?: string;
}

export interface TodayGoal {
  id: string;
  title: string;
  doneText: string;
  priority: 'Normal' | 'High' | 'Critical';
  minutes: number;
  completed: boolean;
  date: string; // YYYY-MM-DD
  archived?: boolean;
  rolledFromDate?: string;
  rolledToDate?: string;
  createdAt: number;
}

export interface WeekendWant {
  id: string;
  text: string;
  status: 'open' | 'done' | 'missed';
  enjoy?: string;
  feel?: string;
  createdAt: number;
  closedAt?: number;
}

export type Theme = 'midnight' | 'solar' | 'forest' | 'light' | 'mono' | 'sepia' | 'lavender' | 'ocean' | 'sage' | 'mist';

interface AppState {
  userId: string | null;
  setUserId: (id: string | null) => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;

  pinnedWidgets: string[];
  togglePinWidget: (widgetId: string) => void;

  todayGoals: Record<string, TodayGoal>;
  setTodayGoal: (date: string, goal: Partial<TodayGoal>) => void;
  archiveTodayGoal: (date: string) => void;
  rollTodayGoal: (oldDate: string, newDate: string) => void;

  userName: string;
  setUserName: (name: string) => void;

  setupComplete: boolean;
  setSetupComplete: (v: boolean) => void;

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

  weekendWants: WeekendWant[];
  addWeekendWant: (item: WeekendWant) => void;
  updateWeekendWant: (id: string, updates: Partial<WeekendWant>) => void;
  removeWeekendWant: (id: string) => void;

  focusSessions: FocusSession[];
  addFocusSession: (session: FocusSession) => void;

  savedItems: SavedItem[];
  addSavedItem: (item: SavedItem) => void;
  updateSavedItem: (id: string, updates: Partial<SavedItem>) => void;
  deleteSavedItem: (id: string) => void;

  pinWidget: (id: string) => void;
  unpinWidget: (id: string) => void;

  clearAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),

      theme: 'midnight',
      setTheme: (theme) => set({ theme }),

      pinnedWidgets: [],
      togglePinWidget: (widgetId) => set((state) => ({
        pinnedWidgets: state.pinnedWidgets.includes(widgetId)
          ? state.pinnedWidgets.filter(id => id !== widgetId)
          : [...state.pinnedWidgets, widgetId]
      })),
      pinWidget: (widgetId) => set((state) => ({
        pinnedWidgets: state.pinnedWidgets.includes(widgetId) ? state.pinnedWidgets : [...state.pinnedWidgets, widgetId]
      })),
      unpinWidget: (widgetId) => set((state) => ({
        pinnedWidgets: state.pinnedWidgets.filter(id => id !== widgetId)
      })),

      todayGoals: {},
      setTodayGoal: (date, goal) => set((state) => ({
        todayGoals: {
          ...state.todayGoals,
          [date]: { ...state.todayGoals[date], ...goal } as TodayGoal
        }
      })),
      archiveTodayGoal: (date) => set((state) => ({
        todayGoals: {
          ...state.todayGoals,
          [date]: { ...state.todayGoals[date], archived: true }
        }
      })),
      rollTodayGoal: (oldDate, newDate) => set((state) => {
        const oldGoal = state.todayGoals[oldDate];
        if (!oldGoal) return state;
        return {
          todayGoals: {
            ...state.todayGoals,
            [oldDate]: { ...oldGoal, rolledToDate: newDate },
            [newDate]: { ...oldGoal, id: crypto.randomUUID(), date: newDate, completed: false, rolledFromDate: oldDate, createdAt: Date.now() }
          }
        };
      }),

      userName: '',
      setUserName: (name) => set({ userName: name }),

      setupComplete: false,
      setSetupComplete: (v) => set({ setupComplete: v }),

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

      weekendWants: [],
      addWeekendWant: (item) => set((state) => ({ weekendWants: [...state.weekendWants, item] })),
      updateWeekendWant: (id, updates) => set((state) => ({
        weekendWants: state.weekendWants.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      removeWeekendWant: (id) => set((state) => ({
        weekendWants: state.weekendWants.filter((w) => w.id !== id),
      })),

      focusSessions: [],
      addFocusSession: (session) => set((state) => ({ focusSessions: [...state.focusSessions, session] })),

      savedItems: [],
      addSavedItem: (item) => set((state) => ({ savedItems: [...state.savedItems, item] })),
      updateSavedItem: (id, updates) => set((state) => ({
        savedItems: state.savedItems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      deleteSavedItem: (id) => set((state) => ({
        savedItems: state.savedItems.filter((s) => s.id !== id),
      })),

      clearAll: () => set({ 
        goals: [], events: [], reflections: [], quotes: [], 
        weekendWants: [], focusSessions: [], savedItems: [],
        setupComplete: false, userName: '', birthDate: '1995-01-01',
        pinnedWidgets: [], todayGoals: {}
      }),
    }),
    {
      name: 'finite-storage', // local storage key
    }
  )
);
