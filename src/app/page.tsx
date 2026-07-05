"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { EtherealShadow } from "@/components/ui/etheral-shadow";
import { Player } from "@remotion/player";
import { BranchComposition } from "@/remotion/BranchComposition";

// Type definitions matching the Aetos data models
interface GlobalStyle {
  pacing: string;
  colorGrade: string;
  musicMood: string;
  captionStyle: string;
  brandTone: string;
}

interface TimelineClip {
  id: string;
  name: string;
  duration: number;
  caption: string;
  transition: string;
}

interface Timeline {
  id: string;
  name: string;
  duration: number;
  globalStyle: GlobalStyle;
  clips: TimelineClip[];
  status: "draft" | "approved" | "merged";
}

// Seed data representing agent-created branches for the YC launch video demo.
const INITIAL_BRANCHES: Record<string, Timeline> = {
  main: {
    id: "main",
    name: "Main Cut",
    duration: 60,
    status: "draft",
    globalStyle: {
      pacing: "medium",
      colorGrade: "neutral",
      musicMood: "calm",
      captionStyle: "minimal_white",
      brandTone: "clear_b2b",
    },
    clips: [
      { id: "c1", name: "Hook", duration: 8, caption: "A startup launch video for social and investor audiences", transition: "fade" },
      { id: "c2", name: "Problem", duration: 12, caption: "Video teams still ship final_v7 chaos", transition: "cut" },
      { id: "c3", name: "Product Demo", duration: 18, caption: "Agents create cuts in versioned branches", transition: "slide" },
      { id: "c4", name: "Customer Proof", duration: 12, caption: "Teams merge the best creative decisions", transition: "cut" },
      { id: "c5", name: "CTA", duration: 10, caption: "Launch the agent workspace", transition: "fade_out" },
    ],
  },
  "fast-reel": {
    id: "fast-reel",
    name: "Fast Reel Cut",
    duration: 39,
    status: "draft",
    globalStyle: {
      pacing: "fast",
      colorGrade: "warm",
      musicMood: "energetic",
      captionStyle: "bold_yellow",
      brandTone: "confident_and_clear",
    },
    clips: [
      { id: "c1", name: "Hook", duration: 3, caption: "Stop reviewing five final files", transition: "cut" },
      { id: "c2", name: "Problem", duration: 8, caption: "Agents need branches, scores, and approvals", transition: "cut" },
      { id: "c3", name: "Product Demo", duration: 12, caption: "Run viral, story, and brand-safe cuts in parallel", transition: "quick_zoom" },
      { id: "c4", name: "Customer Proof", duration: 8, caption: "Merge what wins. Reject what drifts.", transition: "cut" },
      { id: "c5", name: "CTA", duration: 8, caption: "Run the agent arena", transition: "flash" },
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Investor Cut",
    duration: 53,
    status: "draft",
    globalStyle: {
      pacing: "medium_fast",
      colorGrade: "premium_warm",
      musicMood: "cinematic",
      captionStyle: "clean_white",
      brandTone: "elevated_and_bold",
    },
    clips: [
      { id: "c1", name: "Hook", duration: 5, caption: "Git, Figma, and Gym for video agents", transition: "cross_dissolve" },
      { id: "c2", name: "Problem", duration: 11, caption: "Autonomous edits need creative decision history", transition: "cut" },
      { id: "c3", name: "Product Demo", duration: 16, caption: "Verifier scores every versioned branch", transition: "fade_to_black" },
      { id: "c4", name: "Customer Proof", duration: 11, caption: "Human approval becomes the strongest reward signal", transition: "cut" },
      { id: "c5", name: "CTA", duration: 10, caption: "Compare branches", transition: "fade_out" },
    ],
  },
  story: {
    id: "story",
    name: "Story Cut",
    duration: 48,
    status: "draft",
    globalStyle: {
      pacing: "story_first",
      colorGrade: "warm",
      musicMood: "focused",
      captionStyle: "bold_white",
      brandTone: "confident_and_clear",
    },
    clips: [
      { id: "c1", name: "Hook", duration: 4, caption: "One raw video becomes an agent learning loop", transition: "cut" },
      { id: "c2", name: "Problem", duration: 9, caption: "Revision feedback disappears after each export", transition: "cut" },
      { id: "c3", name: "Product Demo", duration: 12, caption: "Aetos preserves every attempt as a semantic diff", transition: "slide" },
      { id: "c4", name: "Customer Proof", duration: 13, caption: "Approved edits update reward memory", transition: "cut" },
      { id: "c5", name: "CTA", duration: 10, caption: "Merge best decisions", transition: "fade_out" },
    ],
  },
  "brand-safe": {
    id: "brand-safe",
    name: "Brand-Safe Cut",
    duration: 52,
    status: "draft",
    globalStyle: {
      pacing: "controlled",
      colorGrade: "premium_warm",
      musicMood: "restrained",
      captionStyle: "clean_white",
      brandTone: "brand_safe",
    },
    clips: [
      { id: "c1", name: "Hook", duration: 4, caption: "Autonomous editing with human judgment intact", transition: "cut" },
      { id: "c2", name: "Problem", duration: 10, caption: "Not every viral idea should survive review", transition: "cut" },
      { id: "c3", name: "Product Demo", duration: 15, caption: "Verifier checks hook, pacing, CTA, and brand fit", transition: "fade_to_black" },
      { id: "c4", name: "Customer Proof", duration: 13, caption: "Teams approve specific changes, not whole exports", transition: "cut" },
      { id: "c5", name: "CTA", duration: 10, caption: "Score agent cuts", transition: "fade_out" },
    ],
  },
};

// Framer motion variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const workflowSteps = [
  {
    title: "Upload Raw Video",
    body: "Start with one unedited video or timeline export.",
  },
  {
    title: "Launch Agents",
    body: "Aetos creates multiple editing agents with different goals: viral, premium, story, and brand-safe.",
  },
  {
    title: "Create Branches",
    body: "Each agent works in its own versioned sandbox without touching the main cut.",
  },
  {
    title: "Score Outputs",
    body: "A verifier scores every branch on hook, pacing, captions, CTA, brand fit, and technical quality.",
  },
  {
    title: "Learn From Approvals",
    body: "Approvals, rejections, comments, and merges become reward signals for future agents.",
  },
];

const agentCards = [
  {
    name: "Viral Agent",
    score: "82 / 100",
    body: "Optimizes for hook strength, fast pacing, retention, and short-form energy.",
    output: ["Intro cut from 8s to 3s", "CTA moved earlier", "Captions made punchier"],
  },
  {
    name: "Premium Agent",
    score: "76 / 100",
    body: "Optimizes for polish, brand safety, clean transitions, and premium tone.",
    output: ["Reduced flashy transitions", "Softened music mood", "Improved brand consistency"],
  },
  {
    name: "Story Agent",
    score: "88 / 100",
    body: "Optimizes for narrative order, emotional clarity, and viewer understanding.",
    output: ["Reordered clips", "Moved proof earlier", "Improved story arc"],
  },
  {
    name: "Brand Agent",
    score: "91 / 100",
    body: "Optimizes for client style, previous approvals, and brand guidelines.",
    output: ["Rejected meme effects", "Kept warm color grade", "Matched caption pattern"],
  },
];

