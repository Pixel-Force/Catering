@echo off
echo ================================================================
echo   Starting Grand Heritage Catering & Events Production Server
echo ================================================================
cd /d "%~dp0"
if exist "server\server.js" (
  node server\server.js
) else if exist "catering\server\server.js" (
  node catering\server\server.js
)
pause
