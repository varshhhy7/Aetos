"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Branch } from "@/lib/types";
import { useAetosStore } from "@/lib/store";

const TRANSITIONS = ["cut", "fade", "fade_out", "slide"];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

export function Timeline({ branch }: { branch: Branch }) {
  const [openClipId, setOpenClipId] = useState<string | null>(null);
  const updateClip = useAetosStore((s) => s.updateClip);
  const clips = [...branch.timeline.clips].sort((a, b) => a.order - b.order);

  const selectedClip = clips.find((c) => c.id === openClipId);

  // Real-time playback simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const rulerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const startTime = Date.now() - currentTime * 1000;
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= branch.timeline.duration) {
        setIsPlaying(false);
        setCurrentTime(0);
      } else {
        setCurrentTime(elapsed);
      }
    }, 33); // ~30 fps
    
    return () => clearInterval(interval);
  }, [isPlaying, branch.timeline.duration]);

  // Handle playhead scrubbing drag
  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = clickX / rect.width;
      const newTime = Math.max(0, Math.min(branch.timeline.duration, pct * branch.timeline.duration));
      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, branch.timeline.duration]);

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    const newTime = Math.max(0, Math.min(branch.timeline.duration, pct * branch.timeline.duration));
    setCurrentTime(newTime);
  };

  // Trimming right edge of clip (End duration)
  const handleRightTrimMouseDown = (clipId: string, start: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const relativeX = moveEvent.clientX - rect.left;
      const computedEnd = (relativeX / rect.width) * branch.timeline.duration;
      // Guarantee at least 1 second clip duration
      const newEnd = Math.max(start + 1, Math.min(branch.timeline.duration, computedEnd));
      updateClip(branch.id, clipId, { end: newEnd });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Trimming left edge of clip (Start duration)
  const handleLeftTrimMouseDown = (clipId: string, end: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const relativeX = moveEvent.clientX - rect.left;
      const computedStart = (relativeX / rect.width) * branch.timeline.duration;
      // Guarantee at least 1 second clip duration
      const newStart = Math.max(0, Math.min(end - 1, computedStart));
      updateClip(branch.id, clipId, { start: newStart });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="bg-[#151413] border border-[#2c2a27] rounded-xl overflow-hidden flex flex-col font-sans select-none text-[11px] text-zinc-400">
      
      {/* 1. TIMELINE CONTROLS TOOLBAR */}
      <div className="h-9 border-b border-[#2c2a27] bg-[#1a1918] flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-6 w-8 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white flex items-center justify-center text-[10px] font-semibold transition-colors"
            title={isPlaying ? "Pause Timeline" : "Play Timeline"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button 
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="h-6 w-8 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white flex items-center justify-center text-[9px] font-semibold transition-colors"
            title="Rewind to Start"
          >
            ⏮
          </button>
          <div className="h-4 w-px bg-zinc-700 mx-1" />
          <span className="font-mono text-zinc-300 font-medium text-[11px]">
            {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(branch.timeline.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] uppercase font-mono text-zinc-500 tracking-wider">Drag playhead to scrub</span>
        </div>
      </div>

      {/* 2. TIMELINE RULER TRACK */}
      <div className="h-6 border-b border-[#2c2a27] bg-[#1a1918] flex relative overflow-hidden">
        {/* Left header space */}
        <div className="w-12 border-r border-[#2c2a27] shrink-0" />
        
        {/* Ruler ticks every 5 seconds */}
        <div 
          ref={rulerRef}
          onMouseDown={handleRulerMouseDown}
          className="flex-grow relative h-full cursor-ew-resize select-none"
        >
          {Array.from({ length: Math.ceil(branch.timeline.duration / 5) + 1 }).map((_, i) => {
            const sec = i * 5;
            const leftPct = (sec / branch.timeline.duration) * 100;
            return (
              <div 
                key={sec} 
                className="absolute h-full flex flex-col justify-between pointer-events-none" 
                style={{ left: `${leftPct}%` }}
              >
                <span className="text-[8px] font-mono text-zinc-500 pl-1">{sec}s</span>
                <div className="h-1.5 w-px bg-zinc-600" />
              </div>
            );
          })}
          
          {/* FCP Red Playhead Line - moving in real-time */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none" 
            style={{ left: `${(currentTime / branch.timeline.duration) * 100}%` }}
          >
            <div className="absolute top-0 -left-1.5 w-3 h-3 bg-red-500 rotate-45 border border-white" />
          </div>
        </div>
      </div>

      {/* 3. MULTITRACK RAILS CONTAINER */}
      <div className="flex flex-col bg-black/40">
        
        {/* TRACK 1: Text / Captions Track (T1) */}
        <div className="flex border-b border-[#2c2a27] h-8 items-stretch relative">
          <div className="w-12 border-r border-[#2c2a27] bg-[#1a1918] flex items-center justify-center font-mono font-bold text-zinc-600 shrink-0 text-[10px]">
            T1
          </div>
          <div className="flex-grow relative bg-zinc-950/20">
            {clips.map((clip) => {
              const startPct = (clip.start / branch.timeline.duration) * 100;
              const widthPct = ((clip.end - clip.start) / branch.timeline.duration) * 100;
              return (
                <div 
                  key={clip.id}
                  onClick={() => setOpenClipId(clip.id)}
                  className="absolute top-1 bottom-1 bg-[#f2a94e]/10 border border-[#f2a94e]/20 hover:border-[#f2a94e]/40 rounded px-1.5 flex items-center justify-start text-[9px] text-[#f2a94e] font-sans truncate cursor-pointer hover:bg-[#f2a94e]/15 transition-all"
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  title={clip.caption}
                >
                  "{clip.caption}"
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 2: Video Clips Track (V1) */}
        <div className="flex border-b border-[#2c2a27] h-14 items-stretch relative">
          <div className="w-12 border-r border-[#2c2a27] bg-[#1a1918] flex items-center justify-center font-mono font-bold text-zinc-600 shrink-0 text-[10px]">
            V1
          </div>
          <div className="flex-grow relative bg-zinc-950/40">
            {clips.map((clip) => {
              const startPct = (clip.start / branch.timeline.duration) * 100;
              const widthPct = ((clip.end - clip.start) / branch.timeline.duration) * 100;
              const isSelected = openClipId === clip.id;
              return (
                <div
                  key={clip.id}
                  onClick={() => setOpenClipId(isSelected ? null : clip.id)}
                  className={`absolute top-1 bottom-1 rounded-lg border-l-4 p-1.5 flex flex-col justify-between cursor-pointer group transition-all ${
                    isSelected 
                      ? 'bg-zinc-800 border border-teal/60 border-l-teal shadow-lg scale-[1.01] z-20' 
                      : 'bg-teal/10 border border-hairline border-l-teal hover:bg-teal/20'
                  }`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                >
                  {/* Left Trim Handle */}
                  <div 
                    onMouseDown={(e) => handleLeftTrimMouseDown(clip.id, clip.end, e)}
                    className="absolute left-0 top-0 bottom-0 w-2.5 bg-teal/40 opacity-0 group-hover:opacity-100 cursor-ew-resize flex items-center justify-center text-[8px] font-bold text-teal-200"
                    title="Trim Start"
                  >
                    ⟨
                  </div>

                  <div className="flex items-center justify-between font-semibold text-white text-[10px] px-2.5">
                    <span className="truncate">{clip.name}</span>
                    <span className="font-mono text-[8px] opacity-75">{Math.round((clip.end - clip.start) * 10) / 10}s</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono px-2.5">
                    <span className="truncate">{clip.transition || 'cut'}</span>
                    <span>Composition</span>
                  </div>

                  {/* Right Trim Handle */}
                  <div 
                    onMouseDown={(e) => handleRightTrimMouseDown(clip.id, clip.start, e)}
                    className="absolute right-0 top-0 bottom-0 w-2.5 bg-teal/40 opacity-0 group-hover:opacity-100 cursor-ew-resize flex items-center justify-center text-[8px] font-bold text-teal-200"
                    title="Trim End"
                  >
                    ⟩
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 3: Ambient Audio Track (A1) */}
        <div className="flex h-10 items-stretch relative">
          <div className="w-12 border-r border-[#2c2a27] bg-[#1a1918] flex items-center justify-center font-mono font-bold text-zinc-600 shrink-0 text-[10px]">
            A1
          </div>
          <div className="flex-grow relative bg-[#090909] flex items-center">
            <div className="absolute inset-x-0 inset-y-1 bg-green-500/10 border border-green-500/20 rounded flex items-center justify-between px-3">
              <span className="text-green-500 font-mono font-bold text-[8px]">ambient_hype_music.wav</span>
              
              <svg className="w-full max-w-[360px] h-6 text-green-500/40" fill="currentColor" viewBox="0 0 100 20">
                <rect x="2" y="5" width="1.5" height="10" />
                <rect x="6" y="2" width="1.5" height="16" />
                <rect x="10" y="7" width="1.5" height="6" />
                <rect x="14" y="4" width="1.5" height="12" />
                <rect x="18" y="9" width="1.5" height="2" />
                <rect x="22" y="1" width="1.5" height="18" />
                <rect x="26" y="5" width="1.5" height="10" />
                <rect x="30" y="8" width="1.5" height="4" />
                <rect x="34" y="3" width="1.5" height="14" />
                <rect x="38" y="6" width="1.5" height="8" />
                <rect x="42" y="9" width="1.5" height="2" />
                <rect x="46" y="2" width="1.5" height="16" />
                <rect x="50" y="5" width="1.5" height="10" />
                <rect x="54" y="7" width="1.5" height="6" />
                <rect x="58" y="4" width="1.5" height="12" />
                <rect x="62" y="8" width="1.5" height="4" />
                <rect x="66" y="1" width="1.5" height="18" />
                <rect x="70" y="5" width="1.5" height="10" />
                <rect x="74" y="3" width="1.5" height="14" />
                <rect x="78" y="6" width="1.5" height="8" />
                <rect x="82" y="9" width="1.5" height="2" />
                <rect x="86" y="2" width="1.5" height="16" />
                <rect x="90" y="5" width="1.5" height="10" />
                <rect x="94" y="7" width="1.5" height="6" />
                <rect x="98" y="4" width="1.5" height="12" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* 4. TIMELINE INSPECTOR BOX (Pulls out when clip is selected) */}
      <AnimatePresence>
        {selectedClip && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="border-t border-[#2c2a27] bg-[#1a1918] p-3 flex flex-col sm:flex-row gap-4 items-end"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold font-mono">Clip Inspector: {selectedClip.name}</span>
                <span className="text-zinc-500 font-mono text-[9px]">{selectedClip.start}s - {selectedClip.end}s</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Caption Text</span>
                  <input
                    className="rounded border border-[#2c2a27] bg-black/60 px-2 py-1 text-xs text-white focus:border-teal/50 focus:outline-none"
                    value={selectedClip.caption ?? ""}
                    onChange={(e) =>
                      updateClip(branch.id, selectedClip.id, { caption: e.target.value })
                    }
                  />
                </label>
                
                <label className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Transition Style</span>
                  <select
                    className="rounded border border-[#2c2a27] bg-black/60 px-2 py-1 text-xs text-white focus:border-teal/50 focus:outline-none"
                    value={selectedClip.transition ?? "cut"}
                    onChange={(e) =>
                      updateClip(branch.id, selectedClip.id, { transition: e.target.value })
                    }
                  >
                    {TRANSITIONS.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
                
                <label className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Editor Notes</span>
                  <input
                    className="rounded border border-[#2c2a27] bg-black/60 px-2 py-1 text-xs text-white focus:border-teal/50 focus:outline-none"
                    value={selectedClip.notes ?? ""}
                    onChange={(e) =>
                      updateClip(branch.id, selectedClip.id, { notes: e.target.value })
                    }
                  />
                </label>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setOpenClipId(null)}
              className="bg-black/60 border border-[#2c2a27] hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] px-3 py-1.5 rounded transition-colors"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
