@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "Alixis's Monopoly Mod" http://localhost:8000
  py -m http.server 8000
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "Alixis's Monopoly Mod" http://localhost:8000
  python -m http.server 8000
  goto :eof
)
echo Python was not found.
echo Install Python 3, or publish this folder using GitHub Pages / another static host.
echo The game uses PeerJS and should be opened through localhost or HTTPS, not file://.
pause
