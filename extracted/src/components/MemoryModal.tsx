import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MemoryId,
  DiscoveryId,
  MEMORIES_DATA,
  SECRET_SIGNAL_DATA,
  ENVIRONMENTAL_OBJECTS,
  EnvironmentalObjectId,
} from '../types';
import { soundEngine } from '../utils/audio';
import { X, ChevronRight, Waves, Building2, Terminal, Radio, Cpu, RadioTower, Monitor } from 'lucide-react';

interface MemoryModalProps {
  discoveryId: DiscoveryId | null;
  onClose: () => void;
  recoveredIds: MemoryId[];
  onSelectDiscovery: (id: DiscoveryId) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  discoveryId,
  onClose,
  recoveredIds,
  onSelectDiscovery,
}) => {
  // Step for progressive reveal on the MESSAGE memory
  const [messageStep, setMessageStep] = useState<number>(0);

  useEffect(() => {
    if (discoveryId === 'secret_signal') {
      soundEngine.setFinalSilence(true);
      return () => {
        soundEngine.setFinalSilence(false);
      };
    } else {
      soundEngine.setFinalSilence(false);
    }

    if (discoveryId === 'message') {
      setMessageStep(0);
      const t1 = setTimeout(() => setMessageStep(1), 500);
      const t2 = setTimeout(() => setMessageStep(2), 1500);
      const t3 = setTimeout(() => setMessageStep(3), 2600);
      const t4 = setTimeout(() => setMessageStep(4), 3700);
      const t5 = setTimeout(() => setMessageStep(5), 4800);
      const t6 = setTimeout(() => setMessageStep(6), 6200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(t6);
      };
    } else {
      setMessageStep(6);
    }
  }, [discoveryId]);

  if (!discoveryId) return null;

  const handleClose = () => {
    soundEngine.playUiClick();
    onClose();
  };

  const isMemory = discoveryId === 'ocean' || discoveryId === 'city' || discoveryId === 'message';
  const isArchiveCore = discoveryId === 'archive_core';
  const isSecretSignal = discoveryId === 'secret_signal';
  const isTerminal = discoveryId === 'terminal';
  const isTransceiver = discoveryId === 'transceiver';
  const isEnvObject = isTerminal || isTransceiver;

  const memoryKeys: MemoryId[] = ['ocean', 'city', 'message'];
  const currentIndex = isMemory ? memoryKeys.indexOf(discoveryId as MemoryId) : 0;
  const nextMemoryId = memoryKeys[(currentIndex + 1) % memoryKeys.length];

  const getMemoryIcon = (id: DiscoveryId) => {
    switch (id) {
      case 'ocean':
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case 'city':
        return <Building2 className="w-5 h-5 text-amber-400" />;
      case 'message':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'archive_core':
        return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'secret_signal':
        return <Radio className="w-5 h-5 text-purple-400" />;
      case 'terminal':
        return <Monitor className="w-5 h-5 text-sky-400" />;
      case 'transceiver':
        return <RadioTower className="w-5 h-5 text-rose-400" />;
    }
  };

  // ----------------------------------------------------
  // 1. FEATURE 2: ENVIRONMENTAL OBJECT CARD (Terminal / Transceiver)
  // ----------------------------------------------------
  if (isEnvObject) {
    const envData = ENVIRONMENTAL_OBJECTS[discoveryId as EnvironmentalObjectId];
    const isOffline = envData.status === 'OFFLINE';

    return (
      <AnimatePresence>
        <div
          id="environmental-object-modal-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            id="environmental-object-panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[#040810]/95 backdrop-blur-2xl border border-slate-700/60 rounded-lg p-5 sm:p-6 text-slate-100 shadow-[0_0_30px_rgba(0,0,0,0.8)] font-mono select-none"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOffline ? 'bg-amber-400' : 'bg-rose-400'
                  } animate-pulse`}
                />
                <span className="text-[11px] tracking-[0.25em] text-slate-400 font-bold uppercase">
                  {envData.code}
                </span>
              </div>
              <button
                id="close-env-obj-btn"
                onClick={handleClose}
                aria-label="Close object inspection"
                className="min-w-[40px] min-h-[40px] w-10 h-10 rounded flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/70 active:bg-cyan-950 transition-colors border border-slate-700/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Object Title & Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                {getMemoryIcon(discoveryId)}
              </div>
              <div>
                <h3 className="font-['Orbitron',sans-serif] text-sm font-semibold tracking-widest text-slate-200 uppercase">
                  {envData.title}
                </h3>
              </div>
            </div>

            {/* Readout Fields */}
            <div className="space-y-2.5 text-xs tracking-wider text-slate-300 bg-black/60 p-4 rounded border border-slate-800/80 mb-4">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-500">STATUS:</span>
                <span
                  className={`font-bold ${
                    isOffline ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {envData.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-500">{envData.lastActivityLabel}:</span>
                <span className="text-slate-200 font-semibold">{envData.lastActivity}</span>
              </div>
              <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                {envData.notes.map((note, idx) => (
                  <p key={idx} className="italic text-slate-400">
                    &bull; {note}
                  </p>
                ))}
              </div>
            </div>

            {/* Return Button */}
            <button
              id="close-env-obj-bottom-btn"
              onClick={handleClose}
              className="w-full min-h-[44px] px-4 py-2 bg-slate-900/80 hover:bg-slate-800 active:bg-cyan-950 border border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white text-xs tracking-[0.2em] uppercase rounded transition-all cursor-pointer text-center flex items-center justify-center"
            >
              RETURN TO CHAMBER
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // ----------------------------------------------------
  // 2. CENTRAL ARCHIVE NODE READOUT DIALOG
  // ----------------------------------------------------
  if (isArchiveCore) {
    const totalRecovered = recoveredIds.length;
    const percent = Math.round((totalRecovered / 3) * 100);
    const isComplete = totalRecovered === 3;

    return (
      <AnimatePresence>
        <div
          id="archive-core-modal-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            id="archive-core-panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#030a14]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-lg p-6 sm:p-7 text-slate-100 shadow-[0_0_40px_rgba(0,240,255,0.25)] font-mono"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs tracking-[0.25em] text-cyan-300 font-bold uppercase">
                  CENTRAL ARCHIVE // CORE
                </span>
              </div>
              <button
                id="close-core-btn"
                onClick={handleClose}
                aria-label="Close archive status"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-md flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 active:bg-cyan-950 transition-colors border border-slate-700/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Readout Content */}
            <div className="space-y-4 text-xs sm:text-sm tracking-widest text-slate-300 bg-black/60 p-5 rounded border border-slate-800/80">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">FACILITY:</span>
                <span className="text-cyan-400 font-bold">ARCHIVE NODE 01</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">STATUS:</span>
                <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                  {isComplete ? 'COMPLETE' : 'STABLE'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">DATA RECOVERED:</span>
                <span className="text-slate-100 font-bold">{percent === 0 ? '03%' : `${percent}%`}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">INTEGRITY:</span>
                <span className="text-slate-300">SOLAR BATTERY // NOMINAL</span>
              </div>

              {isComplete && (
                <div className="pt-3 text-center border-t border-cyan-500/30">
                  <p className="text-cyan-300 font-bold tracking-[0.25em] text-sm">
                    THE RECORD SURVIVES.
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                id="close-core-bottom-btn"
                onClick={handleClose}
                className="w-full min-h-[44px] px-6 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 active:bg-cyan-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs tracking-[0.2em] uppercase rounded transition-all cursor-pointer text-center flex items-center justify-center"
              >
                RETURN TO ORBIT
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // ----------------------------------------------------
  // 3. FEATURE 6: FINAL SIGNAL DISCOVERY
  // ----------------------------------------------------
  if (isSecretSignal) {
    return (
      <AnimatePresence>
        <div
          id="secret-signal-modal-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            id="secret-signal-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#080412]/95 backdrop-blur-2xl border border-purple-500/40 rounded-lg p-6 sm:p-7 text-slate-100 shadow-[0_0_50px_rgba(192,132,252,0.25)] font-mono"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                <span className="text-xs tracking-[0.25em] text-purple-300 font-bold uppercase">
                  {SECRET_SIGNAL_DATA.title}
                </span>
              </div>
              <button
                id="close-secret-btn"
                onClick={handleClose}
                aria-label="Close signal view"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-md flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 active:bg-purple-950 transition-colors border border-slate-700/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Readout */}
            <div className="space-y-3.5 text-xs tracking-widest text-slate-300 bg-black/70 p-5 rounded border border-purple-900/40">
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-purple-400/80 font-semibold">SOURCE:</span>
                <span className="text-slate-200">{SECRET_SIGNAL_DATA.source}</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-purple-400/80 font-semibold">AGE:</span>
                <span className="text-slate-200">{SECRET_SIGNAL_DATA.age}</span>
              </div>
              <div className="flex justify-between border-b border-purple-900/40 pb-2">
                <span className="text-purple-400/80 font-semibold">STATUS:</span>
                <span className="text-purple-300 font-bold">{SECRET_SIGNAL_DATA.status}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-purple-400/80 font-semibold">CONNECTION:</span>
                <span className="text-amber-400 font-semibold">UNSTABLE // DEEP VOID</span>
              </div>
            </div>

            {/* Poetic Message */}
            <div className="my-6 p-6 rounded bg-purple-950/30 border border-purple-500/40 text-center">
              <p className="font-['Orbitron',sans-serif] text-base sm:text-lg text-purple-100 font-semibold tracking-[0.15em] drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]">
                &ldquo;{SECRET_SIGNAL_DATA.message}&rdquo;
              </p>
            </div>

            {/* Close Button */}
            <div className="mt-4">
              <button
                id="close-secret-bottom-btn"
                onClick={handleClose}
                className="w-full min-h-[44px] px-6 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 active:bg-purple-800 border border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white text-xs tracking-[0.2em] uppercase rounded transition-all cursor-pointer text-center flex items-center justify-center"
              >
                RETURN TO ARCHIVE ORBIT
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // ----------------------------------------------------
  // 4. CORE THREE MEMORIES (Ocean, City, Message)
  // ----------------------------------------------------
  const memoryId = discoveryId as MemoryId;
  const memory = MEMORIES_DATA[memoryId];

  return (
    <AnimatePresence>
      <div
        id="memory-modal-overlay"
        className={`fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-colors duration-700 ${
          memoryId === 'message' ? 'bg-black/85' : 'bg-black/60'
        }`}
        onClick={handleClose}
      >
        <motion.div
          id="memory-panel-card"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            borderColor: memory.themeColor,
            boxShadow: `0 0 35px ${memory.glowColor}, inset 0 0 15px rgba(0,0,0,0.8)`,
          }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#040810]/95 backdrop-blur-xl border border-opacity-40 rounded-lg p-5 sm:p-7 text-slate-100 flex flex-col justify-between shadow-2xl select-none"
        >
          {/* Top Holographic Header Bar */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: memory.themeColor }}
                />
                <span className="font-mono text-xs tracking-[0.25em] text-slate-300 font-semibold uppercase">
                  {memory.code} &bull; RECOVERED LOG
                </span>
              </div>

              {/* Close X Button (44px min touch target) */}
              <button
                id="close-memory-btn"
                onClick={handleClose}
                aria-label="Close memory view"
                className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-md flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 active:bg-cyan-950 transition-colors border border-slate-700/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800">
                {getMemoryIcon(memoryId)}
              </div>
              <div>
                <h2
                  className="font-['Orbitron',sans-serif] text-xl sm:text-2xl font-bold tracking-[0.15em] uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                  style={{ color: memory.themeColor }}
                >
                  {memory.title}
                </h2>
                <div className="font-mono text-[11px] tracking-wider text-slate-400">
                  {memory.subtitle}
                </div>
              </div>
            </div>

            {/* Memory Narrative Content */}
            <div
              id="memory-body-narrative"
              className="my-5 p-5 sm:p-6 rounded-lg bg-black/50 border border-slate-800/80 font-mono text-sm sm:text-base leading-relaxed tracking-wide space-y-4 text-slate-200"
            >
              {memoryId === 'message' ? (
                <div className="space-y-3.5 py-1 text-center sm:text-left">
                  {messageStep >= 1 && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-emerald-400 font-bold text-base sm:text-lg tracking-[0.18em]"
                    >
                      IF YOU ARE READING THIS,
                    </motion.p>
                  )}
                  {messageStep >= 2 && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-emerald-300 font-bold text-base sm:text-lg tracking-[0.18em]"
                    >
                      HUMANITY WAS HERE.
                    </motion.p>
                  )}
                  <div className="py-1 space-y-2 text-slate-300 font-medium tracking-wide">
                    {messageStep >= 3 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="italic text-slate-300"
                      >
                        WE WERE FRIGHTENED.
                      </motion.p>
                    )}
                    {messageStep >= 4 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="italic text-slate-300"
                      >
                        WE WERE CURIOUS.
                      </motion.p>
                    )}
                  </div>
                  {messageStep >= 5 && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1.0 }}
                      className="text-emerald-200 font-bold text-lg sm:text-xl tracking-[0.25em] pt-1"
                    >
                      WE TRIED.
                    </motion.p>
                  )}
                  {messageStep >= 6 && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2 }}
                      className="font-['Orbitron',sans-serif] text-cyan-300 font-bold text-sm sm:text-base tracking-[0.3em] pt-3 border-t border-emerald-500/30 drop-shadow-[0_0_16px_rgba(0,240,255,0.4)] uppercase"
                    >
                      THE RECORD SURVIVES.
                    </motion.p>
                  )}
                </div>
              ) : (
                memory.bodyLines.map((line, idx) => (
                  <p key={idx} className="text-slate-300">
                    {line}
                  </p>
                ))
              )}
            </div>

            {/* Technical Metadata Footer */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/70 p-3.5 rounded border border-slate-900 mb-5">
              <div>
                <span className="text-slate-500 block">SECTOR:</span>
                <span className="text-slate-300">{memory.metadata.sector}</span>
              </div>
              <div>
                <span className="text-slate-500 block">STATUS:</span>
                <span className="text-cyan-400 font-medium">{memory.metadata.integrity}</span>
              </div>
              <div>
                <span className="text-slate-500 block">RECORD TIMESTAMP:</span>
                <span className="text-slate-300">{memory.metadata.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CLASSIFICATION:</span>
                <span className="text-slate-300 truncate block">{memory.metadata.classification}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {/* Cycle to next memory */}
            <button
              id="next-memory-btn"
              onClick={() => {
                soundEngine.playUiClick();
                onSelectDiscovery(nextMemoryId);
              }}
              className="w-full sm:w-auto min-h-[44px] text-left font-mono text-xs tracking-wider text-slate-400 hover:text-cyan-300 active:text-cyan-200 flex items-center justify-center sm:justify-start gap-1.5 transition-colors px-3 py-2.5 rounded bg-slate-900/50 hover:bg-slate-800/60 sm:bg-transparent cursor-pointer"
            >
              <span>EXPLORE NEXT: {MEMORIES_DATA[nextMemoryId].title}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Close / Return button */}
            <button
              id="return-to-orbit-btn"
              onClick={handleClose}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 active:bg-cyan-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs tracking-[0.2em] uppercase rounded transition-all cursor-pointer text-center flex items-center justify-center"
            >
              RETURN TO ARCHIVE ORBIT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
