'use client';

import type { ReactNode } from 'react';

type ExamWorkspacePageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Tab page title — exam name lives in the workspace shell header only. */
export function ExamWorkspacePageHeader({ title, description, actions }: ExamWorkspacePageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="font-serif text-2xl font-normal tracking-tight text-[#0D1B35] md:text-3xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
