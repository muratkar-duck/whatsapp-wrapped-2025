@echo off
setlocal

set ENABLE_LOCAL_BUILD=1
set NODE_ENV=development

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js bulunamadı. Lutfen https://nodejs.org adresinden kurup tekrar deneyin.
  pause
  exit /b 1
)

echo Node versiyonu:
node -v

echo Bağımlılıklar kontrol ediliyor...
if not exist node_modules (
  echo node_modules bulunamadı, npm install çalışıyor...
  npm install || (echo npm install başarısız oldu. Lütfen çıktıyı inceleyin. & pause & exit /b 1)
)

echo Geliştirme sunucusu baslatiliyor (ENABLE_LOCAL_BUILD=1)...
start "Wrapped 2025" http://localhost:3000
npm run dev
pause
