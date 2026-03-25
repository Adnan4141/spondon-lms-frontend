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
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Sigma,
} from 'lucide-react';
import { Button } from './button';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, onImageUpload, placeholder, className }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageWidth, setImageWidthState] = useState(100);
  const [imageHeight, setImageHeightState] = useState<number | undefined>(undefined);
  const [mathInput, setMathInput] = useState('');
  const [showMathDialog, setShowMathDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md h-auto my-2 cursor-move',
          style: 'max-width:100%;height:auto;',
          draggable: 'true',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      MathExtension,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
        showOnlyWhenEditable: true,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'data-slot': 'textarea',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (!files.length || !onImageUpload || !editor) return;

      try {
        setIsUploading(true);
        for (const file of files) {
          const url = await onImageUpload(file);
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }
      } catch (error) {
        // Swallow, toast handled by caller if needed
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUpload, editor]
  );

  const updateImageSize = (widthPercent?: number, heightPx?: number) => {
    if (!editor) return;

    const attrs = editor.getAttributes('image');
    const style = typeof attrs.style === 'string' ? attrs.style : '';

    const widthMatch = /max-width:(\d+)%/.exec(style);
    const heightMatch = /max-height:(\d+)px/.exec(style);

    const width = widthPercent ?? (widthMatch ? Number(widthMatch[1]) : imageWidth);
    const height = heightPx ?? (heightMatch ? Number(heightMatch[1]) : imageHeight);

    const styleParts = [`max-width:${width}%;height:auto;`];
    if (height && height > 0) {
      styleParts.push(`max-height:${height}px;`);
    }

    setImageWidthState(width);
    setImageHeightState(height && height > 0 ? height : undefined);

    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        style: styleParts.join(''),
      })
      .run();
  };

  const setImageWidth = (percent: number) => {
    updateImageSize(percent, undefined);
  };

  const setImageHeight = (height: number | undefined) => {
    updateImageSize(undefined, height && height > 0 ? height : undefined);
  };

  if (!editor) {
    return (
      <div className="w-full rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 bg-muted/60 px-2 py-1.5">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3 w-3" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 4 }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 className="h-3 w-3" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3 w-3" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button
          type="button"
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="icon-xs"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="h-3 w-3" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-3 w-3" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" />
        {/* LaTeX Math Button */}
        <div className="relative inline-flex items-center">
          <Button
            type="button"
            variant={showMathDialog ? 'default' : 'ghost'}
            size="icon-xs"
            title="Insert LaTeX equation"
            onClick={() => setShowMathDialog(!showMathDialog)}
          >
            <Sigma className="h-3 w-3" />
          </Button>
          {showMathDialog && (
            <div className="absolute top-full left-0 mt-1 z-50 flex items-center gap-1 rounded border bg-background p-1.5 shadow-lg">
              <input
                type="text"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mathInput.trim()) {
                    (editor.commands as any).insertMath(mathInput.trim());
                    setMathInput('');
                    setShowMathDialog(false);
                  }
                  if (e.key === 'Escape') setShowMathDialog(false);
                }}
                placeholder="e.g. x^2 + y^2 = z^2"
                className="h-6 w-48 rounded border px-1.5 text-xs font-mono outline-none"
                autoFocus
              />
              <Button
                type="button"
                size="icon-xs"
                onClick={() => {
                  if (mathInput.trim()) {
                    (editor.commands as any).insertMath(mathInput.trim());
                    setMathInput('');
                    setShowMathDialog(false);
                  }
                }}
              >
                ✓
              </Button>
            </div>
          )}
        </div>
        {onImageUpload && (
          <>
            <span className="mx-1 h-4 w-px bg-border" />
            <label className="inline-flex h-6 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground hover:bg-muted/80">
              <ImageIcon className="mr-1 h-3 w-3" />
              {isUploading ? 'Uploading...' : 'Image'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
            {editor.isActive('image') && (
              <div className="ml-2 flex flex-wrap items-center gap-2">
                {(() => {
                  const attrs = editor.getAttributes('image');
                  const style = typeof attrs.style === 'string' ? attrs.style : '';
                  const widthMatch = /max-width:(\d+)%/.exec(style);
                  const heightMatch = /max-height:(\d+)px/.exec(style);
                  const currentWidth = widthMatch ? Number(widthMatch[1]) : imageWidth;
                  const currentHeight = heightMatch ? Number(heightMatch[1]) : imageHeight;

                  return (
                    <>
                      <span className="text-[10px] text-muted-foreground">W%</span>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={currentWidth}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setImageWidth(val);
                        }}
                        className="h-1 w-24 accent-foreground"
                      />
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{currentWidth}%</span>

                      <span className="ml-3 text-[10px] text-muted-foreground">H (px)</span>
                      <input
                        type="number"
                        min={0}
                        max={2000}
                        value={currentHeight ?? ''}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : 0;
                          setImageHeight(val > 0 ? val : undefined);
                        }}
                        className="h-6 w-16 rounded border border-input bg-background px-1 text-[10px]"
                        placeholder="auto"
                      />
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Scroll to top"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Scroll to bottom"
            onClick={() =>
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
              })
            }
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          {placeholder && !value && (
            <span className="pr-1 text-[11px] text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto rounded-b-md border border-input bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted"
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
