@echo off
setlocal

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js bulunamadı. https://nodejs.org adresinden yukleyip tekrar deneyin.
  pause
  exit /b 1
)

echo Node versiyonu:
node -v

echo Bagimliliklar kontrol ediliyor...
if not exist node_modules (
  echo node_modules bulunamadi, npm install calisiyor...
  npm install
)

echo Gelistirme sunucusu baslatiliyor...
start "Wrapped 2025" http://localhost:3000
npm run dev
