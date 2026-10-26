// Robtic: moving between the site, the panel and the admin area. Leaving, the eyes open over the page, then the
// screen goes black and the next page loads behind it; arriving, the eyes blink and the new page is already there.
(function () {
    if (window.top !== window) return;
    var KEY = 'robtic:transit';
    var html = document.documentElement;
    // The site (robtic.org) and the panel (panel.robtic.org): links between them get the transit too.
    var SITE = 'robtic.org', PANEL = 'panel.robtic.org';
    var ours = function (url) {
        return url.origin === location.origin || ((url.hostname === SITE || url.hostname === PANEL) && url.protocol === 'https:');
    };
    // The flag crosses from one address to the other as a short cookie for robtic.org.
    var shared = location.hostname === SITE || location.hostname === PANEL;
    var mark = function () {
        if (shared) document.cookie = 'robtic_transit=1; path=/; max-age=30; domain=' + SITE + '; secure; samesite=lax';
        else try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    };
    var marked = function () {
        var on = /(?:^|; )robtic_transit=1/.test(document.cookie);
        if (on) document.cookie = 'robtic_transit=; path=/; max-age=0; domain=' + SITE + '; secure; samesite=lax';
        try {
            on = on || sessionStorage.getItem(KEY) === '1';
            sessionStorage.removeItem(KEY);
        } catch (e) {}
        return on;
    };

    var area = function (url) {
        var path = url.pathname;
        if (/^\/admin(\/|$)/.test(path)) return 'admin';
        if (/^\/(panel|auth)(\/|$)/.test(path)) return 'panel';
        return 'site';
    };

    var arrived = false;
    arrived = marked();

    // Arriving: the page's own eye screen (site, panel) starts black and the eyes come in for the blink. The admin
    // area has none, so it gets one for the arrival.
    if (arrived) {
        var boot = document.getElementById('robtic-boot');
        if (!boot) {
            boot = document.createElement('div');
            boot.id = 'robtic-boot';
            boot.setAttribute('aria-hidden', 'true');
            boot.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:#000;transition:opacity .4s ease';
            boot.innerHTML = '<video autoplay muted playsinline disablepictureinpicture preload="auto" style="width:min(72vw,440px);height:auto">' +
                '<source src="/robtic/loading.webm" type="video/webm"><source src="/robtic/loading.mp4" type="video/mp4"></video>';
            document.body.insertBefore(boot, document.body.firstChild);
            html.style.overflow = 'hidden';
            var video = boot.querySelector('video');
            var ready = document.readyState === 'complete', blinked = false;
            var hide = function () {
                if (!ready || !blinked || boot.style.opacity === '0') return;
                boot.style.opacity = '0';
                boot.style.pointerEvents = 'none';
                html.style.overflow = '';
                setTimeout(function () { boot.remove(); }, 450);
            };
            video.addEventListener('timeupdate', function () { if (video.currentTime >= 0.95) { blinked = true; hide(); } });
            setTimeout(function () { blinked = true; hide(); }, 2500);
            window.addEventListener('load', function () { ready = true; hide(); });
            setTimeout(function () { ready = blinked = true; hide(); }, 8000);
        }
        var eyes = boot.querySelector('video');
        if (eyes) {
            eyes.style.opacity = '0';
            eyes.style.transition = 'opacity .2s ease';
            setTimeout(function () { eyes.style.opacity = '1'; }, 120);
        }
    }

    // The blink's sound: two soft chirps made on the spot (no sound file), the lid closing (falling) and opening
    // (rising), timed to the eyes in the video (closed 0.45-0.58 s, open again by 0.80 s). Browsers only allow sound
    // after a click on the page, so a fresh load may stay silent; leaving (a click) always has it. The tour's
    // sound switch mutes it too.
    var ctx = null;
    var sound = function () {
        try {
            if (localStorage.getItem('robtic:tour-sound') === 'off') return null;
            ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        } catch (e) {
            return null;
        }
    };
    var chirp = function (from, to, length, delay) {
        var a = sound();
        if (!a) return;
        var at = a.currentTime + (delay || 0);
        [[1, 0.07], [2, 0.018]].forEach(function (part) {
            var osc = a.createOscillator();
            var gain = a.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(from * part[0], at);
            osc.frequency.exponentialRampToValueAtTime(to * part[0], at + length);
            gain.gain.setValueAtTime(0.0001, at);
            gain.gain.exponentialRampToValueAtTime(part[1], at + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
            osc.connect(gain).connect(a.destination);
            osc.start(at);
            osc.stop(at + length + 0.02);
        });
    };
    var close = function (delay) { chirp(880, 430, 0.12, delay); };
    var open = function (delay) { chirp(430, 1040, 0.15, delay); };

    // The loading screen's blink, with the sound when the browser lets it play.
    var eyesVideo = document.querySelector('#robtic-boot video');
    if (eyesVideo) {
        var heard = 0;
        var started = Date.now();
        var listen = function () {
            var t = eyesVideo.currentTime;
            if (heard === 0 && t >= 0.45) { heard = 1; close(); }
            if (heard === 1 && t >= 0.64) { heard = 2; open(); }
            if (heard < 2 && t < 1 && Date.now() - started < 4000 && document.body.contains(eyesVideo)) requestAnimationFrame(listen);
        };
        requestAnimationFrame(listen);
    }

    var leaving = false;
    var leave = function (href) {
        if (leaving) return;
        leaving = true;
        mark();
        var cover = document.createElement('div');
        cover.id = 'robtic-leave';
        cover.setAttribute('aria-hidden', 'true');
        cover.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#000;opacity:0;transition:opacity .25s ease';
        cover.innerHTML = '<img src="/robtic/loading.jpg" alt="" style="width:min(72vw,440px);height:auto;transition:opacity .2s ease">';
        document.body.appendChild(cover);
        html.style.overflow = 'hidden';
        // The eyes open over the page...
        requestAnimationFrame(function () { requestAnimationFrame(function () { cover.style.opacity = '1'; }); });
        // ...then black, and the next page.
        setTimeout(function () { cover.firstChild.style.opacity = '0'; }, 550);
        // The eyes close as the screen goes dark (this click lets the sound play).
        close(0.5);
        setTimeout(function () { window.location.href = href; }, 760);
    };

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
        var url;
        try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
        if (!ours(url) || area(url) === area(location)) return;
        e.preventDefault();
        e.stopPropagation();
        leave(url.href);
    }, true);

    // Back from the next page (kept in the browser's cache): no cover left over.
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        leaving = false;
        var cover = document.getElementById('robtic-leave');
        if (cover) cover.remove();
        html.style.overflow = '';
    });
})();
