"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function AttackPacket() {
  const { phase, activeVulnerability } = useCyberArena();
  const isActive = phase === "RED_EXPLOIT";

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, x: "-100%", y: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 1, 1, 0.8],
            x: ["-50%", "0%", "50%"],
            scale: [0.8, 1.2, 1],
          }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="pointer-events-none fixed top-1/2 left-1/4 -translate-y-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-red/90 border border-white text-white font-mono text-xs shadow-red-glow"
        >
          <Zap className="w-4 h-4 text-yellow-300 animate-spin" />
          <span className="font-bold tracking-wider">
            EXPLOIT PACKET: {activeVulnerability?.cwe || "PAYLOAD"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
