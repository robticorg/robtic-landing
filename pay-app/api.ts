// The calls the pay popup makes, all on the site it's opened from (robtic.org: the panel's API with its session
// cookie; links: the public /api/robtic/pay routes). A refusal keeps the panel's whole reply (its `error` sentence
// and fields like `code`).

export class PayError extends Error {
    constructor(public status: number, message: string, public body: Record<string, unknown> = {}) {
        super(message);
    }
}

function csrfToken(): string | null {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]!) : null;
}

export async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
        const token = csrfToken();
        if (token) headers['X-XSRF-TOKEN'] = token;
    }
    let res: Response;
    try {
        res = await fetch(path, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
        throw new PayError(0, 'You seem to be offline. Check your connection and try again.');
    }
    if (res.status === 204) return undefined as T;
    const data = (await res.json().catch(() => null)) as Record<string, any> | null;
    if (!res.ok) {
        const message =
            data?.error ||
            data?.errors?.[0]?.detail ||
            data?.message ||
            (res.status === 419 || res.status === 401 ? 'Your sign-in expired. Sign in again and retry.' : `That didn’t work (${res.status}).`);
        throw new PayError(res.status, String(message), data ?? {});
    }
    return data as T;
}

export type Money = { amount: number; currency: string };
export type Tax = { enabled: boolean; name: string; rate: number; inclusive: boolean } | null;
export type Card = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean };

export type BillingOverview = {
    publishableKey: string | null;
    prices: Record<string, Money>;
    tax: Tax;
    plan: { key: string; name: string; ends_at: string | null };
    account: { subscription: { plan: string; status: string } | null };
};

export type Checkout = {
    subscriptionId: string;
    clientSecret: string;
    kind: 'payment' | 'setup';
    amount: { net: number; tax: number; total: number; currency: string; dueNow: number };
};

export type PublicLink = {
    id: string;
    title: string;
    note: string;
    amount: { net: number; tax: number; total: number };
    tax: { name: string; rate: number; inclusive: boolean } | null;
    currency: string;
    style: 'hosting' | 'discord';
    uses: 'once' | 'many';
    open: boolean;
    reason: 'paid' | 'expired' | 'off' | null;
};

export type BillingDetails = {
    name: string;
    address: { line1: string; line2: string | null; city: string; postal_code: string; country: string };
};

export const BILLING = '/api/client/robtic/billing';

/** "$4.60", "SAR 15.00": amounts are in minor units. */
export function money(amount: number, currency: string): string {
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() });
    const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
    return fmt.format(amount / 10 ** digits).replace(/ /g, ' ');
}

/** The same rule as robtic-payment: rounded half up once, on the whole amount. */
export function withTax(amount: number, tax: Tax): { net: number; tax: number; total: number } {
    if (!tax?.enabled || tax.rate <= 0) return { net: amount, tax: 0, total: amount };
    if (tax.inclusive) {
        const t = Math.round((amount * tax.rate) / (100 + tax.rate));
        return { net: amount - t, tax: t, total: amount };
    }
    const t = Math.round((amount * tax.rate) / 100);
    return { net: amount, tax: t, total: amount + t };
}

const BRANDS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover', jcb: 'JCB', unionpay: 'UnionPay', diners: 'Diners', mada: 'mada' };
export const brandName = (b: string) => BRANDS[b] ?? b.charAt(0).toUpperCase() + b.slice(1);
const SHORT: Record<string, string> = { visa: 'VISA', mastercard: 'MC', amex: 'AMEX', discover: 'DISC', jcb: 'JCB', unionpay: 'UPAY', diners: 'DINERS', mada: 'mada' };
export const brandShort = (b: string) => SHORT[b] ?? b.slice(0, 4).toUpperCase();
export const planName = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);
