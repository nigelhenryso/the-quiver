
'use client';

import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function CommonModal({
  isOpen,
  onClose,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative h-hug w-[603px] max-h-[95dvh] max-w-full overflow-y-auto rounded-[19px] bg-[linear-gradient(180deg,#00B775_28.85%,#66D4AC_93.75%)] p-10 shadow-[0px_4px_8.3px_1px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-5 top-4 text-3xl font-light leading-none text-white transition-opacity hover:opacity-70"
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  );
}
