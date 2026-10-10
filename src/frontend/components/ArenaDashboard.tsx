"use client";

import React from "react";
import { Header } from "@/frontend/components/layout/Header";
import { Sidebar } from "@/frontend/components/layout/Sidebar";
import { StatusBanner } from "@/frontend/components/layout/StatusBanner";
import { ThreePanelLayout } from "@/frontend/components/layout/ThreePanelLayout";
import { EditorHeader } from "@/frontend/components/editor/EditorHeader";
import { TargetCodeEditor } from "@/frontend/components/editor/TargetCodeEditor";
import { PatchDiffEditor } from "@/frontend/components/editor/PatchDiffEditor";
import { VerificationView } from "@/frontend/components/editor/VerificationView";
import { OutcomePanel } from "@/frontend/components/editor/OutcomePanel";
import { RedBotTerminal } from "@/frontend/components/terminal/RedBotTerminal";
import { BlueBotTerminal } from "@/frontend/components/terminal/BlueBotTerminal";
import { AttackPacket } from "@/frontend/components/animations/AttackPacket";
import { AlertFlash } from "@/frontend/components/animations/AlertFlash";
import { RepoIngestModal } from "@/frontend/components/modals/RepoIngestModal";
import { useCyberArena } from "@/frontend/hooks/useCyberArenaState";
import { useAuditLifecycle } from "@/frontend/hooks/useAgentStream";

function CenterView() {
  const editorView = useCyberArena((s) => s.editorView);
  const hasPatch = useCyberArena((s) => Boolean(s.blue?.patchedCode));
  if (editorView === "VERIFICATION") return <VerificationView />;
  if (editorView === "DIFF" && hasPatch) return <PatchDiffEditor />;
  return <TargetCodeEditor />;
}

export function ArenaDashboard() {
  useAuditLifecycle();

  return (
    <main className="h-screen w-screen flex flex-col bg-cyber-bg cyber-grid overflow-hidden relative">
      <Header />
      <StatusBanner />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <ThreePanelLayout
          leftPanel={<RedBotTerminal />}
          centerPanel={
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <EditorHeader />
              <div className="flex-1 relative overflow-hidden flex">
                <CenterView />
              </div>
              <OutcomePanel />
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
