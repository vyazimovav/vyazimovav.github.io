// Первый экран «В + шар» — из прототипа Вики (референсы/для-моего-сайта/прототип-В-плюс-шар.html):
// искра → шар → волна будит сцену; ночная лента вопросов клиентов и ответов ИИ; телефон хозяина с уведомлениями.
// Плюс: нижняя кнопка на телефоне появляется после первого экрана.
(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('vh-stage'), feed = $('vh-feed'), notes = $('vh-notes'), orbWrap = $('vh-orbwrap'), lock = $('vh-lock');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // нижняя кнопка на телефоне
  const bar = document.querySelector('.mob-bar');
  const hero = document.querySelector('#top');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => bar.classList.toggle('show', !en.isIntersecting), { threshold: .15 }).observe(hero);
  } else if (bar) bar.classList.add('show');

  if (!stage) return;

  // сегодняшний день на экране блокировки
  try { $('vh-day').textContent = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { /* оставим как есть */ }

  const POOL = [   // примеры из разных ниш, без бьюти (круги 4–5)
    { n: 'Мебель на заказ', q: 'Замер бесплатный?', a: 'Да, мастер приедет в удобное время. Когда вам удобно?', note: ['Заявка на замер', 'Кухня 3 м, завтра после 18:00'] },
    { n: 'Автосервис', q: 'Поменяете масло завтра утром?', a: 'Да, свободно в 9:00 и 11:30. Записываю?', note: ['Новая запись', 'Замена масла, вс, 9:00'] },
    { n: 'Массаж', q: 'Сколько длится сеанс?', a: 'Час. Есть время в понедельник в 10:00. Записать?', note: ['Новая запись', 'Массаж спины, пн, 10:00'] },
    { n: 'Клиника', q: 'Можно на УЗИ в субботу утром?', a: 'Да, свободно в 10:00. Записать вас?', note: ['Новая запись', 'УЗИ, сб, 10:00'] },
    { n: 'Ремонт квартир', q: 'Сколько стоит ремонт ванной?', a: 'Зависит от площади. Пришлите размеры — мастер посчитает.', note: ['Новая заявка', 'Ремонт ванной, расчёт'] },
    { n: 'Детский центр', q: 'Есть пробное занятие?', a: 'Да, в среду в 17:00. Записать ребёнка?', note: ['Пробное занятие', 'Ср, 17:00'] },
    { n: 'Клиника', q: 'Нужно ли записываться к терапевту?', a: 'Лучше записаться: завтра свободно в 12:30.', note: null },
    { n: 'Автосервис', q: 'Сколько стоит диагностика?', a: 'Подскажу точнее после пары вопросов. Какая у вас машина?', note: null },
  ];
  const GAP = 16;     // зазор между сообщениями
  const SPEED = 50;   // скорость ленты, пикселей в секунду (замедлено по просьбе Вики 06.11)
  let i = 0, count = 0, minutes = 23 * 60 + 52, side = false, timers = [], pairs = [], gen = 0, last = 0, visible = true;
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clock = () => { const m = minutes % (24 * 60), h = Math.floor(m / 60), mm = m % 60; return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const speak = () => restart(orbWrap, 'speak');

  function tickClock() {
    count++; const c = $('vh-cnt'); if (c) { c.textContent = count; restart(c, 'bump'); }
    minutes += 7; if (minutes > 30 * 60) minutes = 23 * 60 + 52; $('vh-clock').textContent = clock();
  }
  function addNote([title, text], flash) {
    const el = document.createElement('div'); el.className = 'note';
    el.innerHTML = '<span class="holo-dot"></span><div><b></b><span class="ns"></span></div>';
    el.querySelector('b').textContent = title; el.querySelector('.ns').textContent = text;
    notes.prepend(el);
    if (flash) restart(lock, 'flash');
    const all = notes.querySelectorAll('.note:not(.out)');
    if (all.length > 4) { const old = all[all.length - 1]; old.classList.add('out'); later(400, () => old.remove()); }
  }
  function makePair(m) {
    const el = document.createElement('div'); el.className = 'pair' + (side ? ' shift' : ''); side = !side;
    el.innerHTML = '<div class="q"><small><span></span><span class="qt-time"></span></small><div class="qt"></div></div><div class="r"><span class="holo-dot"></span><div class="bub"><span class="dots"><i></i><i></i><i></i></span></div></div>';
    el.querySelector('small span').textContent = m.n; el.querySelector('.qt').textContent = m.q;
    feed.appendChild(el); return el;
  }
  function fillAnswer(el, m) {
    const bub = el.querySelector('.bub'); bub.innerHTML = '<span class="t"></span>'; bub.firstChild.textContent = m.a;
    const ok = document.createElement('div'); ok.className = 'ok'; el.appendChild(ok); return ok;
  }
  const place = (p) => { p.el.style.transform = `translateY(${-p.y}px)`; };
  function spawnLive() {
    const m = POOL[i % POOL.length]; i++;
    const el = makePair(m); el.querySelector('.qt-time').textContent = clock();
    const p = { el, y: 0, m }; pairs.push(p); place(p);
    later(1000, () => {
      const ok = fillAnswer(el, m); ok.textContent = '✓ ответил ИИ, ' + clock();
      tickClock(); speak(); restart(el.querySelector('.r .holo-dot'), 'lit');
      if (m.note) later(600, () => addNote(m.note, true));
    });
  }
  function prefill() {
    const fh = feed.clientHeight, made = []; let y = 0;
    while (true) {
      const m = POOL[i % POOL.length]; i++;
      const el = makePair(m), ok = fillAnswer(el, m), h = el.offsetHeight;
      y = made.length ? y + h + GAP : h + GAP; made.push({ el, ok, m, y });
      if (y > fh * .98 || made.length > 20) break;
    }
    made.reverse().forEach((p) => {
      p.el.querySelector('.qt-time').textContent = clock(); p.ok.textContent = '✓ ответил ИИ, ' + clock(); tickClock();
      if (p.m.note) addNote(p.m.note, false);
    });
    pairs = made; pairs.forEach(place);
  }
  function tick(now, g) {
    if (g !== gen) return;
    const dt = Math.min(50, now - last) / 1000; last = now;
    if (visible) {
      const fh = feed.clientHeight;
      for (const p of pairs) { p.y += SPEED * dt; place(p); }
      while (pairs.length && pairs[0].y > fh + pairs[0].el.offsetHeight + 20) pairs.shift().el.remove();
      const lp = pairs[pairs.length - 1];
      if (!lp || lp.y >= lp.el.offsetHeight + GAP) spawnLive();
    }
    requestAnimationFrame((t) => tick(t, g));
  }
  function start() {
    timers.forEach(clearTimeout); timers = []; gen++;
    feed.innerHTML = ''; notes.innerHTML = ''; pairs = []; i = 0; count = 0; minutes = 23 * 60 + 52; side = false;
    if ($('vh-cnt')) $('vh-cnt').textContent = '0'; $('vh-clock').textContent = clock();
    stage.classList.remove('ignite', 'wake', 'ready'); void stage.offsetWidth;
    if (reduce) { stage.classList.add('ignite', 'wake', 'ready'); prefill(); return; }
    const g = gen;
    later(250, () => stage.classList.add('ignite'));
    later(900, () => stage.classList.add('wake'));
    later(1500, () => {
      stage.classList.add('ready'); prefill(); speak();
      last = performance.now(); requestAnimationFrame((t) => tick(t, g));
    });
  }

  // звёзды
  for (let k = 0; k < 40; k++) {
    const s = document.createElement('i'); s.className = 'star';
    s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (-Math.random() * 3) + 's'; s.style.opacity = .2 + Math.random() * .6;
    $('vh-stars').appendChild(s);
  }

  // шар тянется за курсором; на телефоне — плавает сам
  let tx = 0, ty = 0, ox = 0, oy = 0;
  stage.addEventListener('pointermove', (e) => { const o = orbWrap.getBoundingClientRect(); tx = (e.clientX - (o.left + o.width / 2)) * .08; ty = (e.clientY - (o.top + o.height / 2)) * .08; });
  stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  (function follow(now) {
    if (matchMedia('(hover: none)').matches) { tx = Math.sin(now / 1800) * 8; ty = Math.cos(now / 2300) * 10; }
    ox += (tx - ox) * .06; oy += (ty - oy) * .06;
    orbWrap.style.setProperty('--ox', ox.toFixed(1) + 'px'); orbWrap.style.setProperty('--oy', oy.toFixed(1) + 'px');
    requestAnimationFrame(follow);
  })(0);

  // кнопки-магниты
  document.querySelectorAll('.mag').forEach((b) => {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .35}px`; });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  // лента не крутится, когда первый экран ушёл из виду
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; last = performance.now(); }).observe(stage);

  // сцена теперь отдельным блоком ниже — запускаем, когда до неё долистали
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(start); } }, { threshold: .3 });
    io.observe(stage);
  } else (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();


// Калькулятор «Посчитайте свой сайт» (цены — прайс 08.11) и «вау»-плитка: слои расходятся, когда видны
(() => {
  const calc = document.getElementById('calc');
  if (calc) {
    const fmt = (n) => n.toLocaleString('ru-RU') + ' ₽';
    const upd = () => {
      const site = calc.querySelector('input[name="site"]:checked');
      const adds = [...calc.querySelectorAll('input[name="add"]:checked')];
      const care = calc.querySelector('input[name="care"]').checked;
      const base = Number(site.value), extra = adds.reduce((s, i) => s + Number(i.value), 0);
      const exact = site.dataset.fixed && !adds.length;
      calc.querySelector('.calc-sum').textContent = (exact ? '' : 'от ') + fmt(base + extra);
      let lo = 0, hi = 0;
      adds.forEach((i) => { if (i.dataset.month) { const [a, b] = i.dataset.month.split('–').map(Number); lo += a; hi += b; } });
      if (care) { lo += 2; hi += 5; }
      calc.querySelector('.calc-month').textContent = hi ? '+ ' + lo + '–' + hi + ' тыс. ₽ в месяц' : '';
      calc.querySelector('.calc-first').textContent = 'Первым клиентам: ' + (exact ? '' : 'от ') + fmt(Math.round(base * 0.8) + extra) + ' — скидка 20% на сайт';
    };
    calc.addEventListener('change', upd);
    calc.addEventListener('submit', (e) => e.preventDefault());
    upd();
  }
  const wow = document.querySelector('.tile-wow');
  if (wow && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => wow.classList.toggle('in', en.isIntersecting), { threshold: 0.6 }).observe(wow);
  }
})();

// ═════════ Фоны блоков (выбор Вики 10.11): поток сообщений, линии связи, звёзды с фонариком ═════════
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (matchMedia('(max-width: 899px)').matches) return;   // на телефоне фоновых эффектов нет (круг 5)
  const fx = [];
  function canvasFx(cv, impl) {
    const ctx = cv.getContext('2d'), sec = cv.closest('section');
    const st = { ctx, sec, w: 0, h: 0, on: false, mouse: null };
    const size = () => {
      st.w = sec.clientWidth; st.h = sec.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, st.h > 1600 ? 1 : 2); // длинный блок — проще, чтобы телефон не грелся
      cv.width = st.w * dpr; cv.height = st.h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (impl.resize) impl.resize(st);
      if (reduce) impl.step(st, 0, 0);
    };
    size(); addEventListener('resize', size);
    sec.addEventListener('pointermove', (e) => { const r = sec.getBoundingClientRect(); st.mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    sec.addEventListener('pointerleave', () => { st.mouse = null; });
    new IntersectionObserver(([en]) => { st.on = en.isIntersecting; }).observe(sec);
    fx.push({ st, impl });
  }

  // 6. Поток сообщений — бледные пузыри переписки поднимаются фоном
  document.querySelectorAll('[data-fx="bubbles"]').forEach((cv) => {
    const list = [];
    const spawn = (st, y) => {
      const right = Math.random() > .5;
      list.push({ x: right ? st.w * (.6 + Math.random() * .36) : st.w * (.03 + Math.random() * .3), y: y == null ? st.h + 40 : y, w: 110 + Math.random() * 150, h: 32 + Math.random() * 18, v: 9 + Math.random() * 7, right, lilac: Math.random() > .55 });
    };
    canvasFx(cv, {
      resize(st) { list.length = 0; const n = Math.round(Math.min(18, Math.max(8, st.h / 60))); for (let i = 0; i < n; i++) spawn(st, Math.random() * st.h); },
      step(st, t, dt) {
        const { ctx, w, h } = st;
        ctx.clearRect(0, 0, w, h);
        for (const b of list) {
          b.y -= b.v * dt;
          ctx.globalAlpha = Math.max(0, Math.min(1, b.y / (h * .25), (h - b.y) / (h * .15)) * .5);
          const x = b.x - (b.right ? b.w : 0), r = 14;
          ctx.fillStyle = b.lilac ? '#ebe2d8' : '#ffffff';
          ctx.beginPath(); ctx.roundRect(x, b.y, b.w, b.h, [r, r, b.right ? 4 : r, b.right ? r : 4]); ctx.fill();
          ctx.fillStyle = 'rgba(42,4,17,.12)';
          ctx.fillRect(x + 14, b.y + 12, b.w * .62, 4); if (b.h > 40) ctx.fillRect(x + 14, b.y + 22, b.w * .4, 4);
        }
        ctx.globalAlpha = 1;
        for (let i = list.length - 1; i >= 0; i--) if (list[i].y < -60) { list.splice(i, 1); spawn(st); }
      },
    });
  });

  // 7. Линии связи — огоньки бегут по линиям, как заявка с сайта в телефон; курсор притягивает линии
  document.querySelectorAll('[data-fx="links"]').forEach((cv) => {
    let curves = [], sparks = [];
    canvasFx(cv, {
      resize(st) {
        curves = []; sparks = [];
        const n = Math.round(Math.min(12, Math.max(6, st.h / 170)));
        for (let i = 0; i < n; i++) {
          const y0 = st.h * (.04 + .92 * Math.random()), y1 = st.h * (.04 + .92 * Math.random());
          curves.push([[-20, y0], [st.w * .3, y0 + (Math.random() - .5) * 220], [st.w * .7, y1 + (Math.random() - .5) * 220], [st.w + 20, y1]]);
          sparks.push({ c: i, t: Math.random(), v: .05 + Math.random() * .06 });
        }
      },
      step(st, t, dt) {
        const { ctx, w, h } = st, m = st.mouse;
        ctx.clearRect(0, 0, w, h);
        const pt = (c, u) => {
          const q = c.map(([x, y]) => { if (m) { const d = Math.hypot(x - m.x, y - m.y); if (d < 260) y += (m.y - y) * .25 * (1 - d / 260); } return [x, y]; });
          const v = 1 - u;
          return [0, 1].map((k) => v * v * v * q[0][k] + 3 * v * v * u * q[1][k] + 3 * v * u * u * q[2][k] + u * u * u * q[3][k]);
        };
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(74,18,48,.13)';
        for (const c of curves) { ctx.beginPath(); for (let u = 0; u <= 1.001; u += .02) { const [x, y] = pt(c, u); if (u) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
        ctx.fillStyle = 'rgba(123,42,72,.32)';
        for (const c of curves) for (const u of [.3, .7]) { const [x, y] = pt(c, u); ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
        for (const s of sparks) {
          s.t += s.v * dt; if (s.t > 1) s.t = 0;
          for (let k = 0; k < 10; k++) {
            const u = s.t - k * .006; if (u < 0) break;
            const [x, y] = pt(curves[s.c], u);
            ctx.fillStyle = 'rgba(123,42,72,' + (.6 * (1 - k / 10)).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(x, y, 2.6 - k * .2, 0, 7); ctx.fill();
          }
        }
      },
    });
  });

  // 10. Звёзды и фонарик за курсором
  document.querySelectorAll('[data-fx="stars"]').forEach((box) => {
    for (let k = 0; k < 50; k++) {
      const s = document.createElement('i'); s.className = 'star';
      s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
      s.style.opacity = .2 + Math.random() * .6; s.style.animationDelay = -Math.random() * 3 + 's';
      box.appendChild(s);
    }
    const sec = box.closest('section');
    sec.addEventListener('pointermove', (e) => { const r = sec.getBoundingClientRect(); sec.style.setProperty('--mx', (e.clientX - r.left) + 'px'); sec.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });

  if (reduce || !fx.length) return;
  let last = performance.now();
  (function loop(t) {
    const dt = Math.min(50, t - last) / 1000; last = t;
    for (const { st, impl } of fx) if (st.on) impl.step(st, t, dt);
    requestAnimationFrame(loop);
  })(last);
})();

// ═════════ Круги 3–4 (11.11): «Пример работы» — телефон и подписи + тестовая заявка (ничего не отправляется); нижняя кнопка прячется у финала ═════════
(() => {
  const bar = document.querySelector('.mob-bar'), fin = document.querySelector('.final');
  // нижняя кнопка: листаете вниз — прячется и не закрывает текст, вверх — появляется; у финала не нужна
  if (bar) {
    let lastY = scrollY, finVis = false;
    addEventListener('scroll', () => {
      const y = scrollY;
      if (y > lastY + 6) { bar.classList.add('away'); lastY = y; }
      else if (y < lastY - 6) { if (!finVis) bar.classList.remove('away'); lastY = y; }
    }, { passive: true });
    if (fin && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => { finVis = en.isIntersecting; bar.classList.toggle('away', finVis); }).observe(fin);
  }

  const notes = document.getElementById('demo-notes'); if (!notes) return;
  const sec = notes.closest('.demo'), lock = notes.closest('.vh-lock'), steps = [...document.querySelectorAll('#demo-steps li')];
  const btn = document.getElementById('demo-try'), hint = document.getElementById('demo-hint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { document.getElementById('demo-day').textContent = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { /* оставим как есть */ }
  const N = [['ИИ-консультант', 'Ответил клиенту про цену ТО'], ['Новая запись', 'Замена масла, сб, 10:00'], ['Заявка с сайта', 'Новая заявка — откройте почту']];
  let k = 0, timer = null, pause = null, on = false;
  function add([t, s], j) {
    const el = document.createElement('div'); el.className = 'note';
    el.innerHTML = '<span class="holo-dot"></span><div><b></b><span class="ns"></span></div>';
    el.querySelector('b').textContent = t; el.querySelector('.ns').textContent = s; notes.prepend(el);
    const all = notes.querySelectorAll('.note'); if (all.length > 3) all[all.length - 1].remove();
    steps.forEach((li, i) => li.classList.toggle('on', i === j));
    lock.classList.remove('flash'); void lock.offsetWidth; lock.classList.add('flash');
  }
  const step = () => { const j = k++ % N.length; if (j === 0) notes.innerHTML = ''; add(N[j], j); };
  const run = () => { clearInterval(timer); if (!reduce) timer = setInterval(step, 3600); };
  btn.addEventListener('click', () => {
    add(['Заявка с сайта', 'Тестовая заявка · только что'], 2);
    hint.textContent = 'Вот так владельцу приходит заявка. Это демонстрация — ничего никуда не отправилось.'; hint.classList.add('ok');
    on = true; k = 0; clearInterval(timer); clearTimeout(pause);
    pause = setTimeout(() => { step(); run(); }, 6000); // тестовая заявка держится на экране 6 секунд
  });
  if (reduce || !('IntersectionObserver' in window)) { N.forEach((n, j) => add(n, j)); return; }
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !on) { on = true; step(); run(); }
    else if (!en.isIntersecting && on) { on = false; clearInterval(timer); clearTimeout(pause); }
  }, { threshold: .3 }).observe(sec);
})();

// ═════════ Круг 8 (11.11): уведомление у фото сменяется; переписка в «болях» появляется по сообщению; линия шагов «Как работаю» ═════════
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const once = (el, fn, th) => {
    if (!el || reduce || !('IntersectionObserver' in window)) return false;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { threshold: th });
    o.observe(el); return true;
  };

  // 1. уведомление у фото: заявки с сайта и записи ИИ-агента сменяют друг друга, пока первый экран виден
  const tg = document.querySelector('.first-tg .tg-card'), t = document.getElementById('tg-t'), s = document.getElementById('tg-s'), top = document.getElementById('top');
  const N = [
    ['Новая заявка с сайта', 'Кухня на заказ, замер в субботу'],
    ['ИИ-агент записал клиента', 'Массаж спины, понедельник 10:00'],
    ['Новая заявка с сайта', 'Ремонт ванной, нужен расчёт'],
    ['ИИ-агент ответил ночью', 'Диагностика, суббота 9:00'],
  ];
  if (tg && t && s && top && !reduce) {
    let k = 0, timer = null;
    const next = () => { k = (k + 1) % N.length; tg.classList.remove('ping'); void tg.offsetWidth; t.textContent = N[k][0]; s.textContent = N[k][1]; tg.classList.add('ping'); };
    const run = (on) => { clearInterval(timer); if (on) timer = setInterval(next, 4200); };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => run(e.isIntersecting), { threshold: .2 }).observe(top);
    else run(true);
  }
  // орбиты: при «меньше движения» стоят
  document.querySelectorAll('.first-orbits, .fin-orbit, .svc-orbit').forEach((svg) => { if (reduce && svg.pauseAnimations) svg.pauseAnimations(); });

  // 2. переписка появляется по сообщению
  const chat = document.querySelector('.pain-chat');
  if (chat) { chat.classList.add('wait'); if (!once(chat, () => chat.classList.add('go'), .35)) chat.classList.remove('wait'); }

  // 3. линия шагов прорисовывается
  const how = document.querySelector('.how');
  if (how) { how.classList.add('prep'); if (!once(how, () => how.classList.add('in'), .35)) how.classList.remove('prep'); }
})();

// ═════════ Круги 10–11 (12.11): работы сменяются в карточке сайтов; появление блоков при прокрутке; орбиты стоят, когда их не видно ═════════
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  // 1. карточка «Сайты и лендинги»: мебель → массаж → клиника, полоски под ними показывают, сколько осталось до следующей.
  //    Крутится, только пока карточку видно; при «меньше движения» стоит первая работа.
  const slides = [...document.querySelectorAll('.ch-slide')], dots = [...document.querySelectorAll('.ch-dots i')], cap = document.getElementById('ch-cap');
  const CAPS = ['Мебель на заказ: сайт с квизом', 'Массаж: сайт-визитка', 'Клиника «Мера»: сайт с ИИ, демо'];
  const SLIDE = 4200;
  if (slides.length && cap && !reduce && hasIO) {
    let k = 0, timer = null;
    const show = (n) => {
      k = n % slides.length;
      slides.forEach((s, i) => s.classList.toggle('on', i === k));
      dots.forEach((d, i) => { d.classList.remove('on'); void d.offsetWidth; d.classList.toggle('done', i < k); d.classList.toggle('on', i === k); });
      cap.classList.add('swap'); setTimeout(() => { cap.textContent = CAPS[k]; cap.classList.remove('swap'); }, 300);
    };
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) { show(k); timer = setInterval(() => show(k + 1), SLIDE); }
    }, { threshold: .3 }).observe(slides[0].closest('.ch-card'));
  }

  // 2. появление при прокрутке — только то, что ниже первого экрана; в сетках по очереди (не дольше 0,2 с разницы)
  if (!reduce && hasIO) {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); e.target.classList.add('rv-in'); e.target.classList.remove('rv-wait');
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    [['.choose-grid > .ch-card', 2], ['.work-grid > .work', 3], ['.svc-grid > .svc-card', 3], ['.deal > li', 3], ['.pain-items', 0], ['.pain-close', 0]]
      .forEach(([sel, cols]) => document.querySelectorAll(sel).forEach((el, k) => {
        if (el.getBoundingClientRect().top < innerHeight) return;
        if (cols) el.style.setProperty('--d', k % cols);
        el.classList.add('rv-wait'); io.observe(el);
      }));
  }

  // 3. SVG-орбиты (первый экран и финал) не крутятся, когда их не видно — бережём батарею телефона
  if (!reduce && hasIO) {
    [['.first-orbits', '#top'], ['.fin-orbit', '.final'], ['.svc-orbit', '#services']].forEach(([s, w]) => {
      const svg = document.querySelector(s), box = document.querySelector(w);
      if (svg && box && svg.pauseAnimations) new IntersectionObserver(([e]) => (e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations())).observe(box);
    });
  }
})();
