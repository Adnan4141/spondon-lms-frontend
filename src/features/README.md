# Feature modules (`src/features/`)

Use this folder for **page-level business logic**. Keep `app/**/page.tsx` as thin route wrappers.

## Golden patterns (copy these)

### 1. Admin list page — Questions (`admin/questions/`)

```
features/admin/questions/
  QuestionsPageContent.tsx     # orchestrator only (~250 lines)
  hooks/useQuestionsPageData.ts
  hooks/useQuestionPageActions.tsx
  components/QuestionsTable.tsx
  components/QuestionsFiltersBar.tsx
  questions-page-utils.ts
  questions-folder-utils.ts
  index.ts                     # public exports
```

`app/admin/questions/page.tsx` dynamically imports `QuestionsPageContent`.

**Rules:**
- Data fetching in React Query hooks (`src/lib/query/hooks/` or feature hooks)
- UI state (filters, selection, pagination) in the orchestrator
- Mutations + toasts in `use*Actions` hooks
- Presentational pieces in `components/`

### 2. Student list page — My Courses (`app/student/courses/` + `components/student/courses/`)

```
app/student/courses/page.tsx           # orchestrator (~150 lines)
lib/query/hooks/useStudentMyCourses.ts
components/student/courses/*.tsx       # toolbar, list item, skeleton, empty
```

**Rules:**
- One hook per resource (`useStudentMyCourses`)
- Pure helpers (sort, filter, stats) as functions in the page or a `*-utils.ts` file
- Loading / error / empty states as dedicated components

### 3. Thin app routes

```tsx
// app/admin/teachers/page.tsx
const TeachersPageContent = dynamic(
  () => import('@/features/admin/teachers/TeachersPageContent').then((m) => m.TeachersPageContent),
  { loading: () => <PageSkeleton /> },
);

export default function AdminTeachersPage() {
  return <TeachersPageContent />;
}
```

Target: **≤ 80 lines** per `app/**/page.tsx` (ESLint warns above this).

## File size limits (Phase 1)

| Threshold | Action |
|-----------|--------|
| **400 lines** | ESLint warning — consider splitting |
| **600 lines** | Do not add new files above this (`npm run lint:file-sizes:strict`) |
| **800+ lines** | Critical debt — prioritize in Phase 2 decomposition |

```bash
npm run lint:file-sizes          # audit report
npm run lint:file-sizes:strict   # fail on new files > 600 lines (git)
npm run analyze                  # bundle size baseline
```

## Heavy dependencies — always lazy-load

| Library | Wrapper |
|---------|---------|
| TipTap / KaTeX | `@/components/ui/lazy-rich-text-editor` |
| Exam taking UI | `@/components/student/exam-window/LazyExamTakingView` |
| OMR review panel | `@/features/admin/exam-engine/components/LazyOmrScanReviewPanel` |
| Question forms | `@/features/admin/questions/lazyQuestionForms` |
| PDF preview | `dynamic()` → `PublicSamplePdfDialog` |
| Excel export | `dynamic import('exceljs')` in `lib/export.ts` |
| Recharts | `dynamic()` per tab (see `ReportsPageContent`) |

Do **not** statically import these from route files or shared layouts.

## Adding a new feature

1. Create `src/features/<area>/<name>/`
2. Add `*PageContent.tsx` + hooks + components
3. Add `index.ts` for public exports
4. Wire `app/.../page.tsx` with `dynamic()` import
5. Add React Query hook in `src/lib/query/hooks/` if fetching server data

## Anti-patterns (avoid)

- 500+ line `*PageContent.tsx` with inline `useEffect` fetch
- Business logic in `app/**/page.tsx`
- Direct `import` of exam engine, rich text, or PDF viewers from layouts
- Duplicating admin list UI instead of extracting shared `AdminListPage` primitives (Phase 2)
