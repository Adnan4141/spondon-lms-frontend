'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@/lib/tiptap-placeholder';
import { MathExtension } from '@/lib/tiptap-math';
import 'katex/dist/katex.min.css';
import katex from 'katex';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code2,
  Braces,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Image as ImageIcon,
  Sigma,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/* ── LaTeX quick-insert suggestions ── */
const LATEX_SUGGESTIONS = [
  { label: 'Fraction', latex: '\\frac{a}{b}', hint: '\\frac{a}{b}' },
  { label: 'Square root', latex: '\\sqrt{x}', hint: '\\sqrt{x}' },
  { label: 'Power', latex: 'x^{n}', hint: 'x^{n}' },
  { label: 'Subscript', latex: 'x_{i}', hint: 'x_{i}' },
  { label: 'Summation', latex: '\\sum_{i=1}^{n} x_i', hint: '\\sum' },
  { label: 'Integral', latex: '\\int_{a}^{b} f(x)\\,dx', hint: '\\int' },
  { label: 'Limit', latex: '\\lim_{x \\to \\infty}', hint: '\\lim' },
  { label: 'Pi', latex: '\\pi', hint: 'π' },
  { label: 'Theta', latex: '\\theta', hint: 'θ' },
  { label: 'Alpha', latex: '\\alpha', hint: 'α' },
  { label: 'Beta', latex: '\\beta', hint: 'β' },
  { label: 'Delta', latex: '\\Delta', hint: 'Δ' },
  { label: 'Infinity', latex: '\\infty', hint: '∞' },
  { label: 'Not equal', latex: '\\neq', hint: '≠' },
  { label: 'Less or equal', latex: '\\leq', hint: '≤' },
  { label: 'Greater or equal', latex: '\\geq', hint: '≥' },
  { label: 'Plus-minus', latex: '\\pm', hint: '±' },
  { label: 'Times', latex: '\\times', hint: '×' },
  { label: 'Divide', latex: '\\div', hint: '÷' },
  { label: 'Arrow right', latex: '\\rightarrow', hint: '→' },
  { label: 'Pythagorean', latex: 'a^2 + b^2 = c^2', hint: 'a²+b²=c²' },
  { label: 'Quadratic', latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', hint: 'Quadratic formula' },
  { label: 'Matrix 2×2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', hint: 'Matrix' },
];

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
};

function ToolButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={active ? 'default' : 'ghost'}
          onClick={onClick}
          className="h-8 w-8 rounded-md transition hover:scale-105"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  );
}

function renderLatexPreview(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false });
  } catch {
    return `<span class="text-destructive text-xs">${tex}</span>`;
  }
}

