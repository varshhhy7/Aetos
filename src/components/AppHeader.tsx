"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxMark } from "./ui/BoxMark";
import { CollaboratorPresence } from "./CollaboratorPresence";

export function AppHeader() {
  const pathname = usePathname();
  const inProject = pathname.startsWith("/project/");
  const projectId = inProject ? pathname.split("/")[2] : null;
  const inCompare = pathname.includes("/compare");

  if (pathname === "/" || pathname.startsWith("/editor/")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <BoxMark size={22} />
            <span className="font-stencil text-[16px] text-white">aetos</span>
          </Link>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-3 hidden md:inline">
            version control for video teams
          </span>
        </div>

        <div className="flex items-center gap-4">
          {inCompare && projectId ? (
            <Link href={`/project/${projectId}`} className="border border-hairline hover:border-hairline-strong bg-zinc-900/40 text-zinc-300 px-3 py-1.5 rounded-lg text-xs transition-colors">
              ← Back to workspace
            </Link>
          ) : inProject ? (
            <>
              <Link href="/dashboard" className="border border-hairline hover:border-hairline-strong bg-zinc-900/40 text-zinc-300 px-3 py-1.5 rounded-lg text-xs transition-colors">
                ← All projects
              </Link>
              <Link href={`/editor/${projectId}`} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors">
                Open editor →
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className={`nav-tab ${pathname === "/dashboard" ? "is-active" : ""}`}>
              Dashboard
            </Link>
          )}
          {inProject && <CollaboratorPresence />}
        </div>
      </div>
    </header>
  );
}
