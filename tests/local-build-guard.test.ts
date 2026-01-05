import { describe, expect, it, beforeEach, afterAll } from 'vitest';
import { enforceLocalBuildAccess } from '../app/api/_utils/local-build-guard';
import { isLocalBuildAllowed, localBuildHint } from '../lib/localBuild';

const ORIGINAL_ENV = process.env;

describe('local build guard', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('allows requests in development mode', () => {
    process.env.NODE_ENV = 'development';
    const allowed = isLocalBuildAllowed();
    expect(allowed).toBe(true);
  });

  it('blocks production requests without override', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_LOCAL_BUILD;

    const response = enforceLocalBuildAccess();
    expect(response?.status).toBe(403);
    const body = await response?.json();
    expect(body).toEqual({
      error: 'Orchestrator API erişimi reddedildi.',
      hint: localBuildHint(),
      details: {
        nodeEnv: 'production',
        enableLocalBuild: false,
        platform: process.platform
      }
    });
  });

  it('allows production requests when ENABLE_LOCAL_BUILD=1', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_LOCAL_BUILD = '1';

    const response = enforceLocalBuildAccess();
    expect(response).toBeNull();
  });
});
