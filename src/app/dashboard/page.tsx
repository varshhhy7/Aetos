"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useAetosStore } from "@/lib/store";
import { BranchRibbon } from "@/components/BranchRibbon";

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export default function Dashboard() {
  const projects = useAetosStore((s) => s.projects);
  const branches = useAetosStore((s) => s.branches);
  const comments = useAetosStore((s) => s.comments);
  const memory = useAetosStore((s) => s.memory);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
      <header className="animate-fade-up">
        <span className="eyebrow text-teal">Projects</span>
        <h1 className="gi-display mt-2 font-display text-3xl font-medium text-ink">
          your projects
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-dim">
          Every project keeps its own branches, semantic diffs, and team memory.
        </p>
      </header>

      <motion.div
        className="mt-10 flex flex-col gap-4"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {projects.map((project) => {
          const projectBranches = branches.filter((b) => b.projectId === project.id);
          const projectComments = comments.filter((c) => c.projectId === project.id);
          const projectMemory = memory[project.id];

          return (
            <motion.div key={project.id} variants={itemVariants} whileHover={{ y: -3 }}>
              <Link
                href={`/project/${project.id}`}
                className="glass-card block p-6 transition-colors hover:border-hairline-strong"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-medium text-ink">{project.name}</h2>
                    <p className="mt-1 text-sm text-ink-dim">{project.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
                    Open project →
                  </span>
                </div>

                <div className="mt-5">
                  <BranchRibbon branches={projectBranches} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-hairline pt-4 text-sm">
                  <span className="font-mono-aetos text-ink-dim">
                    {projectBranches.length} cuts
                  </span>
                  <span className="text-ink-faint">·</span>
                  <span className="font-mono-aetos text-ink-dim">
                    {projectComments.length} comments
                  </span>
                  {projectMemory && (
                    <>
                      <span className="text-ink-faint">·</span>
                      <span className="inline-flex items-center gap-1.5 text-amber">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                        Team memory active
                      </span>
                    </>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
