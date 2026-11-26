// The pay popup as one script for every Robtic place (built by scripts/build-pay.ts to /rl/robtic/pay/pay.js).
// A page loads /rl/robtic/pay-open.js and calls:
//
//     window.RobticPay.open({ kind: 'plan', plan: 'developers', theme: 'hosting' })   // a plan
//     window.RobticPay.open({ kind: 'card' })                                         // save a card
//     window.RobticPay.open({ kind: 'link', link })                                   // a payment link
//
// It resolves 'paid', 'saved' or 'closed'. Calls made before this script arrived (pay-open.js queues them) run now.
import { createRoot } from 'react-dom/client';
import css from './pay.css' with { type: 'text' };
import PayPopup, { type PayOptions, type PayResult } from './PayPopup';

type Queued = [PayOptions, (r: PayResult) => void];
declare global {
    interface Window {
        RobticPay?: { open: (o: PayOptions) => Promise<PayResult>; stub?: boolean };
        __robticPayQueue?: Queued[];
    }
}

let openNow: Promise<PayResult> | null = null;

function styles() {
    if (document.getElementById('robtic-pay-css')) return;
    const style = document.createElement('style');
    style.id = 'robtic-pay-css';
    style.textContent = css;
    document.head.appendChild(style);
}

function open(options: PayOptions): Promise<PayResult> {
    // One at a time: a second call while open gets the same answer.
    if (openNow) return openNow;
    styles();
    const restoreFocus = document.activeElement as HTMLElement | null;
    const restoreOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const host = document.createElement('div');
    host.setAttribute('data-robtic-pay', '');
    document.body.appendChild(host);
    const root = createRoot(host);
    openNow = new Promise<PayResult>((resolve) => {
        root.render(
            <PayPopup
                options={options}
                onClose={(result) => {
                    root.unmount();
                    host.remove();
                    document.documentElement.style.overflow = restoreOverflow;
                    restoreFocus?.focus?.();
                    openNow = null;
                    resolve(result);
                }}
            />,
        );
    });
    return openNow;
}

window.RobticPay = { open };
for (const [options, resolve] of window.__robticPayQueue?.splice(0) ?? []) void open(options).then(resolve);
