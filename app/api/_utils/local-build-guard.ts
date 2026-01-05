import { NextResponse } from 'next/server';

const LOCALHOST_HOSTS = ['localhost', '127.0.0.1', '::1'];
const LOCALHOST_IPS = new Set(['127.0.0.1', '::1']);

function parseHostHeader(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  if (hostHeader.startsWith('[')) {
    const endIndex = hostHeader.indexOf(']');
    if (endIndex !== -1) {
      return hostHeader.slice(1, endIndex);
    }
  }
  return hostHeader.split(':')[0];
}

function isLocalHostname(hostname: string | null): boolean {
  if (!hostname) return false;
  return LOCALHOST_HOSTS.includes(hostname);
}

function extractClientIp(request?: Request): string | null {
  if (!request) return null;

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [first] = forwardedFor.split(',').map((part) => part.trim());
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Node 18 Request does not expose remote address; fall back to host detection
  return null;
}

function isLocalRequest(request?: Request): boolean {
  if (!request) return false;

  const originHeader = request.headers.get('origin');
  if (originHeader) {
    try {
      const { hostname } = new URL(originHeader);
      if (isLocalHostname(hostname)) return true;
    } catch {
      // ignore parsing failures
    }
  }

  try {
    const { hostname } = new URL(request.url);
    if (isLocalHostname(hostname)) return true;
  } catch {
    // ignore parsing failures
  }

  const hostHeader = parseHostHeader(request.headers.get('host'));
  if (isLocalHostname(hostHeader)) return true;

  const ip = extractClientIp(request);
  if (ip && LOCALHOST_IPS.has(ip)) return true;

  return false;
}

export function isLocalBuildAllowed(request?: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  if (process.env.ENABLE_LOCAL_BUILD === '1') return true;
  if (isLocalRequest(request)) return true;
  return false;
}

export function enforceLocalBuildAccess(request?: Request) {
  if (isLocalBuildAllowed(request)) return null;

  return NextResponse.json(
    {
      ok: false,
      error: 'LOCAL_BUILD_DISABLED',
      hint: 'Set ENABLE_LOCAL_BUILD=1 or run in development.'
    },
    { status: 403 }
  );
}
