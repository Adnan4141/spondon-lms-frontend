#!/usr/bin/env node
/**
 * Reports TypeScript/TSX file sizes and optionally fails on violations.
 *
 * Usage:
 *   node scripts/check-file-sizes.mjs              # report only (exit 0)
 *   node scripts/check-file-sizes.mjs --warn-over=400
 *   node scripts/check-file-sizes.mjs --fail-over=600   # fail if any file exceeds limit
 *   node scripts/check-file-sizes.mjs --fail-new-over=600 # fail only on git-added files
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'out', 'build', 'dist']);

function parseArgs(argv) {
  const opts = {
    warnOver: null,
    failOver: null,
    failNewOver: null,
    baseRef: 'main',
    top: 25,
  };
  for (const arg of argv) {
    if (arg.startsWith('--warn-over=')) opts.warnOver = Number(arg.split('=')[1]);
    if (arg.startsWith('--fail-over=')) opts.failOver = Number(arg.split('=')[1]);
    if (arg.startsWith('--fail-new-over=')) opts.failNewOver = Number(arg.split('=')[1]);
    if (arg.startsWith('--base-ref=')) opts.baseRef = arg.split('=')[1];
    if (arg.startsWith('--top=')) opts.top = Number(arg.split('=')[1]);
  }
  return opts;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function walkSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    if (entry.name === 'next-env.d.ts') continue;
    files.push(fullPath);
  }
  return files;
}

function getGitAddedFiles(baseRef) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    return null;
  }
  try {
    const out = execSync(`git diff --name-only --diff-filter=A ${baseRef}...HEAD`, {
      encoding: 'utf8',
      cwd: FRONTEND_ROOT,
    });
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((f) => path.resolve(FRONTEND_ROOT, f));
  } catch {
    try {
      const out = execSync('git diff --name-only --diff-filter=A HEAD', {
        encoding: 'utf8',
        cwd: FRONTEND_ROOT,
      });
      return out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((f) => path.resolve(FRONTEND_ROOT, f));
    } catch {
      return [];
    }
  }
}

function rel(filePath) {
  return path.relative(FRONTEND_ROOT, filePath).replace(/\\/g, '/');
}

function tier(lines) {
  if (lines >= 800) return 'critical';
  if (lines >= 600) return 'high';
  if (lines >= 400) return 'warn';
  return 'ok';
}

const opts = parseArgs(process.argv.slice(2));
const scanRoots = [path.join(FRONTEND_ROOT, 'app'), path.join(FRONTEND_ROOT, 'src')];
const allFiles = scanRoots.flatMap((root) => walkSourceFiles(root));

const sizes = allFiles
  .map((filePath) => ({ filePath, lines: countLines(filePath) }))
  .sort((a, b) => b.lines - a.lines);

const critical = sizes.filter((f) => f.lines >= 800);
const high = sizes.filter((f) => f.lines >= 600 && f.lines < 800);
const warn = sizes.filter((f) => f.lines >= 400 && f.lines < 600);

console.log('\n📏 Frontend file size audit\n');
console.log(`Scanned ${sizes.length} files under app/ and src/\n`);

console.log(`Top ${opts.top} largest files:`);
sizes.slice(0, opts.top).forEach(({ filePath, lines }, index) => {
  const tag = tier(lines).toUpperCase().padEnd(8);
  console.log(`  ${String(index + 1).padStart(2)}. [${tag}] ${String(lines).padStart(5)}  ${rel(filePath)}`);
});

console.log('\nSummary:');
console.log(`  ≥800 lines (critical): ${critical.length}`);
console.log(`  600–799 lines (high):    ${high.length}`);
console.log(`  400–599 lines (warn):    ${warn.length}`);

const failures = [];

if (opts.failOver != null) {
  const over = sizes.filter((f) => f.lines > opts.failOver);
  if (over.length > 0) {
    failures.push(
      `${over.length} file(s) exceed --fail-over=${opts.failOver}:\n${over
        .slice(0, 10)
        .map((f) => `  - ${rel(f.filePath)} (${f.lines})`)
        .join('\n')}`,
    );
  }
}

if (opts.warnOver != null) {
  const over = sizes.filter((f) => f.lines > opts.warnOver);
  console.log(`\n${over.length} file(s) exceed warn threshold (${opts.warnOver} lines).`);
}

if (opts.failNewOver != null) {
  const added = getGitAddedFiles(opts.baseRef);
  if (added === null) {
    console.log('\n⚠️  Not a git repo — skipping --fail-new-over check.');
  } else {
    const addedSet = new Set(added);
    const newViolations = sizes.filter(
      (f) => addedSet.has(f.filePath) && f.lines > opts.failNewOver,
    );
    if (newViolations.length > 0) {
      failures.push(
        `${newViolations.length} newly added file(s) exceed --fail-new-over=${opts.failNewOver}:\n${newViolations
          .map((f) => `  - ${rel(f.filePath)} (${f.lines})`)
          .join('\n')}`,
      );
    } else {
      console.log(`\n✓ No new files exceed ${opts.failNewOver} lines (vs ${opts.baseRef}).`);
    }
  }
}

if (failures.length > 0) {
  console.error('\n❌ File size check failed:\n');
  failures.forEach((msg) => console.error(`${msg}\n`));
  process.exit(1);
}

console.log('\n✓ File size check passed.\n');
