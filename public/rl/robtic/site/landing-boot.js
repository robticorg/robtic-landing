// Robtic landing: the eyes while the page loads. They blink once, then fade out once the page is there.
(function () {
    var boot = document.getElementById('robtic-boot');
    if (!boot) return;
    // Only on a refresh or a first visit (or coming from the panel or admin): moving between the site's own
    // pages goes straight to the page.
    var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var from = null;
    try { from = document.referrer ? new URL(document.referrer) : null; } catch (e) {}
    var transit = /(?:^|; )robtic_transit=1/.test(document.cookie);
    if ((!nav || nav.type !== 'reload') && !transit && from && from.origin === location.origin
        && !/^\/(panel|auth|admin)(\/|$)/.test(from.pathname)) {
        boot.style.display = 'none'; // React owns this element: hide it, never delete it.
        document.documentElement.setAttribute('data-booted', '1');
        return;
    }
    var video = boot.querySelector('video');
    var ready = false, blinked = false;
    document.documentElement.style.overflow = 'hidden';
    var hide = function () {
        if (!ready || !blinked || boot.className) return;
        boot.className = 'done';
        document.documentElement.style.overflow = '';
        // A flag on <html> React never touches: the eyes stay gone even if React re-renders the layout.
        setTimeout(function () { boot.style.display = 'none'; document.documentElement.setAttribute('data-booted', '1'); }, 450);
    };
    var watch = function () {
        if (video.currentTime >= 0.95) { blinked = true; video.removeEventListener('timeupdate', watch); hide(); }
    };
    video.addEventListener('timeupdate', watch);
    setTimeout(function () { blinked = true; hide(); }, 2500);
    // The script can start after the page has already loaded: then it is ready now.
    if (document.readyState === 'complete') ready = true;
    else window.addEventListener('load', function () { ready = true; hide(); });
    // Never stay over the page: at most 4 seconds, whatever happens.
    setTimeout(function () { ready = blinked = true; hide(); }, 4000);
})();
