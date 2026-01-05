import { describe, expect, it, beforeEach, afterAll } from 'vitest';
import { enforceLocalBuildAccess, isLocalBuildAllowed } from '../app/api/_utils/local-build-guard';

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
    const allowed = isLocalBuildAllowed(new Request('http://example.com/api/run-all'));
    expect(allowed).toBe(true);
  });

  it('blocks production requests without override', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_LOCAL_BUILD;

    const response = enforceLocalBuildAccess(new Request('http://example.com/api/run-all'));
    expect(response?.status).toBe(403);
    const body = await response?.json();
    expect(body).toEqual({
      ok: false,
      error: 'LOCAL_BUILD_DISABLED',
      hint: 'Set ENABLE_LOCAL_BUILD=1 or run in development.'
    });
  });

  it('allows production requests when ENABLE_LOCAL_BUILD=1', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_LOCAL_BUILD = '1';

    const response = enforceLocalBuildAccess(new Request('http://example.com/api/build-report'));
    expect(response).toBeNull();
  });

  it('allows localhost requests even in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_LOCAL_BUILD;

    const response = enforceLocalBuildAccess(new Request('http://127.0.0.1:3000/api/export-pdf'));
    expect(response).toBeNull();
  });
});
