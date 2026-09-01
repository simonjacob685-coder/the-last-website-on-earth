/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { OpeningSequence } from './components/OpeningSequence';
import { ArchiveScene } from './components/ArchiveScene';
import { ArchiveHUD } from './components/ArchiveHUD';
import { MemoryModal } from './components/MemoryModal';
import { ArchivalFragmentToast } from './components/ArchivalFragmentToast';
import { MemoryId, DiscoveryId, ArchivalFragment, ARCHIVAL_FRAGMENTS } from './types';
import { soundEngine } from './utils/audio';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activeDiscovery, setActiveDiscovery] = useState<DiscoveryId | null>(null);
  const [recoveredIds, setRecoveredIds] = useState<MemoryId[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);

  // Hidden Archival Fragments
  const [discoveredFragmentIds, setDiscoveredFragmentIds] = useState<string[]>([]);
  const [activeFragmentToast, setActiveFragmentToast] = useState<ArchivalFragment | null>(null);

  // Final Archive Moment (When 3/3 memories are recovered)
  const [isCeremonyActive, setIsCeremonyActive] = useState<boolean>(false);
  const [ceremonyStep, setCeremonyStep] = useState<number>(0);
  const hasTriggeredCeremony = useRef<boolean>(false);

  const [secretDiscovered, setSecretDiscovered] = useState<boolean>(false);

  const handleEnterArchive = () => {
    setIsTransitioning(true);
    setHasEntered(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200);
  };

  const handleSelectDiscovery = (id: DiscoveryId) => {
    // Check if selecting a memory for the first time
    const isMemory = id === 'ocean' || id === 'city' || id === 'message';
    const isNewMemory = isMemory && !recoveredIds.includes(id as MemoryId);

    if (isNewMemory) {
      // Trigger micro-glitch effect (250ms)
      setIsGlitching(true);
      soundEngine.playGlitchBurst();
      setTimeout(() => setIsGlitching(false), 280);

      const nextRecovered = [...recoveredIds, id as MemoryId];
      setRecoveredIds(nextRecovered);

      // If all 3 are recovered for the first time, queue the Final Archive Moment
      if (nextRecovered.length === 3 && !hasTriggeredCeremony.current) {
        hasTriggeredCeremony.current = true;
        setTimeout(() => {
          triggerArchiveCompleteCeremony();
        }, 800);
      }
    }

    if (id === 'secret_signal') {
      setSecretDiscovered(true);
      soundEngine.setAtmosphereQuieter(true);
    }

    setActiveDiscovery(id);
  };

  const handleDiscoverFragment = (fragmentId: string) => {
    const fragment = ARCHIVAL_FRAGMENTS.find((f) => f.id === fragmentId);
    if (!fragment) return;

    if (!discoveredFragmentIds.includes(fragmentId)) {
      setDiscoveredFragmentIds((prev) => [...prev, fragmentId]);
      soundEngine.playFragmentDiscovered();
    } else {
      soundEngine.playUiClick();
    }

    setActiveFragmentToast(fragment);
  };

  const triggerArchiveCompleteCeremony = () => {
    setIsCeremonyActive(true);
    setCeremonyStep(1); // ARCHIVE COMPLETE
    soundEngine.playArchiveComplete();

    setTimeout(() => {
      setCeremonyStep(2); // THREE MEMORIES RECOVERED
    }, 1600);

    setTimeout(() => {
      setCeremonyStep(3); // SEARCHING FOR REMAINING SIGNAL...
    }, 3200);

    setTimeout(() => {
      setCeremonyStep(4); // THE RECORD SURVIVES.
    }, 4800);

    setTimeout(() => {
      setIsCeremonyActive(false);
      setCeremonyStep(0);
    }, 6600);
  };

  const handleCloseDiscovery = () => {
    setActiveDiscovery(null);
    soundEngine.setAtmosphereQuieter(false);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main
      id="last-website-root"
      className="relative w-screen h-screen bg-[#020306] overflow-hidden select-none text-slate-100 font-sans"
    >
      {/* 1. Opening Sequence Screen */}
      {!hasEntered && <OpeningSequence onEnter={handleEnterArchive} />}

      {/* 2. 3D WebGL Archive Chamber */}
      {hasEntered && (
        <>
          <ArchiveScene
            activeDiscovery={activeDiscovery}
            onSelectDiscovery={handleSelectDiscovery}
            recoveredIds={recoveredIds}
            discoveredFragmentIds={discoveredFragmentIds}
            onDiscoverFragment={handleDiscoverFragment}
            secretDiscovered={secretDiscovered}
          />

          {/* 3. Futuristic Archival HUD Layer */}
          <ArchiveHUD
            recoveredIds={recoveredIds}
            onSelectDiscovery={handleSelectDiscovery}
            activeDiscovery={activeDiscovery}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            secretDiscovered={secretDiscovered}
            discoveredFragmentIds={discoveredFragmentIds}
          />

          {/* 4. Recovered Memory & Environmental Object Modal */}
          <MemoryModal
            discoveryId={activeDiscovery}
            onClose={handleCloseDiscovery}
            recoveredIds={recoveredIds}
            onSelectDiscovery={handleSelectDiscovery}
          />

          {/* 5. Archival Fragment Discovered Toast */}
          <ArchivalFragmentToast
            fragment={activeFragmentToast}
            onDismiss={() => setActiveFragmentToast(null)}
          />

          {/* 6. Quantum Relay Entry Transition */}
          {isTransitioning && (
            <div
              id="entry-transition-overlay"
              className="absolute inset-0 z-50 pointer-events-none bg-cyan-950/25 backdrop-blur-[2px] animate-pulse flex items-center justify-center"
            >
              <div className="font-mono text-xs sm:text-sm tracking-[0.35em] text-cyan-300 bg-black/85 border border-cyan-400 px-6 py-3 rounded shadow-[0_0_30px_rgba(0,240,255,0.4)] uppercase">
                &bull; SYNCHRONIZING NODE 01 ARCHIVE &bull;
              </div>
            </div>
          )}

          {/* 7. Subtle Micro-Glitch Effect (250-300ms) on memory discovery */}
          {isGlitching && (
            <div
              id="micro-glitch-overlay"
              className="absolute inset-0 z-50 pointer-events-none bg-cyan-500/10 mix-blend-screen flex items-center justify-center overflow-hidden"
            >
              {/* Horizontal scanline jitter */}
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,240,255,0.15),rgba(0,240,255,0.15)_1px,transparent_1px,transparent_3px)] opacity-75 animate-pulse" />
              <div className="font-mono text-[10px] sm:text-xs tracking-[0.3em] text-cyan-300 bg-black/90 px-4 py-1.5 border border-cyan-400/80 shadow-[2px_0_0_rgba(255,0,0,0.6),-2px_0_0_rgba(0,0,255,0.6)]">
                [DECRYPTING SECTOR ARCHIVE]
              </div>
            </div>
          )}

          {/* 8. Final Archive Ceremony Moment (When 3/3 memories recovered) */}
          <AnimatePresence>
            {isCeremonyActive && (
              <motion.div
                id="archive-ceremony-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 z-50 pointer-events-none bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="space-y-4 font-mono">
                  {ceremonyStep >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7 }}
                      className="text-xs sm:text-sm tracking-[0.4em] text-cyan-400 font-bold uppercase"
                    >
                      &bull; ARCHIVE COMPLETE &bull;
                    </motion.div>
                  )}

                  {ceremonyStep >= 2 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      className="text-slate-300 text-xs tracking-[0.25em] uppercase"
                    >
                      THREE MEMORIES RECOVERED
                    </motion.div>
                  )}

                  {ceremonyStep >= 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.7 }}
                      className="text-purple-300 text-[11px] sm:text-xs tracking-[0.3em] uppercase animate-pulse"
                    >
                      SEARCHING FOR REMAINING SIGNAL...
                    </motion.div>
                  )}

                  {ceremonyStep >= 4 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.9 }}
                      className="font-['Orbitron',sans-serif] text-xl sm:text-2xl text-emerald-300 font-bold tracking-[0.25em] pt-3 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                    >
                      THE RECORD SURVIVES.
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}
