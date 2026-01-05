import { spawn } from 'node:child_process';
import { NextResponse } from 'next/server';
import { enforceLocalBuildAccess } from '../_utils/local-build-guard';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

function resolveCommand(command: string) {
  return process.platform === 'win32' && !command.endsWith('.cmd') ? `${command}.cmd` : command;
}

async function runCommand(command: string, args: string[]): Promise<CommandResult> {
  const executable = resolveCommand(command);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr, exitCode: code });
      else reject({ stdout, stderr, exitCode: code });
    });
  });
}

export async function POST() {
  const guardResponse = enforceLocalBuildAccess();
  if (guardResponse) return guardResponse;

  try {
    const result = await runCommand('npm', ['run', 'export:pdf']);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'PDF oluşturma sırasında hata oluştu.',
        stdout: error?.stdout ?? '',
        stderr: error?.stderr ?? '',
        exitCode: error?.exitCode ?? null
      },
      { status: 500 }
    );
  }
}
