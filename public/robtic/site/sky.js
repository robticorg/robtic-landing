// Robtic: the landing page's sound, made on the spot (no sound files): soft wind that swells and settles, and now
// and then a bird far away. Browsers only allow sound after a click, so it fades in after the first one (or a key);
// the speaker button turns it off and on (remembered). It pauses while the tab is hidden.
(function () {
    var button = document.getElementById('sky-sound');
    if (!button) return;
    var KEY = 'robtic:sky-sound';
    var VOLUME = 0.15;
    var on = true;
    try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) {}

    var ctx = null, master = null, birdTimer = null;

    var noise = function (length) {
        // Brown noise: soft and deep, like air moving.
        var buffer = ctx.createBuffer(1, ctx.sampleRate * length, ctx.sampleRate);
        var data = buffer.getChannelData(0), last = 0;
        for (var i = 0; i < data.length; i++) {
            last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
            data[i] = last * 3.5;
        }
        return buffer;
    };

    // One layer of wind: looping noise through a filter whose colour and loudness drift slowly.
    var wind = function (type, freq, q, gainValue, rate, depth) {
        var source = ctx.createBufferSource();
        source.buffer = noise(8);
        source.loop = true;
        var filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.Q.value = q;
        var gain = ctx.createGain();
        gain.gain.value = gainValue;
        var lfo = ctx.createOscillator();
        lfo.frequency.value = rate;
        var lfoGain = ctx.createGain();
        lfoGain.gain.value = depth;
        lfo.connect(lfoGain).connect(filter.frequency);
        var swell = ctx.createOscillator();
        swell.frequency.value = rate * 0.7;
        var swellGain = ctx.createGain();
        swellGain.gain.value = gainValue * 0.6;
        swell.connect(swellGain).connect(gain.gain);
        source.connect(filter).connect(gain).connect(master);
        source.start();
        lfo.start();
        swell.start();
    };

    // A bird far off: a few quick whistles, somewhere left or right.
    var bird = function () {
        var at = ctx.currentTime + 0.05;
        var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) pan.pan.value = Math.random() * 1.6 - 0.8;
        var out = ctx.createGain();
        out.gain.value = 0.02 + Math.random() * 0.015;
        (pan ? out.connect(pan).connect(master) : out.connect(master));
        var notes = 2 + Math.floor(Math.random() * 4);
        var base = 2300 + Math.random() * 1400;
        for (var i = 0; i < notes; i++) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            var start = at + i * (0.11 + Math.random() * 0.06);
            var length = 0.06 + Math.random() * 0.05;
            var up = Math.random() < 0.6;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(base * (up ? 0.85 : 1.25), start);
            osc.frequency.exponentialRampToValueAtTime(base * (up ? 1.3 : 0.8), start + length);
            g.gain.setValueAtTime(0.0001, start);
            g.gain.exponentialRampToValueAtTime(1, start + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, start + length);
            osc.connect(g).connect(out);
            osc.start(start);
            osc.stop(start + length + 0.02);
        }
    };
    var birds = function () {
        birdTimer = setTimeout(function () {
            if (ctx && ctx.state === 'running') bird();
            birds();
        }, 5000 + Math.random() * 9000);
    };

    var start = function () {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return;
            }
            master = ctx.createGain();
            master.gain.value = 0.0001;
            master.connect(ctx.destination);
            wind('lowpass', 420, 0.7, 0.5, 0.07, 180);
            wind('bandpass', 900, 1.4, 0.16, 0.11, 400);
            birds();
        }
        if (ctx.state === 'suspended') ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(VOLUME, ctx.currentTime + 3);
    };
    var stop = function () {
        if (!ctx) return;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        setTimeout(function () { if (!on || document.hidden) ctx.suspend(); }, 900);
    };

    var paint = function () {
        button.classList.toggle('is-off', !on);
        button.setAttribute('aria-pressed', on ? 'true' : 'false');
        button.title = on ? 'Turn the sound off' : 'Turn the sound on';
    };
    paint();

    // The first click or key starts it (when it is on).
    var first = function (e) {
        if (e && button.contains(e.target)) return;
        document.removeEventListener('pointerdown', first, true);
        document.removeEventListener('keydown', first, true);
        if (on) start();
    };
    document.addEventListener('pointerdown', first, true);
    document.addEventListener('keydown', first, true);

    button.addEventListener('click', function () {
        on = !on;
        try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
        paint();
        first();
        on ? start() : stop();
    });

    document.addEventListener('visibilitychange', function () {
        if (!ctx || !on) return;
        document.hidden ? stop() : start();
    });
})();
