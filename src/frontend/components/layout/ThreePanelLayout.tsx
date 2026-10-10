"use client";

import React, { ReactNode } from "react";

interface ThreePanelLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export function ThreePanelLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: ThreePanelLayoutProps) {
  return (
    <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-3 p-4 min-h-0 overflow-hidden bg-cyber-bg">
      <section className="xl:col-span-3 flex flex-col min-h-[320px] xl:min-h-0 overflow-hidden rounded-lg border border-cyber-border bg-cyber-panel shadow-lg">
        {leftPanel}
      </section>

      <section className="xl:col-span-6 flex flex-col min-h-[480px] xl:min-h-0 overflow-hidden rounded-lg border border-cyber-border bg-cyber-panel shadow-lg relative">
        {centerPanel}
      </section>

      <section className="xl:col-span-3 flex flex-col min-h-[320px] xl:min-h-0 overflow-hidden rounded-lg border border-cyber-border bg-cyber-panel shadow-lg">
        {rightPanel}
      </section>
    </div>
  );
}
