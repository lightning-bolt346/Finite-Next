'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cloud, LogOut, Trash2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { birthDate, setBirthDate, clearAll, setUserId } = useStore();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setUserId(usr ? usr.uid : null);
    });
    return unsub;
  }, [setUserId]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure? This will clear all data from this browser.')) {
      clearAll();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#08090d]/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#12131a] border border-white/[0.08] relative w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/[0.08]">
              <h2 className="text-xl font-bold tracking-tight text-white/90">Settings</h2>
              <button onClick={onClose} className="p-2 text-[#a1a1aa] hover:text-white transition-colors rounded-full hover:bg-white/5">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Config */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10"><Calendar size={18} className="text-[#38bdf8]" /></div>
                  <div>
                    <h3 className="font-semibold text-white/90">Life in weeks origin</h3>
                    <p className="text-xs text-[#a1a1aa]">Your birthdate to calculate the dashboard grid.</p>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                  <input 
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
                  />
                </div>
              </section>

              {/* Cloud Sync */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10"><Cloud size={18} className="text-[#a78bfa]" /></div>
                  <div>
                    <h3 className="font-semibold text-white/90">Optional Cloud Sync</h3>
                    <p className="text-xs text-[#a1a1aa]">Local-first by default. Enable to sync across devices.</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/90">{user.email}</p>
                        <p className="text-xs text-[#34d399] flex items-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
                          Syncing active
                        </p>
                      </div>
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-[#fca5a5] rounded-xl text-sm font-medium transition-colors">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[#a1a1aa] mb-4">You are currently using the app locally. Sign in to backup your data.</p>
                      <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black hover:bg-white/90 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        Continue with Google
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Danger Zone */}
              <section>
                <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2"><Trash2 size={16} /> Danger Zone</h3>
                <div className="bg-red-500/[0.05] border border-red-500/20 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white/90">Reset Local Data</h4>
                    <p className="text-xs text-[#a1a1aa] mt-1">Clear everything from this browser.</p>
                  </div>
                  <button onClick={handleReset} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded-xl text-sm font-medium transition-colors">
                    Reset
                  </button>
                </div>
              </section>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
