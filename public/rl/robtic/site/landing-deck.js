// The deck: scrolling down slides the pictures to the left (eased). Each rides a wave by how far it is from
// the middle; the one in the middle is up. Narrow screens swipe them instead.
(function () {
    var deck = document.getElementById('features');
    var track = document.getElementById('deck-track');
    if (!deck || !track) return;
    var cards = [].slice.call(track.children);
    var bar = document.getElementById('deck-bar');
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var target = 0, shown = 0, running = false, travel = 0, span = 1, centers = [], wide = true;
    var A = 18;

    var layout = function () {
        wide = window.innerWidth > 760;
        deck.classList.toggle('is-swipe', !wide);
        track.style.transform = '';
        cards.forEach(function (c) { c.style.transform = ''; });
        if (!wide) { deck.style.height = ''; return; }
        var vw = document.documentElement.clientWidth;
        span = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
        travel = Math.max(0, track.scrollWidth - vw);
        centers = cards.map(function (c) { return c.offsetLeft + c.offsetWidth / 2; });
        deck.style.height = (window.innerHeight + travel * 1.1) + 'px';
    };

    var paint = function (p) {
        var x = -p * travel;
        track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        var vw = document.documentElement.clientWidth;
        cards.forEach(function (c, i) {
            var dx = centers[i] + x - vw / 2;
            var t = clamp(1 - Math.abs(dx) / span, 0, 1);
            var y = -A * Math.cos((dx / span) * Math.PI) - 10 * t;
            c.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
        });
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };

    var step = function () {
        shown += (target - shown) * 0.12;
        if (Math.abs(target - shown) < 0.0004) shown = target;
        paint(shown);
        if (shown !== target) requestAnimationFrame(step); else running = false;
    };
    var measure = function () {
        if (!wide) return;
        var top = deck.getBoundingClientRect().top + window.scrollY;
        target = clamp((window.scrollY - top) / Math.max(1, deck.offsetHeight - window.innerHeight), 0, 1);
        if (!running) { running = true; requestAnimationFrame(step); }
    };
    var init = function () {
        layout();
        if (!wide) return;
        measure();
        shown = target;
        paint(shown);
    };
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', init);
    window.addEventListener('load', init);
    init();
})();
