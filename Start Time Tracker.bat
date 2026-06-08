@echo off
set "HERE=%~dp0"
if not exist "%HERE%node_modules\electron\dist\electron.exe" (
  echo Electron is missing. Open Command Prompt here and run: npm install
  pause
  exit /b 1
)
start "" /D "%HERE%" "%HERE%node_modules\electron\dist\electron.exe" "%HERE%."
