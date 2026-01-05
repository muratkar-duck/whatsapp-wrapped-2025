import { NextResponse } from 'next/server';
import { isLocalBuildAllowed, localBuildErrorPayload } from '../../../lib/localBuild';

export function enforceLocalBuildAccess(_request?: Request) {
  if (isLocalBuildAllowed()) return null;

  return NextResponse.json(localBuildErrorPayload(), { status: 403 });
}
