import { create } from 'zustand';
import { ReactNode } from 'react';

interface ModalState {
  isOpen: boolean;
  content: ReactNode | null;
  title: string;
  description?: string;
  className?: string;
  openModal: (options: { content: ReactNode; title: string; description?: string; className?: string }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  content: null,
  title: '',
  description: '',
  className: '',
  openModal: ({ content, title, description, className }) =>
    set({
      isOpen: true,
      content,
      title,
      description,
      className,
    }),
  closeModal: () =>
    set({
      isOpen: false,
      content: null,
      title: '',
      description: '',
      className: '',
    }),
}));
