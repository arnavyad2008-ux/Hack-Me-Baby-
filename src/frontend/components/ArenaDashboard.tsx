"use client";

import React from "react";
import { Header } from "@/frontend/components/layout/Header";
import { Sidebar } from "@/frontend/components/layout/Sidebar";
import { ThreePanelLayout } from "@/frontend/components/layout/ThreePanelLayout";
import { EditorHeader } from "@/frontend/components/editor/EditorHeader";
import { TargetCodeEditor } from "@/frontend/components/editor/TargetCodeEditor";
import { PatchDiffEditor } from "@/frontend/components/editor/PatchDiffEditor";
import { SandboxView } from "@/frontend/components/editor/SandboxView";
import { ScorecardView } from "@/frontend/components/editor/ScorecardView";
import { RedBotTerminal } from "@/frontend/components/terminal/RedBotTerminal";
import { BlueBotTerminal } from "@/frontend/components/terminal/BlueBotTerminal";
import { AttackPacket } from "@/frontend/components/animations/AttackPacket";
import { AlertFlash } from "@/frontend/components/animations/AlertFlash";
import { RepoIngestModal } from "@/frontend/components/modals/RepoIngestModal";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";

export function ArenaDashboard() {
  const { editorView, patchedCode, phase } = useCyberArena();

  const renderCenterView = () => {
    if (editorView === "SANDBOX") return <SandboxView />;
    if (editorView === "DIFF" || (phase === "BLUE_PATCH" && Boolean(patchedCode))) {
      return <PatchDiffEditor />;
    }
    return <TargetCodeEditor />;
  };

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
                {renderCenterView()}
              </div>
              <ScorecardView />
            </div>
          }
          rightPanel={<BlueBotTerminal />}
        />
      </div>

      <AttackPacket />
      <AlertFlash />
      <RepoIngestModal />
    </main>
  );
}
