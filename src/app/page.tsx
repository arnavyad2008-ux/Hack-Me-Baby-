"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThreePanelLayout } from "@/components/layout/ThreePanelLayout";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { TargetCodeEditor } from "@/components/editor/TargetCodeEditor";
import { PatchDiffEditor } from "@/components/editor/PatchDiffEditor";
import { ScorecardView } from "@/components/editor/ScorecardView";
import { RedBotTerminal } from "@/components/terminal/RedBotTerminal";
import { BlueBotTerminal } from "@/components/terminal/BlueBotTerminal";
import { AttackPacket } from "@/components/animations/AttackPacket";
import { AlertFlash } from "@/components/animations/AlertFlash";
import { useCyberArena } from "@/hooks/useCyberArenaState";

export default function ArenaDashboard() {
  const { isDiffView, patchedCode, phase } = useCyberArena();
  const showDiff = isDiffView || (phase === "BLUE_PATCH" && Boolean(patchedCode));

  return (
    <main className="h-screen w-screen flex flex-col bg-cyber-bg cyber-grid overflow-hidden relative">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <ThreePanelLayout
          leftPanel={<RedBotTerminal />}
          centerPanel={
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <EditorHeader />
              <div className="flex-1 relative overflow-hidden">
                {showDiff ? <PatchDiffEditor /> : <TargetCodeEditor />}
              </div>
              <ScorecardView />
            </div>
          }
          rightPanel={<BlueBotTerminal />}
        />
      </div>

      <AttackPacket />
      <AlertFlash />
    </main>
  );
}
