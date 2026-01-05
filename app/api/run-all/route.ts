import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';

const isLocalBuildAllowed = process.env.NODE_ENV === 'development' || process.env.ENABLE_LOCAL_BUILD === '1';

function createStreamResponse(enablePdf: boolean) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const args = ['tsx', 'scripts/run-all.ts'];
      if (enablePdf) {
        args.push('--pdf');
      }

      const child = spawn('npx', args, {
        cwd: process.cwd(),
        env: process.env,
        shell: true
      });

      const handleLine = (line: string, isError = false) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        try {
          JSON.parse(trimmed);
          controller.enqueue(encoder.encode(`${trimmed}\n`));
        } catch {
          const payload = {
            status: isError ? 'error' : 'running',
            message: trimmed,
            hint: isError ? 'Detaylar için logları kopyalayın' : undefined
          };
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        }
      };

      child.stdout?.on('data', (chunk) => {
        const lines = chunk.toString().split(/\r?\n/);
        lines.forEach((line) => handleLine(line));
      });

      child.stderr?.on('data', (chunk) => {
        const lines = chunk.toString().split(/\r?\n/);
        lines.forEach((line) => handleLine(line, true));
      });

      child.on('error', (error) => {
        const payload = {
          status: 'error',
          message: error.message,
          hint: 'Komut başlatılamadı'
        };
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        controller.close();
      });

      child.on('close', () => {
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store'
    }
  });
}

export async function POST(request: NextRequest) {
  if (!isLocalBuildAllowed) {
    return NextResponse.json({ error: 'Yerel orchestrator sadece geliştirme ortamında açıktır.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({ pdf: false }));
  const enablePdf = Boolean(body?.pdf);

  return createStreamResponse(enablePdf);
}
