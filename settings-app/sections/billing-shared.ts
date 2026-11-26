// What Settings → Plan and Payment methods share: the pay popup and which look Settings is showing.
import type { PayOptions, PayResult } from '../../pay-app/PayPopup';

declare global {
    interface Window {
        RobticPay?: { open: (o: PayOptions) => Promise<PayResult>; stub?: boolean };
    }
}

/** The look Settings is showing (the pay popup opens in the same one). */
export function settingsTheme(): 'hosting' | 'discord' {
    const root = document.querySelector('robtic-settings')?.shadowRoot?.querySelector('.st-root');
    return root?.classList.contains('theme-hosting') ? 'hosting' : 'discord';
}

let loading: Promise<void> | null = null;

/** Opens the pay popup (loading it the first time). */
export async function openPay(options: PayOptions): Promise<PayResult> {
    if (!window.RobticPay) {
        loading ??= new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = '/rl/robtic/pay-open.js';
            s.onload = () => resolve();
            s.onerror = () => {
                loading = null;
                reject(new Error('The payment window could not load. Try again.'));
            };
            document.head.appendChild(s);
        });
        await loading;
    }
    return window.RobticPay!.open({ theme: settingsTheme(), ...options } as PayOptions);
}

export const day = (v: string) => new Date(v).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
