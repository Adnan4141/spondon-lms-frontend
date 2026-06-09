export type StockPageSharedFilters = {
  bookId: string;
  branchId: string;
  fromDate?: Date;
  toDate?: Date;
};

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function defaultStockPageFilters(): StockPageSharedFilters {
  return { bookId: 'all', branchId: 'all' };
}
