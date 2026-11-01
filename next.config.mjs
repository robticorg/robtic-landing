import sentry from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Emit a self-contained server bundle (.next/standalone) so the Docker runtime image stays tiny.
    output: 'standalone',
    // The site is static markup over copied CSS/JS/images; no server features are needed, so it can be
    // exported and served by nginx as plain files (output: 'export') or run under `next start`. We keep the
    // Node server so the catch-all redirect (not-found) and headers work without extra nginx rules; nginx can
    // still sit in front of it.
    poweredByHeader: false,
};

// Source maps go up only when CI has a token; without one the build is unchanged.
export default sentry.withSentryConfig(nextConfig, {
    org: 'robtic-7p',
    project: 'robtic-landing',
    silent: true,
    telemetry: false,
    // Errors go through our own address: ad blockers stop direct calls to Sentry. Under /rl/ because NPM sends that to the landing.
    tunnelRoute: '/rl/e',
    sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
