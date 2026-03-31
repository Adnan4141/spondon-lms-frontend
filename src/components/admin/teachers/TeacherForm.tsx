'use client';

import { useState, useEffect } from 'react';
import {
  createUser,
  updateUser,
  uploadUserProfileImage,
  type User as TeacherUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/api/users';
import type { Branch } from '@/lib/api/branches';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { useModalStore } from '@/store/modalStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, User as UserIcon, Phone, Mail, Lock, Shield, ImagePlus, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner outline-none';
const sectionLabel = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 block px-1';

const BD_MOBILE = /^01[3-9]\d{8}$/;

type TeacherFormProps = {
  branches: Branch[];
  teacher?: TeacherUser | null;
  /** When set, branch is fixed (e.g. branch admin). */
  lockedBranchId?: string | null;
  onSuccess: () => Promise<void>;
};

export function TeacherForm({ branches, teacher, lockedBranchId, onSuccess }: TeacherFormProps) {
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const isEdit = !!teacher;

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.fullName);
      setMobile(teacher.mobile);
      setEmail(teacher.email || '');
      setBranchId(teacher.branchId || '');
      setStatus(teacher.status || 'ACTIVE');
      setPassword('');
      setPhotoUrl(teacher.profileImage || '');
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      setFullName('');
      setMobile('');
      setEmail('');
      setPassword('');
      setBranchId(lockedBranchId || '');
      setStatus('ACTIVE');
      setPhotoUrl('');
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [teacher, lockedBranchId]);

  const effectiveBranchId = lockedBranchId || branchId || undefined;

  const handleSubmit = async () => {
    setError(null);
    const name = fullName.trim();
    const mob = mobile.trim();
    const em = email.trim();

    if (!name) {
      setError('Full name is required');
      return;
    }
    if (!BD_MOBILE.test(mob)) {
      setError('Use an 11-digit Bangladesh mobile (e.g. 01712345678)');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);

      if (isEdit && teacher) {
        const payload: UpdateUserPayload = {
          fullName: name,
          mobile: mob,
          email: em || undefined,
          status,
          profileImage: photoFile ? undefined : photoUrl || null,
        };
        if (lockedBranchId) {
          payload.branchId = lockedBranchId;
        } else {
          payload.branchId = branchId ? branchId : null;
        }
        if (password.trim()) payload.password = password.trim();

        const res = await updateUser(teacher.id, payload);
        if (!res.success) {
          setError(res.message || 'Update failed');
          return;
        }
        if (photoFile) {
          const up = await uploadUserProfileImage(teacher.id, photoFile);
          if (!up.success) {
            setError(up.message || 'Profile saved but image upload failed');
            return;
          }
        }
        await onSuccess();
        toast({ title: 'Success', description: 'Teacher updated.', variant: 'success' });
        closeModal();
      } else {
        const payload: CreateUserPayload = {
          fullName: name,
          mobile: mob,
          email: em || undefined,
          role: 'TEACHER',
          status: 'ACTIVE',
          profileImage: photoFile ? undefined : photoUrl || undefined,
        };
        if (password.trim()) payload.password = password.trim();
        if (effectiveBranchId) payload.branchId = effectiveBranchId;

        const res = await createUser(payload);
        if (!res.success || !res.data) {
          setError(res.message || 'Could not create teacher');
          return;
        }
        const newId = res.data.id;
        if (photoFile && newId) {
          const up = await uploadUserProfileImage(newId, photoFile);
          if (!up.success) {
            setError(up.message || 'Teacher created but photo upload failed');
            return;
          }
        }
        await onSuccess();
        const otp = (res.data as { oneTimePassword?: string }).oneTimePassword;
        toast({
          title: 'Success',
          description: otp
            ? `Share this one-time password with the teacher: ${otp}`
            : 'New teacher account established.',
          variant: 'success',
        });
        closeModal();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden text-slate-900 bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="space-y-10">
          
          {/* Section: Profile */}
          <section className="space-y-6">
            <div className="flex items-center gap-2.5 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50">
                <UserIcon className="h-4 w-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Profile</h3>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className={sectionLabel}>Full name</label>
                 <Input
                   className={inputClass}
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="Teacher name"
                 />
               </div>

               <div className="grid gap-6 sm:grid-cols-2">
                 <div className="space-y-2">
                   <label className={sectionLabel}>Phone (login)</label>
                   <div className="relative">
                     <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                     <Input
                       className={cn(inputClass, 'pl-11')}
                       value={mobile}
                       onChange={(e) => setMobile(e.target.value)}
                       placeholder="017XXXXXXXX"
                       disabled={isEdit}
                     />
                   </div>
                   {isEdit && (
                     <p className="text-[9px] font-bold text-slate-400 px-2 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> System locked for security.
                     </p>
                   )}
                 </div>
                 
                 <div className="space-y-2">
                   <label className={sectionLabel}>Email</label>
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                     <Input
                       className={cn(inputClass, 'pl-11')}
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="institutional@email.com"
                     />
                   </div>
                 </div>
               </div>
            </div>
          </section>

          {/* Section: Photo */}
          <section className="space-y-6">
             <div className="flex items-center gap-2.5 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shadow-sm border border-sky-100/50">
                   <ImagePlus className="h-4 w-4" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Photo</h3>
             </div>
             
             <div className="rounded-[28px] border border-slate-100 bg-slate-50/30 p-6 space-y-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                   <div className="relative group shrink-0">
                      <div className="h-24 w-24 rounded-[28px] border-4 border-white bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center overflow-hidden">
                         {(photoPreview || photoUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoPreview || resolveAttachmentUrl(photoUrl, API_ORIGIN)}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                         ) : (
                            <UserIcon className="h-10 w-10 text-slate-200" />
                         )}
                      </div>
                      {(photoPreview || photoUrl) && (
                         <button 
                            onClick={() => {
                               setPhotoFile(null);
                               setPhotoPreview(null);
                               setPhotoUrl('');
                            }}
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                         >
                            <X className="h-4 w-4" />
                         </button>
                      )}
                   </div>
                   
                   <div className="flex-1 space-y-4">
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-black tracking-tight text-white transition-all hover:bg-indigo-600 shadow-lg shadow-slate-200">
                         <ImagePlus className="h-4 w-4" />
                         Upload Profile Image
                         <input
                           type="file"
                           accept="image/*"
                           className="sr-only"
                           onChange={(e) => {
                             const f = e.target.files?.[0];
                             if (!f) return;
                             setPhotoFile(f);
                             setPhotoPreview(URL.createObjectURL(f));
                           }}
                         />
                      </label>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest px-1">
                         Tip: square JPG/PNG works best.
                      </p>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className={sectionLabel}>Image URL (optional)</label>
                   <Input
                     className={inputClass}
                     value={photoUrl}
                     onChange={(e) => setPhotoUrl(e.target.value)}
                     placeholder="https://institutional-storage.com/photo.jpg"
                     disabled={!!photoFile}
                   />
                </div>
             </div>
          </section>

          {/* Section: Branch & Security */}
          <div className="grid gap-10 lg:grid-cols-2">
             <section className="space-y-6">
                <div className="flex items-center gap-2.5 px-1">
                   <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 shadow-sm border border-violet-100/50">
                      <Building2 className="h-4 w-4" />
                   </div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Branch</h3>
                </div>
                
                {lockedBranchId ? (
                   <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 px-5 py-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                         <Building2 className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-black text-indigo-900">
                         {branches.find((b) => b.id === lockedBranchId)?.name || 'Branch Office'}
                      </p>
                   </div>
                ) : (
                  <div className="space-y-2">
                     <label className={sectionLabel}>Branch</label>
                     <Select value={branchId || 'none'} onValueChange={(v) => setBranchId(v === 'none' ? '' : v)}>
                       <SelectTrigger className={cn(inputClass, 'h-14')}>
                         <SelectValue placeholder="Select Institutional Node" />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl p-2 border-slate-100 shadow-2xl">
                         <SelectItem value="none" className="rounded-xl font-bold">Not Assigned (Global)</SelectItem>
                         {branches.map((b) => (
                           <SelectItem key={b.id} value={b.id} className="rounded-xl font-bold">
                             {b.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                )}
             </section>

             <section className="space-y-6">
                <div className="flex items-center gap-2.5 px-1">
                   <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50">
                      <Lock className="h-4 w-4" />
                   </div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Password</h3>
                </div>
                
                <div className="space-y-2">
                  <label className={sectionLabel}>{isEdit ? 'New password' : 'Password (optional)'}</label>
                  <Input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEdit ? '••••••••' : 'Leave empty for auto-generation'}
                  />
                  {!isEdit && (
                    <p className="text-[9px] font-bold text-slate-400 px-2 leading-relaxed tracking-tight">
                       Leave empty to auto-generate.
                    </p>
                  )}
                </div>
             </section>
          </div>

          {isEdit && (
             <section className="space-y-6">
                <div className="flex items-center gap-2.5 px-1">
                   <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100/50">
                      <Shield className="h-4 w-4" />
                   </div>
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Status</h3>
                </div>
                
                <div className="space-y-2">
                   <label className={sectionLabel}>Status</label>
                   <Select value={status} onValueChange={setStatus}>
                     <SelectTrigger className={cn(inputClass, 'h-14')}>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl p-2 border-slate-100 shadow-2xl">
                       <SelectItem value="ACTIVE" className="rounded-xl font-bold text-emerald-600">Active Access</SelectItem>
                       <SelectItem value="BLOCKED" className="rounded-xl font-bold text-rose-600">Restricted Access</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
             </section>
          )}

          {error && (
            <div className="rounded-[20px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-black text-rose-700 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <div className="h-6 w-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                 <X className="h-3.5 w-3.5" />
              </div>
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-50 bg-slate-50/50 px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 transition-all"
            onClick={closeModal}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-14 px-10 rounded-2xl text-white bg-slate-900 font-black tracking-tight hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create teacher'}
          </Button>
        </div>
      </div>
    </div>
  );
}
