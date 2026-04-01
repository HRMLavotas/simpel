/**
 * Script to replace console.log with logger utility
 * 
 * Usage: node scripts/replace-console-log.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToUpdate = [
  'src/pages/Employees.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Import.tsx',
  'src/pages/ImportNonAsn.tsx',
  'src/pages/PetaJabatan.tsx',
  'src/components/employees/EmployeeFormModal.tsx',
];

const replacements = [
  {
    from: /console\.log\(/g,
    to: 'logger.debug(',
  },
  {
    from: /console\.warn\(/g,
    to: 'logger.warn(',
  },
  // Keep console.error as is (already handled by logger.error)
];

function addLoggerImport(content, filePath) {
  // Check if logger is already imported
  if (content.includes("from '@/lib/logger'")) {
    return content;
  }

  // Find the last import statement
  const importRegex = /^import .+ from .+;$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const importIndex = content.indexOf(lastImport) + lastImport.length;
    
    // Add logger import after last import
    const newContent = 
      content.slice(0, importIndex) +
      "\nimport { logger } from '@/lib/logger';" +
      content.slice(importIndex);
    
    return newContent;
  }
  
  return content;
}

function replaceInFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Apply replacements
    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    // Add logger import if modified
    if (modified) {
      content = addLoggerImport(content, filePath);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔄 Replacing console.log with logger...\n');

filesToUpdate.forEach(replaceInFile);

console.log('\n✨ Done! Please review the changes and test the application.');
console.log('💡 Tip: Run "git diff" to see all changes.');
