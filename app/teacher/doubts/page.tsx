'use client';

import { HelpCircle } from 'lucide-react';

export default function TeacherDoubtsPage() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Help Students</h1>
        <p className="text-slate-500 text-lg font-medium">Answer questions from your students.</p>
      </div>

      <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
          <HelpCircle className="h-12 w-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No active questions!</h2>
        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
          Your students don't have any doubts right now. Check back later to see if they need help.
        </p>
      </div>
    </div>
  );
}
