'use client';

// The signed-in person's account, for Settings. The landing and the panel share the robtic.org origin, so these are
// same-origin calls with the panel's session cookie; changes send back the CSRF token from its XSRF-TOKEN cookie.

export type Badge = { key: string; name: string; icon: string | null; color: string; description: string | null };

export type Profile = {
    username: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string;
    badges: Badge[];
    joined_at: string | null;
    active_hours: number;
    online: boolean;
    last_seen: string | null;
    email: string;
    two_factor: boolean;
    password_set: boolean;
    workspace_ui: boolean;
};

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

function csrfToken(): string | null {
    const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const form = body instanceof FormData;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined && !form) headers['Content-Type'] = 'application/json';
    if (method !== 'GET') {
        const token = csrfToken();
        if (token) headers['X-XSRF-TOKEN'] = token;
    }
    const res = await fetch(path, {
        method,
        headers,
        credentials: 'same-origin',
        body: body === undefined ? undefined : form ? (body as FormData) : JSON.stringify(body),
    });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }
    if (!res.ok) throw new ApiError(res.status, data?.errors?.[0]?.detail || data?.message || `Request failed (${res.status})`);
    return data as T;
}

export const PROFILE = '/api/client/robtic/account/profile';

export const getProfile = () => request<{ data: Profile }>('GET', PROFILE).then((r) => r.data);

// The file field for an image upload.
export function imageForm(field: string, file: File): FormData {
    const form = new FormData();
    form.append(field, file);
    return form;
}

export function errorText(e: unknown): string {
    return e instanceof Error ? e.message : 'Something went wrong.';
}

export async function logout(): Promise<void> {
    await request('POST', '/auth/logout').catch(() => undefined);
    window.location.assign('/');
}
