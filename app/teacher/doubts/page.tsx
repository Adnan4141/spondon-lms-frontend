'use client';

import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function TeacherDoubtsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Student Doubts</h1>
      <Card className="rounded-2xl p-12 text-center">
        <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="font-bold text-slate-500">Answer student doubts</p>
      </Card>
    </div>
  );
}
