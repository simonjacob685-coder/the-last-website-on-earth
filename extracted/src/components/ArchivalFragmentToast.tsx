import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArchivalFragment } from '../types';
import { Sparkles, X } from 'lucide-react';

interface ArchivalFragmentToastProps {
  fragment: ArchivalFragment | null;
  onDismiss: () => void;
}

export const ArchivalFragmentToast: React.FC<ArchivalFragmentToastProps> = ({
  fragment,
  onDismiss,
}) => {
  useEffect(() => {
    if (!fragment) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5200);

    return () => clearTimeout(timer);
  }, [fragment, onDismiss]);

  return (
    <AnimatePresence>
      {fragment && (
        <motion.div
          id="archival-fragment-toast"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-md w-[calc(100%-2rem)] bg-[#030914]/95 backdrop-blur-xl border border-cyan-400/50 rounded-md p-4 sm:p-5 shadow-[0_0_30px_rgba(0,240,255,0.25)] font-mono text-slate-100 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-900/50 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span className="text-[10px] sm:text-xs tracking-[0.25em] text-cyan-300 font-bold uppercase">
                {fragment.code} &bull; ARCHIVAL FRAGMENT
              </span>
            </div>
            <button
              id="dismiss-fragment-btn"
              onClick={onDismiss}
              aria-label="Dismiss fragment notification"
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Quote */}
          <div className="py-1">
            <p className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed italic tracking-wide">
              &ldquo;{fragment.quote}&rdquo;
            </p>
          </div>

          {/* Sector metadata */}
          <div className="mt-2 text-[9px] sm:text-[10px] text-cyan-400/70 tracking-widest uppercase flex items-center justify-between">
            <span>{fragment.sector}</span>
            <span className="text-emerald-400 font-semibold">● LOG RECOVERED</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
