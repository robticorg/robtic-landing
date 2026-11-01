// Sentry in the browser: errors, and a sample of page loads and navigations. Runs before the page's own code.
import * as Sentry from '@sentry/nextjs';
import { SENTRY_DSN } from '@/lib/site';

Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Never cookies, headers, bodies, query strings or who the user is: this handles sessions and passwords.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
