'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Columns, AlignJustify, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateSetPdf, regenerateExamPdf, getExamPdfDownloadUrl } from '@/lib/api/exams';

interface OfflineExamSheetProps {
  exam: any;
  set: any;
  onClose: () => void;
}

type Lang = 'bn' | 'en';

function toBn(n: number) {
  return String(n).replace(/\d/g, (d) => ['০','১','২','৩','৪','৫','৬','৭','৮','৯'][parseInt(d)]);
}

function formatNum(n: number, lang: Lang): string {
  return lang === 'bn' ? toBn(n) : String(n);
}

function isBanglaText(v?: string | null) {
  if (!v) return false;
  return /[\u0980-\u09FF]/.test(v);
}

function detectQuestionLang(question: any, fallback: Lang = 'bn'): Lang {
  const prompt = String(question?.prompt ?? '');
  const optionText = (question?.options ?? [])
    .map((o: any) => String(o?.text ?? ''))
    .join(' ');
  const combined = `${prompt} ${optionText}`;
  return isBanglaText(combined) ? 'bn' : 'en';
}

const bnOptionLetters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];
const bnOptionInv: Record<string, number> = Object.fromEntries(
  bnOptionLetters.map((l, i) => [l, i]),
);

function getOptionUiLetter(label: string | undefined, idx: number, lang: Lang): string {
  const raw = String(label ?? '').trim();
  const upper = raw.toUpperCase();
  const isAlpha = upper.length === 1 && upper >= 'A' && upper <= 'Z';
  const alphaIndex = isAlpha ? upper.charCodeAt(0) - 65 : -1;

  if (lang === 'bn') {
    // If stored as A/B/C... convert to Bengali letters when we can.
    if (alphaIndex >= 0 && alphaIndex < bnOptionLetters.length) return bnOptionLetters[alphaIndex];
    // If already Bengali, keep it.
    if (isBanglaText(raw)) return raw;
    // Fallback to positional Bengali letters.
    return bnOptionLetters[idx] ?? raw ?? String(idx + 1);
  }

  // lang === 'en'
  const bnIdx = bnOptionInv[raw];
  if (bnIdx !== undefined) return String.fromCharCode(65 + bnIdx);
  if (isAlpha) return upper;
  // Fallback to positional English letters.
  return String.fromCharCode(65 + idx) ?? raw ?? String(idx + 1);
}

const bnCQLetters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];
function getPartLabel(idx: number, lang: Lang): string {
  if (lang === 'en') return String.fromCharCode(65 + idx);
  return bnCQLetters[idx] ?? String(idx + 1);
}

