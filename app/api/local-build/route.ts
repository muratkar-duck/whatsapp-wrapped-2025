import { NextResponse } from 'next/server';
import { isLocalBuildAllowed, localBuildDetails, localBuildHint } from '../../../lib/localBuild';

export async function GET() {
  const allowed = isLocalBuildAllowed();
  return NextResponse.json({ allowed, hint: localBuildHint(), details: localBuildDetails() });
}
