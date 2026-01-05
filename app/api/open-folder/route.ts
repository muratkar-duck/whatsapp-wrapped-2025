import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextResponse } from 'next/server';

const isLocalBuildAllowed = process.env.NODE_ENV === 'development' || process.env.ENABLE_LOCAL_BUILD === '1';

export async function POST(request: Request) {
  if (!isLocalBuildAllowed) {
    return NextResponse.json({ error: 'Yerel dosya açma yalnızca geliştirme ortamında kullanılabilir.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const targetPath = typeof body?.path === 'string' ? body.path : null;
    if (!targetPath) {
      return NextResponse.json({ error: 'path alanı zorunlu.' }, { status: 400 });
    }

    const normalized = path.resolve(process.cwd(), targetPath);
    const command = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';

    return new Promise((resolve) => {
      const child = spawn(command, [normalized], { shell: false });
      child.on('error', (error) => {
        resolve(NextResponse.json({ error: error.message }, { status: 500 }));
      });
      child.on('close', (code) => {
        if (code === 0) {
          resolve(NextResponse.json({ success: true }));
        } else {
          resolve(NextResponse.json({ error: 'Klasör açılamadı.' }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'İstek işlenemedi.' }, { status: 500 });
  }
}
