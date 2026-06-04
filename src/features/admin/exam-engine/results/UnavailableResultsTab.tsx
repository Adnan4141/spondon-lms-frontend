'use client';

import { Card, CardContent } from '@/components/ui/card';

export function UnavailableResultsTab({ message }: { message: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="py-8 text-center text-sm text-slate-500">
        {message}
      </CardContent>
    </Card>
  );
}
