import path from "node:path";
import fs from "node:fs";
import type { NextConfig } from "next";

// Copy generated Final Cut Pro image to public folder at startup/build
try {
  const src = "/home/cheeku1855/.gemini/antigravity/brain/1f1170c0-7acd-4bab-802c-0743411c2be5/final_cut_editor_preview_1783182259471.png";
  const dest = path.join(process.cwd(), "public", "final_cut_preview.png");
  
  // Ensure public folder exists
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("Successfully copied Final Cut Pro preview image to public directory.");
  } else {
    console.warn("Source Final Cut Pro preview image not found at path:", src);
  }
} catch (err) {
  console.error("Failed to copy image in next.config.ts:", err);
}

const nextConfig: NextConfig = {
  /* config options here */
  // React Compiler disabled: it is global and the embedded OpenCut editor
  // (src/opencut) was not written for it.
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow an isolated build dir (verification builds shouldn't clobber .next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
