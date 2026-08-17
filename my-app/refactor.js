const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'app', '(dashboard)');

const replacements = [
  // Primary brand replacements (was red, now primary)
  { regex: /bg-red-600/g, replace: "bg-primary" },
  { regex: /text-red-600/g, replace: "text-primary" },
  { regex: /border-red-600/g, replace: "border-primary" },
  { regex: /bg-red-500/g, replace: "bg-primary" },
  { regex: /focus:border-red-500/g, replace: "focus:border-primary" },
  { regex: /focus:ring-red-500\/20/g, replace: "focus:ring-primary" },
  { regex: /hover:bg-red-50/g, replace: "hover:bg-primary-light" },
  { regex: /hover:border-red-300/g, replace: "hover:border-primary" },
  { regex: /hover:text-red-600/g, replace: "hover:text-primary" },
  { regex: /text-red-500/g, replace: "text-coral" }, // Typically errors
  { regex: /text-red-400/g, replace: "text-coral" },
  { regex: /bg-red-50/g, replace: "bg-coral-light" },
  { regex: /border-red-200/g, replace: "border-coral" },
  { regex: /border-red-100/g, replace: "border-coral" },

  // Backgrounds and Surfaces
  { regex: /bg-slate-50/g, replace: "bg-background" },
  { regex: /bg-white/g, replace: "bg-surface" },
  { regex: /bg-slate-100/g, replace: "bg-background" },
  { regex: /border-slate-200/g, replace: "border-border" },
  { regex: /border-slate-100/g, replace: "border-border" },
  { regex: /border-white\/10/g, replace: "border-border" },
  { regex: /border-white\/5/g, replace: "border-border" },
  
  // Text colors
  { regex: /text-slate-400/g, replace: "text-text-secondary" },
  { regex: /text-slate-500/g, replace: "text-text-secondary" },
  { regex: /text-gray-500/g, replace: "text-text-primary" },
  { regex: /text-slate-700/g, replace: "text-text-primary" },
  { regex: /text-slate-800/g, replace: "text-text-primary" },
  { regex: /text-slate-600/g, replace: "text-text-primary" },
  { regex: /text-gray-400/g, replace: "text-text-secondary" },
  
  // Modals / Cards
  { regex: /glass-panel/g, replace: "saas-card" },
  { regex: /btn-metallic/g, replace: "bg-primary text-white hover:bg-primary-hover" },

  // Specific semantic colors based on prompt
  { regex: /text-green-600/g, replace: "text-success" },
  { regex: /bg-green-50/g, replace: "bg-mint-light" },
  { regex: /border-green-200/g, replace: "border-mint" },
  { regex: /text-green-700/g, replace: "text-success" },

  { regex: /text-amber-700/g, replace: "text-warning" },
  { regex: /bg-amber-50/g, replace: "bg-warning/10" },
  { regex: /border-amber-200/g, replace: "border-warning" },
  { regex: /text-amber-600/g, replace: "text-warning" },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && fullPath !== path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'page.tsx')) {
      // Don't modify dashboard/page.tsx again as we already fully rewrote it
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const rule of replacements) {
        newContent = newContent.replace(rule.regex, rule.replace);
      }
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
console.log('Refactoring complete.');
