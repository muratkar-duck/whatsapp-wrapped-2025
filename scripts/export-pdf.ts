import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { promises as fs } from 'node:fs';

const resolveCommand = (command: string) => (process.platform === 'win32' && !command.endsWith('.cmd') ? `${command}.cmd` : command);

async function runCommand(cmd: string, args: string[]) {
  const executable = resolveCommand(cmd);
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function startServer() {
  await runCommand('npm', ['run', 'build']);
  const proc = spawn(resolveCommand('npm'), ['run', 'start', '--', '--hostname', '0.0.0.0', '--port', '3000'], {
    stdio: 'inherit',
    shell: false
  });
  await new Promise((res) => setTimeout(res, 4000));
  return proc;
}

async function exportPdf() {
  const server = await startServer();
  await fs.mkdir(path.join(process.cwd(), 'dist'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/report/2025', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 1200, height: 1600 });
  const target = path.join(process.cwd(), 'dist', 'wrapped_2025.pdf');
  await page.pdf({
    path: target,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1
  });
  await browser.close();
  server.kill();
  console.log(`PDF kaydedildi → ${target}`);
}

exportPdf();
