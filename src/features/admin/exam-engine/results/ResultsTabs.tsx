'use client';

import { BarChart3, ClipboardCheck, FileSpreadsheet, Medal, ScanLine } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ResultsTabKey } from './types';

type ResultsTabsProps = {
  activeTab: ResultsTabKey;
  onTabChange: (tab: ResultsTabKey) => void;
  availability: Record<ResultsTabKey, boolean>;
  children: React.ReactNode;
};

const tabs: Array<{ key: ResultsTabKey; label: string; icon: React.ElementType }> = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'omr', label: 'OMR scans', icon: ScanLine },
  { key: 'offline', label: 'Offline results', icon: FileSpreadsheet },
  { key: 'evaluation', label: 'Evaluation', icon: ClipboardCheck },
  { key: 'merit', label: 'Merit list', icon: Medal },
];

export function ResultsTabs({ activeTab, onTabChange, availability, children }: ResultsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as ResultsTabKey)} className="space-y-5">
      <div className="overflow-x-auto print:hidden">
        <TabsList className="h-auto w-full min-w-max justify-start gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const enabled = availability[tab.key];
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={cn(
                  'gap-2 rounded-md px-3 py-2 text-sm data-[state=active]:bg-slate-950 data-[state=active]:text-white',
                  !enabled && 'text-slate-400',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}

export { TabsContent };