const verifierCriteria = [
  "Hook strength",
  "Pacing",
  "Caption readability",
  "CTA placement",
  "Brand fit",
  "Transition quality",
  "Audio clarity",
  "Technical quality",
];

const outcomeCards = [
  {
    title: "Fewer Revisions",
    body: "Teams compare branches instead of rewatching five final files manually.",
  },
  {
    title: "Faster Approvals",
    body: "Clients review clear creative differences and approve specific changes.",
  },
  {
    title: "More Output",
    body: "The same team can ship more videos because agents explore directions in parallel.",
  },
  {
    title: "Compounding Learning",
    body: "Every approved edit improves the next agent run.",
  },
];

export default function VercelStyleLanding() {
  const [branches, setBranches] = useState<Record<string, Timeline>>(INITIAL_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("main");
  const [compareBranchId, setCompareBranchId] = useState<string>("fast-reel");
  
  // Interactive choices
  const [selectedChanges, setSelectedChanges] = useState<string[]>([
    "hookLength",
    "captionStyle",
    "ctaTime",
  ]);
  const [isMerged, setIsMerged] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<"cuts" | "diff" | "memory">("cuts");

  // Simulated Team Memory state
  const [teamMemory, setTeamMemory] = useState({
    pacing: "medium",
    hookLengthPreference: "under 4 seconds",
    captionStyle: "bold_high_contrast",
    colorGrade: "warm_cinematic",
    musicMood: "energetic_but_not_loud",
    ctaPlacement: "before 30 seconds",
    confidence: 0.52,
    brandMatchScore: 55,
  });

  // Auto-playing storyboard state for Style Memory section
  const [storyStep, setStoryStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setStoryStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  // 3D Parallax Tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const xVal = (e.clientX - box.left) / box.width;
    const yVal = (e.clientY - box.top) / box.height;
    const rotateY = (xVal - 0.5) * 12; // -6deg to 6deg (subtle and premium)
    const rotateX = (0.5 - yVal) * 12; // 6deg to -6deg
    setTilt({ x: rotateX, y: rotateY });
    setGlare({ x: xVal * 100, y: yVal * 100 });
  };
  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const activeTimeline = useMemo(() => {
    return branches[selectedBranchId] || branches["main"];
  }, [branches, selectedBranchId]);

  const remotionTimeline = useMemo(() => {
    return {
      duration: activeTimeline.duration,
      globalStyle: {
        pacing: activeTimeline.globalStyle.pacing,
        colorGrade: activeTimeline.globalStyle.colorGrade,
        musicMood: activeTimeline.globalStyle.musicMood,
        captionStyle: activeTimeline.globalStyle.captionStyle,
        brandTone: activeTimeline.globalStyle.brandTone,
      },
      clips: activeTimeline.clips.map((clip, i) => {
        let start = 0;
        for (let j = 0; j < i; j++) {
          start += activeTimeline.clips[j].duration;
        }
        return {
          id: clip.id,
          name: clip.name,
          type: "video" as const,
          start,
          end: start + clip.duration,
          order: i,
          caption: clip.caption,
          transition: clip.transition,
        };
      }),
      audio: {
        musicMood: activeTimeline.globalStyle.musicMood,
        volume: 0.5,
        voiceoverVolume: 0.8,
      },
      captions: {
        style: activeTimeline.globalStyle.captionStyle,
        font: "Space Grotesk",
        size: "md",
        position: "bottom",
      },
    };
  }, [activeTimeline]);

  // Compute semantic differences between Base (Main Cut) and selected Target
  const currentDiff = useMemo(() => {
    const base = branches["main"];
    const target = branches[compareBranchId] || branches["fast-reel"];

    const baseHook = base.clips.find((c) => c.name === "Hook")?.duration || 8;
    const targetHook = target.clips.find((c) => c.name === "Hook")?.duration || 3;

    const baseCTA = base.clips.reduce((acc, c, idx) => {
      if (c.name === "CTA") return acc;
      return acc + c.duration;
    }, 0);
    const targetCTA = target.clips.reduce((acc, c, idx) => {
      if (c.name === "CTA") return acc;
      return acc + c.duration;
    }, 0);

    return {
      summary: `${target.name} is an agent-generated branch. It shortens the hook by ${
        baseHook - targetHook
      }s, changes the caption style to ${target.globalStyle.captionStyle.replace(
        "_",
        " ",
      )}, switches music to ${target.globalStyle.musicMood}, and moves the CTA to an earlier time.`,
      changes: [
        {
          id: "hookLength",
          label: "Hook duration",
          before: `${baseHook}s`,
          after: `${targetHook}s`,
          impact: "high" as const,
          category: "pacing" as const,
        },
        {
          id: "captionStyle",
          label: "Caption style",
          before: base.globalStyle.captionStyle.replace("_", " "),
          after: target.globalStyle.captionStyle.replace("_", " "),
          impact: "medium" as const,
          category: "captions" as const,
        },
        {
          id: "musicMood",
          label: "Music mood",
          before: base.globalStyle.musicMood,
          after: target.globalStyle.musicMood,
          impact: "medium" as const,
          category: "audio" as const,
        },
        {
          id: "ctaTime",
          label: "CTA placement",
          before: `${baseCTA}s`,
          after: `${targetCTA}s`,
          impact: "high" as const,
          category: "cta" as const,
        },
      ],
      recommendation: `Keep the strongest hook and CTA move. Reject any music or transition choices that weaken brand fit.`,
    };
  }, [branches, compareBranchId]);

  // Selective Merge Trigger
  const handleMerge = () => {
    setIsMerging(true);
    setTimeout(() => {
      const base = branches["main"];
      const target = branches[compareBranchId];

      // Clone main timeline
      const mergedTimeline = JSON.parse(JSON.stringify(base)) as Timeline;
      mergedTimeline.id = "merged-cut";
      mergedTimeline.name = `Main Cut + Merged ${target.name.split(" ")[0]}`;
      mergedTimeline.status = "merged";

      // Apply selected edits
      if (selectedChanges.includes("hookLength")) {
        const targetHook = target.clips.find((c) => c.name === "Hook");
        const mergedHook = mergedTimeline.clips.find((c) => c.name === "Hook");
        if (targetHook && mergedHook) {
          mergedHook.duration = targetHook.duration;
          mergedHook.caption = targetHook.caption;
        }
      }
      if (selectedChanges.includes("captionStyle")) {
        mergedTimeline.globalStyle.captionStyle = target.globalStyle.captionStyle;
      }
      if (selectedChanges.includes("musicMood")) {
        mergedTimeline.globalStyle.musicMood = target.globalStyle.musicMood;
      }
      if (selectedChanges.includes("ctaTime")) {
        const targetCTA = target.clips.find((c) => c.name === "CTA");
        const mergedCTA = mergedTimeline.clips.find((c) => c.name === "CTA");
        if (targetCTA && mergedCTA) {
          mergedCTA.duration = targetCTA.duration;
          mergedCTA.caption = targetCTA.caption;
        }
      }

      // Recompute total duration
      mergedTimeline.duration = mergedTimeline.clips.reduce((acc, c) => acc + c.duration, 0);

      // Save branch
      setBranches((prev) => ({
        ...prev,
        "merged-cut": mergedTimeline,
      }));

      setSelectedBranchId("merged-cut");
      setIsMerged(true);
      setIsMerging(false);
      setActiveTab("cuts");
      
      // Update memory preview scores slightly on merge
      setTeamMemory(prev => ({
        ...prev,
        brandMatchScore: 78
      }));
    }, 1100);
  };

  // Approve Cut & Update Memory Trigger
  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      setIsApproved(true);
      setIsApproving(false);
      setTeamMemory((prev) => ({
        ...prev,
        confidence: 0.88,
        brandMatchScore: 96,
        pacing: "fast",
        captionStyle: "bold_white",
        musicMood: "restrained_energy",
        ctaPlacement: "before 30 seconds",
      }));
      setActiveTab("memory");
    }, 1200);
  };

  // Reset Playground
  const handleResetPlayground = () => {
    setBranches(INITIAL_BRANCHES);
    setSelectedBranchId("main");
    setCompareBranchId("fast-reel");
    setSelectedChanges(["hookLength", "captionStyle", "ctaTime"]);
    setIsMerged(false);
    setIsApproved(false);
    setActiveTab("cuts");
    setTeamMemory({
      pacing: "medium",
      hookLengthPreference: "under 4 seconds",
      captionStyle: "bold_high_contrast",
      colorGrade: "warm_cinematic",
      musicMood: "energetic_but_not_loud",
      ctaPlacement: "before 30 seconds",
      confidence: 0.52,
      brandMatchScore: 55,
    });
  };

  return (
    <div className="flex flex-1 flex-col bg-[#050505] text-[#f4f4ef] overflow-x-hidden relative font-sans">
      
      {/* Blinking cursor animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink-cursor {
          animation: blink 1.1s step-start infinite;
        }
        .ascii-texture-vercel {
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 0.5px, transparent 0.5px);
          background-size: 8px 8px;
        }
      `}} />

      {/* ---------- HEADER ---------- */}
      <header className="border-b border-[#1c1b19] bg-[#050505]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Minimal App Icon */}
            <div className="h-5 w-5 grid grid-cols-2 gap-0.5">
              <div className="bg-[#f2a94e] rounded-[2px]" />
              <div className="bg-[#f2a94e]/40 rounded-[2px]" />
              <div className="bg-[#f2a94e]/40 rounded-[2px]" />
              <div className="bg-[#f2a94e] rounded-[2px]" />
            </div>
            <span className="font-semibold tracking-tight text-white text-base">Aetos</span>
          </div>

          {/* Navigation links - matching references */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-zinc-400">
            <Link href="#overview" className="hover:text-white transition-colors">Overview</Link>
            <Link href="#agent-arena" className="hover:text-white transition-colors">Agent Arena</Link>
            <Link href="#version-control" className="hover:text-white transition-colors">Version Control</Link>
            <Link href="#reward-layer" className="hover:text-white transition-colors">Reward Layer</Link>
            <Link href="#interactive-workspace" className="hover:text-white transition-colors">Demo</Link>
          </nav>

          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Login</Link>
            <Link href="/dashboard" className="bg-[#efe9df] text-black font-medium px-4 py-1.5 rounded-lg hover:bg-white transition-colors">
              Signup
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- HERO SECTION ---------- */}
      <section id="overview" className="relative pt-20 pb-16 overflow-hidden">
        {/* Soft atmospheric gradient glow */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <EtherealShadow
            color="rgba(242, 169, 78, 0.02)"
            animation={{ scale: 65, speed: 20 }}
            noise={{ opacity: 0.1, scale: 1 }}
            sizing="fill"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-6">
          {/* Two-Column Split Layout */}
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            
            {/* Left Column: Heading with word-by-word stagger */}
            <div className="lg:col-span-7">
              <div className="mb-5 text-[11px] font-mono uppercase tracking-widest text-[#f2a94e]">
                Git + Figma + Gym for autonomous video agents
              </div>
              <h1 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.08] flex flex-wrap gap-x-2.5 sm:gap-x-3.5 gap-y-0.5 sm:gap-y-1.5">
                {"A collaborative learning environment for video editing agents.".split(" ").map((word, idx) => {
                  const isEditors = word === "agents.";
                  return (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                      className="inline-block"
                    >
                      {word}
                      {isEditors && <span className="blink-cursor text-[#f2a94e] font-light">|</span>}
                    </motion.span>
                  );
                })}
              </h1>
            </div>

            {/* Right Column: Paragraph and Call-to-action */}
            <div className="lg:col-span-5 lg:pt-3 space-y-6">
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
                Launch multiple AI editors on the same raw video, compare their cuts as versioned branches, score them with a verifier, and turn team approvals into reward signals for future edits.
              </p>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#f2a94e]">
                RL-ready workspace for autonomous video agents
              </div>
              <div className="flex items-center gap-4">
                <Link href="/project/project-yc-launch" className="bg-[#efe9df] text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-white transition-colors text-sm shadow-lg shadow-[#f2a94e]/5">
                  Launch Agent Workspace
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------- PARTNERS LOGO ROW WITH INFINITE MARQUEE ---------- */}
      <section className="border-y border-[#1c1b19] py-6 bg-black z-10 relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 relative">
          
          {/* Edge gradients overlay */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <div className="flex w-full overflow-hidden select-none">
            <motion.div
              className="flex gap-16 shrink-0 py-2 whitespace-nowrap min-w-full"
              animate={{ x: [0, "-50%"] }}
              transition={{
                ease: "linear",
                duration: 25,
                repeat: Infinity,
              }}
            >
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-24 opacity-45 hover:opacity-90 transition-opacity duration-300">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg" className="h-10 w-10 object-contain" alt="Adobe Premiere Pro" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/90/FinalCutProACS2026.png" className="h-11 w-11 object-contain" alt="Apple Final Cut Pro" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/90/DaVinci_Resolve_17_logo.svg" className="h-10 w-10 object-contain" alt="DaVinci Resolve" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Capcut-icon.png" className="h-10 w-10 object-contain" alt="CapCut" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" className="h-10 w-7.5 object-contain" alt="Figma" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" className="h-10 w-10 object-contain" alt="Slack" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" className="h-10 w-10 object-contain" alt="OpenAI" />
                  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" className="h-10 w-10 invert object-contain" alt="GitHub" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg" className="h-10 w-10 object-contain" alt="Adobe Photoshop" />
                </div>
              ))}
            </motion.div>
          </div>

        </div>
      </section>

      {/* ---------- MAIN WORKSPACE MOCKUP (INTERACTIVE) ---------- */}
      <section id="interactive-workspace" className="py-20 bg-[#050505] relative z-10" style={{ perspective: 1200 }}>
        <motion.div 
          initial={{ opacity: 0, y: 100, rotateX: 18, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="mx-auto max-w-[1400px] px-6"
        >
          
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Interactive Walkthrough</span>
              <h2 className="text-xl sm:text-2xl font-medium text-white">Watch agents create, compare, and merge video cuts.</h2>
              <p className="text-sm text-zinc-500 mt-2 max-w-2xl">
                One raw video becomes multiple agent-generated branches. Aetos tracks what changed, scores each cut, and lets the team merge only the best creative decisions.
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-mono">YC Startup Launch Video project mockup</span>
          </div>

          {/* Inner 3D Hover Tilt container */}
          <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ rotateX: tilt.x, rotateY: tilt.y }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full group cursor-default"
          >
            {/* Vercel-Style App Frame with Linear Warm-Charcoal Color Palette */}
            <div className="border border-[#1c1b19] bg-[#0c0b0b] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:grid md:grid-cols-12 min-h-[580px] text-zinc-300">
              {/* 3D glare reflection effect */}
              <div 
                className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, rgba(242, 169, 78, 0.06), transparent)`,
                }}
              />
            
            {/* 1. Sidebar - Left (Columns 1-3) */}
            <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-[#1c1b19] bg-[#0c0b0b] p-4 flex flex-col gap-6 text-[13px]">
              
              {/* Sidebar Header Dropdown */}
              <div className="flex items-center justify-between text-white font-medium pb-2 border-b border-[#1c1b19]/60">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-[#f2a94e] rounded-sm flex items-center justify-center text-[10px] text-black font-mono font-bold">A</div>
                  <span>Aetos Workspace</span>
                </div>
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Main Navigation links */}
              <div className="space-y-1 text-zinc-400">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#1c1b19] text-[#f2a94e] font-medium cursor-pointer">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                    </svg>
                    <span>Inbox</span>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">12</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-[#1c1b19]/40 hover:text-zinc-200 rounded-lg cursor-pointer">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Agent arena</span>
                </div>
                <div className="flex items-center gap-2 p-2 hover:bg-[#1c1b19]/40 hover:text-zinc-200 rounded-lg cursor-pointer">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Reward memory</span>
                </div>
              </div>

              {/* Cuts/Branches List */}
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block px-2">Agent Branches</span>
                <div className="space-y-1">
                  {Object.values(branches).map((branch) => {
                    const isSelected = selectedBranchId === branch.id;
                    return (
                      <div
                        key={branch.id}
                        onClick={() => setSelectedBranchId(branch.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          isSelected ? "bg-[#1c1b19] text-white font-medium border-l-2 border-[#f2a94e]" : "text-zinc-400 hover:bg-[#1c1b19]/40 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-[#f2a94e]" : "bg-zinc-600"}`} />
                          <span className="truncate">{branch.name}</span>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-1 rounded bg-black/60 border border-zinc-900 scale-90">
                          {branch.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Favorites list */}
              <div className="space-y-1 mt-auto">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block px-2">Favorites</span>
                <div className="text-zinc-400 p-2 rounded hover:bg-[#1c1b19]/40 cursor-pointer truncate">* Faster social hook</div>
                <div className="text-zinc-400 p-2 rounded hover:bg-[#1c1b19]/40 cursor-pointer truncate">* YC Launch Video</div>
              </div>

            </div>

            {/* 2. Main Workspace Center - Warm Charcoal `#121110` (Columns 4-12) */}
            <div className="md:col-span-9 flex flex-col p-6 bg-[#121110] relative">
              
              {/* Center Panel Header */}
              <div className="flex items-center justify-between border-b border-[#1c1b19] pb-4 mb-6 text-[13px]">
                <div className="flex items-center gap-2.5">
                  <span className="text-white font-medium text-base">YC Startup Launch Video</span>
                  <span className="bg-[#1c1b19] border border-[#2c2a27] text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded">
                    ENG-2703
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                  <span>02 / 145 cuts</span>
                  <span className="text-zinc-800">|</span>
                  <button onClick={handleResetPlayground} className="text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
                    Reset demo
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-6 items-start flex-grow">
                
                {/* 2.1 Timeline Preview & Controls (Columns 1-7) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Active Cut Detail Card */}
                  <div className="p-4 rounded-xl border border-[#1c1b19] bg-[#0c0b0b]/60 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                          {activeTimeline.name}
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f2a94e] animate-pulse" />
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Agent sandbox output for the YC Startup Launch Video.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {activeTimeline.duration}s
                      </span>
                    </div>

                    {/* Timeline Tracks Graph */}
                    <div className="space-y-1.5 pt-2 border-t border-[#1c1b19]">
                      <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mb-1">
                        <span>tracks timeline</span>
                        <span>relative scale</span>
                      </div>
                      
                      <div className="flex w-full h-8 gap-0.5 bg-black/60 border border-zinc-900 p-0.5 rounded-lg relative overflow-hidden">
                        <AnimatePresence>
                          {activeTimeline.clips.map((clip) => {
                            const pct = (clip.duration / activeTimeline.duration) * 100;
                            return (
                              <motion.div
                                key={clip.id}
                                layoutId={`clip-mock-${clip.id}`}
                                style={{ width: `${pct}%` }}
                                transition={{ type: "spring", stiffness: 140, damping: 15 }}
                                className={`h-full rounded flex items-center justify-center border text-[9px] font-semibold truncate ${
                                  clip.name === "Hook"
                                    ? "bg-[#f2a94e]/10 border-[#f2a94e]/20 text-[#f2a94e]"
                                    : clip.name === "CTA"
                                    ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                                    : "bg-zinc-900/60 border-[#1c1b19] text-zinc-400"
                                }`}
                              >
                                {clip.name}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Video Screen Simulation - Showing the Live Remotion Player */}
                  <div className="aspect-video w-full rounded-xl border border-[#1c1b19] bg-black overflow-hidden relative shadow-2xl">
                    <Player
                      key={selectedBranchId + (isMerged ? "-merged" : "")}
                      component={BranchComposition}
                      inputProps={{ timeline: remotionTimeline }}
                      durationInFrames={Math.max(1, Math.round(remotionTimeline.duration * 30))}
                      fps={30}
                      compositionWidth={1280}
                      compositionHeight={720}
                      style={{ width: "100%", height: "100%" }}
                      controls
                      loop
                    />
                  </div>

                </div>

                {/* 2.2 Metadata details & Compare panel (Columns 8-12) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Task details panel - Warm Charcoal `bg-[#0c0b0b]` */}
                  <div className="p-4 rounded-xl border border-[#1c1b19] bg-[#0c0b0b]/60 space-y-4 text-xs text-zinc-400">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Cut Metadata</span>
                      <div className="flex justify-between items-center text-white py-1 border-b border-[#1c1b19]/60">
                        <span>Status</span>
                        <span className="text-[#f2a94e] flex items-center gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f2a94e] animate-pulse" />
                          In Progress
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#1c1b19]/60">
                        <span>Verifier Score</span>
                        <span className="text-zinc-200">{activeTimeline.id === "brand-safe" ? "91" : activeTimeline.id === "story" ? "88" : activeTimeline.id === "fast-reel" ? "82" : activeTimeline.id === "premium" ? "76" : "84"} / 100</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#1c1b19]/60">
                        <span>Hook</span>
                        <span className="text-zinc-200">{activeTimeline.clips[0]?.duration <= 4 ? "Strong" : "Needs trim"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#1c1b19]/60">
                        <span>Pacing</span>
                        <span className="text-zinc-200 uppercase">{activeTimeline.globalStyle.pacing}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#1c1b19]/60">
                        <span>Audio setup</span>
                        <span className="text-zinc-200">{activeTimeline.globalStyle.musicMood} mood</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#1c1b19]/60">
                        <span>Brand Fit</span>
                        <span className="text-zinc-200">{activeTimeline.id === "fast-reel" ? "Medium" : "High"}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span>Pending Merge</span>
                        <span className="text-[#f2a94e] font-mono">{selectedChanges.length} changes</span>
                      </div>
                    </div>

                    {/* Compare Cut Select box */}
                    <div className="space-y-2 border-t border-[#1c1b19] pt-3">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Compare Targets</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px]">Compare Main Cut with</span>
                        <select
                          value={compareBranchId}
                          onChange={(e) => {
                            setCompareBranchId(e.target.value);
                            setActiveTab("diff");
                          }}
                          className="bg-black border border-[#1c1b19] rounded px-2 py-1 text-[11px] font-mono text-white cursor-pointer focus:outline-none focus:border-[#f2a94e]"
                        >
                          <option value="fast-reel">Fast Reel Cut</option>
                          <option value="premium">Premium Investor Cut</option>
                          <option value="story">Story Cut</option>
                          <option value="brand-safe">Brand-Safe Cut</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tab menu for comparing changes */}
                  <div className="border border-[#1c1b19] bg-[#0c0b0b]/60 rounded-xl overflow-hidden text-xs">
                    <div className="flex border-b border-[#1c1b19] bg-black/40 text-[10px] font-mono tracking-wider uppercase text-zinc-500">
                      <button
                        onClick={() => setActiveTab("diff")}
                        className={`flex-1 py-2 text-center border-r border-[#1c1b19] last:border-0 ${
                          activeTab === "diff" ? "bg-[#0c0b0b] text-white" : "hover:text-zinc-300"
                        }`}
                      >
                        Compare Diff
                      </button>
                      <button
                        onClick={() => setActiveTab("memory")}
                        className={`flex-1 py-2 text-center border-r border-[#1c1b19] last:border-0 ${
                          activeTab === "memory" ? "bg-[#0c0b0b] text-white" : "hover:text-zinc-300"
                        }`}
                      >
                        Brand Memory
                      </button>
                    </div>

                    <div className="p-4 space-y-3 min-h-[140px]">
                      {activeTab === "diff" ? (
                        <div className="space-y-3">
                          <div className="text-[11px] leading-relaxed text-zinc-400 italic">
                            {currentDiff.summary}
                          </div>
                          
                          {/* Checklist of edits */}
                          <div className="space-y-2 border-t border-[#1c1b19] pt-3">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                              Select timeline edits to merge
                            </span>
                            
                            <div className="space-y-1">
                              {currentDiff.changes.map((change) => {
                                const isChecked = selectedChanges.includes(change.id);
                                return (
                                  <div
                                    key={change.id}
                                    onClick={() => {
                                      if (isMerged) return;
                                      setSelectedChanges((prev) =>
                                        isChecked
                                          ? prev.filter((id) => id !== change.id)
                                          : [...prev, change.id],
                                      );
                                    }}
                                    className="flex items-center gap-2 p-1.5 hover:bg-zinc-900/30 rounded cursor-pointer"
                                  >
                                    <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border text-black font-extrabold ${
                                      isChecked ? "bg-[#f2a94e] border-[#f2a94e]" : "border-zinc-700"
                                    }`}>
                                      {isChecked && (
                                        <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="flex-1 flex justify-between items-center text-[11px]">
                                      <span className="text-zinc-300">{change.label}</span>
                                      <span className="text-[10px] font-mono text-zinc-500">
                                        {change.before} → <span className="text-[#f2a94e] font-medium">{change.after}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-zinc-500">Style Confidence</span>
                            <span className="text-[#f2a94e] font-mono text-[11px] font-semibold">
                              {Math.round(teamMemory.confidence * 100)}%
                            </span>
                          </div>
                          
                          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${teamMemory.confidence * 100}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full bg-[#f2a94e]"
                            />
                          </div>

                          <div className="space-y-1 text-[11px] text-zinc-400 font-sans">
                            {isApproved ? (
                              <div className="text-[#f2a94e] bg-[#f2a94e]/5 border border-[#f2a94e]/10 p-2 rounded-lg">
                                ✓ Brand match score: 96/100. Pacing, hook duration, captions and CTA align with approved presets.
                              </div>
                            ) : (
                              <>
                                <div className="p-1.5 bg-zinc-900/30 rounded">
                                  ⚠️ Hook length: 8s exceeds brand target (under 4s).
                                </div>
                                <div className="p-1.5 bg-zinc-900/30 rounded">
                                  ⚠️ Captions: Minimal White is off-brand (prefer bold).
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* 3. Floating bottom-right autonomous agent console - Warm Charcoal `bg-[#161514]` (styled exactly like the reference mockup) */}
              <div className="absolute bottom-4 right-4 w-72 rounded-xl border border-[#2c2927] bg-[#161514]/95 p-4 shadow-2xl z-20 text-xs select-none">
                
                {/* Header */}
                <div className="flex items-center justify-between text-white font-medium pb-2 border-b border-[#2c2927]/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f2a94e] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f2a94e]" />
                    </span>
                    <span>Aetos Assistant</span>
                  </div>
                  <button className="text-zinc-500 hover:text-white">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Steps logs */}
                <div className="space-y-2 text-zinc-400 font-mono text-[10px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-[#f2a94e] font-bold">1.</span>
                    <span>Compared {compareBranchId === "fast-reel" ? "Fast Reel Cut" : compareBranchId === "premium" ? "Premium Investor Cut" : compareBranchId === "story" ? "Story Cut" : "Brand-Safe Cut"} against Main Cut.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#f2a94e] font-bold">2.</span>
                    <span>Detected hook shortened from 8s to {compareBranchId === "fast-reel" ? "3s" : compareBranchId === "premium" ? "5s" : "4s"}.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#f2a94e] font-bold">3.</span>
                    <span>Captions improved, but music intensity may be off-brand.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500 shrink-0">Pacing:</span>
                    <span>{isMerged ? "keep hook; reject weak music" : "recommended merge pending"}</span>
                  </div>
                </div>

                {/* Statistics status */}
                <div className="mt-4 pt-2 border-t border-[#2c2927]/60 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                  <span>Worked for 2s</span>
                  <span className="text-[#f2a94e]">{isMerged ? "DONE" : "PENDING MERGE"}</span>
                </div>

                {/* Button inside assistant console */}
                <div className="mt-3">
                  {!isMerged ? (
                    <button
                      onClick={handleMerge}
                      disabled={isMerging || selectedChanges.length === 0}
                      className="w-full bg-[#efe9df] text-black font-semibold py-1.5 rounded-lg hover:bg-white transition-colors text-center block text-[11px]"
                    >
                      {isMerging ? "Merging..." : "Merge selected changes"}
                    </button>
                  ) : !isApproved ? (
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="w-full bg-[#f2a94e] text-black font-semibold py-1.5 rounded-lg hover:bg-amber-400 transition-colors text-center block text-[11px]"
                    >
                      {isApproving ? "Approving..." : "Approve and teach Aetos"}
                    </button>
                  ) : (
                    <div className="w-full bg-zinc-900 border border-zinc-800 text-[#f2a94e] text-center py-1.5 rounded-lg font-mono text-[10px]">
                      ✓ Memory Profile Synced
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </motion.div>

          {/* Reference Attribution badge at bottom right */}
          <div className="mt-4 flex justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c0b0b]/60 border border-[#1c1b19] text-[10px] font-mono text-zinc-500 uppercase">
              <span>Made by Nextjsshop ↗</span>
            </span>
          </div>

        </motion.div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how-it-works" className="border-t border-[#1c1b19] py-24 bg-[#121110]">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="max-w-3xl space-y-4 mb-12">
            <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
              From raw footage to learning loop.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed">
              Aetos gives autonomous video agents the environment they need: agent sandboxes, versioned branches, verifier scores, selective merge controls, and memory from approved edits.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="border border-[#1c1b19] bg-[#0c0b0b] rounded-xl p-5 min-h-[190px] flex flex-col justify-between"
              >
                <div className="text-[10px] font-mono text-zinc-500">0{index + 1}</div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 border border-[#1c1b19] bg-black/30 rounded-xl px-4 py-3 text-[11px] font-mono text-zinc-400 overflow-x-auto">
            Upload -&gt; Agents -&gt; Branches -&gt; Verifier -&gt; Approval -&gt; Learning
          </div>
        </div>
      </section>

      {/* ---------- AGENT ARENA ---------- */}
      <section id="agent-arena" className="border-t border-[#1c1b19] py-24 bg-[#050505]">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 space-y-5">
              <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">Agent Arena</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
                Different agents. Different strategies. One stronger final cut.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Aetos lets multiple autonomous editing agents compete and collaborate. Each agent explores a different creative direction, then the verifier and human team decide which decisions deserve to survive.
              </p>
              <Link href="/project/project-yc-launch" className="inline-flex bg-[#efe9df] text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-white transition-colors text-sm">
                Run Agent Arena
              </Link>
            </div>

            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
              {agentCards.map((agent, index) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.07 }}
                  className="border border-[#1c1b19] bg-[#0c0b0b] rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{agent.body}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-[#f2a94e] border border-[#f2a94e]/20 bg-[#f2a94e]/5 px-2 py-1 rounded">
                      {agent.score}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {agent.output.map((item) => (
                      <div key={item} className="text-[11px] text-zinc-400 bg-[#121110] border border-[#1c1b19] rounded-lg px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- DETAILED PRODUCT PILLARS SECTIONS ---------- */}
      
      {/* Pillar 1: Version Control for Video */}
      <section id="version-control" className="border-t border-[#1c1b19] py-24 bg-[#050505]" style={{ perspective: 1200 }}>
        <motion.div
          className="mx-auto max-w-[1400px] px-6"
        >
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center" style={{ transformStyle: "preserve-3d" }}>
            
            {/* Left: Content - Slide in from left */}
            <motion.div 
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6"
            >
              <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">Version Control</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight font-sans">
                Branch video timelines like code. Compare cuts like diffs.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Aetos tracks video editing as timeline metadata, not duplicate render files. Every agent attempt creates a lightweight branch, so teams can see exactly what changed, compare creative decisions, and merge only the best parts.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed border-l border-[#f2a94e]/30 pl-4">
                Version control gives Aetos the history of what was tried, what changed, what worked, and what failed.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Semantic Diffing</h4>
                    <p className="text-xs text-zinc-500 mt-1">Aetos translates timeline changes into plain language: hook shortened, captions changed, CTA moved, music updated, clips reordered.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Selective Merging</h4>
                    <p className="text-xs text-zinc-500 mt-1">Keep the Viral Agent&apos;s hook, the Premium Agent&apos;s color style, and the Story Agent&apos;s structure while rejecting weak changes.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Conflict Resolution</h4>
                    <p className="text-xs text-zinc-500 mt-1">When two agents change the same timeline section differently, Aetos presents creative options instead of technical merge conflicts.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Visual representation of Version Control Branching with SVG Path Drawing - Y-Axis 3D Spin */}
            <motion.div 
              initial={{ opacity: 0, x: 60, rotateY: -16, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="lg:col-span-6"
            >
              <div className="border border-[#1c1b19] bg-[#0c0b0b] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div className="absolute inset-0 ascii-texture-vercel opacity-20 pointer-events-none" />
                
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pb-3 border-b border-[#1c1b19]">
                  <span>Branch lineage graph</span>
                  <span>Active cuts tree</span>
                </div>

                {/* SVG Animated Branch Tree */}
                <div className="relative w-full h-[150px] my-4">
                  <svg className="w-full h-full" viewBox="0 0 400 150" fill="none">
                    {/* Trunk path */}
                    <motion.path
                      d="M30,30 L370,30"
                      stroke="#333230"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 1.1, ease: "easeInOut" }}
                    />
                    {/* Fast Reel cut branch curve */}
                    <motion.path
                      d="M90,30 C140,80 190,80 240,80 L370,80"
                      stroke="#f2a94e"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 1.3, ease: "easeInOut", delay: 0.15 }}
                    />
                    {/* Premium Cut branch curve */}
                    <motion.path
                      d="M140,30 C190,130 240,130 290,130 L370,130"
                      stroke="#f2a94e"
                      strokeOpacity="0.4"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
                    />

                    {/* Nodes */}
                    <motion.circle cx="30" cy="30" r="5" fill="#efe9df" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.05 }} />
                    <motion.circle cx="90" cy="30" r="4.5" fill="#efe9df" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.25 }} />
                    <motion.circle cx="140" cy="30" r="4.5" fill="#efe9df" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.45 }} />

                    {/* Fast Hook branch endpoint */}
                    <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", delay: 1.25 }}>
                      <circle cx="240" cy="80" r="7" fill="#0c0b0b" stroke="#f2a94e" strokeWidth="2.5" />
                      <circle cx="240" cy="80" r="3" fill="#f2a94e" />
                      <text x="240" y="66" fill="#f2a94e" fontSize="9" fontFamily="monospace" textAnchor="middle">Fast Hook Cut</text>
                    </motion.g>

                    {/* Premium grading endpoint */}
                    <motion.g initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", delay: 1.55 }}>
                      <circle cx="290" cy="130" r="7" fill="#0c0b0b" stroke="#f2a94e" strokeWidth="2.5" strokeOpacity="0.5" />
                      <circle cx="290" cy="130" r="3" fill="#f2a94e" fillOpacity="0.5" />
                      <text x="290" y="144" fill="#888" opacity="0.6" fontSize="9" fontFamily="monospace" textAnchor="middle">Premium Grading</text>
                    </motion.g>

                    <motion.circle cx="370" cy="30" r="6" fill="#efe9df" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.95 }} />
                    <text x="370" y="18" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">Main Cut</text>
                  </svg>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="bg-[#121110] border border-[#1c1b19] p-3 rounded-lg text-[10px] font-mono text-[#f2a94e]"
                >
                  <span>3 semantic differences detected: hook length 8s -&gt; 3s, captions minimal -&gt; bold white, CTA final frame -&gt; 00:28. Recommended merge: keep hook and CTA, reject caption color change.</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ---------- REWARD LAYER ---------- */}
      <section id="reward-layer" className="border-t border-[#1c1b19] py-24 bg-[#0c0b0b]">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6"
            >
              <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">Reward Layer</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
                A verifier that turns video edits into rewards.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                For agents to improve, every attempt needs feedback. Aetos scores each branch using a verifier, then combines that score with human approvals to create reward signals for future editing agents.
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed border-l border-[#f2a94e]/30 pl-4">
                Aetos is RL-ready, not fake-RL. The MVP builds the environment where agents can try actions, receive rewards, and improve over time.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {verifierCriteria.map((criterion) => (
                  <div key={criterion} className="border border-[#1c1b19] bg-[#121110] rounded-lg px-3 py-2 text-[11px] text-zinc-400">
                    {criterion}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -12, scale: 0.96 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="border border-[#1c1b19] bg-[#050505] rounded-2xl p-6 space-y-5 relative overflow-hidden">
                <div className="absolute inset-0 ascii-texture-vercel opacity-20 pointer-events-none" />
                <div className="relative flex items-center justify-between border-b border-[#1c1b19] pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Branch</span>
                    <h3 className="text-lg font-semibold text-white mt-1">Viral Agent Cut</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Overall Score</span>
                    <div className="text-3xl font-semibold text-[#f2a94e]">82</div>
                  </div>
                </div>

                <div className="relative space-y-3">
                  {[
                    ["Hook", 94],
                    ["Pacing", 88],
                    ["Captions", 80],
                    ["CTA", 85],
                    ["Brand Fit", 61],
                    ["Technical Quality", 91],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[110px_1fr_42px] items-center gap-3 text-xs">
                      <span className="text-zinc-400">{label}</span>
                      <div className="h-1.5 bg-[#121110] rounded-full overflow-hidden">
                        <div className="h-full bg-[#f2a94e]" style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-zinc-300 font-mono text-right">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="relative bg-[#121110] border border-[#1c1b19] rounded-xl p-4 text-xs text-zinc-400 leading-relaxed">
                  <span className="block text-[10px] font-mono text-[#f2a94e] uppercase tracking-wider mb-2">Recommendation</span>
                  Keep the hook and pacing. Reject the music and transition intensity.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pillar 2: Collaboration (Shared Workspace) */}
      <section id="collaboration" className="border-t border-[#1c1b19] py-24 bg-[#121110]" style={{ perspective: 1200 }}>
        <motion.div
          className="mx-auto max-w-[1400px] px-6"
        >
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center" style={{ transformStyle: "preserve-3d" }}>
            
            {/* Left: Collaboration visual representation with animated Figma cursors - Y-Axis 3D Spin */}
            <motion.div 
              initial={{ opacity: 0, x: -60, rotateY: 16, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="lg:col-span-6 order-last lg:order-first relative"
            >
              <div className="border border-[#1c1b19] bg-[#0c0b0b] rounded-2xl p-6 relative overflow-hidden space-y-4 min-h-[300px]">
                <div className="absolute inset-0 ascii-texture-vercel opacity-25 pointer-events-none" />

                {/* Floating Figma-style multiplayer cursor 1 */}
                <motion.div
                  animate={{ 
                    x: [100, 240, 160, 280, 100],
                    y: [120, 40, 160, 90, 120]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute pointer-events-none z-30 flex items-center gap-1 text-[9px] font-mono bg-[#f2a94e] text-black px-1.5 py-0.5 rounded shadow-lg"
                  style={{ left: 0, top: 0 }}
                >
                  <svg className="h-3 w-3 -scale-x-100 fill-black rotate-12" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span>Jori (Editor)</span>
                </motion.div>

                {/* Floating Figma-style multiplayer cursor 2 */}
                <motion.div
                  animate={{ 
                    x: [240, 60, 210, 80, 240],
                    y: [160, 100, 40, 150, 160]
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5
                  }}
                  className="absolute pointer-events-none z-30 flex items-center gap-1 text-[9px] font-mono bg-teal-500 text-black px-1.5 py-0.5 rounded shadow-lg"
                  style={{ left: 0, top: 0 }}
                >
                  <svg className="h-3 w-3 -scale-x-100 fill-black rotate-12" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span>Riya (Designer)</span>
                </motion.div>

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pb-3 border-b border-[#1c1b19]">
                  <span>Collaborators active</span>
                  <span>Sync: Real-time</span>
                </div>

                {/* Team presence list */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="h-6 w-6 rounded-full bg-[#f2a94e] border-2 border-black flex items-center justify-center text-[9px] text-black font-bold">J</div>
                    <div className="h-6 w-6 rounded-full bg-teal-500 border-2 border-black flex items-center justify-center text-[9px] text-black font-bold">R</div>
                    <div className="h-6 w-6 rounded-full bg-purple-500 border-2 border-black flex items-center justify-center text-[9px] text-black font-bold">K</div>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-sans">3 editors online inside workspace</span>
                </div>

                {/* Pinned comment mockup */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
                  className="p-3.5 bg-[#161514] border border-[#2c2927] rounded-xl space-y-2 font-sans text-xs relative z-10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#f2a94e]" />
                      <span className="text-white font-medium">Karri (Director)</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500">at 00:24s</span>
                  </div>
                  <p className="text-zinc-300">
                    &quot;The pacing feels slightly slow here. Let&apos;s swap the product demo and customer proof clips to keep momentum high.&quot;
                  </p>
                  <div className="flex gap-2 text-[9px] font-mono text-[#f2a94e] pt-1">
                    <span className="hover:underline cursor-pointer">Reply</span>
                    <span>·</span>
                    <span className="hover:underline cursor-pointer">Resolve</span>
                    <span>·</span>
                    <span className="hover:underline cursor-pointer bg-[#f2a94e]/10 px-1.5 py-0.5 rounded">Create branch suggestion</span>
                  </div>
                </motion.div>

                {/* Activity feed snippet */}
                <div className="font-mono text-[9px] text-zinc-500 space-y-1 pt-2 border-t border-[#1c1b19]/60">
                  <div>· Jori created branch &quot;Fast Reel Cut&quot; - 10m ago</div>
                  <div>· Riya added comment on CTA clip - 5m ago</div>
                  <div>· Aetos updated team memory profile - Just now</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Content - Slide in from right */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6"
            >
              <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">02 · Collaboration</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight font-sans">
                Humans and agents work together without overwriting each other.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Editors, founders, designers, clients, and AI agents can all create suggestion branches, leave timeline-pinned feedback, compare edits, and merge approved changes into the final cut.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Timeline-pinned Feedback</h4>
                    <p className="text-xs text-zinc-500 mt-1">Comments attach directly to clips, timestamps, and branches, so feedback never gets lost in Slack threads.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Suggestion Branches</h4>
                    <p className="text-xs text-zinc-500 mt-1">Any teammate or agent can fork a cut, propose changes, and send it back as a reviewable branch.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Human Approval Loop</h4>
                    <p className="text-xs text-zinc-500 mt-1">Approvals, rejections, and merges become the strongest signal for what the team actually wants.</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* Pillar 3: Style Memory */}
      <section id="style-memory" className="border-t border-[#1c1b19] py-24 bg-[#050505]" style={{ perspective: 1200 }}>
        <motion.div
          className="mx-auto max-w-[1400px] px-6"
        >
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center" style={{ transformStyle: "preserve-3d" }}>
            
            {/* Left: Content - Slide in from left */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="lg:col-span-6 space-y-6"
            >
              <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">03 · Style Memory</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight font-sans">
                Memory emerges from approved edits.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Aetos learns from approved branches, rejected cuts, merged changes, and team comments. Over time, it understands which hooks, captions, pacing, transitions, and styles your team actually prefers.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Approval-Based Memory</h4>
                    <p className="text-xs text-zinc-500 mt-1">Every accepted merge increases confidence in the creative pattern behind it.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Rejection Signals</h4>
                    <p className="text-xs text-zinc-500 mt-1">Rejected branches teach Aetos what not to repeat, like loud music, slow intros, cluttered captions, or off-brand transitions.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#f2a94e]/10 flex items-center justify-center text-[#f2a94e] shrink-0 mt-0.5 font-mono text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Recency-Aware Style</h4>
                    <p className="text-xs text-zinc-500 mt-1">Recent campaign decisions matter more than old habits, so style memory can evolve over time.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Style Memory dashboard visual - 3D Perspective Roll & Storyboard */}
            <motion.div 
              initial={{ opacity: 0, x: 60, rotateX: 16, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="lg:col-span-6"
            >
              <div className="border border-[#1c1b19] bg-[#0c0b0b] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[390px] shadow-xl">
                <div className="absolute inset-0 ascii-texture-vercel opacity-20 pointer-events-none" />

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pb-3 border-b border-[#1c1b19]">
                  <span>Workspace Lifecycle Story</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-[#f2a94e] rounded-full animate-ping" />
                    <span>Auto-play active</span>
                  </span>
                </div>

                <div className="flex-1 py-6 flex flex-col justify-center min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {storyStep === 0 && (
                      <motion.div
                        key="step-0"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                      >
                        {/* Step 1 Visual: Version Control Branching */}
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 bg-[#121110] border border-[#1c1b19] px-3.5 py-2.5 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#f2a94e] animate-pulse" />
                            <span>trunk</span>
                          </div>
                          <div className="text-zinc-600">→</div>
                          <div className="flex items-center gap-2 bg-[#f2a94e]/10 border border-[#f2a94e]/20 px-2 py-0.5 rounded text-[#f2a94e]">
                            <span>branch: fast-hook</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block font-semibold">1. Non-Destructive Version Control</span>
                          <h4 className="text-sm font-semibold text-white">Branch metadata, not giant video files.</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            Instead of duplicating heavy export drafts like <code className="text-zinc-300">final_v2_edit.mp4</code>, Aetos creates lightweight metadata branches. Editors experiment freely without altering trunk timelines.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {storyStep === 1 && (
                      <motion.div
                        key="step-1"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                      >
                        {/* Step 2 Visual: Collaboration (Multilevel Review) */}
                        <div className="bg-[#121110] border border-[#1c1b19] p-3.5 rounded-xl space-y-2.5 text-xs relative overflow-hidden">
                          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500">
                            <span>Timestamp: 00:15s</span>
                            <span className="text-teal-400">Riya online</span>
                          </div>
                          <div className="bg-black/40 border border-zinc-900/60 p-2.5 rounded-lg text-zinc-300 relative z-10 font-sans">
                            &quot;Let&apos;s speed up this transition. The intro pacing is a bit slow.&quot;
                          </div>
                          {/* Presence cursor */}
                          <div className="absolute right-4 bottom-2 bg-teal-500 text-black font-mono text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5 shadow-md z-20">
                            <svg className="h-2 w-2 fill-black" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            <span>Riya</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest block font-semibold">2. Live Workspace Collaboration</span>
                          <h4 className="text-sm font-semibold text-white">Pin contextual reviews directly on timestamps.</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            Multiple editors work in parallel. Directors pin frame-exact critiques directly to the clip track, creating instant experimental suggestion branches without context loss.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {storyStep === 2 && (
                      <motion.div
                        key="step-2"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-4"
                      >
                        {/* Step 3 Visual: Style Memory (Aetos Learning) */}
                        <div className="bg-[#121110] border border-[#1c1b19] p-3.5 rounded-xl space-y-2 text-xs font-sans">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">Style Presets Auto-Updated</span>
                            <span className="text-[#f2a94e] font-mono font-semibold">94% Confidence</span>
                          </div>
                          <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ duration: 0.8 }} className="h-full bg-[#f2a94e]" />
                          </div>
                          <div className="text-[10px] font-mono text-[#f2a94e] bg-[#f2a94e]/5 p-2 rounded border border-[#f2a94e]/10">
                            ✓ Hook preset learned: Keep pacing under 3.5 seconds.
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-semibold">3. Cognitive Style Memory</span>
                          <h4 className="text-sm font-semibold text-white">Every approved merge trains your style profile.</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            Aetos reads timeline edit patterns. Over time, it increases confidence scores and flags future drafts that violate brand directives, automating the review cycle.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-[#1c1b19] select-none">
                  {[0, 1, 2].map((step) => {
                    const isActive = storyStep === step;
                    return (
                      <div
                        key={step}
                        onClick={() => setStoryStep(step)}
                        className="flex-1 h-1 rounded-full bg-zinc-900 cursor-pointer overflow-hidden relative"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="storyProgress"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 4.5, ease: "linear" }}
                            className="h-full bg-[#f2a94e]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ---------- ECONOMIC OUTCOME ---------- */}
      <section id="why-it-matters" className="border-t border-[#1c1b19] py-24 bg-[#121110]">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-[10px] font-mono text-[#f2a94e] uppercase tracking-widest block">Why It Matters</span>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white leading-tight">
                Every approved video makes the next one cheaper.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Video teams lose hours in revision loops, unclear feedback, and final-file confusion. Aetos turns every agent attempt and human approval into reusable learning data, reducing repeated work across future projects.
              </p>
              <p className="text-sm text-[#f2a94e] font-mono border border-[#f2a94e]/20 bg-[#f2a94e]/5 rounded-xl px-4 py-3">
                Aetos turns creative feedback into compounding production intelligence.
              </p>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {outcomeCards.map((outcome, index) => (
                <motion.div
                  key={outcome.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="border border-[#1c1b19] bg-[#0c0b0b] rounded-xl p-5 min-h-[150px] flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-zinc-600">0{index + 1}</span>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">{outcome.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{outcome.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-[#1c1b19] bg-[#020202] py-12">
        <div className="mx-auto max-w-[1400px] px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-[13px] text-zinc-500 font-sans">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="h-4.5 w-4.5 grid grid-cols-2 gap-0.5">
              <div className="bg-[#f2a94e] rounded-[2px]" />
              <div className="bg-[#f2a94e]/40 rounded-[2px]" />
              <div className="bg-[#f2a94e]/40 rounded-[2px]" />
              <div className="bg-[#f2a94e] rounded-[2px]" />
            </div>
            <span className="font-semibold tracking-tight text-white">Aetos</span>
          </div>
          <span>© 2026 Aetos. Built for the video workflow. 24h Hackathon MVP.</span>
        </div>
      </footer>

    </div>
  );
}
