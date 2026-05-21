'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import DashboardTab from '../components/DashboardTab';
import TodayTab from '../components/TodayTab';
import GoalsTab from '../components/GoalsTab';
import ReflectTab from '../components/ReflectTab';
import QuotesTab from '../components/QuotesTab';
import FocusTab from '../components/FocusTab';
import SavedTab from '../components/SavedTab';
import SettingsModal from '../components/SettingsModal';
import LandingPage from '../components/LandingPage';
import { useStore } from '../lib/store';

import Navigation from '../components/Navigation';

type Tab = 'dashboard' | 'today' | 'focus' | 'goals' | 'saved' | 'reflect' | 'quotes';

export default function AppMain() {
  const { setupComplete } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      if (!setupComplete) {
        setShowLanding(true);
      }
      setTime(new Date());
    }, 0);
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    const handleNavigation = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail as Tab);
      }
    };
    window.addEventListener('navigate', handleNavigation);

    return () => {
      clearInterval(interval);
      window.removeEventListener('navigate', handleNavigation);
    };
  }, [setupComplete]);

  if (!mounted) return <div className="min-h-screen bg-bg" />;

  if (showLanding) {
    return <LandingPage onComplete={() => setShowLanding(false)} />;
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-bg">
        {/* Background glowing orbs */}
        <div className="absolute top-[-180px] left-[-180px] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,var(--color-accent),transparent_65%)] blur-[100px] opacity-[0.10] pointer-events-none -z-10" />
        
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          openSettings={() => setIsSettingsOpen(true)} 
          time={time} 
        />

        {/* Main Content */}
        <main className="max-w-[1240px] mx-auto px-4 sm:px-8 py-10 pb-32 md:pb-10 min-h-[calc(100vh-80px)]">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardTab key="dashboard" />}
            {activeTab === 'today' && <TodayTab key="today" />}
            {activeTab === 'focus' && <FocusTab key="focus" />}
            {activeTab === 'goals' && <GoalsTab key="goals" />}
            {activeTab === 'saved' && <SavedTab key="saved" />}
            {activeTab === 'reflect' && <ReflectTab key="reflect" />}
            {activeTab === 'quotes' && <QuotesTab key="quotes" />}
          </AnimatePresence>
        </main>

      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

