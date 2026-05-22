'use client';

import { useStore } from '../../lib/store';
import { Plus, X } from 'lucide-react';

export default function BrainDumpWidget() {
  const { brainDumps, addBrainDump, removeBrainDump } = useStore();

  const handleAddDump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('dump') as HTMLInputElement;
    if (!input.value.trim()) return;
    addBrainDump({
      id: crypto.randomUUID(),
      text: input.value.trim(),
      createdAt: Date.now()
    });
    input.value = '';
  };

  return (
    <div className="p-5 bg-surface-1 border border-border rounded-lg relative overflow-hidden flex flex-col">
      <h2 className="text-label font-semibold text-text-primary">Brain Dump</h2>
      <p className="text-xs text-text-muted mb-3">Any random thought to revisit later.</p>
      
      <form onSubmit={handleAddDump} className="flex gap-2 mb-3">
        <input 
          name="dump"
          type="text"
          placeholder="Drop a thought..."
          className="flex-1 bg-surface-2 border border-border rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
          autoComplete="off"
        />
        <button type="submit" className="px-2 py-2 bg-accent text-bg rounded-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} />
        </button>
      </form>

      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
        {brainDumps?.map((dump) => (
          <div key={dump.id} className="flex justify-between items-start group bg-surface-2 border border-border/50 rounded-sm px-2 py-1.5 gap-2 text-xs">
            <div className="flex-1 min-w-0">
              <span className="text-text-primary leading-snug break-words block font-medium">{dump.text}</span>
              <span className="text-[9px] text-text-muted font-mono mt-0.5 block select-none">
                {new Date(dump.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button onClick={() => removeBrainDump(dump.id)} className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 text-text-muted hover:text-danger transition-opacity">
              <X size={12} />
            </button>
          </div>
        ))}
        {(!brainDumps || brainDumps.length === 0) && <span className="text-xs text-text-muted italic block py-2">No thoughts here.</span>}
      </div>
    </div>
  );
}
