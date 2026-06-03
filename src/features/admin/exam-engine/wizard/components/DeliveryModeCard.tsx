'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamProductType } from '../../types';

type Props = {
  courseId: string;
  deliveryMode: 'ONLINE' | 'OFFLINE';
  productType: ExamProductType | '';
};

/**
 * Read-only delivery mode summary card.
 * The mode is derived from the selected course's type — admins cannot override
 * it here. To change the delivery mode, the course type must be edited.
 */
export function DeliveryModeCard({ courseId, deliveryMode, productType }: Props) {
  if (!productType || !courseId) return null;

  const isOnline = deliveryMode === 'ONLINE';

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-serif text-base text-[#0D1B35]">Delivery mode</CardTitle>
          <Badge className={isOnline ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription>
          Delivery mode is set by the selected course. Result entry methods, OMR sheets, and auto-submit options update automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-md bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
          {isOnline
            ? 'Online course — students take this exam digitally. Automatic grading is available.'
            : 'Offline course — students take this exam on paper. OMR scan and manual entry are available.'}
          {' '}
          To change the delivery mode, update the course type in course settings.
        </p>
      </CardContent>
    </Card>
  );
}
