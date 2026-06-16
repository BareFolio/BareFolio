import { notFound } from 'next/navigation';

/**
 * Kill-switch for the (not-yet-public) platform/app routes.
 *
 * While `NEXT_PUBLIC_PLATFORM_LIVE` is anything other than `'true'`, every
 * platform route that calls this returns a real 404 (and Next injects
 * `<meta name="robots" content="noindex" />`), so nothing of the in-progress
 * app is visible or indexable. Flip the env var to `'true'` to bring the whole
 * platform back online without touching the route code.
 *
 * `NEXT_PUBLIC_` vars are inlined at build time, so this is a compile-time
 * constant per build — safe to call before hooks in client components.
 */
export function gatePlatform(): void {
  if (process.env.NEXT_PUBLIC_PLATFORM_LIVE !== 'true') {
    notFound();
  }
}
