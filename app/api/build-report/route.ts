import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { enforceLocalBuildAccess } from '../_utils/local-build-guard';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function resolveCommand(command: string, args: string[]) {
  if (command === 'npm') {
    return { executable: npmCmd, resolvedArgs: args };
  }

  if (command === 'npx' && args[0] === 'tsx') {
    const [, ...rest] = args;
    const tsxCli = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.js');
    return { executable: process.execPath, resolvedArgs: [tsxCli, ...rest] };
  }

  const executable = process.platform === 'win32' && !command.endsWith('.cmd') ? `${command}.cmd` : command;
  return { executable, resolvedArgs: args };
}

async function runCommand(command: string, args: string[]): Promise<CommandResult> {
  const { executable, resolvedArgs } = resolveCommand(command, args);
  return new Promise((resolve, reject) => {
    const child = spawn(executable, resolvedArgs, {
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
    const result = await runCommand('npm', ['run', 'build:report']);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Rapor oluşturma sırasında hata oluştu.',
        stdout: error?.stdout ?? '',
        stderr: error?.stderr ?? '',
        exitCode: error?.exitCode ?? null
      },
      { status: 500 }
    );
  }
}
