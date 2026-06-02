'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { StudentSmsSuggestion } from '@/lib/api/students';
import type { SmsRecipient } from '@/lib/api/sms';
import { Panel } from '../../sms-shared';
import { normalizeBdSmsNumber } from '../../utils/sms-number';
import { StudentSearchCombobox } from './StudentSearchCombobox';
import type { Actor, BranchOption, DirectRecipientMode, WalletSelection } from './types';

export function DirectMethodPanel({
  branches,
  actor,
  wallet,
  onWalletChange,
  onResolved,
}: {
  branches: BranchOption[];
  actor?: Actor;
  wallet: WalletSelection;
  onWalletChange: (wallet: WalletSelection) => void;
  onResolved: (recipients: SmsRecipient[], wallet: WalletSelection, mode: DirectRecipientMode) => void;
}) {
  const { toast } = useToast();
  const isBranchAdmin = actor?.role === 'BRANCH_ADMIN';

  function selectStudent(student: StudentSmsSuggestion) {
    const phone = normalizeBdSmsNumber(student.phone || student.mobile) || student.phone || student.mobile;
    const nextWallet: WalletSelection = student.branchId
      ? { scope: 'BRANCH', branchId: student.branchId }
      : { scope: 'ORG' };
    const variables = {
      ...(student.smsVariables || {}),
      name: student.fullName,
      phone,
      roll: student.registrationNumber || student.roll || '',
      registrationNumber: student.registrationNumber || student.roll || '',
      branch: student.branchName || student.smsVariables?.branch || '',
      institute: student.smsVariables?.institute || 'Spondon LMS',
    };

    onWalletChange(nextWallet);
    onResolved([{
      id: student.id,
      name: student.fullName,
      phone,
      branchId: student.branchId || undefined,
      variables,
    }], nextWallet, 'student');
  }

  function useRawNumber(rawNumber: string) {
    const normalized = normalizeBdSmsNumber(rawNumber);
    if (!normalized) {
      toast({ title: 'Enter a valid BD mobile number', variant: 'destructive' });
      return;
    }
    const nextWallet = isBranchAdmin
      ? { scope: 'BRANCH' as const, branchId: actor?.branchId || undefined }
      : wallet;
    onResolved([{ phone: normalized, branchId: nextWallet.scope === 'BRANCH' ? nextWallet.branchId : undefined, variables: { phone: normalized, institute: 'Spondon LMS' } }], nextWallet, 'raw');
  }

  return (
    <Panel title="Direct SMS">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
        <div className="space-y-3">
          <div>
            <Label>Search by name / roll / mobile</Label>
            <div className="mt-1">
              <StudentSearchCombobox branchId={isBranchAdmin ? actor?.branchId || undefined : undefined} onSelect={selectStudent} />
            </div>
          </div>
          {!isBranchAdmin ? (
            <div>
              <Label>Wallet for raw number</Label>
              <Select
                value={wallet.scope === 'BRANCH' ? wallet.branchId || 'org' : 'org'}
                onValueChange={(value) => onWalletChange(value === 'org' ? { scope: 'ORG' } : { scope: 'BRANCH', branchId: value })}
              >
                <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Central wallet</SelectItem>
                  {branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-slate-500">Student selection automatically uses the student branch wallet.</p>
            </div>
          ) : null}
        </div>
        <RawNumberBox onUse={useRawNumber} />
      </div>
    </Panel>
  );
}

function RawNumberBox({ onUse }: { onUse: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="space-y-3">
      <div>
        <Label>Or raw number</Label>
        <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="01711xxxxxx" className="mt-1 bg-white" />
      </div>
      <Button type="button" onClick={() => onUse(value)} className="gap-2">
        <Send className="h-4 w-4" />
        Use this recipient
      </Button>
    </div>
  );
}
