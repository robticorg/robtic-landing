// Opens Robtic's Settings popup (settings-app/), loading it the first time. The theme follows the page unless given.
type Options = { theme?: 'discord' | 'hosting'; section?: string };
type W = Window & { RobticSettings?: { open: (o?: Options) => void }; __robticSettingsOpen?: Options };

export function openSettings(options: Options = {}) {
    const w = window as W;
    if (w.RobticSettings) { w.RobticSettings.open(options); return; }
    w.__robticSettingsOpen = options;
    if (document.querySelector('script[data-robtic-settings]')) return;
    const s = document.createElement('script');
    s.src = '/rl/robtic/settings-open.js';
    s.async = true;
    s.dataset.robticSettings = '';
    document.head.appendChild(s);
}
