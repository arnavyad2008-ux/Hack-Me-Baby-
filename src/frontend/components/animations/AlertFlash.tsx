"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function AlertFlash() {
  const { phase } = useCyberArena();
  const isIntercepting = phase === "BLUE_INTERCEPT";

  return (
    <AnimatePresence>
      {isIntercepting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0.1, 0.35, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-40 bg-cyber-red/30 mix-blend-screen border-8 border-cyber-red"
        />
      )}
    </AnimatePresence>
  );
}
