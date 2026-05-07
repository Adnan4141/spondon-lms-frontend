import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { BookFormTabMeta } from './book-form-dialog-types';

const stepTones = [
  {
    trigger:
      'group-data-[variant=line]/tabs-list:data-[state=active]:border-sky-300  group-data-[variant=line]/tabs-list:data-[state=active]:bg-sky-50 group-data-[variant=line]/tabs-list:data-[state=active]:text-slate-950 dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-sky-700 dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-sky-950/35 dark:group-data-[variant=line]/tabs-list:data-[state=active]:text-white',
    icon: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-900',
    bar: 'bg-sky-500',
  },
  {
    trigger:
      'group-data-[variant=line]/tabs-list:data-[state=active]:border-emerald-300 group-data-[variant=line]/tabs-list:data-[state=active]:bg-emerald-50 group-data-[variant=line]/tabs-list:data-[state=active]:text-slate-950 dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-emerald-700 dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-emerald-950/35 dark:group-data-[variant=line]/tabs-list:data-[state=active]:text-white',
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900',
    bar: 'bg-emerald-500',
  },
  {
    trigger:
      'group-data-[variant=line]/tabs-list:data-[state=active]:border-violet-300 group-data-[variant=line]/tabs-list:data-[state=active]:bg-violet-50 group-data-[variant=line]/tabs-list:data-[state=active]:text-slate-950 dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-violet-700 dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-violet-950/35 dark:group-data-[variant=line]/tabs-list:data-[state=active]:text-white',
    icon: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-900',
    bar: 'bg-violet-500',
  },
  {
    trigger:
      'group-data-[variant=line]/tabs-list:data-[state=active]:border-rose-300 group-data-[variant=line]/tabs-list:data-[state=active]:bg-rose-50 group-data-[variant=line]/tabs-list:data-[state=active]:text-slate-950 dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-rose-700 dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-rose-950/35 dark:group-data-[variant=line]/tabs-list:data-[state=active]:text-white',
    icon: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-900',
    bar: 'bg-rose-500',
  },
] as const;

export function BookFormStepNavigation({ tabs }: { tabs: BookFormTabMeta[] }) {
  return (
    <aside className="shrink-0 overflow-x-auto overscroll-contain border-b border-border/70 bg-linear-to-r from-white via-sky-50/50 to-rose-50/40 px-3 py-3 [scrollbar-color:rgb(203_213_225)_transparent] [scrollbar-width:thin] dark:from-slate-950 dark:via-sky-950/10 dark:to-rose-950/10 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:border-b-0 lg:border-r lg:bg-linear-to-b lg:from-white lg:to-sky-50/50 lg:px-4 lg:py-5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 dark:lg:from-slate-950 dark:lg:to-sky-950/10">
      <TabsList
        variant="line"
        className="!h-auto !items-stretch flex w-max min-w-full gap-2 bg-transparent p-0 lg:grid lg:w-full lg:grid-cols-1 lg:auto-rows-max lg:content-start"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const tone = stepTones[index % stepTones.length];

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                '!h-auto min-h-[88px] w-[220px] min-w-[220px] !flex-none items-stretch justify-start whitespace-normal rounded-xl border border-border/70 bg-white px-3 py-3 text-left text-slate-800 shadow-sm transition-all dark:bg-slate-950 dark:text-slate-100 lg:w-full lg:min-w-0',
                'group-data-[variant=line]/tabs-list:bg-white dark:group-data-[variant=line]/tabs-list:bg-slate-950',
                'hover:bg-muted/40',
                'data-[state=active]:shadow-md data-[state=active]:after:opacity-0 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-0',
                tone.trigger,
              )}
            >
              <div className="flex h-full w-full min-w-0 gap-3">
                <div className={cn('w-1 shrink-0 rounded-full', tone.bar)} />
                <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', tone.icon)}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between overflow-hidden">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[11px] font-black tabular-nums text-slate-400 dark:text-slate-500">0{index + 1}</span>
                      <span className="truncate text-sm font-black text-slate-950 dark:text-white">{tab.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500 dark:text-slate-400 lg:line-clamp-2">
                      {tab.summary}
                    </p>
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tab.complete ? 'bg-emerald-500' : 'bg-amber-500')} />
                    <span
                      className={cn(
                        'truncate text-white text-[11px] font-bold',
                        tab.complete ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300',
                      )}
                    >
                      {tab.complete ? 'Ready' : tab.badgeText}
                    </span>
                  </div>
                </div>
              </div>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </aside>
  );
}
