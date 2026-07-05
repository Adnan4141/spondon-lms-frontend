'use client';

import { Loader2 } from 'lucide-react';
import type { Book } from '@/lib/api/books';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formError: string | null;
  recipientName: string;
  onRecipientNameChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  postalCode: string;
  onPostalCodeChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  purchasing: boolean;
  onConfirm: () => void;
};

export function StudentBooksCheckoutDialog({
  book,
  open,
  onOpenChange,
  formError,
  recipientName,
  onRecipientNameChange,
  phone,
  onPhoneChange,
  address,
  onAddressChange,
  city,
  onCityChange,
  postalCode,
  onPostalCodeChange,
  notes,
  onNotesChange,
  purchasing,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-black">Confirm Order</DialogTitle>
          <DialogDescription>
            {book ? (
              <>
                <span className="font-semibold text-slate-700">{book.name}</span>
                {' — '}
                ৳{Number(book.price).toLocaleString()}. Provide delivery details, then proceed to
                payment.
              </>
            ) : (
              'Provide delivery and contact details, then proceed to online payment.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {formError ? <p className="text-sm font-semibold text-rose-600">{formError}</p> : null}
          <div className="space-y-1.5">
            <Label htmlFor="sb-name">Full Name</Label>
            <Input
              id="sb-name"
              className="rounded-xl"
              value={recipientName}
              onChange={(e) => onRecipientNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sb-phone">Phone</Label>
            <Input
              id="sb-phone"
              className="rounded-xl"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sb-address">Address</Label>
            <Textarea
              id="sb-address"
              className="min-h-[72px] rounded-xl"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sb-city">City</Label>
              <Input
                id="sb-city"
                className="rounded-xl"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-post">Postal Code</Label>
              <Input
                id="sb-post"
                className="rounded-xl"
                value={postalCode}
                onChange={(e) => onPostalCodeChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sb-notes">Note</Label>
            <Input
              id="sb-notes"
              className="rounded-xl"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="w-full rounded-2xl sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-indigo-600 hover:text-white sm:w-auto [&_svg]:text-white"
            onClick={onConfirm}
            disabled={purchasing}
          >
            {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
