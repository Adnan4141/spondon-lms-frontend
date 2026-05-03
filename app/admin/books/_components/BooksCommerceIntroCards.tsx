'use client';

import { Building2, ReceiptText } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BooksCommerceIntroCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Course-linked books</CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                Course modals and receipts can list each linked book as its own line with a clear subtotal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Public sample PDFs</CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                Storefront book pages use a shared preview modal; empty states show until a sample file is attached.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
