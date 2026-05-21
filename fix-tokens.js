const fs = require('fs');
const path = require('path');

const filePaths = [
  './components/SettingsModal.tsx',
  './components/QuotesTab.tsx',
  './components/LandingPage.tsx'
];

filePaths.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace colors
  content = content.replace(/text-\[\#a78bfa\]/g, 'text-accent');
  content = content.replace(/bg-\[\#a78bfa\]\/10/g, 'bg-accent-soft');
  content = content.replace(/bg-\[\#a78bfa\]\/20/g, 'bg-accent-soft');
  content = content.replace(/bg-\[\#a78bfa\]/g, 'bg-accent');
  content = content.replace(/border-\[\#a78bfa\]/g, 'border-accent');
  content = content.replace(/hover:bg-\[\#8b5cf6\]/g, 'hover:opacity-90');

  content = content.replace(/text-\[\#38bdf8\]/g, 'text-accent2');
  content = content.replace(/bg-\[\#38bdf8\]\/10/g, 'bg-accent2-soft');
  content = content.replace(/bg-\[\#38bdf8\]\/20/g, 'bg-accent2-soft');
  content = content.replace(/border-\[\#38bdf8\]/g, 'border-accent2');
  content = content.replace(/border-\[\#38bdf8\]\/20/g, 'border-accent2/20');
  content = content.replace(/hover:bg-\[\#38bdf8\]\/20/g, 'hover:bg-accent2-soft');

  content = content.replace(/text-\[\#34d399\]/g, 'text-success');
  content = content.replace(/hover:text-\[\#34d399\]/g, 'hover:text-success');

  content = content.replace(/text-\white\/90/g, 'text-text-primary');
  content = content.replace(/text-white/g, 'text-text-primary');
  content = content.replace(/text-\[\#a1a1aa\]/g, 'text-text-muted');
  content = content.replace(/text-\[\#71717a\]/g, 'text-text-secondary');

  // Replace surfaces
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-surface-1');
  content = content.replace(/border-white\/\[0\.05\]/g, 'border-border');
  content = content.replace(/rounded-3xl/g, 'rounded-xl shadow-1');

  content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-surface-2');
  content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-surface-1');
  content = content.replace(/border-white\/\[0\.02\]/g, 'border-border');
  
  content = content.replace(/bg-white\/5/g, 'bg-surface-2');
  content = content.replace(/border-white\/10/g, 'border-border');
  content = content.replace(/border-white\/5/g, 'border-border/50');
  content = content.replace(/rounded-2xl/g, 'rounded-sm');
  content = content.replace(/rounded-xl/g, 'rounded-sm');

  // Replace text sizing / utility
  content = content.replace(/text-4xl md:text-5xl/g, 'text-h1');
  content = content.replace(/text-lg font-semibold/g, 'text-h3 font-semibold');
  content = content.replace(/text-xl font-semibold/g, 'text-h2 font-semibold');
  content = content.replace(/text-xs/g, 'text-micro');

  // Fix button bg
  content = content.replace(/bg-\[\#12131a\]/g, 'bg-bg');

  fs.writeFileSync(file, content);
});
console.log('done!');
