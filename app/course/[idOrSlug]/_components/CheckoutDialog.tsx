import { ArrowRight, BookOpen, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CourseDetailBatch, CourseDetailCourseBook, CourseDetails } from '@/types/course';

type DeliveryState = {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseDetails;
  checkoutCourseFee: number;
  checkoutBooksTotal: number;
  checkoutAdmissionFee: number;
  checkoutTotal: number;
  checkoutBillingType?: 'MONTHLY' | 'ONE_TIME';
  checkoutBillingMonth?: string | null;
  courseBooks: CourseDetailCourseBook[];
  selectedPaidBooks: CourseDetailCourseBook[];
  selectedPaidBookIds: string[];
  setPaidBookIncluded: (bookId: string, included: boolean) => void;
  offlineBatches: CourseDetailBatch[];
  offlineBranches: { id: string; name: string }[];
  lockedBranch: { id: string; name: string } | null;
  branchLocked: boolean;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  batchesLoading: boolean;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  selectedBatch: CourseDetailBatch | undefined;
  needsDelivery: boolean;
  delivery: DeliveryState;
  setDelivery: React.Dispatch<React.SetStateAction<DeliveryState>>;
  enrolling: boolean;
  quoteLoading: boolean;
  quoteError: string | null;
  submitDeliveryAndEnroll: () => void;
};

