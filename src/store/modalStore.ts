import { create } from 'zustand';
import { ReactNode } from 'react';

interface ModalState {
  isOpen: boolean;
  content: ReactNode | null;
  title: string;
  description?: string;
  className?: string;
  stack: Array<{ content: ReactNode; title: string; description?: string; className?: string }>;
  openModal: (options: { content: ReactNode; title: string; description?: string; className?: string }) => void;
  closeModal: () => void;
  goBack: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  content: null,
  title: '',
  description: '',
  className: '',
  stack: [],
  openModal: ({ content, title, description, className }) =>
    set({
      isOpen: true,
      content,
      title,
      description,
      className,
      stack: (prev) => [...prev, { content, title, description, className }],
    }),
  closeModal: () =>
    set({
      isOpen: false,
      content: null,
      title: '',
      description: '',
      className: '',
      stack: [],
    }),
  goBack: () =>
    set((state) => {
      if (state.stack.length <= 1) {
        return { isOpen: false, content: null, title: '', description: '', className: '', stack: [] };
      }
      const nextStack = state.stack.slice(0, -1);
      const prev = nextStack[nextStack.length - 1];
      return {
        isOpen: true,
        content: prev.content,
        title: prev.title,
        description: prev.description,
        className: prev.className,
        stack: nextStack,
      };
    }),
}));
