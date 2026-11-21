import { asset } from '@/lib/asset';

// The Settings popup's starter, for every Robtic place (this site, Robtic Discord's dashboard, Robtic Hosting's panel):
// a few lines, never cached, that load the current build of the popup (its URL carries a hash of its contents, so it
// can be cached for long). A page that wants Settings to open sets window.__robticSettingsOpen = { theme, section }
// and loads this; the popup opens as soon as it arrives. Pages that already have it call window.RobticSettings.open().
export function GET() {
    const src = asset('/rl/robtic/settings/settings.js');
    const js = `(function(){if(window.RobticSettings||window.__robticSettingsLoading)return;window.__robticSettingsLoading=1;var s=document.createElement('script');s.src=${JSON.stringify(src)};s.async=true;document.head.appendChild(s);})();`;
    return new Response(js, { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
