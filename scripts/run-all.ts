import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUTPUT_MESSAGES_PATH = path.join(process.cwd(), 'dist', 'messages.jsonl');
const CHAT_PATH = path.join(process.cwd(), 'data', 'input', 'whatsapp', '_chat.txt');
const LEGACY_CHAT_PATH = path.join(process.cwd(), 'data', 'input', 'whatsapp.txt');
const RUNNER_NAME = 'one-click-runner';

type RunnerStep = 'validate' | 'parse' | 'report' | 'pdf';
type RunnerStatus = 'running' | 'success' | 'error';

type RunnerEvent = {
  status: RunnerStatus;
  step?: RunnerStep | 'complete';
  message: string;
  hint?: string;
  details?: string;
};

class RunnerError extends Error {
  step: RunnerStep;
  hint?: string;
  constructor(message: string, step: RunnerStep, hint?: string) {
    super(message);
    this.step = step;
    this.hint = hint;
  }
}

function emit(event: RunnerEvent) {
  console.log(JSON.stringify({ source: RUNNER_NAME, ...event }));
}

async function fileExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function validateInputs() {
  const hasExport = await fileExists(CHAT_PATH);
  const hasLegacy = await fileExists(LEGACY_CHAT_PATH);

  if (!hasExport && !hasLegacy) {
    throw new RunnerError('_chat.txt bulunamadı', 'parse', 'WhatsApp export klasörünü data/input/whatsapp altına koyun');
  }
}

function streamLines(data: Buffer, step: RunnerStep, stream: 'stdout' | 'stderr') {
  const content = data.toString();
  const lines = content.split(/\r?\n/).filter(Boolean);
  lines.forEach((line) => {
    emit({
      status: stream === 'stderr' ? 'error' : 'running',
      step,
      message: line
    });
  });
}

function resolveCommand(command: string) {
  return process.platform === 'win32' && !command.endsWith('.cmd') ? `${command}.cmd` : command;
}

async function runCommand(command: string, args: string[], step: RunnerStep) {
  const executable = resolveCommand(command);
  return new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false
    });

    child.stdout?.on('data', (chunk) => streamLines(chunk, step, 'stdout'));
    child.stderr?.on('data', (chunk) => streamLines(chunk, step, 'stderr'));

    child.on('error', (error) => {
      reject(new RunnerError(error.message, step, 'Detaylar için logları kopyalayın'));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new RunnerError(`${command} ${args.join(' ')} hatayla kapandı`, step, 'Detaylar için logları kopyalayın'));
      }
    });
  });
}

async function ensureMessagesExist() {
  try {
    const content = await fs.readFile(OUTPUT_MESSAGES_PATH, 'utf-8');
      const count = content
        .split(/\n/)
        .filter(Boolean)
        .length;

      if (count === 0) {
        throw new RunnerError(
          'WhatsApp export formatı tanınmadı veya regex eşleşmedi',
          'parse',
          'İlk satır örneği (maskeli): [..] <NAME>: <TEXT> · Desteklenen formatlar: 12/01/2025, 09:12 - Kişi: Mesaj · 1.02.25 10:01 - Kişi: Mesaj · [18.04.2025 13:42] Kişi: Mesaj'
        );
      }
  } catch (error: any) {
    if (error instanceof RunnerError) throw error;
    throw new RunnerError(
      'Sohbet verisi okunamadı',
      'parse',
      'WhatsApp export klasörünü data/input/whatsapp altına koyun'
    );
  }
}

function normalizeError(error: unknown, step: RunnerStep): RunnerError {
  if (error instanceof RunnerError) {
    return error;
  }
  const message = error instanceof Error ? error.message : 'Bilinmeyen hata';

  const lowered = message.toLowerCase();
  if (step === 'pdf' && (lowered.includes('playwright') || lowered.includes('chromium'))) {
    return new RunnerError('PDF engine bulunamadı', step, 'npx playwright install');
  }

  return new RunnerError(message, step, 'Detaylar için logları kopyalayın');
}

async function parsePhase() {
  emit({ status: 'running', step: 'parse', message: 'WhatsApp sohbeti parse ediliyor…' });
  await runCommand('npm', ['run', 'parse:whatsapp'], 'parse');
  await runCommand('npm', ['run', 'parse:gsm'], 'parse');
  await ensureMessagesExist();
  emit({ status: 'success', step: 'parse', message: 'Mesajlar okundu, ara çıktılar hazır.' });
}

async function reportPhase() {
  emit({ status: 'running', step: 'report', message: 'Rapor hazırlanıyor…' });
  await runCommand('npm', ['run', 'render:assets'], 'report');
  await runCommand('npx', ['tsx', 'scripts/build-report.ts'], 'report');
  emit({ status: 'success', step: 'report', message: 'report.json oluşturuldu.' });
}

async function pdfPhase() {
  emit({ status: 'running', step: 'pdf', message: 'PDF export başlatıldı…' });
  await runCommand('npx', ['tsx', 'scripts/export-pdf.ts'], 'pdf');
  emit({ status: 'success', step: 'pdf', message: 'PDF üretildi: dist/wrapped_2025.pdf' });
}

async function main() {
  const shouldGeneratePdf = process.argv.includes('--pdf') || process.env.ENABLE_PDF === '1';

  try {
    emit({ status: 'running', step: 'validate', message: 'Input kontrolü yapılıyor…' });
    await validateInputs();
    emit({ status: 'success', step: 'validate', message: 'Input OK' });

    await parsePhase();
    await reportPhase();

    if (shouldGeneratePdf) {
      await pdfPhase();
    } else {
      emit({ status: 'running', step: 'pdf', message: 'PDF atlandı (flag kapalı).' });
    }

    emit({ status: 'success', step: 'complete', message: 'Tüm adımlar tamamlandı.' });
  } catch (error: any) {
    const step: RunnerStep = error?.step ?? 'report';
    const normalized = normalizeError(error, step);
    emit({
      status: 'error',
      step: normalized.step,
      message: normalized.message,
      hint: normalized.hint,
      details: normalized.stack
    });
    process.exit(1);
  }
}

main();
