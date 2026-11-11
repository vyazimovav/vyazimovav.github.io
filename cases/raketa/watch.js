// Часы, которые показывают настоящее время и разбираются на слои при прокрутке.
// Все детали рисуются кодом (SVG) — без фото. Anime.js — только для появления текста.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const C = 200;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const grad = (defs, type, id, attrs, stops) => {
    const g = el(type, { id, ...attrs }, defs);
    stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g));
  };

  // ——— Корпус ———
  const sCase = document.getElementById('svg-case');
  const dCase = el('defs', {}, sCase);
  grad(dCase, 'linearGradient', 'steel', { x1: 0, y1: 0, x2: 1, y2: 1 }, [['0', '#eef2f6'], ['.35', '#8b96a2'], ['.62', '#d8dee5'], ['1', '#56616d']]);
  el('rect', { x: 372, y: 182, width: 24, height: 36, rx: 5, fill: 'url(#steel)' }, sCase);
  el('circle', { cx: C, cy: C, r: 188, fill: 'url(#steel)' }, sCase);
  el('circle', { cx: C, cy: C, r: 172, fill: '#18212c' }, sCase);
  for (let r = 36; r < 172; r += 17) el('circle', { cx: C, cy: C, r, fill: 'none', stroke: 'rgba(163,173,184,.13)' }, sCase);

  // ——— Механизм ———
  const sMove = document.getElementById('svg-move');
  const dMove = el('defs', {}, sMove);
  grad(dMove, 'radialGradient', 'brass', { cx: .4, cy: .35, r: .8 }, [['0', '#f6dea3'], ['.55', '#c9a45c'], ['1', '#7a5c24']]);
  const clip = el('clipPath', { id: 'plate' }, dMove);
  el('circle', { cx: C, cy: C, r: 168 }, clip);
  el('circle', { cx: C, cy: C, r: 168, fill: '#2a3543' }, sMove);
  const stripes = el('g', { 'clip-path': 'url(#plate)' }, sMove);
  for (let x = -120; x < 520; x += 24) el('rect', { x, y: -100, width: 12, height: 600, fill: 'rgba(255,255,255,.04)', transform: 'rotate(-30 200 200)' }, stripes);

  const gearD = (cx, cy, r, n, d) => {
    let s = '';
    const step = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a = i * step;
      [[a, r - d], [a + step * .12, r], [a + step * .42, r], [a + step * .55, r - d]].forEach(([ang, rad], j) => {
        s += (i === 0 && j === 0 ? 'M' : 'L') + (cx + rad * Math.cos(ang)).toFixed(1) + ' ' + (cy + rad * Math.sin(ang)).toFixed(1);
      });
    }
    return s + 'Z';
  };
  const gears = [];
  const gear = (cx, cy, r, n, spd) => {
    const g = el('g', {}, sMove);
    el('path', { d: gearD(cx, cy, r, n, r * .1), fill: 'url(#brass)' }, g);
    el('circle', { cx, cy, r: r * .72, fill: '#2a3543' }, g);
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2;
      el('line', { x1: cx, y1: cy, x2: cx + r * .74 * Math.cos(a), y2: cy + r * .74 * Math.sin(a), stroke: 'url(#brass)', 'stroke-width': r * .14, 'stroke-linecap': 'round' }, g);
    }
    el('circle', { cx, cy, r: r * .2, fill: 'url(#brass)' }, g);
    el('circle', { cx, cy, r: 4.5, fill: '#c2183a' }, sMove); // камень
    gears.push({ g, cx, cy, spd, a: Math.random() * 360 });
  };
  gear(168, 196, 74, 36, 1);
  gear(266, 132, 46, 22, -1.6);
  gear(268, 252, 32, 16, -2.3);
  gear(206, 300, 22, 12, 3.4);

  // баланс с волоском
  const bal = el('g', {}, sMove);
  const BX = 112, BY = 292;
  el('circle', { cx: BX, cy: BY, r: 40, fill: 'none', stroke: 'url(#brass)', 'stroke-width': 6 }, bal);
  for (let k = 0; k < 3; k++) {
    const a = k * Math.PI * 2 / 3;
    el('line', { x1: BX, y1: BY, x2: BX + 38 * Math.cos(a), y2: BY + 38 * Math.sin(a), stroke: 'url(#brass)', 'stroke-width': 3 }, bal);
  }
  let spiral = '';
  for (let t = 0; t < 26; t += .2) spiral += (t ? 'L' : 'M') + (BX + (3 + t * .95) * Math.cos(t)).toFixed(1) + ' ' + (BY + (3 + t * .95) * Math.sin(t)).toFixed(1);
  el('path', { d: spiral, fill: 'none', stroke: 'rgba(240,230,200,.55)', 'stroke-width': .8 }, sMove);
  el('circle', { cx: BX, cy: BY, r: 4.5, fill: '#c2183a' }, sMove);

  // мост с синими винтами
  el('path', { d: 'M92 150 Q150 108 236 96 L248 118 Q170 132 110 176 Z', fill: 'url(#steel)', opacity: .9 }, sMove);
  [[104, 162], [240, 106]].forEach(([x, y]) => {
    el('circle', { cx: x, cy: y, r: 7, fill: '#2d4f93' }, sMove);
    el('line', { x1: x - 5, y1: y - 2, x2: x + 5, y2: y + 2, stroke: '#122244', 'stroke-width': 1.6 }, sMove);
  });

  // ——— Циферблат ———
  const sDial = document.getElementById('svg-dial');
  const dDial = el('defs', {}, sDial);
  grad(dDial, 'radialGradient', 'dialg', { cx: .45, cy: .38, r: .75 }, [['0', '#ffffff'], ['.6', '#eef0f2'], ['1', '#c4cad1']]);
  el('circle', { cx: C, cy: C, r: 168, fill: 'url(#dialg)' }, sDial);
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0;
    const a = i * 6 * Math.PI / 180;
    const r1 = 156, r2 = big ? (i % 15 === 0 ? 122 : 132) : 148;
    el('line', {
      class: 'tick',
      x1: C + r1 * Math.sin(a), y1: C - r1 * Math.cos(a), x2: C + r2 * Math.sin(a), y2: C - r2 * Math.cos(a),
      stroke: big ? '#131c27' : '#6a7480', 'stroke-width': big ? 6 : 1.6, 'stroke-linecap': 'round'
    }, sDial);
  }
  const brand = el('text', { x: C, y: 132, 'text-anchor': 'middle', 'font-family': 'Unbounded, sans-serif', 'font-weight': 700, 'font-size': 18, 'letter-spacing': 3, fill: '#131c27' }, sDial);
  brand.textContent = 'РАКЕТА';
  const sub = el('text', { x: C, y: 276, 'text-anchor': 'middle', 'font-family': 'Spectral, serif', 'font-style': 'italic', 'font-size': 15, fill: '#e0322b' }, sDial);
  sub.textContent = 'механика';

  // ——— Стрелки ———
  const sH = document.getElementById('svg-hands');
  const dH = el('defs', {}, sH);
  const f = el('filter', { id: 'hs', x: '-50%', y: '-50%', width: '200%', height: '200%' }, dH);
  el('feDropShadow', { dx: 0, dy: 4, stdDeviation: 3, 'flood-opacity': .35 }, f);
  const hour = el('g', { filter: 'url(#hs)' }, sH);
  el('path', { d: 'M193 216 L195.5 112 L200 100 L204.5 112 L207 216 Z', fill: '#131c27' }, hour);
  const minute = el('g', { filter: 'url(#hs)' }, sH);
  el('path', { d: 'M196 222 L198 64 L200 54 L202 64 L204 222 Z', fill: '#131c27' }, minute);
  el('circle', { cx: C, cy: C, r: 9, fill: '#131c27' }, sH);
  const second = el('g', { filter: 'url(#hs)' }, sH);
  el('line', { x1: C, y1: 238, x2: C, y2: 46, stroke: '#e0322b', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, second);
  el('circle', { cx: C, cy: 228, r: 6, fill: '#e0322b' }, second);
  el('circle', { cx: C, cy: C, r: 5.5, fill: '#e0322b' }, second);
  el('circle', { cx: C, cy: C, r: 2, fill: '#fff' }, sH);

  // ——— Сцена ———
  const scene = document.getElementById('scene');
  const stage = scene.querySelector('.stage');
  const watch = document.getElementById('watch');
  const parts = document.getElementById('parts');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const setGap = () => watch.style.setProperty('--gap', (watch.offsetWidth * .24).toFixed(0) + 'px');
  setGap();
  addEventListener('resize', setGap);

  let tx = 0, ty = 0, mx = 0, my = 0, last = performance.now();
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = (e.clientY / innerHeight - .5) * -12;
    ty = (e.clientX / innerWidth - .5) * 18;
  }, { passive: true });

  const rot = (g, a, cx = C, cy = C) => g.setAttribute('transform', `rotate(${a.toFixed(2)} ${cx} ${cy})`);

  function frame(now) {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    const total = scene.offsetHeight - innerHeight;
    const p = reduce ? 0 : clamp((scrollY - scene.offsetTop) / (total || 1));
    const e = ss(.1, .34, p) * (1 - ss(.72, .9, p));
    mx += (tx - mx) * .06;
    my += (ty - my) * .06;
    watch.style.transform = `rotateX(${(58 * e + mx).toFixed(2)}deg) rotateY(${(my * (1 - e * .6)).toFixed(2)}deg) rotateZ(${(-26 * e).toFixed(2)}deg) scale(${(1 - .1 * e).toFixed(3)})`;
    watch.style.setProperty('--e', e.toFixed(4));
    stage.style.setProperty('--intro', (1 - ss(.03, .12, p)).toFixed(3));
    stage.style.setProperty('--outro', ss(.88, .96, p).toFixed(3));
    stage.style.setProperty('--p', p.toFixed(4));
    stage.style.setProperty('--drift', (p * 700).toFixed(1));
    parts.classList.toggle('show', reduce || e > .55);

    if (!reduce) {
      const boost = 1 + e * 6;
      gears.forEach((g) => { g.a += g.spd * 24 * boost * dt; rot(g.g, g.a, g.cx, g.cy); });
      rot(bal, Math.sin(now / 1000 * Math.PI * 2 * 2.5) * 160, BX, BY);
    }

    const d = new Date();
    const s = d.getSeconds() + (reduce ? 0 : Math.floor(d.getMilliseconds() / (1000 / 6)) / 6);
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    rot(second, s * 6);
    rot(minute, m * 6);
    rot(hour, h * 30);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ——— Появление текста (Anime.js) ———
  if (window.anime && !reduce) {
    const { animate, stagger, splitText } = window.anime;
    try {
      animate('#svg-dial .tick', { opacity: [0, 1], delay: stagger(12), duration: 500, ease: 'outQuad' });
      const { chars } = splitText('.intro h1', { words: true, chars: true });
      animate(chars, { opacity: [0, 1], y: ['.5em', '0em'], delay: stagger(16), duration: 800, ease: 'outExpo' });
      const st = splitText('#statement', { words: true, chars: true });
      st.chars.forEach((c) => { c.style.opacity = .12; });
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        animate(st.chars, { opacity: [.12, 1], delay: stagger(28), duration: 600, ease: 'outQuad' });
        io.disconnect();
      }, { threshold: .5 });
      io.observe(document.getElementById('statement'));
    } catch (err) { /* без анимации текст просто виден */ }
  }
})();
