/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // The site is static markup over copied CSS/JS/images; no server features are needed, so it can be
    // exported and served by nginx as plain files (output: 'export') or run under `next start`. We keep the
    // Node server so the catch-all redirect (not-found) and headers work without extra nginx rules; nginx can
    // still sit in front of it.
    poweredByHeader: false,
};

export default nextConfig;
