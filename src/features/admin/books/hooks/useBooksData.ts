'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getBooks,
  getBookCategories,
  getDistributionChannels,
  getStockSources,
  type Book,
  type BookCategory,
  type DistributionChannel,
  type StockSource,
} from '@/lib/api/books';
import { getBranches, type Branch } from '@/lib/api/branches';
import { getPrograms, type Program } from '@/lib/api/programs';

export interface BooksDashboardData {
  books: Book[];
  categories: BookCategory[];
  branches: Branch[];
  channels: DistributionChannel[];
  sources: StockSource[];
  programs: Program[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshBooks: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  setCategories: React.Dispatch<React.SetStateAction<BookCategory[]>>;
}

export function useBooksData(): BooksDashboardData {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [channels, setChannels] = useState<DistributionChannel[]>([]);
  const [sources, setSources] = useState<StockSource[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBooks = useCallback(async () => {
    const response = await getBooks();
    setBooks(response.success && response.data ? response.data : []);
  }, []);

  const refreshCategories = useCallback(async () => {
    const response = await getBookCategories();
    setCategories(response.success && response.data ? response.data : []);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, categoriesRes, branchesRes, channelsRes, sourcesRes, programsRes] = await Promise.allSettled([
        getBooks(),
        getBookCategories(),
        getBranches(),
        getDistributionChannels({ includeInactive: true }),
        getStockSources({ includeInactive: true }),
        getPrograms(),
      ]);

      if (booksRes.status === 'fulfilled') {
        setBooks(booksRes.value.success && booksRes.value.data ? booksRes.value.data : []);
      }
      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.success && categoriesRes.value.data ? categoriesRes.value.data : []);
      }
      if (branchesRes.status === 'fulfilled') {
        setBranches(branchesRes.value.success && branchesRes.value.data ? branchesRes.value.data : []);
      }
      if (channelsRes.status === 'fulfilled') {
        setChannels(channelsRes.value.success && channelsRes.value.data ? channelsRes.value.data : []);
      }
      if (sourcesRes.status === 'fulfilled') {
        setSources(sourcesRes.value.success && sourcesRes.value.data ? sourcesRes.value.data : []);
      }
      if (programsRes.status === 'fulfilled') {
        setPrograms(programsRes.value.success && programsRes.value.data ? programsRes.value.data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  return {
    books,
    categories,
    branches,
    channels,
    sources,
    programs,
    loading,
    refreshAll,
    refreshBooks,
    refreshCategories,
    setBooks,
    setCategories,
  };
}