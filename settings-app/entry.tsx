// The Settings popup as one script for every Robtic place (built by scripts/build-settings.ts to
// /rl/robtic/settings/settings.js). A page loads it and calls:
//
//     window.RobticSettings.open({ theme: 'discord' | 'hosting', section: 'account' | 'security' | … })
//
// An address with ?settings=<section> opens it on load (old /settings links, a sign-in round trip, the email link),
// and the parameter is then taken out of the address. With no theme given, the page's own look decides (Robtic Hosting's
// pages are black). The popup lives in a shadow root: it brings its own styles and keeps the page's font.
import { createRoot, type Root } from 'react-dom/client';
import SettingsPopup, { SECTIONS, type Section } from './Popup';
import css from './settings.css' with { type: 'text' };
import AccountSettings from './sections/Account';
import NotificationSettings from './sections/Notifications';
import SecuritySettings from './sections/Security';
import Connections from './sections/Connections';
import DevicesPage from './sections/Devices';
import PlanSettings from './sections/Plan';
import CardsSettings from './sections/Cards';

type Theme = 'discord' | 'hosting';
type Options = { theme?: Theme; section?: Section | string; params?: Record<string, string> };

const RENDER: Record<Section, () => React.ReactNode> = {
    account: () => <AccountSettings />,
    notifications: () => <NotificationSettings />,
    security: () => <SecuritySettings />,
    connections: () => <Connections />,
    devices: () => <DevicesPage />,
    plan: () => <PlanSettings />,
    cards: () => <CardsSettings />,
};

let host: HTMLElement | null = null;
let root: Root | null = null;
let restoreFocus: HTMLElement | null = null;
let restoreOverflow = '';

function guessTheme(): Theme {
    const fromPage = document.documentElement.dataset.robticSettings;
    if (fromPage === 'hosting' || fromPage === 'discord') return fromPage;
    return document.querySelector('.rh') ? 'hosting' : 'discord';
}

function close() {
    root?.unmount();
    host?.remove();
    root = null;
    host = null;
    document.documentElement.style.overflow = restoreOverflow;
    restoreFocus?.focus?.();
}

function open(options: Options = {}) {
    const section = (SECTIONS as string[]).includes(String(options.section)) ? (options.section as Section) : 'account';
    const theme = options.theme ?? guessTheme();
    if (root) close();
    restoreFocus = document.activeElement as HTMLElement | null;
    restoreOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    host = document.createElement('robtic-settings');
    host.style.cssText = 'all: initial; font-family: inherit;';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    const mount = document.createElement('div');
    mount.className = `st-root theme-${theme}`;
    mount.style.fontFamily = getComputedStyle(document.body).fontFamily;
    shadow.append(style, mount);
    root = createRoot(mount);
    root.render(<SettingsPopup section={section} params={options.params ?? {}} onClose={close} render={(s) => RENDER[s]()} />);
}

declare global {
    interface Window { RobticSettings?: { open: typeof open; close: typeof close } }
}
window.RobticSettings = { open, close };

// A page asked for Settings before this script arrived (see /rl/robtic/settings-open.js): open it now.
const asked = (window as Window & { __robticSettingsOpen?: Options }).__robticSettingsOpen;
if (asked) {
    delete (window as Window & { __robticSettingsOpen?: Options }).__robticSettingsOpen;
    open(asked);
}

// ?settings=<section> opens it on load; the parameters come out of the address.
const q = new URLSearchParams(window.location.search);
if (q.has('settings')) {
    const params: Record<string, string> = {};
    for (const key of ['connection', 'github']) { const v = q.get(key); if (v) { params[key] = v; q.delete(key); } }
    const section = q.get('settings') ?? 'account';
    q.delete('settings');
    window.history.replaceState(window.history.state, '', window.location.pathname + (q.toString() ? `?${q}` : '') + window.location.hash);
    const go = () => open({ section, params });
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
}
window.dispatchEvent(new Event('robtic-settings-ready'));
