'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ArrowRight, Cloud, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function LandingPage({ onComplete }: { onComplete: () => void }) {
  const { setUserName, setBirthDate, setSetupComplete } = useStore();
  const [step, setStep] = useState<'intro' | 'setup' | 'auth'>('intro');
  const [nameInput, setNameInput] = useState('');
  const [birthInput, setBirthInput] = useState('1995-01-01');

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authLoading, setAuthLoading] = useState(false);

  const handleSkip = () => {
    setSetupComplete(true);
    onComplete();
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) setUserName(nameInput.trim());
    if (birthInput) setBirthDate(birthInput);
    setStep('auth');
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleSkip(); // Finish setup
    } catch (error: any) {
      console.error(error);
      alert('Google Login failed: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setAuthLoading(true);
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      handleSkip(); // Finish setup
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#08090d] flex items-center justify-center p-4">
      {/* Background glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,#a78bfa,transparent_50%)] blur-[100px] opacity-[0.15] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,#38bdf8,transparent_50%)] blur-[100px] opacity-[0.12] pointer-events-none -z-10" />

      <AnimatePresence mode="wait">
        {step === 'intro' ? (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="max-w-2xl text-center space-y-8"
          >
            <div className="flex justify-center mb-12">
              <div className="w-[64px] h-[64px] rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff,#a78bfa_25%,#38bdf8_72%)] shadow-[0_0_40px_rgba(167,139,250,0.5)] relative after:content-[''] after:absolute after:inset-[12px] after:rounded-full after:bg-[#08090d] after:opacity-80" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white/90">Your time, visualized.</h1>
            <p className="text-xl md:text-2xl text-[#a1a1aa] font-medium leading-relaxed max-w-xl mx-auto">
              A local-first dashboard for life, today, goals, reflections, quotes, and optional cloud sync.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setStep('setup')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black hover:bg-white/90 font-bold text-lg transition-transform hover:-translate-y-1 shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
              >
                Set up your timeline <ArrowRight size={20} />
              </button>
              <button 
                onClick={handleSkip}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-lg transition-colors border border-white/10"
              >
                Explore dashboard
              </button>
            </div>
          </motion.div>
        ) : step === 'setup' ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-md bg-white/[0.02] border border-white/10 p-8 md:p-10 rounded-[32px] backdrop-blur-xl shadow-2xl"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-white/90">Let&apos;s get started</h2>
            <p className="text-[#a1a1aa] mb-8">Personalize your timeline and experience.</p>
            
            <form onSubmit={handleFinishSetup} className="space-y-6">
              <div>
                <label className="text-xs text-[#a1a1aa] block mb-2 uppercase tracking-wider font-semibold">Your first name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="e.g. Alex"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#a78bfa] transition-colors text-lg"
                />
              </div>
              
              <div>
                <label className="text-xs text-[#a1a1aa] block mb-2 uppercase tracking-wider font-semibold">Your birthdate</label>
                <p className="text-xs text-[#71717a] mb-3">Used only to generate your &quot;Life in weeks&quot; grid.</p>
                <input 
                  type="date"
                  required
                  value={birthInput}
                  onChange={e => setBirthInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#38bdf8] transition-colors text-lg"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#38bdf8] text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-[0_0_30px_rgba(167,139,250,0.3)]"
                >
                  Create my dashboard
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md bg-[#12131a] border border-white/10 p-8 md:p-10 rounded-[32px] backdrop-blur-xl shadow-2xl relative"
          >
            <button onClick={handleSkip} className="absolute right-6 top-6 text-[#a1a1aa] hover:text-white" title="Skip for now">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10"><Cloud size={20} className="text-[#a78bfa]" /></div>
              <h2 className="text-2xl font-bold tracking-tight text-white/90">Sync data</h2>
            </div>
            
            <p className="text-sm text-[#a1a1aa] mb-6">Enable cloud sync to backup your data. You can skip this and keep your data local-only.</p>
            
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <input 
                type="email" 
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
              />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
              />
              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full px-4 py-3.5 bg-[#a78bfa]/20 text-[#a78bfa] hover:bg-[#a78bfa]/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {authMode === 'login' ? 'Sign In with Email' : 'Create Account'}
              </button>
            </form>
            
            <div className="flex items-center justify-between mt-3 mb-6">
              <button 
                onClick={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
                className="text-xs text-[#a1a1aa] hover:text-white transition-colors"
                type="button"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-xs text-[#71717a] font-medium uppercase tracking-wider">OR</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <button 
              onClick={handleGoogleLogin} 
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-black hover:bg-white/90 rounded-xl text-sm font-bold transition-all shadow-lg shadow-white/5 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </button>
            <div className="mt-6 text-center">
              <button 
                onClick={handleSkip}
                className="text-xs text-[#a1a1aa] hover:text-white transition-colors"
              >
                Skip and stay local
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
