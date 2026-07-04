"use client";

import { Player } from "@remotion/player";
import { motion } from "framer-motion";
import {
  LandingReel,
  LANDING_REEL_DURATION,
  LANDING_REEL_FPS,
} from "@/remotion/LandingReel";

export function HeroReel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="hud-frame relative mt-14 overflow-hidden"
    >
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />

      <div className="relative aspect-video w-full">
        <Player
          component={LandingReel}
          durationInFrames={LANDING_REEL_DURATION}
          fps={LANDING_REEL_FPS}
          compositionWidth={1280}
          compositionHeight={720}
          style={{ width: "100%", height: "100%" }}
          autoPlay
          loop
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline bg-void/60 px-4 py-2.5">
        <span className="eyebrow text-[10px] text-ink-faint">Rendered live with Remotion</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-teal animate-breathe" />
          <span className="font-mono-aetos text-[11px] text-ink-dim">looping · 12s</span>
        </span>
      </div>
    </motion.div>
  );
}
