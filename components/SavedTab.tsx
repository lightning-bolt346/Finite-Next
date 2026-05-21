'use client';

import { useStore, SavedItemCategory, SavedItem } from '../lib/store';
import { motion } from 'motion/react';
import { Inbox, LayoutGrid, CheckCircle2, Circle, ArrowRight, Trash2, Library, BookOpen } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES: SavedItemCategory[] = ['YouTube', 'Blogs', 'Books', 'Courses', 'Movies', 'TV Shows', 'Podcasts', 'Music', 'Games'];

export default function SavedTab() {
  const { savedItems, addSavedItem, updateSavedItem, deleteSavedItem } = useStore();
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState("Thought");
  const [newTags, setNewTags] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newCat, setNewCat] = useState<SavedItemCategory>('YouTube');
  const [view, setView] = useState<'board' | 'backlog'>('board');

  const TYPES = ['Thought', 'Idea', 'Note', 'Link', 'YouTube Video', 'Blog', 'Article', 'Book', 'Course', 'Movie', 'TV Show', 'Podcast', 'Music', 'Tool', 'Document', 'Other'];

  const getCategoryCurrentCount = (cat: string) => savedItems.filter(s => s.category === cat && s.status === 'current').length;

  // Filter out categories that are full (>= 2 current items)
  const availableCategories = CATEGORIES.filter(c => getCategoryCurrentCount(c) < 2);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addSavedItem({
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      category: newCat,
      status: 'inbox',
      savedAt: new Date().toISOString(),
      url: newUrl,
      type: newType,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      notes: newNotes
    });
    setNewTitle("");
    setNewUrl("");
    setNewTags("");
    setNewNotes("");
  };

  const handleUrlBlur = async () => {
    if (newUrl && !newTitle) {
      try {
        const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(newUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title && data.title !== newUrl) {
            setNewTitle(data.title);
          }
        }
      } catch (e) {
        console.error("Failed to fetch title", e);
      }
    }
  };

  const moveItem = (id: string, newStatus: SavedItem['status']) => {
    const item = savedItems.find(s => s.id === id);
    if (!item) return;

    if (newStatus === 'current') {
      const catCount = getCategoryCurrentCount(item.category);
      if (catCount >= 2) {
        alert("You already have 2 active items in this category. Finish one first!");
        return;
      }
    }
    updateSavedItem(id, { status: newStatus });
  };

  // Stats
  const inboxCount = savedItems.filter(s => s.status === 'inbox').length;
  const currentCount = savedItems.filter(s => s.status === 'current').length;
  const doneCount = savedItems.filter(s => s.status === 'done').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight m-0 text-white/90 mb-2">Saved</h1>
          <p className="text-[#a1a1aa] text-sm">Curation with limits. Max 2 active per category.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        <div className="col-span-3 md:col-span-1 p-6 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-3xl flex flex-col justify-center">
          <div className="text-xs text-[#38bdf8] uppercase tracking-wider font-semibold mb-1">Total Items</div>
          <div className="text-3xl font-bold text-white/90">{savedItems.length}</div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-3xl flex flex-col justify-center">
          <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Inbox</div>
          <div className="text-2xl font-bold text-white/90">{inboxCount}</div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-3xl flex flex-col justify-center">
          <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Active</div>
          <div className="text-2xl font-bold text-white/90">{currentCount}</div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-3xl flex flex-col justify-center">
          <div className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Done</div>
          <div className="text-2xl font-bold text-white/90">{doneCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white/90">
              <Inbox size={18} className="text-[#a78bfa]" /> Brain Dump
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <input 
                  type="url" 
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  placeholder="Link URL (optional)" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Title (required)" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#a1a1aa] focus:outline-none focus:border-[#a78bfa] appearance-none"
                >
                  {TYPES.map(t => <option key={t} value={t} className="bg-[#12131a]">{t}</option>)}
                </select>
                <select 
                  value={newCat}
                  onChange={e => setNewCat(e.target.value as SavedItemCategory)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#a1a1aa] focus:outline-none focus:border-[#a78bfa] appearance-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-[#12131a]">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <input 
                  type="text" 
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="Tags (comma separated)" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>
              <div>
                <textarea 
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Notes..." 
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#a78bfa] resize-none"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-[#a78bfa] text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:bg-[#8b5cf6] transition-colors">
                Save Item
              </button>
            </form>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl">
            <button 
              onClick={() => setView('board')}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex justify-center items-center gap-2 ${view === 'board' ? 'bg-[#12131a] text-white/90 shadow' : 'text-[#a1a1aa] hover:text-white'}`}
            >
              <LayoutGrid size={16} /> Current Board
            </button>
            <button 
              onClick={() => setView('backlog')}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex justify-center items-center gap-2 ${view === 'backlog' ? 'bg-[#12131a] text-white/90 shadow' : 'text-[#a1a1aa] hover:text-white'}`}
            >
              <Library size={16} /> Inbox & Backlog
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {view === 'board' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2"><BookOpen size={20} className="text-[#38bdf8]"/> Active Items</h2>
                <span className="text-xs bg-white/10 px-2 py-1 rounded text-[#a1a1aa]">Max 2 per category</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => {
                  const currentItems = savedItems.filter(s => s.category === cat && s.status === 'current');
                  if (currentItems.length === 0) return null;
                  
                  return (
                    <div key={cat} className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">{cat}</span>
                        <span className="text-xs font-mono text-[#71717a]">{currentItems.length}/2</span>
                      </div>
                      <div className="space-y-3">
                        {currentItems.map(item => (
                          <div key={item.id} className="group flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                            <button 
                              onClick={() => moveItem(item.id, 'done')}
                              className="mt-0.5 text-[#71717a] hover:text-[#34d399] transition-colors"
                              title="Mark as done"
                            >
                              <Circle size={16} />
                            </button>
                            <span className="flex-1 text-sm font-medium text-white/90 break-words">{item.title}</span>
                            <button onClick={() => moveItem(item.id, 'inbox')} className="opacity-0 group-hover:opacity-100 p-1 text-[#71717a] hover:text-white transition-colors" title="Move back to inbox">
                              <Inbox size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {currentCount === 0 && (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
                  <LayoutGrid className="mx-auto text-[#71717a] mb-4" size={32} />
                  <p className="text-[#a1a1aa] font-medium mb-1">Your board is empty.</p>
                  <p className="text-[#71717a] text-sm">Move items from your inbox to start working on them.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
                  Inbox
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[#a1a1aa] font-mono">{inboxCount}</span>
                </h3>
                {inboxCount === 0 ? (
                  <p className="text-sm text-[#71717a] italic">Inbox is clear.</p>
                ) : (
                  <div className="space-y-2">
                    {savedItems.filter(s => s.status === 'inbox').map(item => (
                      <div key={item.id} className="group flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider w-20 truncate">{item.category}</span>
                          <span className="text-sm font-medium text-white/90 truncate max-w-[200px] sm:max-w-xs">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveItem(item.id, 'current')} className="p-1.5 bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
                            Start <ArrowRight size={12} />
                          </button>
                          <button onClick={() => deleteSavedItem(item.id)} className="p-1.5 text-[#71717a] hover:text-red-400 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
                  Recently Done
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-[#a1a1aa] font-mono">{doneCount}</span>
                </h3>
                {doneCount === 0 ? (
                  <p className="text-sm text-[#71717a] italic">Nothing completed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {savedItems.filter(s => s.status === 'done').map(item => (
                      <div key={item.id} className="group flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.02] rounded-xl opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-[#34d399]" />
                          <span className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider w-20 truncate">{item.category}</span>
                          <span className="text-sm font-medium text-white/60 line-through truncate max-w-[200px] sm:max-w-[250px]">{item.title}</span>
                        </div>
                        <button onClick={() => deleteSavedItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#71717a] hover:text-red-400 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
