'use client';

import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cloud, LogOut, Trash2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { userName, setUserName, birthDate, setBirthDate, clearAll, setUserId, theme, setTheme, setSetupComplete } = useStore();
  const [user, setUser] = useState<User | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (document.getElementById('settingsTheme')) {
        (document.getElementById('settingsTheme') as HTMLSelectElement).value = theme;
      }
    }
  }, [isOpen, theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return unsub;
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (confirm('Also clear local data?')) {
        clearAll();
      }
      await signOut(auth);
      setSetupComplete(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure? This will clear all data from this browser.')) {
      clearAll();
      try {
        await signOut(auth);
      } catch (err) {}
      setSetupComplete(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-bg border border-white/[0.08] relative w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/[0.08] sticky top-0 bg-bg z-10">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Settings</h2>
              <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-full hover:bg-surface-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Config */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-surface-2 rounded-sm border border-border"><Calendar size={18} className="text-accent2" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Personalization</h3>
                    <p className="text-micro text-text-muted">Your name and birthdate for the dashboard.</p>
                  </div>
                </div>
                <div className="bg-surface-1 border border-border p-5 rounded-sm space-y-4">
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Your name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Satyam"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent2 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Birthdate</label>
                    <input 
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent2 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-micro text-text-muted block mb-1 uppercase tracking-wider font-semibold">Theme</label>
                    <select 
                      id="settingsTheme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
                    >
                      <option value="midnight" className="bg-bg text-text-primary">Midnight</option>
                      <option value="solar" className="bg-bg text-text-primary">Solar</option>
                      <option value="forest" className="bg-bg text-text-primary">Forest</option>
                      <option value="light" className="bg-bg text-text-primary">Light</option>
                      <option value="mono" className="bg-bg text-text-primary">Mono</option>
                      <option value="sepia" className="bg-bg text-text-primary">Sepia</option>
                      <option value="lavender" className="bg-bg text-text-primary">Lavender</option>
                      <option value="ocean" className="bg-bg text-text-primary">Ocean</option>
                      <option value="sage" className="bg-bg text-text-primary">Sage</option>
                      <option value="mist" className="bg-bg text-text-primary">Mist</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Cloud Sync */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-surface-2 rounded-sm border border-border"><Cloud size={18} className="text-accent" /></div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Optional Cloud Sync</h3>
                    <p className="text-micro text-text-muted">Local-first by default. Enable to sync across devices.</p>
                  </div>
                </div>

                <div className="bg-surface-1 border border-border p-5 rounded-sm">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{user.email}</p>
                        <p className="text-micro text-success flex items-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                          Syncing active
                        </p>
                      </div>
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-danger rounded-sm text-sm font-medium transition-colors">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-text-muted">You are currently using the app locally. Sign in to backup your data.</p>
                      
                      <form onSubmit={handleEmailAuth} className="space-y-3">
                        <input 
                          type="email" 
                          placeholder="Email address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                        <input 
                          type="password" 
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-sm px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent"
                        />
                        <button 
                          type="submit" 
                          disabled={authLoading}
                          className="w-full px-4 py-3 bg-accent-soft text-accent hover:bg-accent/30 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {authMode === 'login' ? 'Sign In with Email' : 'Create Account'}
                        </button>
                      </form>
                      
                      <div className="flex items-center justify-between mt-2">
                        <button 
                          onClick={() => setAuthMode(m => m === 'login' ? 'signup' : 'login')}
                          className="text-micro text-text-muted hover:text-text-primary"
                        >
                          {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 my-2">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-micro text-text-secondary font-medium uppercase tracking-wider">OR</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                      </div>

                      <button 
                        onClick={handleGoogleLogin} 
                        disabled={authLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black hover:bg-white/90 rounded-sm text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
                      >
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
                <div className="bg-red-500/[0.05] border border-red-500/20 p-5 rounded-sm flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Reset Local Data</h4>
                    <p className="text-micro text-text-muted mt-1">Clear everything from this browser.</p>
                  </div>
                  <button onClick={handleReset} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded-sm text-sm font-medium transition-colors">
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