export function OfflineExamSheet({ exam, set, onClose }: OfflineExamSheetProps) {
  const [isTwoColumn, setIsTwoColumn] = useState(true);
  const [downloadingSet, setDownloadingSet] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const sheetLang: Lang = exam?.language === 'en' ? 'en' : 'bn';

  const ui = sheetLang === 'en'
    ? {
        previewTitle: `Question Paper Preview — Set ${set?.name ?? ''}`,
        previewMeta: (qCount: number, totalMarks: number) => `(${qCount} questions, ${totalMarks} marks)`,
        col1: '1 column',
        col2: '2 columns',
        downloading: 'Generating...',
        downloadSet: (setName: string) => `Download Set ${setName}`,
        downloadAll: 'Download all sets',
        headerAcademy: 'Spondon Academy',
        subject: 'Subject',
        branch: 'Branch',
        batch: 'Batch',
        duration: 'Time',
        fullMarks: 'Full marks',
        studentName: 'Name',
        studentRoll: 'Roll No',
        passageInstruction: 'Read the passage and answer',
      }
    : {
        previewTitle: `প্রশ্নপত্র প্রিভিউ — সেট ${set?.name ?? ''}`,
        previewMeta: (qCount: number, totalMarks: number) => `(${qCount} প্রশ্ন, ${totalMarks} নম্বর)`,
        col1: '১ কলাম',
        col2: '২ কলাম',
        downloading: 'তৈরি হচ্ছে...',
        downloadSet: (setName: string) => `সেট ${setName} ডাউনলোড`,
        downloadAll: 'সব সেট ডাউনলোড',
        headerAcademy: 'স্পন্দন একাডেমি',
        subject: 'বিষয়',
        branch: 'শাখা',
        batch: 'ব্যাচ',
        duration: 'সময়',
        fullMarks: 'পূর্ণমান',
        studentName: 'নাম',
        studentRoll: 'রোল নং',
        passageInstruction: 'উদ্দীপকটি পড়ে',
      };

  const handleDownloadSetPdf = async () => {
    try {
      setDownloadingSet(true);
      const columns = isTwoColumn ? 2 : 1;
      const res = await generateSetPdf(exam.id, set.id, columns as 1 | 2);
      if (res.success && res.data?.pdfUrl) {
        window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
      }
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setDownloadingSet(false);
    }
  };

  const handleDownloadAllPdf = async () => {
    try {
      setDownloadingAll(true);
      const columns = isTwoColumn ? 2 : 1;
      const res = await regenerateExamPdf(exam.id, columns as 1 | 2);
      if (res.success && res.data?.pdfUrl) {
        window.open(getExamPdfDownloadUrl(res.data.pdfUrl), '_blank');
      }
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setDownloadingAll(false);
    }
  };

  let questionNumber = 0;
  const questions = set.questions || [];
  const totalMarks = questions.reduce((sum: number, q: any) => sum + Number(q.marks), 0);
  const totalSets = exam.sets?.length || 1;

  return (
    <div className="flex min-h-0 max-h-[min(85vh,calc(92vh-6rem))] flex-1 flex-col bg-white text-slate-900">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-700">
            {ui.previewTitle}
          </h3>
          <span className="text-xs text-slate-400">{ui.previewMeta(questions.length, totalMarks)}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              className={cn("px-3 py-1.5 text-xs font-semibold transition-colors", !isTwoColumn ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-100")}
              onClick={() => setIsTwoColumn(false)}
            >
              <AlignJustify className="h-3.5 w-3.5 inline mr-1" />{ui.col1}
            </button>
            <button
              className={cn("px-3 py-1.5 text-xs font-semibold transition-colors", isTwoColumn ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-100")}
              onClick={() => setIsTwoColumn(true)}
            >
              <Columns className="h-3.5 w-3.5 inline mr-1" />{ui.col2}
            </button>
          </div>

          {/* Download this set */}
          <Button
            size="sm"
            onClick={handleDownloadSetPdf}
            disabled={downloadingSet}
            className="bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold h-8"
          >
            {downloadingSet ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
            {downloadingSet ? ui.downloading : ui.downloadSet(set.name)}
          </Button>

          {/* Download all sets */}
          {totalSets > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadAllPdf}
              disabled={downloadingAll}
              className="text-xs font-bold h-8"
            >
              {downloadingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              {downloadingAll ? ui.downloading : ui.downloadAll}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Preview Canvas ─── */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 no-scrollbar">
        <div className="w-full max-w-[850px] mx-auto bg-white shadow-lg border border-slate-200 px-10 py-8">

          {/* ─── Header ─── */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <h1 className="text-xl font-black text-slate-900">{ui.headerAcademy}</h1>
            <p className="text-base font-bold text-slate-800 mt-0.5">{exam.title}</p>
            <div className="flex items-center justify-center gap-4 mt-1 text-xs text-slate-600">
              {exam.course?.name && <span>{ui.subject}: {exam.course.name}</span>}
              {exam.branch?.name && <span>{ui.branch}: {exam.branch.name}</span>}
              {exam.batch?.name && <span>{ui.batch}: {exam.batch.name}</span>}
            </div>
            <div className="flex items-center justify-center gap-6 mt-1 text-xs font-semibold text-slate-700">
              {exam.durationMinutes && (
                <span>
                  {ui.duration}: {exam.durationMinutes} {sheetLang === 'en' ? 'minutes' : 'মিনিট'}
                </span>
              )}
              <span>{ui.fullMarks}: {totalMarks}</span>
              <span>{sheetLang === 'en' ? 'Set' : 'সেট'}: {set.name}</span>
            </div>
          </div>

          {/* ─── Student Info ─── */}
          <div className="flex gap-8 text-xs text-slate-600 mb-5 pb-3 border-b border-dashed border-slate-300">
            <span>
              {ui.studentName}: ______________________________________
            </span>
            <span>
              {ui.studentRoll}: _______________
            </span>
          </div>

          {/* ─── Questions ─── */}
          <div className={cn(
            "gap-x-8",
            isTwoColumn ? "columns-2 [column-rule:1px_solid_#e2e8f0]" : "columns-1"
          )}>
            {(() => {
              const rendered: React.ReactNode[] = [];
              const seenPassageIds = new Set<string>();

              for (let i = 0; i < questions.length; i++) {
                const eq = questions[i];
                const q = eq.question;
                const passageId = q?.passageId;

                if (passageId && !seenPassageIds.has(passageId)) {
                  seenPassageIds.add(passageId);
                  const passageContent = q?.passage?.content;
                  const children = questions.filter((c: any) => c.question?.passageId === passageId);

                  const firstNum = questionNumber + 1;
                  const lastNum = firstNum + children.length - 1;
                  const instructionLang: Lang = detectQuestionLang(children[0]?.question, sheetLang);
                  let instruction: string;
                  if (children.length === 1) {
                    instruction =
                      instructionLang === 'en'
                        ? `${ui.passageInstruction} question ${formatNum(firstNum, instructionLang)}.`
                        : `${ui.passageInstruction} ${formatNum(firstNum, instructionLang)} নং প্রশ্নের উত্তর দাও:`;
                  } else if (children.length === 2) {
                    instruction =
                      instructionLang === 'en'
                        ? `${ui.passageInstruction} questions ${formatNum(firstNum, instructionLang)} and ${formatNum(lastNum, instructionLang)}.`
                        : `${ui.passageInstruction} ${formatNum(firstNum, instructionLang)} ও ${formatNum(lastNum, instructionLang)} নং প্রশ্নের উত্তর দাও:`;
                  } else {
                    const nums = children.map((_: any, idx: number) => formatNum(firstNum + idx, instructionLang));
                    const last = nums.pop();
                    instruction =
                      instructionLang === 'en'
                        ? `${ui.passageInstruction} questions ${nums.join(', ')} and ${last}.`
                        : `${ui.passageInstruction} ${nums.join(', ')} ও ${last} নং প্রশ্নের উত্তর দাও:`;
                  }

                  rendered.push(
                    <div key={`passage-${passageId}`} className="mb-3 break-inside-avoid">
                      <p className="text-[12px] font-bold text-slate-900 mb-1 pl-5">{instruction}</p>
                      {passageContent && (
                        <div className="text-[12px] leading-relaxed text-slate-700 mb-2 pl-5" dangerouslySetInnerHTML={{ __html: passageContent }} />
                      )}
                      {children.map((child: any) => {
                        questionNumber++;
                        return renderQuestion(child, questionNumber, isTwoColumn, sheetLang);
                      })}
                    </div>
                  );
                } else if (!passageId) {
                  questionNumber++;
                  rendered.push(renderQuestion(eq, questionNumber, isTwoColumn, sheetLang));
                }
              }
              return rendered;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderQuestion(eq: any, num: number, isTwoColumn: boolean, sheetLang: Lang) {
  const q = eq.question;
  if (!q) return null;

  const questionLang: Lang = detectQuestionLang(q, sheetLang);

  const validOpts = (q.options || []).filter((o: any) => o.text && o.text.replace(/<[^>]*>/g, '').trim());

  return (
    <div key={eq.id} className="mb-3 break-inside-avoid">
      <div className="flex items-start gap-1.5">
        <span className="text-[12px] font-bold text-slate-900 min-w-[20px] shrink-0">{num}.</span>
        <div className="flex-1">
          <div className="flex justify-between items-start gap-2">
            <div className="text-[12px] font-semibold text-slate-900 leading-snug" dangerouslySetInnerHTML={{ __html: q.prompt || '' }} />
            <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap shrink-0">[{eq.marks}]</span>
          </div>
          {q.type === 'MCQ' && validOpts.length > 0 && (
            <div className={cn(
              "mt-0.5",
              isTwoColumn ? "space-y-0" : "grid grid-cols-2 gap-x-4"
            )}>
              {validOpts.map((opt: any, idx: number) => (
                <div key={opt.id || idx} className="flex items-center gap-1 text-[11px] text-slate-700 leading-snug">
                  <span className="font-bold text-slate-400 w-3.5">
                    ({getOptionUiLetter(opt.label, idx, questionLang)})
                  </span>
                  <span>{opt.text?.replace(/<[^>]*>/g, '').trim()}</span>
                </div>
              ))}
            </div>
          )}
          {q.type === 'CQ' && (() => {
            let meta: any = null;
            try { meta = typeof q.meta === 'string' ? JSON.parse(q.meta) : q.meta; } catch (_) {}
            if (!meta?.parts || !Array.isArray(meta.parts)) return null;
            return (
              <div className="mt-1 space-y-0.5">
                {meta.parts.map((part: any, idx: number) => {
                  const lbl = getPartLabel(idx, questionLang);
                  const txt = (part.text || part.prompt || '').replace(/<[^>]*>/g, '').trim();
                  const marks = part.marks ? ` [${part.marks}]` : '';
                  return (
                    <p key={idx} className="text-[11px] text-slate-700 pl-3">
                      ({lbl}) {txt}{marks}
                    </p>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
