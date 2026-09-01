import React, { useState } from 'react';
import { MemoryId, DiscoveryId, MEMORIES_DATA } from '../types';
import { Volume2, VolumeX, Check, Radio, Cpu, Sparkles, FileText, Info } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ArchiveHUDProps {
  recoveredIds: MemoryId[];
  onSelectDiscovery: (id: DiscoveryId) => void;
  activeDiscovery: DiscoveryId | null;
  isMuted: boolean;
  onToggleMute: () => void;
  secretDiscovered: boolean;
  discoveredFragmentIds: string[];
}

export const ArchiveHUD: React.FC<ArchiveHUDProps> = ({
  recoveredIds,
  onSelectDiscovery,
  activeDiscovery,
  isMuted,
  onToggleMute,
  secretDiscovered,
  discoveredFragmentIds,
}) => {
  const memoryList: MemoryId[] = ['ocean', 'city', 'message'];
  const recoveredCount = recoveredIds.length;
  const allRecovered = recoveredCount === 3;
  const hasPattern = recoveredIds.includes('ocean') && recoveredIds.includes('city');
  const [showPatternDetail, setShowPatternDetail] = useState<boolean>(false);

  return (
    <div
      id="archive-hud-overlay"
      className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] overflow-hidden select-none"
    >
      {/* ----------------------------------------------------
          TOP BAR (Top Left Branding + Center Docks + Top Right Controls)
      ---------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3">
        {/* Top Left Branding & Progress Readouts */}
        <div id="hud-top-left" className="space-y-1.5 pointer-events-auto max-w-[260px] sm:max-w-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-[11px] sm:text-xs tracking-[0.25em] text-cyan-400 font-bold uppercase">
              EARTH//ARCHIVE
            </span>
          </div>

          {/* Archival System Progress Readout */}
          <div className="bg-black/75 backdrop-blur-md border border-slate-800/90 px-3 py-1.5 rounded text-[10px] font-mono tracking-[0.2em] space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 text-[9px] uppercase">MEMORIES RECOVERED</span>
              <span className={`font-bold ${allRecovered ? 'text-emerald-400' : 'text-cyan-300'}`}>
                0{recoveredCount} / 03
              </span>
            </div>

            {/* FEATURE 3: Hidden Archival Fragments Counter */}
            <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-800/80">
              <span className="text-slate-500 text-[9px] uppercase flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>ARCHIVAL FRAGMENTS</span>
              </span>
              <span className="text-slate-300 font-bold">
                0{discoveredFragmentIds.length} / 05
              </span>
            </div>

            {/* FEATURE 5: Pattern Detection Indicator */}
            {hasPattern && (
              <div className="pt-1 border-t border-amber-500/30">
                <button
                  id="hud-pattern-toggle-btn"
                  onClick={() => setShowPatternDetail(!showPatternDetail)}
                  className="w-full text-left font-mono text-[9px] tracking-wider text-amber-300/90 hover:text-amber-200 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>PATTERN DETECTED</span>
                  </span>
                  <Info className="w-3 h-3 text-amber-400" />
                </button>
                {showPatternDetail && (
                  <div className="mt-1 text-[8.5px] text-amber-200/80 leading-snug tracking-normal bg-amber-950/40 p-1.5 rounded border border-amber-500/20">
                    [CORRELATION: RISING TIDES → MIGRATION TO URBAN RELAYS → SILENCE]
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Center: Memory Dock + Central Node + Secret Signal (Desktop / Tablet) */}
        <div
          id="memory-selector-dock"
          className="pointer-events-auto hidden md:flex items-center gap-2 bg-black/75 backdrop-blur-md border border-slate-800/80 px-3.5 py-1.5 rounded-full shadow-lg"
        >
          {/* Central Archive Core Button */}
          <button
            id="hud-central-node-btn"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectDiscovery('archive_core');
            }}
            className={`font-mono text-[11px] tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeDiscovery === 'archive_core'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>NODE 01</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* 3 Core Memories */}
          {memoryList.map((id) => {
            const mem = MEMORIES_DATA[id];
            const isRecovered = recoveredIds.includes(id);
            const isSelected = activeDiscovery === id;

            return (
              <button
                key={id}
                id={`hud-select-${id}-btn`}
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectDiscovery(id);
                }}
                className={`font-mono text-[11px] tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : isRecovered
                    ? 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                    : 'bg-black/40 border-slate-800/80 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: mem.themeColor }}
                />
                <span>{mem.title}</span>
                {isRecovered && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}

          {/* Secret Fourth Discovery Button (Visible after 3/3 recovered) */}
          {allRecovered && (
            <>
              <div className="h-4 w-px bg-slate-800 mx-1" />
              <button
                id="hud-secret-signal-btn"
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectDiscovery('secret_signal');
                }}
                className={`font-mono text-[11px] tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer animate-pulse ${
                  activeDiscovery === 'secret_signal'
                    ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                    : 'bg-purple-950/40 border-purple-800/80 text-purple-300 hover:border-purple-400'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>FINAL SIGNAL</span>
              </button>
            </>
          )}
        </div>

        {/* Top Right: Status & Audio Controls */}
        <div id="hud-top-right" className="flex items-center gap-2.5">
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold hidden sm:inline">ARCHIVE ONLINE</span>
            <span className="font-semibold sm:hidden">ONLINE</span>
          </div>

          {/* Sound Mute Toggle Button (44px min touch target) */}
          <button
            id="audio-toggle-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute atmospheric audio' : 'Mute atmospheric audio'}
            className="pointer-events-auto min-h-[44px] px-3 py-1.5 rounded bg-black/75 border border-slate-800 hover:border-cyan-500/50 active:bg-cyan-950 text-slate-300 hover:text-cyan-300 flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="font-mono text-[10px] tracking-widest text-slate-500 hidden sm:inline">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-[10px] tracking-widest text-cyan-400/90 hidden sm:inline">AUDIO ON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          BOTTOM BAR (Bottom Left Title + Mobile Pills + Bottom Right Guide)
      ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-4">
        {/* Bottom Left Title */}
        <div id="hud-bottom-left" className="space-y-1">
          <div className="font-['Orbitron',sans-serif] text-xs sm:text-sm font-semibold tracking-[0.2em] text-slate-100 uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            THE LAST WEBSITE ON EARTH
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-cyan-400/80">
            {allRecovered ? 'THE RECORD SURVIVES // 2098' : 'FINAL SURVIVING DIGITAL RECORD // 2098'}
          </div>
        </div>

        {/* Mobile Quick Discoveries Dock */}
        <div className="flex md:hidden items-center gap-2 pointer-events-auto overflow-x-auto py-1">
          <button
            id="mobile-hud-chip-core"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectDiscovery('archive_core');
            }}
            className={`min-h-[44px] font-mono text-[11px] tracking-wider px-3.5 py-2 rounded bg-black/80 border text-slate-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
              activeDiscovery === 'archive_core'
                ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200'
                : 'border-slate-800 text-slate-400'
            }`}
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>NODE 01</span>
          </button>

          {memoryList.map((id) => {
            const mem = MEMORIES_DATA[id];
            const isRecovered = recoveredIds.includes(id);
            const isSelected = activeDiscovery === id;
            return (
              <button
                key={id}
                id={`mobile-hud-chip-${id}`}
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectDiscovery(id);
                }}
                className={`min-h-[44px] font-mono text-[11px] tracking-wider px-3.5 py-2 rounded bg-black/80 border text-slate-200 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200'
                    : isRecovered
                    ? 'border-slate-700 bg-slate-900/80 text-slate-300'
                    : 'border-slate-800 text-slate-400 hover:border-cyan-400/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mem.themeColor }} />
                <span>{mem.title}</span>
                {isRecovered && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}

          {allRecovered && (
            <button
              id="mobile-hud-chip-secret"
              onClick={() => {
                soundEngine.playUiClick();
                onSelectDiscovery('secret_signal');
              }}
              className={`min-h-[44px] font-mono text-[11px] tracking-wider px-3.5 py-2 rounded bg-purple-950/80 border border-purple-500/60 text-purple-200 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse`}
            >
              <Radio className="w-3 h-3 text-purple-400" />
              <span>FINAL SIGNAL</span>
            </button>
          )}
        </div>

        {/* Bottom Right Interaction Guide */}
        <div id="hud-bottom-right" className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-slate-400/90 text-left sm:text-right uppercase">
          DRAG TO EXPLORE &bull; TAP TO DISCOVER
        </div>
      </div>
    </div>
  );
};
