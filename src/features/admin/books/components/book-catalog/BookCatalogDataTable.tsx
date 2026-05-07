'use client';

import type { Book } from '@/lib/api/books';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, FileText, PencilLine } from 'lucide-react';
import { bookStockState } from './book-catalog-utils';

type BookCatalogDataTableProps = {
  books: Book[];
  onOpenDetail: (book: Book) => void;
  onOpenEdit: (book: Book) => void;
  onPreviewPdf: (book: Book) => void;
};

export function BookCatalogDataTable({ books, onOpenDetail, onOpenEdit, onPreviewPdf }: BookCatalogDataTableProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Pages</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => {
            const state = bookStockState(book);
            return (
              <TableRow key={book.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-9 overflow-hidden rounded-xl bg-muted">
                      {book.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.thumbnailUrl} alt={book.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-black text-muted-foreground">
                          {book.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-foreground">{book.name}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{book.sku}</p>
                      <p className="text-xs text-slate-500">{book.author || 'Author not set'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{book.category?.name || 'Uncategorized'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{book.isEbook ? 'E-Book' : 'Physical'}</Badge>
                </TableCell>
                <TableCell>{Number(book.pageCount || 0) > 0 ? Number(book.pageCount).toLocaleString() : 'Not set'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={state.className}>
                    {book.isEbook ? 'Digital' : `${book.centralQty || 0} · ${state.label}`}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-black text-primary">৳{Number(book.price).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenDetail(book)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => onOpenEdit(book)}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    {book.isEbook && book.fileUrl ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => onPreviewPdf(book)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
