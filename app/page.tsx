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

type Tab = 'dashboard' | 'today' | 'focus' | 'goals' | 'saved' | 'reflect' | 'quotes';

const TabButton = ({ tab, label, activeTab, setActiveTab }: { tab: Tab, label: string, activeTab: Tab, setActiveTab: (t: Tab) => void }) => (
  <button 
    onClick={() => setActiveTab(tab)}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
      activeTab === tab 
      ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' 
      : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
    }`}
  >
    {label}
  </button>
);

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
    return () => clearInterval(interval);
  }, [setupComplete]);

  if (!mounted) return <div className="min-h-screen bg-[#08090d]" />;

  if (showLanding) {
    return <LandingPage onComplete={() => setShowLanding(false)} />;
  }

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-[#08090d]">
        {/* Background glowing orbs */}
        <div className="absolute top-[-180px] left-[-180px] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,#a78bfa,transparent_65%)] blur-[100px] opacity-[0.15] pointer-events-none -z-10" />
        <div className="absolute bottom-[-200px] right-[-180px] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,#38bdf8,transparent_65%)] blur-[100px] opacity-[0.12] pointer-events-none -z-10" />

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090d]/60 border-b border-white/[0.04]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 font-extrabold tracking-tight text-xl cursor-default group">
              <div className="w-[32px] h-[32px] rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,#a78bfa_25%,#38bdf8_72%)] shadow-[0_0_24px_rgba(167,139,250,0.4)] relative after:content-[''] after:absolute after:inset-[8px] after:rounded-full after:bg-[#08090d] after:opacity-80 group-hover:shadow-[0_0_32px_rgba(167,139,250,0.6)] transition-all duration-500" />
              Finite
            </div>
            
            <nav className="hidden md:flex gap-1 p-1 bg-white/[0.02] border border-white/[0.05] rounded-full backdrop-blur-md overflow-x-auto scrollbar-hide shrink-0 max-w-[60vw]">
              <TabButton tab="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tab="today" label="Today" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tab="focus" label="Focus" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tab="goals" label="Goals" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tab="saved" label="Saved" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tab="reflect" label="Reflect" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton tab="quotes" label="Quotes" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>

            <div className="flex items-center gap-4 shrink-0">
              <span className="font-mono text-sm tracking-widest text-[#a1a1aa] hidden sm:block">
                {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 flex items-center justify-center text-[#a1a1aa] hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/[0.05]"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

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

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-2 border border-white/[0.08] rounded-full bg-[#12131a]/90 backdrop-blur-xl shadow-2xl flex items-center gap-1 w-[96%] max-w-[500px] overflow-x-auto scrollbar-hide shrink-0">
          <button onClick={() => setActiveTab('dashboard')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Dash</button>
          <button onClick={() => setActiveTab('today')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'today' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Today</button>
          <button onClick={() => setActiveTab('focus')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'focus' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Focus</button>
          <button onClick={() => setActiveTab('goals')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'goals' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Goals</button>
          <button onClick={() => setActiveTab('saved')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'saved' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Saved</button>
          <button onClick={() => setActiveTab('reflect')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'reflect' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Reflect</button>
          <button onClick={() => setActiveTab('quotes')} className={`shrink-0 px-3 py-2.5 text-xs font-medium rounded-full transition-colors ${activeTab === 'quotes' ? 'bg-white/10 text-white' : 'text-[#a1a1aa] hover:text-[#f5f5f7]'}`}>Quotes</button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}

