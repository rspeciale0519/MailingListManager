#!/usr/bin/env node

/**
 * File Size Checker
 * Enforces the 450 LOC limit across all TypeScript files
 * Critical for maintainability as per Development Roadmap
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const MAX_LINES = 450;
const EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '*.test.ts',
  '*.test.tsx',
  '*.spec.ts',
  '*.spec.tsx',
];

const violations = [];
const warnings = [];

function shouldIgnore(path) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(path);
    }
    return path.includes(pattern);
  });
}

function countLines(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function scanDirectory(dir, rootDir = dir) {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const relativePath = filePath.replace(rootDir + '/', '');

      if (shouldIgnore(relativePath)) {
        continue;
      }

      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath, rootDir);
      } else if (EXTENSIONS.some(ext => file.endsWith(ext))) {
        const lineCount = countLines(filePath);

        if (lineCount > MAX_LINES) {
          violations.push({ path: relativePath, lines: lineCount });
        } else if (lineCount > MAX_LINES * 0.9) {
          warnings.push({ path: relativePath, lines: lineCount });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
  }
}

console.log('🔍 Checking file sizes (450 LOC limit)...\n');

const rootDir = process.cwd();
scanDirectory(rootDir, rootDir);

// Display results
if (violations.length > 0) {
  console.log('❌ VIOLATIONS: Files exceeding 450 lines:\n');
  violations.forEach(({ path, lines }) => {
    console.log(`  ${path}: ${lines} lines (exceeds by ${lines - MAX_LINES})`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS: Files approaching limit (>90%):\n');
  warnings.forEach(({ path, lines }) => {
    console.log(`  ${path}: ${lines} lines (${Math.round((lines / MAX_LINES) * 100)}%)`);
  });
  console.log('');
}

if (violations.length === 0 && warnings.length === 0) {
  console.log('✅ All files within 450 LOC limit!\n');
  process.exit(0);
}

if (violations.length > 0) {
  console.log('💡 Refactor large files by:');
  console.log('  - Extracting utility functions');
  console.log('  - Splitting into sub-components');
  console.log('  - Creating service modules');
  console.log('  - Using composition patterns\n');
  process.exit(1);
}

console.log('✅ No violations, but watch those warnings!\n');
process.exit(0);
