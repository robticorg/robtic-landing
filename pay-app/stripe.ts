// Stripe.js, loaded once from js.stripe.com as Stripe requires (it can't be bundled). The versioned script matches
// robtic-payment's API release; the unversioned v3 script stands in if that can't load.
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    interface Window {
        Stripe?: (key: string) => any;
    }
}

const VERSIONED = 'https://js.stripe.com/endive/stripe.js';
const FALLBACK = 'https://js.stripe.com/v3/';

let script: Promise<void> | null = null;
/** Which script loaded: the versioned one names card-only fields differently from v3. */
let versioned = true;
const clients = new Map<string, any>();

function load(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => (window.Stripe ? resolve() : reject(new Error('Stripe did not load.')));
        s.onerror = () => {
            s.remove();
            reject(new Error('Stripe could not be reached.'));
        };
        document.head.appendChild(s);
    });
}

/** The Stripe client for this publishable key. */
export async function stripeFor(publishableKey: string): Promise<any> {
    if (!window.Stripe) {
        script ??= load(VERSIONED).then(
            () => { versioned = true; },
            () => load(FALLBACK).then(() => { versioned = false; })
        );
        try {
            await script;
        } catch (e) {
            script = null;
            throw new Error('The card form could not load. Check your connection and try again.');
        }
    }
    if (!clients.has(publishableKey)) clients.set(publishableKey, window.Stripe!(publishableKey));
    return clients.get(publishableKey);
}

/** Card only: endive and later take allowedPaymentMethodTypes; the v3 fallback still takes paymentMethodTypes. */
export const cardOnly = () => (versioned ? { allowedPaymentMethodTypes: ['card'] } : { paymentMethodTypes: ['card'] });

export type Theme = 'hosting' | 'discord';

/** Stripe's fields drawn in the popup's colours. */
export function appearance(theme: Theme) {
    const hosting = theme === 'hosting';
    return {
        theme: 'night',
        labels: 'above',
        variables: {
            colorPrimary: hosting ? '#f4f4f5' : '#1793ff',
            colorBackground: hosting ? '#0e0e11' : '#0a1020',
            colorText: hosting ? '#f4f4f5' : '#e8eefb',
            colorTextSecondary: hosting ? '#8b9099' : '#93a1ba',
            colorTextPlaceholder: hosting ? '#71717a' : '#66748f',
            colorDanger: '#f87171',
            borderRadius: '10px',
            fontSizeBase: '14px',
            spacingUnit: '4px',
            fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
        },
        rules: {
            '.Input': { border: `1px solid ${hosting ? 'rgba(255,255,255,0.14)' : 'rgba(120,170,255,0.22)'}`, boxShadow: 'none' },
            '.Input:focus': { borderColor: hosting ? '#f4f4f5' : '#1793ff', boxShadow: 'none' },
            '.Label': { fontWeight: '500', fontSize: '12.5px' },
        },
    };
}
