'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExamWizardState } from '../../types';

type Props = {
  state: ExamWizardState;
  onChange: (deliveryMode: ExamWizardState['deliveryMode']) => void;
};

export function DeliveryModeCard({ state, onChange }: Props) {
  if (!state.productType) return null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-serif text-base text-[#0D1B35]">Delivery mode</CardTitle>
          <Badge className={state.deliveryMode === 'ONLINE' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'}>
            {state.deliveryMode === 'ONLINE' ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription>
          Choose how students take the exam. Result entry, OMR sheets, and SMS options adjust to your choice in later steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={state.deliveryMode === 'ONLINE' ? 'default' : 'outline'}
          className={state.deliveryMode === 'ONLINE' ? 'bg-[#0D1B35] text-[#E2C98A]' : ''}
          onClick={() => onChange('ONLINE')}
        >
          Online
        </Button>
        <Button
          type="button"
          variant={state.deliveryMode === 'OFFLINE' ? 'default' : 'outline'}
          className={state.deliveryMode === 'OFFLINE' ? 'bg-[#E65100] text-white hover:bg-[#bf4200]' : ''}
          onClick={() => onChange('OFFLINE')}
        >
          Offline
        </Button>
      </CardContent>
    </Card>
  );
}
