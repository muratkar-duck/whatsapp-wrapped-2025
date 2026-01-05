@echo off
setlocal EnableDelayedExpansion

rem Betik dizinine git
cd /d "%~dp0"

rem Node.js mevcut mu?
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js bulunamadı. Lutfen https://nodejs.org adresinden kurup tekrar deneyin.
  pause
  exit /b 1
)

rem Node versiyonunu kontrol et
for /f "tokens=1 delims=." %%v in ('node -v') do set NODE_MAJOR_RAW=%%v
set NODE_MAJOR=!NODE_MAJOR_RAW:v=!

echo Node versiyonu: !NODE_MAJOR_RAW!

if !NODE_MAJOR! LSS 18 (
  echo Bu proje icin Node 18+ gerekiyor. Lutfen Node 20 LTS kurun.
  pause
  exit /b 1
)

if !NODE_MAJOR! GEQ 22 (
  echo Uyari: Node !NODE_MAJOR! tespit edildi. Proje Node 20 LTS ile test edildi; devam ediliyor...
)

echo Bağımlılıklar kontrol ediliyor...
if not exist node_modules (
  echo node_modules bulunamadı, npm install çalışıyor...
  npm install || (echo npm install başarısız oldu. Lütfen çıktıyı inceleyin. & pause & exit /b 1)
)

set ENABLE_LOCAL_BUILD=1
set NEXT_PUBLIC_ENABLE_LOCAL_BUILD=1
set NODE_ENV=development

echo Geliştirme sunucusu baslatiliyor (ENABLE_LOCAL_BUILD=1)...
start "Wrapped 2025" http://localhost:3000
npm run dev

endlocal
pause
