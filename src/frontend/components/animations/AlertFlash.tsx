"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { useTransientFlag } from "@/frontend/hooks/useTransientFlag";

export function AlertFlash() {
  const blueEngaged = useCyberArena((s) => s.phase === "BLUE_PATCH");
  const visible = useTransientFlag(blueEngaged, 900);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0.1, 0.35, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-40 bg-cyber-red/30 mix-blend-screen border-8 border-cyber-red motion-reduce:hidden"
        />
      )}
    </AnimatePresence>
  );
}
