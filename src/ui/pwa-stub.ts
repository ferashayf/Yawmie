// Artifact build: no service worker inside Claude.
export function registerSW(_options: unknown) {
  return async (_reload?: boolean) => {};
}