export function CheckoutDialog({
  open,
  onOpenChange,
  course,
  checkoutCourseFee,
  checkoutBooksTotal,
  checkoutAdmissionFee,
  checkoutTotal,
  checkoutBillingType,
  checkoutBillingMonth,
  courseBooks,
  selectedPaidBooks,
  selectedPaidBookIds,
  setPaidBookIncluded,
  offlineBatches,
  offlineBranches,
  lockedBranch,
  branchLocked,
  selectedBranchId,
  setSelectedBranchId,
  batchesLoading,
  selectedBatchId,
  setSelectedBatchId,
  selectedBatch,
  needsDelivery,
  delivery,
  setDelivery,
  enrolling,
  quoteLoading,
  quoteError,
  submitDeliveryAndEnroll,
}: Props) {
  const optionalPaidBooks = courseBooks.filter((cb) => !cb.isFree);
  const visibleBatches = offlineBatches.filter((batch) => !selectedBranchId || batch.branchId === selectedBranchId);
  const hasSelectableBatch = visibleBatches.some((batch) => batch.availableSeats !== 0);
  const visibleBranches =
    branchLocked && lockedBranch && !offlineBranches.some((branch) => branch.id === lockedBranch.id)
      ? [lockedBranch, ...offlineBranches]
      : offlineBranches;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden rounded-[28px] border-slate-200 bg-white p-0 shadow-2xl sm:max-w-3xl">
        <DialogHeader>
          <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#fdf4ff_100%)] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700 shadow-sm">
                  Secure Checkout
                </div>
                <DialogTitle className="truncate text-xl font-black text-slate-900">
                  ভর্তি নিশ্চিত করুন
                </DialogTitle>
                <DialogDescription className="mt-1 text-left text-sm font-medium text-slate-500">
                  {course.name}
                </DialogDescription>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-slate-500">পরিশোধযোগ্য মোট</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-[#5C2D91]">৳{checkoutTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(92vh-11rem)] overflow-y-auto">
          <div className="grid gap-5 px-6 py-5 sm:px-7 md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                <div className="border-b border-slate-200 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Summary</p>
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-bold text-slate-500">
                      {checkoutBillingType === 'MONTHLY' ? `প্রথম মাসের ফি${checkoutBillingMonth ? ` (${checkoutBillingMonth})` : ''}` : 'কোর্স ফি'}
                    </span>
                    <span className="font-black text-slate-900">৳{checkoutCourseFee.toLocaleString()}</span>
                  </div>
                  {selectedPaidBooks.length > 0 ? (
                    <div className="px-4 py-3">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-bold text-slate-500">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          নির্বাচিত বই
                        </span>
                        <span className="font-black text-slate-900">৳{checkoutBooksTotal.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1.5">
                        {selectedPaidBooks.map((cb) => (
                          <div key={cb.bookId} className="flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="truncate">{cb.book.name}</span>
                            <span className="font-bold">৳{Number(cb.book.price).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {checkoutAdmissionFee > 0 ? (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-bold text-slate-500">ভর্তি ফি</span>
                      <span className="font-black text-slate-900">৳{checkoutAdmissionFee.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between bg-[#5C2D91] px-4 py-4 text-white">
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">মোট</span>
                    <span className="text-xl font-black">৳{checkoutTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 px-4 py-4 text-sm font-medium text-indigo-950">
                <div className="mb-2 flex items-center gap-2 font-black">
                  <Users className="h-4 w-4" />
                  ভর্তি সারাংশ
                </div>
                <p>{course.name}</p>
              </div>
            </div>

            <div className="space-y-5">
              <>
                {optionalPaidBooks.length > 0 ? (
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">বই যোগ করুন</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          চাইলে checkout-এর আগে বই include বা বাদ দিতে পারবেন।
                        </p>
                      </div>
                      <div className="space-y-2">
                        {optionalPaidBooks.map((cb) => {
                          const checked = selectedPaidBookIds.includes(cb.bookId);
                          return (
                            <label
                              key={cb.bookId}
                              className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors',
                                checked
                                  ? 'border-indigo-200 bg-indigo-50/70'
                                  : 'border-slate-200 bg-slate-50/70 hover:border-slate-300',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextChecked) => setPaidBookIncluded(cb.bookId, nextChecked)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black text-slate-900">{cb.book.name}</span>
                                <span className="mt-1 block text-[11px] font-bold text-slate-500">
                                  {cb.book.isEbook ? 'ই-বুক' : 'প্রিন্ট বই'} · ৳{Number(cb.book.price).toLocaleString()}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {course.type === 'OFFLINE' ? (
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Branch নির্বাচন করুন</Label>
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                          <SelectTrigger
                            disabled={branchLocked || batchesLoading}
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-bold text-slate-800 shadow-none"
                          >
                            <SelectValue placeholder={batchesLoading ? 'Branch লোড হচ্ছে...' : 'Branch বেছে নিন'} />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {visibleBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id} className="font-bold">
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {branchLocked ? (
                          <p className="text-xs font-bold text-slate-500">
                            আপনার saved branch checkout থেকে পরিবর্তন করা যাবে না।
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Batch নির্বাচন করুন</Label>
                        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                          <SelectTrigger
                            disabled={!selectedBranchId}
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-bold text-slate-800 shadow-none"
                          >
                            <SelectValue
                              placeholder={
                                !selectedBranchId
                                  ? 'আগে Branch বেছে নিন'
                                  : batchesLoading
                                    ? 'Batch লোড হচ্ছে...'
                                    : 'Batch বেছে নিন'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {visibleBatches.map((b) => {
                              const seats = b.availableSeats;
                              const isFull = seats === 0;
                              return (
                                <SelectItem key={b.id} value={b.id} disabled={isFull} className="font-bold">
                                  {b.name}
                                  {b.branch?.name ? (
                                    <span className="ml-2 text-[10px] font-black text-indigo-500">
                                      · {b.branch.name}
                                    </span>
                                  ) : null}
                                  {seats != null ? (
                                    <span className={cn('ml-2 text-[10px] font-black', isFull ? 'text-rose-500' : 'text-slate-400')}>
                                      {isFull ? '· পূর্ণ' : `· ${seats} seats`}
                                    </span>
                                  ) : null}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {batchesLoading ? (
                          <p className="text-xs font-bold text-slate-500">Active batch লোড হচ্ছে...</p>
                        ) : !selectedBranchId ? (
                          <p className="text-xs font-bold text-slate-500">Batch দেখতে আগে branch নির্বাচন করুন।</p>
                        ) : selectedBatch ? (
                          <p className="text-xs font-bold text-emerald-700">
                            {selectedBatch.name}
                            {selectedBatch.branch?.name ? ` · ${selectedBatch.branch.name}` : ''} নির্বাচিত হয়েছে।
                          </p>
                        ) : visibleBatches.length === 0 ? (
                          <p className="text-xs font-bold text-amber-700">এই branch-এর জন্য কোনো active batch পাওয়া যায়নি।</p>
                        ) : (
                          <p className="text-xs font-bold text-amber-700">
                            অফলাইন কোর্সে ভর্তি হতে একটি active batch নির্বাচন করুন।
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {needsDelivery ? (
                    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <p className="pt-1 text-sm font-bold text-slate-600">
                          প্রিন্ট বইয়ের ডেলিভারির জন্য ঠিকানা দিন।
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label className="text-xs font-bold">পূর্ণ নাম</Label>
                          <Input
                            className="mt-1 h-11 rounded-2xl border-slate-200 bg-slate-50"
                            value={delivery.recipientName}
                            onChange={(e) => setDelivery((d) => ({ ...d, recipientName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold">মোবাইল</Label>
                          <Input
                            className="mt-1 h-11 rounded-2xl border-slate-200 bg-slate-50"
                            value={delivery.phone}
                            onChange={(e) => setDelivery((d) => ({ ...d, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold">ঠিকানা</Label>
                          <Input
                            className="mt-1 h-11 rounded-2xl border-slate-200 bg-slate-50"
                            value={delivery.address}
                            onChange={(e) => setDelivery((d) => ({ ...d, address: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-bold">শহর (ঐচ্ছিক)</Label>
                            <Input
                              className="mt-1 h-11 rounded-2xl border-slate-200 bg-slate-50"
                              value={delivery.city}
                              onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-bold">পোস্ট কোড</Label>
                            <Input
                              className="mt-1 h-11 rounded-2xl border-slate-200 bg-slate-50"
                              value={delivery.postalCode}
                              onChange={(e) => setDelivery((d) => ({ ...d, postalCode: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                {quoteError ? (
                  <div className="rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {quoteError}
                  </div>
                ) : null}
              </>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:gap-2 sm:px-7">
          <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button
            type="button"
            onClick={submitDeliveryAndEnroll}
            disabled={
              enrolling ||
              quoteLoading ||
              Boolean(quoteError) ||
              (course.type === 'OFFLINE' && (!selectedBranchId || !hasSelectableBatch || batchesLoading))
            }
            className="h-11 rounded-2xl bg-[#5C2D91] px-6 text-white hover:bg-[#4A2475]"
          >
            {enrolling ? 'প্রসেসিং...' : quoteLoading ? 'মূল্য যাচাই হচ্ছে...' : <>পেমেন্ট করুন <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
