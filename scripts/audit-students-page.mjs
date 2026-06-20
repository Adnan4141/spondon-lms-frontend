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
  'src/features/admin/students/hooks/useStudentsPageData.ts',
  'src/features/admin/students/hooks/useStudentsPageActions.ts',
  'src/features/admin/students/components/StudentsListPanel.tsx',
  'src/features/admin/students/components/StudentsEnrollmentsPanel.tsx',
  'src/features/admin/students/components/StudentsPageModals.tsx',
  'src/features/admin/students/components/StudentsTable.tsx',
  'src/features/admin/students/components/StudentsToolbar.tsx',
  'src/features/admin/students/components/StudentsStats.tsx',
  'src/lib/query/hooks/useStudentsList.ts',
  'src/features/admin/students/index.ts',
];

const MODAL_COMPONENTS = [
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

function isEagerModalImport(content, name) {
  const staticImport = new RegExp(
    `import\\s+(?:\\{[^}]*\\b${name}\\b[^}]*\\}|\\b${name}\\b)\\s+from`,
  );
  const dynamicImport = new RegExp(`import\\([^)]*${name}`);
  return staticImport.test(content) && !dynamicImport.test(content);
}

function analyzeImports(pageContent, modalsContent, enrollmentsContent) {
  const barrelMatch = pageContent.match(/from '@\/features\/admin\/students'/);
  const dynamicMatches = [
    ...pageContent.matchAll(/dynamic\s*\(\s*\(\)\s*=>\s*import\(/g),
    ...readFile('src/features/admin/students/components/StudentsListPanel.tsx').matchAll(
      /dynamic\s*\(\s*\(\)\s*=>\s*import\(/g,
    ),
  ];
  const eagerModals = MODAL_COMPONENTS.filter((name) =>
    isEagerModalImport(modalsContent, name) || isEagerModalImport(enrollmentsContent, name),
  );
  return {
    usesBarrelImport: Boolean(barrelMatch),
    dynamicImportCount: dynamicMatches.length,
    eagerModalImports: eagerModals,
  };
}

const pageContent = readFile('src/features/admin/students/StudentsPageContent.tsx');
const pageEntry = readFile('app/admin/students/page.tsx');
const modalsContent = readFile('src/features/admin/students/components/StudentsPageModals.tsx');
const enrollmentsContent = readFile('src/features/admin/students/components/StudentsEnrollmentsPanel.tsx');
const importAnalysis = analyzeImports(pageContent, modalsContent, enrollmentsContent);

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
    'GET /users/students (useStudentsList — list only)',
    'GET /users/student-stats (useStudentDatabaseStats — separate, cached)',
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

const outJson = path.resolve(FRONTEND_ROOT, '../docs/performance/admin-students-frontend-audit.json');
mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('\n📦 Admin Students Page — Frontend Audit (Phase 4)\n');
console.log('Source file sizes:');
fileSizes.forEach(({ path: p, lines }) => {
  console.log(`  ${String(lines).padStart(5)} lines  ${p}`);
});
console.log(`\nTotal tracked source lines: ${totalLines}`);
console.log(`\nPage entry dynamic import: ${report.pageEntryUsesDynamic ? 'yes' : 'no'}`);
console.log(`StudentsPageContent barrel import: ${importAnalysis.usesBarrelImport ? 'yes' : 'no'}`);
console.log(`Dynamic import count: ${importAnalysis.dynamicImportCount}`);
console.log(`Eager modal imports (${importAnalysis.eagerModalImports.length}): ${importAnalysis.eagerModalImports.join(', ') || 'none'}`);
console.log(`\nAPI calls on mount: ${report.apiCallsOnMount.length}`);
report.apiCallsOnMount.forEach((c) => console.log(`  - ${c}`));
console.log(`\nDefault page size: ${report.defaultPageSize}`);
if (report.recommendations.length > 0) {
  console.log('\nRecommendations:');
  report.recommendations.forEach((r) => console.log(`  • ${r}`));
}
console.log(`\n✅ JSON report: ${outJson}\n`);
