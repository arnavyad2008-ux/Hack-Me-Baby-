# Hack Me Baby // Automated Adversarial Code Audit Platform

An enterprise-grade, dual-agent security audit engine that pairs an offensive Red Team auditor with a defensive Blue Team sentinel in a real-time, high-stakes cyber arena.

---

## ⚡ Core Concept

When vulnerable application code is submitted:
1. **Red Agent** executes static control-flow and taint analysis, identifies the flaw (e.g., SQLi, SSRF, RCE), and crafts an exploit vector.
2. An animated **Attack Packet** visually routes the exploit across the dashboard.
3. **Blue Agent** intercepts the threat with a perimeter defense alert, isolates the vulnerability root cause, and synthesizes a production-grade patch.
4. The center stage transitions to a side-by-side **Monaco DiffEditor** displaying the original vulnerable code alongside the verified patch, backed by an **Enterprise Security Scorecard**.

---

## 🏛️ State Machine Lifecycle

| Phase | Description |
|---|---|
| `IDLE` | System standby, waiting for user snippet or scenario selection |
| `TARGET_ACQUIRED` | Code snippet mounted into Monaco Editor |
| `RED_RECON` | Red Agent parses AST, traces unescaped sinks |
| `RED_EXPLOIT` | Vulnerability confirmed; exploit packet animation dispatches |
| `BLUE_INTERCEPT` | Defensive perimeter flashes red; Blue Agent engages |
| `BLUE_PATCH` | Blue Agent synthesizes patch; Monaco DiffEditor mounts |
| `RESOLVED` | Audit cycle completed; Defense Scorecard with CVSS reduction rendered |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict mode enabled, 100% typed, 0 `any`)
- **Styling**: Tailwind CSS + custom cyber glow extensions
- **State Management**: Zustand
- **Code Editor**: `@monaco-editor/react` (Editor & DiffEditor)
- **Animations**: `framer-motion`
- **Streaming**: Native Server-Sent Events (SSE) Web API
- **Boundary Validation**: Zod

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Select a preset scenario (e.g., SQLi Auth Query or SSRF Webhook Client) and click **SIMULATE AUDIT**.
