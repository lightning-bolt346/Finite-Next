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
import TimerOverlay from '../components/focus/TimerOverlay';
import SessionOutcomeModal from '../components/focus/SessionOutcomeModal';
import { saveFocusSessionToFirestore, loadUserDataFromFirestore } from '../lib/firebaseSync';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { format } from 'date-fns';

import Navigation from '../components/Navigation';

type Tab = 'dashboard' | 'today' | 'focus' | 'goals' | 'saved' | 'reflect' | 'quotes';

export default function AppMain() {
  const { 
    setupComplete,
    activeFocusSessionId,
    activeFocusSessionConfig,
    showOutcome,
    setActiveFocusSessionId,
    setActiveFocusSessionConfig,
    setShowOutcome,
    addFocusSession,
    setUserId,
    hydrateFromFirestore,
  } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUserId(usr.uid);
        try {
          const remoteData = await loadUserDataFromFirestore(usr.uid);
          if (remoteData) {
            hydrateFromFirestore(remoteData);
          }
        } catch (error) {
          console.warn("Failed to load user data from Firestore on login", error);
        }
      } else {
        setUserId(null);
      }
    });
    return unsub;
  }, [setUserId, hydrateFromFirestore]);

  const handleSessionComplete = () => {
    setShowOutcome(true);
  };

  const handleSessionCancel = () => {
    setActiveFocusSessionId(null);
    setActiveFocusSessionConfig(null);
  };

  const handleSaveOutcome = async (outcome: string, rating: number) => {
    if (!activeFocusSessionId || !activeFocusSessionConfig) return;

    const loggedSession = {
      id: activeFocusSessionId,
      title: activeFocusSessionConfig.type,
      outcome,
      rating,
      durationMinutes: activeFocusSessionConfig.durationMinutes,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: Date.now()
    };

    addFocusSession(loggedSession);

    try {
      await saveFocusSessionToFirestore(loggedSession);
    } catch (err) {
      console.warn('Network offline fallback cached: ', err);
    }

    setShowOutcome(false);
    setActiveFocusSessionId(null);
    setActiveFocusSessionConfig(null);
  };

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      if (!setupComplete) {
        setShowLanding(true);
      } else {
        setShowLanding(false);
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

      {activeFocusSessionId && activeFocusSessionConfig && (
        <TimerOverlay 
          sessionId={activeFocusSessionId}
          durationMinutes={activeFocusSessionConfig.durationMinutes}
          breakMinutes={activeFocusSessionConfig.breakMinutes}
          numBreaks={activeFocusSessionConfig.numBreaks}
          sessionType={activeFocusSessionConfig.type}
          intention={activeFocusSessionConfig.intention}
          linkedName={activeFocusSessionConfig.linkedName}
          onComplete={handleSessionComplete}
          onCancel={handleSessionCancel}
        />
      )}

      {showOutcome && (
        <SessionOutcomeModal onSave={handleSaveOutcome} />
      )}
    </>
  );
}

