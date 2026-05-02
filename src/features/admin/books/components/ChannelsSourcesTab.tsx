'use client';

import { useState } from 'react';
import {
  createDistributionChannel,
  createStockSource,
  updateDistributionChannelStatus,
  updateStockSourceStatus,
  type DistributionChannel,
  type DistributionChannelType,
  type StockSource,
  type StockSourceType,
} from '@/lib/api/books';
import { useAdminToast } from '@/features/admin/shared/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ChannelsSourcesTab({ channels, sources, onRefresh }: { channels: DistributionChannel[]; sources: StockSource[]; onRefresh: () => Promise<void> }) {
  const toast = useAdminToast();
  const [channelForm, setChannelForm] = useState({ name: '', type: 'OTHER' as DistributionChannelType, contactPerson: '', phone: '' });
  const [sourceForm, setSourceForm] = useState({ name: '', type: 'PRESS' as StockSourceType, contactPerson: '', phone: '' });

  const createChannel = async () => {
    try {
      await createDistributionChannel(channelForm);
      setChannelForm({ name: '', type: 'OTHER', contactPerson: '', phone: '' });
      await onRefresh();
      toast({ title: 'Channel created', variant: 'success' });
    } catch (error) {
      toast({ title: 'Channel failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  const createSource = async () => {
    try {
      await createStockSource(sourceForm);
      setSourceForm({ name: '', type: 'PRESS', contactPerson: '', phone: '' });
      await onRefresh();
      toast({ title: 'Source created', variant: 'success' });
    } catch (error) {
      toast({ title: 'Source failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    }
  };

  return (
    <Tabs defaultValue="channels" className="space-y-6">
      <TabsList className="rounded-2xl">
        <TabsTrigger value="channels">Distribution Channels</TabsTrigger>
        <TabsTrigger value="sources">Stock Sources</TabsTrigger>
      </TabsList>

      <TabsContent value="channels" className="space-y-6">
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <Input value={channelForm.name} onChange={(e) => setChannelForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Channel name" />
            <Input value={channelForm.type} onChange={(e) => setChannelForm((prev) => ({ ...prev, type: e.target.value as DistributionChannelType }))} placeholder="Type" />
            <Input value={channelForm.contactPerson} onChange={(e) => setChannelForm((prev) => ({ ...prev, contactPerson: e.target.value }))} placeholder="Contact person" />
            <Input value={channelForm.phone} onChange={(e) => setChannelForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
            <Button onClick={createChannel}>Add Channel</Button>
          </div>
        </section>
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-semibold">{channel.name}</TableCell>
                  <TableCell>{channel.type}</TableCell>
                  <TableCell>{channel.contactPerson || '—'}</TableCell>
                  <TableCell>{channel.phone || '—'}</TableCell>
                  <TableCell className="text-right"><Switch checked={channel.isActive} onCheckedChange={async (checked) => { await updateDistributionChannelStatus(channel.id, checked); await onRefresh(); }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </TabsContent>

      <TabsContent value="sources" className="space-y-6">
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 rounded-2xl border border-blue-500/15 bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-400">
            Every incoming stock movement should point to a source. This keeps receive history auditable by press, vendor, branch return, or internal unit.
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <Input value={sourceForm.name} onChange={(e) => setSourceForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Source name" />
            <Input value={sourceForm.type} onChange={(e) => setSourceForm((prev) => ({ ...prev, type: e.target.value as StockSourceType }))} placeholder="Type" />
            <Input value={sourceForm.contactPerson} onChange={(e) => setSourceForm((prev) => ({ ...prev, contactPerson: e.target.value }))} placeholder="Contact person" />
            <Input value={sourceForm.phone} onChange={(e) => setSourceForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
            <Button onClick={createSource}>Add Source</Button>
          </div>
        </section>
        <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-semibold">{source.name}</TableCell>
                  <TableCell>{source.type}</TableCell>
                  <TableCell>{source.contactPerson || '—'}</TableCell>
                  <TableCell>{source.phone || '—'}</TableCell>
                  <TableCell className="text-right"><Switch checked={source.isActive} onCheckedChange={async (checked) => { await updateStockSourceStatus(source.id, checked); await onRefresh(); }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </TabsContent>
    </Tabs>
  );
}