// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDB(request: Request): any | null {
  const env = (request as any).cf?.env;
  if (env?.DB) return env.DB;

  const g = globalThis as any;
  if (g.process?.env?.DB) return g.process.env.DB;
  if (g.__env__?.DB) return g.__env__.DB;

  try {
    // @cloudflare/next-on-pages runtime helper
    const mod = require('@cloudflare/next-on-pages');
    const ctx = mod.getRequestContext?.() ?? mod.default?.getRequestContext?.();
    return ctx?.env?.DB ?? null;
  } catch {
    return null;
  }
}
