// Robtic landing: the collapsing bar, the wavy section edges, the reveal-on-scroll and count-up, and the
// back-to-top button with its filling ring. Lifted verbatim from the panel's public site layout.
(function () {
    // The bar: everything but the brand slides away once the page scrolls down.
    var bar = document.getElementById('bar');
    if (bar) {
        var onScroll = function () { bar.classList.toggle('is-collapsed', window.scrollY > 80); };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // The wavy edges between sections: always a gentle swell, bigger and faster while the page scrolls.
    var waves = [].slice.call(document.querySelectorAll('[data-wave]'));
    if (waves.length) {
        var seenWaves = new Set(), amp = 10, push = 0, lastY = window.scrollY, phase = 0, looping = false;
        var line = function (a, k, ph, off) {
            var d = '';
            for (var x = 0; x <= 1440; x += 24) {
                var u = (x / 1440) * Math.PI * 2;
                var y = 55 + off + a * Math.sin(u * k + ph) + a * 0.35 * Math.sin(u * k * 2.3 - ph * 1.4);
                d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
            }
            return d;
        };
        var draw = function () {
            push *= 0.92;
            amp += (10 + Math.min(32, push * 0.12) - amp) * 0.08;
            phase += 0.012 + push * 0.0004;
            seenWaves.forEach(function (w) {
                var p = w.querySelectorAll('path');
                var top = line(amp, 1.5, phase, 0);
                p[0].setAttribute('d', line(amp * 0.8, 1.1, -phase * 0.8 + 1.2, -14) + 'L1440 110L0 110Z');
                p[1].setAttribute('d', top + 'L1440 110L0 110Z');
                p[2].setAttribute('d', top);
            });
            if (seenWaves.size) requestAnimationFrame(draw); else looping = false;
        };
        var watchWaves = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) seenWaves.add(e.target); else seenWaves.delete(e.target); });
            if (seenWaves.size && !looping) { looping = true; requestAnimationFrame(draw); }
        });
        waves.forEach(function (w) { watchWaves.observe(w); });
        window.addEventListener('scroll', function () {
            push += Math.abs(window.scrollY - lastY);
            lastY = window.scrollY;
        }, { passive: true });
    }

    // Sections rise in as they come into view; numbers count up.
    var count = function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = performance.now();
        var tick = function (now) {
            var t = Math.min(1, (now - start) / 1400);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString();
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    var items = document.querySelectorAll('.reveal, [data-count]');
    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-in'); if (el.hasAttribute('data-count')) el.textContent = el.getAttribute('data-count'); });
    } else {
        var seen = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                if (entry.target.hasAttribute('data-count')) count(entry.target);
                seen.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        items.forEach(function (el) { seen.observe(el); });
    }

    // Back to the top: shows once the page is scrolled; its ring fills as you read down.
    var btn = document.getElementById('to-top');
    var fill = document.getElementById('to-top-fill');
    if (btn && fill) {
        var len = 2 * Math.PI * 22;
        fill.style.strokeDasharray = len;
        var update = function () {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
            fill.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
            btn.classList.toggle('is-shown', window.scrollY > 500);
        };
        btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }
})();
