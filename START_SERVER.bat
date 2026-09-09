@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Please install Node.js 20 or later, then run this file again.
  pause
  exit /b 1
)
echo IRON TIDE 2
echo Open http://localhost:3000 in your browser.
echo Keep this window open while playing. Press Ctrl+C to stop.
node server/server.cjs
pause
