@echo off
cd /d "%~dp0"
echo Installing dependencies in %CD%...
call npm install zod @tanstack/react-query axios lucide-react react-hook-form @hookform/resolvers clsx
if %errorlevel% neq 0 (
  echo Installation failed.
  exit /b %errorlevel%
)
echo Installation complete.
