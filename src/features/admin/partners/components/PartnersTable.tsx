'use client';

import { format } from 'date-fns';
import {
  BarChart3,
  Building2,
  ExternalLink,
  Globe2,
  Link2,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import type { PartnerAdmin } from '@/lib/api/partners';
import { API_ORIGIN } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCollaborationSummary, safeHostname } from '../partners-page-utils';

type PartnersTableProps = {
  loading: boolean;
  partners: PartnerAdmin[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  togglingId: string | null;
  onRowClick: (partner: PartnerAdmin) => void;
  onToggleActive: (partner: PartnerAdmin, next: boolean) => void;
  onEdit: (partner: PartnerAdmin) => void;
  onDelete: (id: string) => void;
  onRevenue: (partner: PartnerAdmin) => void;
};

export function PartnersTable({
  loading,
  partners,
  searchQuery,
  onSearchChange,
  togglingId,
  onRowClick,
  onToggleActive,
  onEdit,
  onDelete,
  onRevenue,
}: PartnersTableProps) {
  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-50 p-6">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name or category…"
            className="h-12 w-full rounded-2xl border-none bg-slate-50 pl-11 text-sm font-bold outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="px-8 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">
              Partner
            </TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">
              Category
            </TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">
              Website
            </TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">
              Collaborations
            </TableHead>
            <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-slate-400">
              On homepage
            </TableHead>
            <TableHead className="px-8 py-4 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => (
            <TableRow
              key={partner.id}
              role="button"
              tabIndex={0}
              className="group cursor-pointer border-slate-50 transition-colors hover:bg-slate-50/50"
              onClick={() => onRowClick(partner)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(partner);
                }
              }}
            >
              <TableCell className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition-transform group-hover:scale-105">
                    {partner.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${API_ORIGIN}${partner.logo}`}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                      {partner.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Order {partner.sortOrder} · {format(new Date(partner.createdAt), 'MMM yyyy')}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-5">
                <Badge
                  variant="outline"
                  className="rounded-lg border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter text-indigo-700 shadow-none"
                >
                  {partner.type || 'Partner'}
                </Badge>
              </TableCell>
              <TableCell className="py-5" onClick={(e) => e.stopPropagation()}>
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition-all hover:text-indigo-700 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {safeHostname(partner.websiteUrl)}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                ) : (
                  <span className="text-xs font-bold text-slate-300">—</span>
                )}
              </TableCell>
              <TableCell className="py-5">
                <span className="text-xs font-bold text-slate-600">
                  {formatCollaborationSummary(partner)}
                </span>
              </TableCell>
              <TableCell className="py-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={partner.isActive}
                    disabled={togglingId === partner.id}
                    onCheckedChange={(checked) => onToggleActive(partner, checked)}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {partner.isActive ? 'Live' : 'Off'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                    onClick={() => onRevenue(partner)}
                  >
                    <BarChart3 className="mr-1 h-3.5 w-3.5" /> Revenue
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm transition-all hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
                    onClick={() => onEdit(partner)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                    onClick={() => onDelete(partner.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!loading && partners.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-20 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-200">
                  <Globe2 className="h-10 w-10" />
                </div>
                <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-300">
                  No partners match your search.
                </p>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
