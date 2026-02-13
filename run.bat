@echo off
title FASHIN Play Launcher
echo ===================================================
echo   JURUS ULTIMATE: Starting FASHIN Play...
echo ===================================================

:: 1. Force move to project directory
cd /d "C:\Users\Administrator\.gemini\antigravity\scratch\fashin-play"

:: 2. Kill any old node processes (Cleanup)
taskkill /F /IM node.exe >nul 2>&1

:: 3. Start Backend Server (Minimized to avoid clutter)
echo   Starting Backend Audio Server...
start "FASHIN Play - Backend Audio Server" /min cmd /k "node server.js"

:: 4. Wait for server to be ready
timeout /t 5 >nul

:: 5. Start Frontend and open browser
echo   Starting Frontend...
call npm run dev
