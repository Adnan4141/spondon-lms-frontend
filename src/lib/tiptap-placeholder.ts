import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

type PlaceholderOptions = {
  placeholder: string | ((node: any) => string);
  showOnlyWhenEditable: boolean;
  showOnlyCurrent: boolean;
  includeChildren: boolean;
  emptyNodeClass: string;
  emptyEditorClass: string;
};

const placeholderKey = new PluginKey('local-placeholder');

export const LocalPlaceholder = Extension.create<PlaceholderOptions>({
  name: 'placeholder',

  addOptions() {
    return {
      placeholder: 'Start writing...',
      showOnlyWhenEditable: true,
      showOnlyCurrent: true,
      includeChildren: false,
      emptyNodeClass: 'is-empty',
      emptyEditorClass: 'is-editor-empty',
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: placeholderKey,
        props: {
          decorations: ({ doc, selection, editable }) => {
            const active = editable || !this.options.showOnlyWhenEditable;
            if (!active) return null;

            const decorations: Decoration[] = [];
            const {
              placeholder,
              showOnlyCurrent,
              includeChildren,
              emptyNodeClass,
              emptyEditorClass,
            } = this.options;

            const createPlaceholder = (node: any, pos: number) => {
              const isEmpty = !node.textContent.length;
              const isCurrent = selection.$from.parent === node;
              if (!isEmpty) return;
              if (showOnlyCurrent && !isCurrent) return;

              const text = typeof placeholder === 'function' ? placeholder(node) : placeholder;

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: `${emptyNodeClass} ${emptyEditorClass}`.trim(),
                  'data-placeholder': text,
                })
              );
            };

            doc.descendants((node, pos) => {
              if (!node.isTextblock) return includeChildren;

              if (node.isLeaf) {
                createPlaceholder(node, pos);
                return false;
              }

              if (node.content.size === 0) {
                createPlaceholder(node, pos);
                return includeChildren;
              }

              return includeChildren;
            });

            return decorations.length ? DecorationSet.create(doc, decorations) : null;
          },
        },
      }),
    ];
  },
});

export default LocalPlaceholder;
