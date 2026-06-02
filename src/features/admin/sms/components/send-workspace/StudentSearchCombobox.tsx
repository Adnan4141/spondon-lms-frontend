'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Search, UserRoundCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchStudentSmsSuggestions, type StudentSmsSuggestion } from '@/lib/api/students';

export function StudentSearchCombobox({
  branchId,
  onSelect,
}: {
  branchId?: string;
  onSelect: (student: StudentSmsSuggestion) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSmsSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const blurTimerRef = useRef<number | null>(null);
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmedQuery.length < 2) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      searchStudentSmsSuggestions({ q: trimmedQuery, branchId, limit: 10 })
        .then((res) => {
          if (cancelled) return;
          setResults(res.data || []);
          setOpen(true);
        })
        .catch((err) => {
          if (cancelled) return;
          setResults([]);
          setError(err instanceof Error ? err.message : 'Student search failed');
          setOpen(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [branchId, trimmedQuery]);

  function selectStudent(student: StudentSmsSuggestion) {
    setQuery(`${student.fullName}${student.registrationNumber ? ` (${student.registrationNumber})` : ''}`);
    setOpen(false);
    onSelect(student);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (next.trim().length < 2) {
              setResults([]);
              setError('');
              setLoading(false);
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Name, roll, or mobile"
          className="bg-white pl-9 pr-9"
          role="combobox"
          aria-expanded={open}
          aria-controls="direct-student-search-results"
        />
        {loading ? <RotateCcw className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" /> : null}
      </div>

      {open && trimmedQuery.length >= 2 ? (
        <div
          id="direct-student-search-results"
          role="listbox"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          onMouseDown={() => {
            if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
          }}
        >
          {error ? (
            <div className="px-3 py-3 text-sm text-rose-600">{error}</div>
          ) : results.length ? (
            results.map((student) => (
              <button
                key={student.id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => selectStudent(student)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                  <UserRoundCheck className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{student.fullName}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {student.phone || student.mobile}
                    {student.registrationNumber ? ` | Roll ${student.registrationNumber}` : ''}
                    {student.branchName ? ` | ${student.branchName}` : ''}
                  </span>
                </span>
              </button>
            ))
          ) : loading ? (
            <div className="px-3 py-3 text-sm text-slate-500">Searching...</div>
          ) : (
            <div className="px-3 py-3 text-sm text-slate-500">No matching active student found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
