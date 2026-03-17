'use client';

import { BookOpen, ClipboardList, FileQuestion, Users, Sparkles, ArrowRight, GraduationCap, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TeacherDashboardPage() {
  const tools = [
    {
      title: "My Lessons",
      desc: "Manage what you teach",
      href: "/teacher/courses",
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-200"
    },
    {
      title: "Tests",
      desc: "Check student progress",
      href: "/teacher/exams",
      icon: ClipboardList,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "hover:border-indigo-200"
    },
    {
      title: "Question List",
      desc: "Prepare for your tests",
      href: "/teacher/questions",
      icon: FileQuestion,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "hover:border-amber-200"
    },
    {
      title: "Help Students",
      desc: "Answer student questions",
      href: "/teacher/doubts",
      icon: MessageCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "hover:border-rose-200"
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold w-fit border border-indigo-100/50">
          <Sparkles className="h-4 w-4" />
          Welcome Back
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
          Teacher Hub
        </h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl leading-relaxed">
          Everything you need to manage your lessons, create tests, and help your students succeed.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href} className="group">
            <Card className={cn(
              "h-full rounded-[2rem] border border-slate-200 p-8 transition-all duration-300",
              "hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
              tool.border
            )}>
              <CardContent className="p-0 flex flex-col h-full">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300",
                  tool.bg
                )}>
                  <tool.icon className={cn("h-7 w-7", tool.color)} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-500 font-medium text-sm mb-6 flex-grow">
                  {tool.desc}
                </p>

                <div className="flex items-center text-slate-400 group-hover:text-indigo-600 font-bold text-sm transition-all">
                  Open Tool
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:ml-3 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats or Tips Area */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative shadow-xl shadow-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-indigo-400" />
              Teacher Tip
            </h2>
            <p className="text-slate-300 text-lg max-w-xl font-medium">
              Update your lesson content regularly to keep students engaged and excited about learning!
            </p>
          </div>
          <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all w-fit shadow-lg shadow-black/20">
            View My Students
          </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />
      </div>
    </div>
  );
}
