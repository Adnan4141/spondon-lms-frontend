import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useCallback } from 'react';
import katex from 'katex';

// LaTeX inline node view component
const MathNodeView = ({ node, updateAttributes, selected }: any) => {
  const [editing, setEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.latex || '');

  const renderLatex = useCallback((tex: string) => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: node.attrs.display });
    } catch {
      return `<span style="color:red;">${tex}</span>`;
    }
  }, [node.attrs.display]);

  const handleSave = () => {
    updateAttributes({ latex });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setLatex(node.attrs.latex);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <NodeViewWrapper as="span" className="inline-flex items-center gap-1">
        <input
          type="text"
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 rounded border border-indigo-400 bg-indigo-50 px-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-500"
          style={{ minWidth: '120px' }}
          autoFocus
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="span"
      className={`inline cursor-pointer rounded px-0.5 ${selected ? 'ring-2 ring-indigo-400 bg-indigo-50' : 'hover:bg-indigo-50/50'}`}
      onClick={() => setEditing(true)}
      title="Click to edit equation"
    >
      <span dangerouslySetInnerHTML={{ __html: renderLatex(node.attrs.latex) }} />
    </NodeViewWrapper>
  );
};

// TipTap Extension
export const MathExtension = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
      display: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-math]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-math': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },

  addCommands(): any {
    return {
      insertMath:
        (latex: string, display = false) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex, display },
          });
        },
    };
  },
});
