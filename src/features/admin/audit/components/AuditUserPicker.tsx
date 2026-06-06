'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getUsers, type User } from '@/lib/api/users';

export function AuditUserPicker({
  value,
  onChange,
  actorRole,
}: {
  value: string;
  onChange: (userId: string, user?: User | null) => void;
  actorRole?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showRawId, setShowRawId] = useState(false);
  const blurTimerRef = useRef<number | null>(null);
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
      setQuery('');
      return;
    }
    if (selectedUser?.id === value) return;

    let cancelled = false;
    getUsers({ search: value, limit: 5 })
      .then((res) => {
        if (cancelled || !res.success || !res.data?.length) return;
        const match = res.data.find((u) => u.id === value) ?? res.data[0];
        if (match) {
          setSelectedUser(match);
          setQuery(`${match.fullName} (${match.role.replace(/_/g, ' ')})`);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [value, selectedUser?.id]);

  useEffect(() => {
    if (trimmedQuery.length < 2 || (selectedUser && query.includes(selectedUser.fullName))) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      getUsers({
        search: trimmedQuery,
        role: actorRole || undefined,
        limit: 15,
        minimal: true,
      })
        .then((res) => {
          if (cancelled) return;
          setResults(res.data || []);
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [actorRole, query, selectedUser, trimmedQuery]);

  function selectUser(user: User) {
    setSelectedUser(user);
    setQuery(`${user.fullName} (${user.role.replace(/_/g, ' ')})`);
    setOpen(false);
    onChange(user.id, user);
  }

  function clearSelection() {
    setSelectedUser(null);
    setQuery('');
    setResults([]);
    onChange('', null);
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (selectedUser) {
              setSelectedUser(null);
              onChange('', null);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Search user by name or mobile"
          className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-8 pr-8 text-xs focus-visible:ring-indigo-300"
        />
        {(value || query) && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear user"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {open && (results.length > 0 || loading) && (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {loading && <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>}
            {!loading &&
              results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="flex w-full flex-col items-start border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectUser(user)}
                >
                  <span className="text-xs font-bold text-slate-800">{user.fullName}</span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {user.role.replace(/_/g, ' ')} · {user.mobile}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowRawId((prev) => !prev)}
        className="text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-indigo-600"
      >
        {showRawId ? 'Hide raw actor ID' : 'Raw actor ID'}
      </button>

      {showRawId && (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value, null)}
          placeholder="Paste user ID"
          className="h-8 rounded-lg border-slate-200 bg-slate-50 font-mono text-[11px] focus-visible:ring-indigo-300"
        />
      )}
    </div>
  );
}