export function RichTextEditor({
  value,
  onChange,
  onImageUpload,
  placeholder,
  className,
}: RichTextEditorProps) {
  const [mathInput, setMathInput] = useState('');
  const [showMath, setShowMath] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: true }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md h-auto my-2',
          style: 'max-width:100%;height:auto;',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      MathExtension,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
        showOnlyWhenEditable: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onImageUpload || !editor) return;
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;

      setIsUploading(true);
      try {
        for (const file of files) {
          const url = await onImageUpload(file);
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }
      } finally {
        setIsUploading(false);
      }
    },
    [editor, onImageUpload]
  );

  const insertMath = (latex: string) => {
    if (!editor || !latex.trim()) return;
    (editor.commands as Record<string, (...args: unknown[]) => boolean>).insertMath(latex.trim());
    setMathInput('');
    setShowMath(false);
  };

  if (!editor) return null;

  return (
    <div className={cn('rounded-md border overflow-hidden', className)}>
      {/* ── Sticky Toolbar ── */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1.5 border-b bg-muted/40 px-2 py-1.5">
        {/* Text formatting */}
        <div className="flex gap-0.5">
          <ToolButton title="Bold (Ctrl+B)" active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolButton>
          <ToolButton title="Italic (Ctrl+I)" active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolButton>
          <ToolButton title="Underline (Ctrl+U)" active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={16} />
          </ToolButton>
          <ToolButton title="Strikethrough" active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={16} />
          </ToolButton>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Headings */}
        <div className="flex gap-0.5">
          <ToolButton title="Heading 2" active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={16} />
          </ToolButton>
          <ToolButton title="Heading 3" active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={16} />
          </ToolButton>
          <ToolButton title="Heading 4" active={editor.isActive('heading', { level: 4 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
            <Heading4 size={16} />
          </ToolButton>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Lists & blocks */}
        <div className="flex gap-0.5">
          <ToolButton title="Bullet list" active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolButton>
          <ToolButton title="Ordered list" active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolButton>
          <ToolButton title="Blockquote" active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={16} />
          </ToolButton>
          <ToolButton title="Inline code" active={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code2 size={16} />
          </ToolButton>
          <ToolButton title="Code block" active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Braces size={16} />
          </ToolButton>
          <ToolButton title="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={16} />
          </ToolButton>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Alignment */}
        <div className="flex gap-0.5">
          <ToolButton title="Align left" active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft size={16} />
          </ToolButton>
          <ToolButton title="Align center" active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter size={16} />
          </ToolButton>
          <ToolButton title="Align right" active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight size={16} />
          </ToolButton>
          <ToolButton title="Justify" active={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify size={16} />
          </ToolButton>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* History */}
        <div className="flex gap-0.5">
          <ToolButton title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}>
            <Undo size={16} />
          </ToolButton>
          <ToolButton title="Redo (Ctrl+Shift+Z)"
            onClick={() => editor.chain().focus().redo().run()}>
            <Redo size={16} />
          </ToolButton>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Image upload */}
        {onImageUpload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <ImageIcon size={16} />
                {isUploading ? 'Uploading…' : 'Image'}
                <input type="file" accept="image/*" hidden multiple onChange={handleImageUpload} />
              </label>
            </TooltipTrigger>
            <TooltipContent side="bottom">Upload image</TooltipContent>
          </Tooltip>
        )}

        {/* LaTeX Math — Popover with suggestions */}
        <Popover open={showMath} onOpenChange={setShowMath}>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" variant={showMath ? 'default' : 'ghost'} className="h-8 w-8" title="Insert LaTeX equation">
              <Sigma size={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-0">
            <div className="border-b px-3 pt-3 pb-2">
              <p className="mb-1.5 text-xs font-semibold text-foreground">LaTeX Equation</p>
              <input
                type="text"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') insertMath(mathInput);
                  if (e.key === 'Escape') setShowMath(false);
                }}
                placeholder="Type LaTeX: e.g. x^2 + y^2 = z^2"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-mono outline-none focus:border-ring focus:ring-ring/50 focus:ring-2"
                autoFocus
              />
              {/* Live preview */}
              {mathInput.trim() && (
                <div className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-center">
                  <span dangerouslySetInnerHTML={{ __html: renderLatexPreview(mathInput.trim()) }} />
                </div>
              )}
              <Button size="sm" className="mt-2 w-full" onClick={() => insertMath(mathInput)}>
                Insert Equation
              </Button>
            </div>
            {/* Quick suggestions */}
            <div className="px-3 pt-2 pb-1">
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">Quick Insert — click to use</p>
            </div>
            <div className="max-h-52 overflow-y-auto px-1 pb-2">
              <div className="grid grid-cols-2 gap-1 px-1">
                {LATEX_SUGGESTIONS.map((s) => (
                  <button
                    key={s.latex}
                    type="button"
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent"
                    onClick={() => insertMath(s.latex)}
                    title={s.latex}
                  >
                    <span
                      className="shrink-0 text-[13px]"
                      dangerouslySetInnerHTML={{ __html: renderLatexPreview(s.latex) }}
                    />
                    <span className="truncate text-muted-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Editor content ── */}
      <div
        ref={scrollRef}
        className="max-h-96 overflow-y-auto px-4 py-3 text-[15px] leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted"
      >
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1">
        <span className="text-xs text-muted-foreground">{editor.getText().length} characters</span>
        {placeholder && !value && (
          <span className="text-xs text-muted-foreground">{placeholder}</span>
        )}
      </div>
    </div>
  );
}

export default RichTextEditor;