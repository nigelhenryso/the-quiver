
'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** false = clicking the backdrop / pressing Escape doesn't close it (the × still does). */
  dismissible?: boolean;
}

/** Dark full-screen backdrop shared by the auth modals and the "logging you in" screen. */
export const AUTH_BACKDROP = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4';

export default function CommonModal({
  isOpen,
  onClose,
  children,
  dismissible = true,
}: ModalProps) {
  // Only close when the press both starts and ends on the backdrop. A plain onClick also
  // fires when you press inside the modal (e.g. selecting text) and release outside it.
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    if (!isOpen || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={AUTH_BACKDROP}
      onPointerDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const onBackdrop = pressStartedOnBackdrop.current && e.target === e.currentTarget;
        pressStartedOnBackdrop.current = false;
        if (onBackdrop && dismissible) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative h-hug w-[603px] max-h-[95dvh] max-w-full overflow-y-auto rounded-[19px] bg-[linear-gradient(180deg,#00B775_28.85%,#66D4AC_93.75%)] p-10 shadow-[0px_4px_8.3px_1px_rgba(0,0,0,0.25)]"
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
