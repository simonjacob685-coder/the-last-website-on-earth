import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../utils/audio';

interface OpeningSequenceProps {
  onEnter: () => void;
}

export const OpeningSequence: React.FC<OpeningSequenceProps> = ({ onEnter }) => {
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1900);
    const timer3 = setTimeout(() => setStep(3), 3200);
    const timer4 = setTimeout(() => setStep(4), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleEnter = () => {
    soundEngine.playUiClick();
    soundEngine.startAmbient();
    onEnter();
  };

  return (
    <div
      id="opening-sequence-container"
      className="fixed inset-0 z-50 bg-[#030508] text-slate-100 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
    >
      {/* Subtle CRT / Scanline ambient texture */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-black opacity-80" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,240,255,0.4) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center space-y-7">
        {/* Step 1: System Node Header */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              id="node-header-info"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="font-mono text-[11px] tracking-[0.35em] text-cyan-400/80 uppercase space-y-1"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>EARTH // ARCHIVE</span>
              </div>
              <div className="text-slate-400 tracking-[0.25em]">NODE 01 &bull; SURVIVING RELAY</div>
              <div className="text-cyan-300/90 font-semibold tracking-[0.4em] pt-0.5">2098</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Main Title */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              id="main-title-block"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="space-y-3"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-['Orbitron',sans-serif] font-bold tracking-[0.18em] text-white leading-tight uppercase drop-shadow-[0_0_25px_rgba(0,240,255,0.35)]">
                THE LAST WEBSITE <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-cyan-400">
                  ON EARTH
                </span>
              </h1>
              <div className="w-16 h-[1px] bg-cyan-500/40 mx-auto" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Core Story Text */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div
              id="story-lines-block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="font-mono text-xs sm:text-sm text-slate-300/90 leading-relaxed tracking-wider space-y-1.5 px-4"
            >
              <p className="text-slate-400">The internet is gone.</p>
              <p className="text-cyan-200/90">One page survived.</p>
              <p className="text-slate-100 font-medium tracking-[0.1em]">Three memories remain.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Enter Button */}
        <AnimatePresence>
          {step >= 4 && (
            <motion.div
              id="enter-button-wrapper"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="pt-4"
            >
              <button
                id="enter-archive-button"
                onClick={handleEnter}
                className="group relative px-8 py-3.5 bg-black/60 hover:bg-cyan-950/40 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 hover:text-white font-mono text-xs sm:text-sm tracking-[0.25em] uppercase transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] cursor-pointer active:scale-95"
              >
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
                <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
                <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
                <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
                
                <span className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                  ENTER THE ARCHIVE
                  <span className="text-cyan-400/60 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle skip control in corner if user wants immediate entry */}
      {step < 4 && (
        <button
          id="skip-intro-btn"
          onClick={() => setStep(4)}
          className="absolute bottom-6 right-6 font-mono text-[10px] text-slate-600 hover:text-cyan-400 tracking-widest uppercase transition-colors"
        >
          [ SKIP INTRO ]
        </button>
      )}
    </div>
  );
};
