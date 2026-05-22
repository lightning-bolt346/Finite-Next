'use client';

import { motion } from 'motion/react';
import { Settings, CheckSquare, Crosshair, Target, Bookmark, PenLine, Quote, User as UserIcon } from 'lucide-react';
import { useStore } from '../lib/store';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type Tab = 'dashboard' | 'today' | 'focus' | 'goals' | 'saved' | 'reflect' | 'quotes';

const TAB_META = [
  { id: 'dashboard', label: 'Dashboard', icon: Target },
  { id: 'today', label: 'Today', icon: CheckSquare },
  { id: 'focus', label: 'Focus', icon: Crosshair },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'reflect', label: 'Reflect', icon: PenLine },
  { id: 'quotes', label: 'Quotes', icon: Quote },
] as const;

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  openSettings, 
  time 
}: { 
  activeTab: Tab, 
  setActiveTab: Dispatch<SetStateAction<Tab>>, 
  openSettings: () => void,
  time: Date | null
}) {
  const [user, setUser] = useState<User | null>(null);
  const activeFocusSessionId = useStore((state) => state.activeFocusSessionId);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 h-[56px] flex items-center justify-between px-4 sm:px-8 border-b border-border bg-surface-1/80 backdrop-blur-[20px]">
        {/* Left: Wordmark */}
        <div className="font-[600] text-[18px] text-text-primary flex-shrink-0 flex items-center gap-2 cursor-pointer">
          <div className="w-[24px] h-[24px] rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,var(--color-accent)_25%,var(--color-accent2,var(--color-surface-2))_72%)] shadow-[0_0_12px_var(--color-accent-soft)] relative after:content-[''] after:absolute after:inset-[5px] after:rounded-full after:bg-[var(--color-bg)] after:opacity-85" />
          Finite
        </div>
        
        {/* Center: Tabs */}
        <nav className="hidden md:flex h-full">
          {TAB_META.map(t => (
            <button 
              key={t.id}
              onClick={() => handleTabClick(t.id as Tab)}
              className="relative h-full px-4 text-label transition-colors duration-medium ease-enter"
              style={{ color: activeTab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
            >
              {t.label}
              {activeTab === t.id && (
                <motion.div 
                  layoutId="active-tab-border"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right: Settings & Clock */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <span className="font-mono text-sm tracking-wider text-accent font-bold">
            {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={openSettings}
              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-fast"
            >
              <Settings size={18} />
            </button>
            {user && (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-2 border border-border flex items-center justify-center">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={12} className="text-text-muted" />
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-[20px] left-1/2 -translate-x-1/2 z-50 bg-surface-1/90 backdrop-blur-[28px] border border-border-strong rounded-pill shadow-3 p-2 flex items-center gap-2 w-[92%] max-w-[400px] justify-between">
        {TAB_META.slice(0, 5).map(t => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button 
              key={t.id}
              onClick={() => handleTabClick(t.id as Tab)}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] active:scale-[0.92] transition-transform duration-medium ease-spring"
              style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-micro">{t.label}</span>
              {isActive && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
