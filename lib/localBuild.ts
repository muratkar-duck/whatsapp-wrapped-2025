const LOCAL_BUILD_HINT =
  'ENABLE_LOCAL_BUILD=1 ile çalıştırın veya development modunda (npm run dev) açın.';

export type LocalBuildDetails = {
  nodeEnv: string;
  enableLocalBuild: boolean;
  platform: string;
};

export function isLocalBuildAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const enableLocalBuild = env.ENABLE_LOCAL_BUILD === '1';

  if (nodeEnv === 'development') return true;
  if (enableLocalBuild) return true;
  return false;
}

export function localBuildHint(): string {
  return LOCAL_BUILD_HINT;
}

export function localBuildDetails(env: NodeJS.ProcessEnv = process.env): LocalBuildDetails {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    enableLocalBuild: env.ENABLE_LOCAL_BUILD === '1',
    platform: process.platform
  };
}

export function localBuildErrorPayload(env: NodeJS.ProcessEnv = process.env) {
  return {
    error: 'Orchestrator API erişimi reddedildi.',
    hint: localBuildHint(),
    details: localBuildDetails(env)
  };
}
