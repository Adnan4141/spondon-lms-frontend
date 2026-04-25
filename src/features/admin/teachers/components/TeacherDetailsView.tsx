'use client';

import { useState } from 'react';
import { type User as TeacherUser } from '@/lib/api/users';
import { API_ORIGIN } from '@/lib/api';
import { resolveAttachmentUrl } from '@/lib/attachment-url';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Ban,
  Calendar,
  Fingerprint,
  User as UserIcon,
  Briefcase,
  History,
  LayoutGrid,
  GraduationCap,
  Clock,
  Link2,
  Eye,
  EyeOff,
  Play,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getYoutubePrivacyEmbedUrl } from '@/lib/youtube-embed';

type TeacherDetailsViewProps = {
  teacher: TeacherUser;
};

export function TeacherDetailsView({ teacher }: TeacherDetailsViewProps) {
  const [activeTab, setActiveTab] = useState('profile');

  const initials = teacher.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const embedUrl = teacher.demoClassUrl ? getYoutubePrivacyEmbedUrl(teacher.demoClassUrl) : null;
  const isDirectVideo = teacher.demoClassUrl && !embedUrl;

  // ── Shared Header ────────────────────────────────────────────────────────────

  const ProfileHeader = (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-100 bg-linear-to-br from-indigo-50/50 via-white to-sky-50/30 p-6 shadow-sm">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative group shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-linear-to-br from-indigo-600 to-indigo-500 text-white font-black text-2xl shadow-xl shadow-indigo-100 overflow-hidden transition-transform group-hover:scale-105 group-hover:rotate-2">
            {teacher.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveAttachmentUrl(teacher.profileImage, API_ORIGIN)}
                alt={teacher.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className={cn(
            'absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-4 border-white flex items-center justify-center shadow-md',
            teacher.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
          )}>
            {teacher.status === 'ACTIVE'
              ? <ShieldCheck className="h-3.5 w-3.5 text-white" />
              : <Ban className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-xl font-black tracking-tight text-slate-900">{teacher.fullName}</h2>
            <Badge className={cn(
              'rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest border-0',
              teacher.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}>
              {teacher.status}
            </Badge>
          </div>

          {teacher.designation && (
            <p className="text-sm font-bold text-slate-600">
              {teacher.designation}{teacher.institute ? ` · ${teacher.institute}` : ''}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-400 sm:justify-start">
            <span className="flex items-center gap-1">
              <Fingerprint className="h-3.5 w-3.5" />
              {teacher.id.slice(-8).toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              Teacher
            </span>
            {teacher.experienceYears != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {teacher.experienceYears} yrs exp
              </span>
            )}
            {teacher.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined{' '}
                {new Date(teacher.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // ── Profile Tab ──────────────────────────────────────────────────────────────

  const ProfileTab = (
    <div className="space-y-6">
      {/* Contact + Branch */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</h3>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone</p>
                <p className="text-base font-black text-slate-900">{teacher.mobile}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
            </div>
            <div className="h-px bg-slate-50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                <p className="text-base font-black text-slate-900">{teacher.email || 'Not provided'}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Branch</h3>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Branch</p>
                <p className="text-base font-black text-slate-900">{teacher.branch?.name || 'Central Administration'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {teacher.branchId ? `ID: ${teacher.branchId.slice(-8).toUpperCase()}` : 'Global'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Teaching Profile */}
      {(teacher.designation || teacher.institute || teacher.experienceYears != null) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Teaching Profile</h3>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            {teacher.designation && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Designation</p>
                  <p className="text-base font-black text-slate-900">{teacher.designation}</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </div>
            )}
            {teacher.designation && teacher.institute && <div className="h-px bg-slate-50" />}
            {teacher.institute && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institute / Department</p>
                  <p className="text-base font-black text-slate-900">{teacher.institute}</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
            )}
            {teacher.institute && teacher.experienceYears != null && <div className="h-px bg-slate-50" />}
            {teacher.experienceYears != null && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience</p>
                  <p className="text-base font-black text-slate-900">{teacher.experienceYears} Years</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
            )}
            <div className="h-px bg-slate-50" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone Visibility</p>
                <p className="text-sm font-black text-slate-900">
                  {teacher.showMobile ? 'Visible to public' : 'Hidden from public'}
                </p>
              </div>
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center',
                teacher.showMobile ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400')}>
                {teacher.showMobile ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick stats */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Role Access', value: 'Teacher',   icon: Briefcase,   color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Courses',     value: 'Active',    icon: LayoutGrid,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Activity',    value: 'Live Feed', icon: History,     color: 'text-amber-600',  bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:shadow-md transition-all">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm', s.bg, s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{s.label}</p>
              <p className="text-sm font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Security */}
      <section className="space-y-3 pb-2">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security</h3>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Role: Teacher</p>
              <p className="text-xs font-bold text-slate-400">Branch rules apply.</p>
            </div>
          </div>
          <Badge variant="outline" className="rounded-lg font-black text-[9px] uppercase tracking-widest text-slate-400 border-slate-200">
            Verified
          </Badge>
        </div>
      </section>
    </div>
  );

  // ── Demo Class Tab ────────────────────────────────────────────────────────────

  const DemoClassTab = (
    <div className="space-y-5">
      {teacher.demoClassUrl ? (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 shrink-0">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Video URL</p>
              <a
                href={teacher.demoClassUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-indigo-600 hover:underline truncate block"
              >
                {teacher.demoClassUrl}
              </a>
            </div>
          </div>

          {embedUrl ? (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-black"
              style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
              <iframe
                src={embedUrl}
                title="Demo Class"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <div
                className="absolute bottom-0 right-0 z-10 h-16 w-32 cursor-default bg-transparent"
                aria-hidden
              />
            </div>
          ) : isDirectVideo ? (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-black"
              style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
              <video
                src={teacher.demoClassUrl!}
                controls
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-300">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
            <Play className="h-8 w-8 text-slate-200" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-400">Demo class not added yet</p>
            <p className="text-xs text-slate-300 mt-1">Edit the teacher profile to add a demo video URL.</p>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex max-h-[85vh] flex-col overflow-hidden bg-white text-slate-900">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
        <div className="space-y-5">
          {ProfileHeader}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-xl bg-slate-100/70 p-1 h-auto gap-1">
              <TabsTrigger
                value="profile"
                className={cn(
                  'flex-1 rounded-lg text-xs font-black uppercase tracking-widest py-2.5 transition-all',
                  'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600',
                  'data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-600'
                )}
              >
                <UserIcon className="h-3.5 w-3.5 mr-1.5 inline" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="demo"
                className={cn(
                  'flex-1 rounded-lg text-xs font-black uppercase tracking-widest py-2.5 transition-all',
                  'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-rose-600',
                  'data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-600'
                )}
              >
                <Video className="h-3.5 w-3.5 mr-1.5 inline" />
                Demo Class
                {teacher.demoClassUrl && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-100 text-rose-600 text-[9px] font-black">1</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-5 outline-none">
              {ProfileTab}
            </TabsContent>

            <TabsContent value="demo" className="mt-5 outline-none">
              {DemoClassTab}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
