import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  maxWidthClass = 'max-w-lg',
  children,
  ariaLabel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs overflow-y-auto"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <motion.div
              key="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 32,
                mass: 0.8,
              }}
              onClick={(e) => e.stopPropagation()}
              className={`clay-modal ${maxWidthClass} w-full shadow-2xl overflow-hidden my-auto border border-slate-200 bg-white`}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
