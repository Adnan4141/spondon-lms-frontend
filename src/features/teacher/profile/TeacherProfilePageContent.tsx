'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Building2,
  Camera,
  Clock,
  ExternalLink,
  Eye,
  GraduationCap,
  Link2,
  Loader2,
  Mail,
  Phone,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import {
  getMyTeacherProfile,
  updateMyTeacherProfile,
  type TeacherMyProfile,
} from '@/lib/api/teacher-portal';
import { uploadMyProfileImage } from '@/lib/api/users';
import { getYoutubePrivacyEmbedUrl } from '@/lib/youtube-embed';
import { useTeacherSession } from '@/components/teacher/useTeacherSession';
import { StudentChangePasswordDialog } from '@/components/student/StudentChangePasswordDialog';
import { cn } from '@/lib/utils';

const inputClass =
  'h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-base font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10';

function syncLocalUser(patch: Record<string, unknown>) {
  const stored = localStorage.getItem('user');
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    localStorage.setItem('user', JSON.stringify({ ...parsed, ...patch }));
  } catch {
    // ignore
  }
}

function profileCompleteness(profile: TeacherMyProfile | null): number {
  if (!profile) return 0;
  const checks = [
    Boolean(profile.profileImage),
    Boolean(profile.fullName?.trim()),
    Boolean(profile.designation?.trim()),
    Boolean(profile.institute?.trim()),
    profile.experienceYears != null && profile.experienceYears >= 0,
    Boolean(profile.demoClassUrl?.trim()),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function TeacherProfilePageContent() {
  const { toast } = useToast();
  const { user, authChecked, refresh, initials } = useTeacherSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<TeacherMyProfile | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [institute, setInstitute] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [demoClassUrl, setDemoClassUrl] = useState('');
  const [showMobile, setShowMobile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyTeacherProfile();
      if (res.success && res.data) {
        const p = res.data;
        setProfile(p);
        setFullName(p.fullName || '');
        setEmail(p.email || '');
        setDesignation(p.designation || '');
        setInstitute(p.institute || '');
        setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : '');
        setDemoClassUrl(p.demoClassUrl || '');
        setShowMobile(Boolean(p.showMobile));
        setProfileImage(p.profileImage ?? null);
      }
    } catch (err) {
      toast({
        title: 'Failed to load profile',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authChecked && user) void loadProfile();
  }, [authChecked, user, loadProfile]);

  const avatarUrl = profileImage ? resolveAttachmentUrl(profileImage, API_ORIGIN) : null;
  const embedUrl = demoClassUrl.trim() ? getYoutubePrivacyEmbedUrl(demoClassUrl.trim()) : null;
  const completeness = useMemo(() => profileCompleteness(profile), [profile]);

  const handleSave = useCallback(async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }

    const expTrimmed = experienceYears.trim();
    let parsedExp: number | null = null;
    if (expTrimmed) {
      const n = Number(expTrimmed);
      if (!Number.isFinite(n) || n < 0) {
        toast({ title: 'Invalid experience', description: 'Enter a non-negative number.', variant: 'destructive' });
        return;
      }
      parsedExp = Math.floor(n);
    }

    setSaving(true);
    try {
      const res = await updateMyTeacherProfile({
        fullName: trimmedName,
        email: email.trim() || null,
        designation: designation.trim() || null,
        institute: institute.trim() || null,
        experienceYears: parsedExp,
        demoClassUrl: demoClassUrl.trim() || null,
        showMobile,
      });
      if (res.success && res.data) {
        setProfile(res.data);
        setProfileImage(res.data.profileImage ?? null);
        syncLocalUser({
          fullName: res.data.fullName,
          profileImage: res.data.profileImage,
        });
        refresh();
        toast({ title: 'Profile updated', variant: 'success' });
      }
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [
    demoClassUrl,
    designation,
    email,
    experienceYears,
    fullName,
    institute,
    refresh,
    showMobile,
    toast,
  ]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadMyProfileImage(file);
      if (res.success && res.data?.profileImage) {
        setProfileImage(res.data.profileImage);
        setProfile((prev) => (prev ? { ...prev, profileImage: res.data!.profileImage } : prev));
        syncLocalUser({ profileImage: res.data.profileImage });
        refresh();
        toast({ title: 'Photo updated', variant: 'success' });
      }
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account and public instructor page.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href={`/teachers/${profile.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View public profile
          </Link>
        </Button>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile completeness</CardTitle>
          <CardDescription>
            Complete your public profile so students can learn more about you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{completeness}% complete</span>
            <span className="text-slate-400">
              Photo, name, designation, institute, experience, demo video
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Profile photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div
              className={cn(
                'flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white',
              )}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingImage}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Upload photo"
            >
              {uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-900">{profile.fullName}</p>
            <p className="mt-1 text-sm text-slate-500">Shown on your public teacher page</p>
            <p className="mt-2 text-xs text-slate-400">JPG or PNG, up to a few MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Login details and branch assignment (read-only fields).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
              Full name
            </Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Email (optional)
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Mobile (login)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={profile.mobile || ''}
                disabled
                className={cn(inputClass, 'pl-10 opacity-70')}
              />
            </div>
            <p className="text-xs text-slate-400">Contact admin to change your login mobile.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Branch</Label>
              <Input
                value={profile.branch?.name || '—'}
                disabled
                className={cn(inputClass, 'opacity-70')}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Status</Label>
              <Input
                value={profile.status}
                disabled
                className={cn(inputClass, 'opacity-70 capitalize')}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <StudentChangePasswordDialog />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Public instructor profile</CardTitle>
          <CardDescription>
            These details appear on your public page at{' '}
            <span className="font-mono text-xs">/teachers/{profile.id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Designation</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Lecturer, Professor…"
                  className={cn(inputClass, 'pl-10')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Experience (years)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 10"
                  className={cn(inputClass, 'pl-10')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Institute / department</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                placeholder="Department of ICT, Dhaka College…"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Demo class video URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={demoClassUrl}
                onChange={(e) => setDemoClassUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={cn(inputClass, 'pl-10')}
              />
            </div>
            <p className="text-xs text-slate-400">YouTube or direct video link</p>
          </div>

          {embedUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
              <div className="aspect-video w-full">
                <iframe
                  src={embedUrl}
                  title="Demo class preview"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Show phone publicly</p>
                <p className="text-xs text-slate-400">Visible on your public teacher profile</p>
              </div>
            </div>
            <Switch checked={showMobile} onCheckedChange={setShowMobile} />
          </div>

          {(designation || institute || experienceYears) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {designation && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <GraduationCap className="h-3 w-3" />
                  {designation}
                </span>
              )}
              {institute && (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <Building2 className="h-3 w-3" />
                  {institute}
                </span>
              )}
              {experienceYears && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Clock className="h-3 w-3" />
                  {experienceYears} yrs
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Assigned courses</CardTitle>
          <CardDescription>
            Courses you teach are assigned by admin. Contact admin to update assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.courses.length === 0 ? (
            <p className="text-sm text-slate-500">No courses assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {profile.courses.map((course) => (
                <li
                  key={course.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-800">{course.name}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button onClick={() => void handleSave()} disabled={saving} className="rounded-xl px-8">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save all changes
        </Button>
      </div>
    </div>
  );
}
