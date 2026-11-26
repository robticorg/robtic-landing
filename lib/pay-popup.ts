// Opens the pay popup (pay-app/, loaded through /rl/robtic/pay-open.js the first time). window.RobticPay is declared
// with the popup (pay-app/entry.tsx).
import type { PayOptions, PayResult } from '@/pay-app/PayPopup';

let ready: Promise<void> | null = null;

function load(): Promise<void> {
    if (window.RobticPay) return Promise.resolve();
    ready ??= new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = '/rl/robtic/pay-open.js';
        s.onload = () => resolve();
        s.onerror = () => {
            ready = null;
            reject(new Error('The payment window could not load. Try again.'));
        };
        document.head.appendChild(s);
    });
    return ready;
}

export async function openPay(options: PayOptions): Promise<PayResult> {
    await load();
    return window.RobticPay!.open(options);
}
