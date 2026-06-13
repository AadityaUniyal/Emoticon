@echo off
title EmoSense Launcher
color 0B
cls

echo =======================================================================
echo          🧠  EMO_SENSE COGNITIVE TELEMETRY CONSOLE LAUNCHER 🧠
echo =======================================================================
echo.
echo [SYS] Initializing EmoSense system boot sequence...
echo [SYS] Operating System: Windows

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERR] Node.js is not installed. Please install Node.js (v18+) to run the web app.
  pause
  exit /b 1
)
echo [SYS] Node.js detected.

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERR] Python is not installed. Python is required to run the ML serve layer.
  echo [WRN] Continuing without Python... Web App will run in SMART_MOCK fallback mode.
  goto WEB_BOOT
)
echo [SYS] Python detected.

:: Setup ML virtual environment
if not exist "ml\.venv" (
  echo [SYS] Creating Python virtual environment in ml\.venv...
  python -m venv ml\.venv
)

:: Install python requirements
echo [SYS] Verifying Python package dependencies...
cmd /c "ml\.venv\Scripts\pip install -r ml\requirements.txt"

:: Start ML API in a new window
echo [SYS] Launching FastAPI backend server...
start "EmoSense ML Backend" cmd /c "cd ml && .venv\Scripts\python serve\api.py"

:WEB_BOOT
:: Check for web modules
if not exist "web\node_modules" (
  echo [SYS] Installing web node_modules (this may take a minute)...
  cd web && npm install && cd ..
)

:: Start Web server in a new window
echo [SYS] Launching Next.js Web Console...
start "EmoSense Next.js Web Console" cmd /c "cd web && npm run dev"

echo.
echo =======================================================================
echo  🚀  SYSTEM BOOT SEQUENCE COMPLETE!
echo  🌐  Next.js Console: http://localhost:3000
echo  🤖  FastAPI Backend: http://localhost:8000 (if Python started)
echo =======================================================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 >nul
start http://localhost:3000

exit
