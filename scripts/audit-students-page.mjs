#!/usr/bin/env node
/**
 * Static audit for /admin/students page frontend weight (Phase 0 baseline).
 *
 * Usage:
 *   cd frontend && npm run perf:students-audit
 */

import fs, { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');

const STUDENTS_FILES = [
  'app/admin/students/page.tsx',
  'src/features/admin/students/StudentsPageContent.tsx',
  'src/features/admin/students/components/StudentsTable.tsx',
  'src/features/admin/students/components/StudentsToolbar.tsx',
  'src/features/admin/students/components/StudentsStats.tsx',
  'src/lib/query/hooks/useStudentsList.ts',
  'src/features/admin/students/index.ts',
];

const EAGER_MODAL_IMPORTS = [
  'AddStudentModal',
  'BulkImportStudentsModal',
  'CollectPaymentModal',
  'EnrollmentModal',
  'EditStudentModal',
  'EnrolledCoursesView',
];

function countLines(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').length;
}

function readFile(relPath) {
  const full = path.join(FRONTEND_ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

function analyzeImports(content) {
  const barrelMatch = content.match(/from '@\/features\/admin\/students'/);
  const dynamicMatches = [...content.matchAll(/dynamic\s*\(\s*\(\)\s*=>\s*import\(/g)];
  const eagerModals = EAGER_MODAL_IMPORTS.filter((name) =>
    new RegExp(`\\b${name}\\b`).test(content),
  );
  return {
    usesBarrelImport: Boolean(barrelMatch),
    dynamicImportCount: dynamicMatches.length,
    eagerModalImports: eagerModals,
  };
}

const pageContent = readFile('src/features/admin/students/StudentsPageContent.tsx');
const pageEntry = readFile('app/admin/students/page.tsx');
const importAnalysis = analyzeImports(pageContent);

const fileSizes = STUDENTS_FILES.map((rel) => ({
  path: rel,
  lines: countLines(path.join(FRONTEND_ROOT, rel)),
}));

const totalLines = fileSizes.reduce((sum, f) => sum + f.lines, 0);

const report = {
  capturedAt: new Date().toISOString(),
  fileSizes,
  totalSourceLines: totalLines,
  pageEntryUsesDynamic: pageEntry.includes('dynamic('),
  studentsPageContent: importAnalysis,
  apiCallsOnMount: [
    'GET /meta/admin-filters (useAdminFilters)',
    'GET /users?role=STUDENT&page&limit&filters (useStudentsList)',
    'GET /users/student-stats (useStudentDatabaseStats)',
    'GET /batches?courseId=… (useBatchesForCourse, when course selected)',
  ],
  defaultPageSize: 25,
  recommendations: [],
};

if (importAnalysis.eagerModalImports.length > 0) {
  report.recommendations.push(
    `Lazy-load modals: ${importAnalysis.eagerModalImports.join(', ')}`,
  );
}
if (importAnalysis.usesBarrelImport) {
  report.recommendations.push('Replace barrel import with direct/dynamic imports for modals');
}
report.recommendations.push('Reduce default page size from 50 to 25');
report.recommendations.push('Defer stats cards; render table first');

const outJson = path.resolve(FRONTEND_ROOT, '../docs/performance/admin-students-frontend-audit.json');
mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('\n📦 Admin Students Page — Frontend Audit (Phase 0)\n');
console.log('Source file sizes:');
fileSizes.forEach(({ path: p, lines }) => {
  console.log(`  ${String(lines).padStart(5)} lines  ${p}`);
});
console.log(`\nTotal tracked source lines: ${totalLines}`);
console.log(`\nPage entry dynamic import: ${report.pageEntryUsesDynamic ? 'yes' : 'no'}`);
console.log(`StudentsPageContent barrel import: ${importAnalysis.usesBarrelImport ? 'yes' : 'no'}`);
console.log(`Eager modal imports (${importAnalysis.eagerModalImports.length}): ${importAnalysis.eagerModalImports.join(', ') || 'none'}`);
console.log(`\nAPI calls on mount: ${report.apiCallsOnMount.length}`);
report.apiCallsOnMount.forEach((c) => console.log(`  - ${c}`));
console.log(`\nDefault page size: ${report.defaultPageSize}`);
console.log('\nRecommendations:');
report.recommendations.forEach((r) => console.log(`  • ${r}`));
console.log(`\n✅ JSON report: ${outJson}\n`);
