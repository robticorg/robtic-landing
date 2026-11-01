// Sentry on the server: errors from rendering and API routes, and a sample of requests.
import * as Sentry from '@sentry/nextjs';
import { SENTRY_DSN } from '@/lib/site';

export function register() {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        // Never cookies, headers, bodies, query strings or who the user is: this handles sessions and passwords.
        dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    });
}

export const onRequestError = Sentry.captureRequestError;
