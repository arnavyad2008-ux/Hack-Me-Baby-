@echo off
title Hack Me Baby // Dual-Agent Cyber Arena
echo ========================================================
echo   Starting Hack Me Baby // Dual-Agent Cyber Arena
echo ========================================================
echo.
cd /d "%~dp0"
echo [1/2] Opening browser at http://localhost:3000 ...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo [2/2] Launching Next.js dev server...
npm run dev
pause
