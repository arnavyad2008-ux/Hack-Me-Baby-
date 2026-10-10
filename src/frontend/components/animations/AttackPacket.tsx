"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { useTransientFlag } from "@/frontend/hooks/useTransientFlag";

/** Visualises Red handing its findings to Blue. Fires only when Red actually reported findings. */
export function AttackPacket() {
  const handoff = useCyberArena((s) => s.phase === "BLUE_PATCH" && (s.red?.findings.length ?? 0) > 0);
  const label = useCyberArena((s) => s.red?.findings[0]?.cwe ?? s.red?.findings[0]?.id ?? "FINDINGS");
  const count = useCyberArena((s) => s.red?.findings.length ?? 0);
  const visible = useTransientFlag(handoff, 1400);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, x: "-100%", y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0.8], x: ["-50%", "0%", "50%"], scale: [0.8, 1.2, 1] }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="pointer-events-none fixed top-1/2 left-1/4 -translate-y-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-red/90 border border-white text-white font-mono text-xs shadow-red-glow"
        >
          <Zap className="w-4 h-4 text-yellow-300" />
          <span className="font-bold tracking-wider">
            {count} FINDING{count === 1 ? "" : "S"} → BLUE: {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
