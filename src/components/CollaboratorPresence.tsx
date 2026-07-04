"use client";

import { motion } from "framer-motion";
import { FAKE_COLLABORATORS } from "@/lib/store";

export function CollaboratorPresence() {
  return (
    <div className="flex items-center">
      <motion.div className="flex" whileHover="hover">
        {FAKE_COLLABORATORS.map((c, i) => (
          <motion.div
            key={c.name}
            title={`${c.name} · ${c.role}`}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-void text-[11px] font-medium text-void"
            style={{ backgroundColor: c.color, marginLeft: i === 0 ? 0 : -8, zIndex: FAKE_COLLABORATORS.length - i }}
            variants={{ hover: { marginLeft: i === 0 ? 0 : -2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            {c.name[0]}
          </motion.div>
        ))}
      </motion.div>
      <span className="ml-3 flex items-center gap-1.5 text-xs text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-teal animate-breathe" />
        {FAKE_COLLABORATORS.length} online
      </span>
    </div>
  );
}
