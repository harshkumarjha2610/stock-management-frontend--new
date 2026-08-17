const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'components', 'Sidebar.tsx');

let content = fs.readFileSync(sidebarPath, 'utf8');

// Replacements
content = content.replace(/bg-accent-soft/g, "bg-primary-light");
content = content.replace(/text-accent/g, "text-primary");
content = content.replace(/border-accent/g, "border-primary");
content = content.replace(/hover:text-accent/g, "hover:text-primary");
content = content.replace(/hover:bg-accent/g, "hover:bg-primary-hover");
content = content.replace(/bg-accent/g, "bg-primary");
content = content.replace(/ring-accent/g, "ring-primary");
content = content.replace(/from-accent-soft/g, "from-primary-light");

content = content.replace(/glass-panel/g, "saas-card");
content = content.replace(/bg-panel/g, "bg-surface");

// Fix store layout active state gradient
content = content.replace(/bg-gradient-to-r from-primary-light to-transparent border-l-2 border-primary text-white shadow-\[inset_0_0_20px_rgba\(123,76,255,0\.15\)\]/g, 
  "bg-gradient-to-r from-primary-light to-transparent border-l-2 border-primary text-primary shadow-sm");

// Also replace standard old ones just in case
content = content.replace(/text-slate-600/g, "text-text-primary");
content = content.replace(/text-slate-500/g, "text-text-secondary");
content = content.replace(/text-slate-400/g, "text-text-secondary");
content = content.replace(/text-gray-500/g, "text-text-primary");
content = content.replace(/text-slate-700/g, "text-text-primary");

fs.writeFileSync(sidebarPath, content, 'utf8');

console.log("Sidebar fixed.");
