/* ═══════════════════════════════════════════════════════════
   soumyadeep.space — main.js
   Vanilla. No dependencies.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ── Theme ─────────────────────────────────────────────── */
  const toggle = $('#themeToggle');
  const setTheme = (mode, save) => {
    root.setAttribute('data-theme', mode);
    if (save) localStorage.setItem('theme', mode);
    toggle?.setAttribute('aria-pressed', String(mode === 'light'));
    const next = mode === 'light' ? 'dark' : 'light';
    toggle?.setAttribute('aria-label', `Switch to ${next} theme`);
    toggle?.setAttribute('title', `Switch to ${next} theme`);
  };
  setTheme(root.getAttribute('data-theme') || 'dark', false);

  toggle?.addEventListener('click', () =>
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true)
  );

  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', e => {
    if (!localStorage.getItem('theme')) setTheme(e.matches ? 'light' : 'dark', false);
  });

  /* ── Mobile menu ───────────────────────────────────────── */
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');

  const menuItems = () => [
    ...$$('#nav a'), toggle, menuBtn
  ].filter(el => el && !el.disabled);

  const setMenu = (open, returnFocus = false) => {
    nav?.classList.toggle('open', open);
    if (menuBtn) {
      menuBtn.textContent = open ? 'Close' : 'Menu';
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) requestAnimationFrame(() => nav?.querySelector('a')?.focus());
    else if (returnFocus) menuBtn?.focus();
  };

  menuBtn?.addEventListener('click', () =>
    setMenu(!nav?.classList.contains('open'))
  );

  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false, true)));
  addEventListener('keydown', e => {
    if (!nav?.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); setMenu(false, true); return; }
    if (e.key !== 'Tab') return;

    const items = menuItems();
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first?.focus();
    }
  });

  /* ── Masthead backdrop on scroll ───────────────────────── */
  const mast = document.querySelector('.masthead');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncSpy();
      syncFills();
      mast?.classList.toggle('stuck', scrollY > 40);
      // the cat waits until you've started reading
      cat?.classList.toggle('ready', scrollY > innerHeight * 0.55);
      document.getElementById('toTop')?.classList.toggle('is-on', scrollY > innerHeight * 0.7);
      ticking = false;
    });
  }, { passive: true });

  /* ── Scrollspy ───────────────────────────────────────────
     Position-based rather than IntersectionObserver: a section is
     current when the reading line (just under the masthead) sits
     inside it. An observer with a thin rootMargin band lit sections
     up ~300px before you reached them, and when two entries fired in
     one batch the last one won regardless of what was on screen.   */
  const navLinks = new Map(
    $$('#nav a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a])
  );
  const spied = $$('main section[id]').filter(sec => navLinks.has(sec.id));

  let current = null;
  let spyLineOffset = 93;
  let pageHeight = document.documentElement.scrollHeight;
  let sectionRanges = [];

  function measureSpy() {
    const bar = parseFloat(getComputedStyle(root).getPropertyValue('--bar')) || 69;
    spyLineOffset = bar + 24;
    sectionRanges = spied.map(sec => ({
      id: sec.id,
      top: sec.offsetTop,
      bottom: sec.offsetTop + sec.offsetHeight
    }));
    pageHeight = document.documentElement.scrollHeight;
    syncSpy();
  }

  function syncSpy() {
    if (!spied.length) return;

    const line = spyLineOffset;
    const atBottom = innerHeight + scrollY >= pageHeight - 2;
    let id = null;

    if (atBottom) {
      id = spied[spied.length - 1].id;
    } else {
      for (const sec of spied) {
        const r = sec.getBoundingClientRect();
        if (r.top <= line) id = sec.id;
        else break;
      }
    }

    if (id === current) return;
    current = id;
    navLinks.forEach(a => a.classList.remove('on'));
    if (id) navLinks.get(id)?.classList.add('on');
  }

  const fillLabels = $$('.band__label');
  function syncFills() {
    if (!fillLabels.length) return;
    if (calm) {
      fillLabels.forEach(el => el.style.setProperty('--fill', '100%'));
      return;
    }
    const viewTop = spyLineOffset;
    const viewBot = innerHeight;
    const end = viewTop + (viewBot - viewTop) * 0.42;
    const span = Math.max(viewBot - end, 1);
    fillLabels.forEach(el => {
      const y = el.getBoundingClientRect().top;
      let p = (viewBot - y) / span;
      if (p < 0) p = 0;
      else if (p > 1) p = 1;
      el.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
    });
  }

  measureSpy();
  syncFills();
  addEventListener('resize', () => requestAnimationFrame(() => { measureSpy(); syncFills(); }), { passive: true });
  document.fonts?.ready?.then(() => { measureSpy(); syncFills(); });

  /* ── Hero: what I do, typed and cycled ─────────────────── */
  const doing = $('#doing');
  const doingCaret = $('#doingCaret');

  const DOES = [
    'build things for the web.',
    'turn ideas into working code.',
    'solve algorithms, most nights.',
    'ship projects people can use.',
    'learn by breaking things first.'
  ];

  if (doing) {
    if (calm) {
      doing.textContent = DOES[0];
      doingCaret?.style.setProperty('animation', 'none');
    } else {
      let i = 0, n = 0, back = false;
      (function run() {
        const word = DOES[i];
        doing.textContent = word.slice(0, n);

        let wait = back ? 26 : 52;
        if (!back && n === word.length) { back = true; wait = 2100; }
        else if (back && n === 0) { back = false; i = (i + 1) % DOES.length; wait = 380; }
        else { n += back ? -1 : 1; }

        setTimeout(run, wait);
      })();
    }
  }

  /* ── Java class, typed out when it scrolls into view ───── */
  const codeEl  = $('#code');
  const caretEl = $('#caret');

  // [text, className] — '' is plain text
  const SRC = [
    ['class ', 'k'], ['Soumyadeep', 't'], [' {\n', ''],
    ['  String', 'k'], [' role = ', ''], ['"CS (AI & ML) Student"', 's'], [';\n', ''],
    ['  String', 'k'], [' campus = ', ''], ['"Parul University"', 's'], [';\n', ''],
    ['  String', 'k'], ['[] stack = { ', ''], ['"Java"', 's'], [', ', ''], ['"C++"', 's'], [',\n', ''],
    ['                     ', ''], ['"Python"', 's'], [', ', ''], ['"JS"', 's'], [' };\n', ''],
    ['  int', 'k'], [' problemsSolved = ', ''], ['501', 'n'], [';\n\n', ''],
    ['  void', 'k'], [' ', ''], ['build', 'f'], ['(Idea idea) {\n', ''],
    ['    while', 'k'], [' (!idea.', ''], ['works', 'f'], ['()) {\n', ''],
    ['      idea.', ''], ['debug', 'f'], ['();  ', ''], ['// this is the job\n', 'c'],
    ['    }\n', ''],
    ['  }\n', ''],
    ['}', '']
  ];

  function typeOut() {
    if (!codeEl) return;
    codeEl.textContent = '';

    if (calm) {                                 // reduced motion: show it at once
      SRC.forEach(([t, c]) => {
        const el = document.createElement('span');
        if (c) el.className = c;
        el.textContent = t;
        codeEl.appendChild(el);
      });
      caretEl?.classList.add('done');
      return;
    }

    let chunk = 0, char = 0, node = null;

    (function step() {
      if (chunk >= SRC.length) { caretEl?.classList.add('done'); return; }

      const [text, cls] = SRC[chunk];

      if (char === 0) {
        node = document.createElement('span');
        if (cls) node.className = cls;
        codeEl.appendChild(node);
      }

      node.textContent = text.slice(0, ++char);

      if (char >= text.length) { chunk++; char = 0; }

      // pause a beat at line ends so it reads like someone typing
      const wait = text.slice(0, char).endsWith('\n') ? 130 : 16;
      setTimeout(step, wait);
    })();
  }

  if (codeEl) {
    if ('IntersectionObserver' in window) {
      const once = new IntersectionObserver((es, o) => {
        es.forEach(en => {
          if (!en.isIntersecting) return;
          typeOut();
          o.disconnect();
        });
      }, { threshold: .3 });
      once.observe(codeEl);
    } else {
      typeOut();
    }
  }

  /* ── Problem tally ──────────────────────────────────────
     Keep the factual value stable; changing it to 1 during an animation
     caused crawlers to index the wrong number. The live figure is
     Codolio’s total, hydrated from data/practice.json. */
  const tally = $('#tally');
  if (tally) tally.textContent = tally.dataset.to || '501';

  /* ── Practice heatmap ───────────────────────────────────
     data/practice.json is written once a day by GitHub Actions
     (scripts/fetch_codolio.py). The page never talks to Codolio. */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const isoDay = d => d.toISOString().slice(0, 10);
  const levelOf = n => n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 7 ? 3 : 4;

  /* Calendar days are IST. Store each IST date as UTC midnight so
     getUTC* lines up with the Asia/Kolkata calendar. */
  function istToday() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const get = t => +parts.find(p => p.type === t).value;
    return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  }

  function paintHeat(calendar) {
    const rootEl = $('#heat');
    if (!rootEl) return;

    const today = istToday();
    const end = new Date(today);
    if (!(calendar[isoDay(end)] > 0)) end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 52 * 7 - start.getUTCDay());

    const weeks = document.createElement('div');
    weeks.className = 'heat__weeks';

    const dows = document.createElement('div');
    dows.className = 'heat__dows';
    dows.setAttribute('aria-hidden', 'true');
    ['', 'Sun', '', 'Tue', '', 'Thu', '', 'Sat'].forEach(label => {
      const s = document.createElement('span');
      s.textContent = label;
      dows.appendChild(s);
    });

    let cursor = new Date(start);
    let lastMonth = -1;
    while (cursor <= end) {
      const week = document.createElement('div');
      week.className = 'heat__week';
      const mo = document.createElement('span');
      mo.className = 'heat__mo';
      if (cursor.getUTCMonth() !== lastMonth) {
        mo.textContent = MONTHS[cursor.getUTCMonth()];
        lastMonth = cursor.getUTCMonth();
      }
      week.appendChild(mo);

      for (let i = 0; i < 7; i++) {
        const key = isoDay(cursor);
        const cell = document.createElement('i');
        cell.className = 'heat__cell';
        if (cursor > end) {
          cell.style.visibility = 'hidden';
        } else {
          const n = calendar[key] || 0;
          cell.dataset.l = String(levelOf(n));
          const label = n
            ? `${n} ${n === 1 ? 'solve' : 'solves'} on ${DOWS[cursor.getUTCDay()]} ${MONTHS[cursor.getUTCMonth()]} ${cursor.getUTCDate()}`
            : `No solves on ${DOWS[cursor.getUTCDay()]} ${MONTHS[cursor.getUTCMonth()]} ${cursor.getUTCDate()}`;
          cell.title = label;
          cell.setAttribute('aria-label', label);
        }
        week.appendChild(cell);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      weeks.appendChild(week);
    }

    rootEl.replaceChildren(dows, weeks);
  }

  function applyPractice(j) {
    if (!j) return;
    const solved = j.solved;
    const days = j.activeDays;
    const streak = j.currentStreak;
    const max = j.maxStreak;
    const solvedText = solved != null ? String(solved) : null;

    if (solvedText) {
      if (tally) {
        tally.dataset.to = solvedText;
        tally.textContent = solvedText;
      }
      const chip = $('#solvedChip');
      if (chip) chip.textContent = solvedText + ' solved';
      SRC.forEach(chunk => {
        if (chunk[1] === 'n' && /^\d+$/.test(chunk[0])) chunk[0] = solvedText;
      });
      const typed = codeEl && codeEl.querySelector('.n');
      if (typed && /^\d+$/.test(typed.textContent)) typed.textContent = solvedText;
    }

    const detail = $('#practiceDetail');
    if (detail && days != null && streak != null) {
      const extra = max && max !== streak ? `, longest ${max}` : '';
      detail.textContent = `${days} active days, current streak ${streak}${extra}.`;
    }
    const cred = ASKS.find(a => a.q === 'Any code cred?');
    if (cred) {
      const n = solvedText || '501';
      const dayBit = days != null
        ? `${days} active days, current streak ${streak}`
        : '220 active days, current streak 107';
      cred.a = `<b>${n} problems solved</b> across seven platforms — LeetCode, GeeksforGeeks, CodeChef, Codeforces and more. ${dayBit}. All verifiable on <a href="https://codolio.com/profile/soumyadeepdas" target="_blank" rel="noopener">Codolio</a>.`;
    }
    if (j.calendar) paintHeat(j.calendar);
    requestAnimationFrame(measureSpy);
  }

  /* ── Signature: letters sign in when the visitor reaches the end ─ */
  const sign = $('.close__sign');
  if (sign) {
    const srcImg = sign.querySelector('img');
    /* Slices follow the ink of Soumyadeep, then Das. */
    const BANDS = [
      [6, 54], [54, 134], [134, 270], [270, 336], [336, 421],
      [421, 561], [561, 634], [634, 745], [745, 792], [792, 955],
      [1000, 1044], [1044, 1243], [1243, 1394]
    ];
    const SRC_W = 1400;

    const playSign = () => {
      if (!srcImg || sign.classList.contains('is-live') || sign.classList.contains('written')) return;
      const cv = document.createElement('canvas');
      const ctx = cv.getContext('2d');
      sign.appendChild(cv);
      sign.classList.remove('is-waiting');
      sign.classList.add('is-live');

      const fit = () => {
        const r = sign.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.max(1, Math.round(r.width * dpr));
        cv.height = Math.max(1, Math.round(r.height * dpr));
      };
      fit();

      const glyphs = [];
      let tAcc = 0;
      BANDS.forEach(([a, b]) => {
        const w = b - a;
        const dur = 105 + w * 1.4;
        glyphs.push({ a: a, b: b, delay: tAcc, dur: dur });
        tAcc += dur * 0.84;
      });
      const t0 = performance.now();

      const paint = (now) => {
        const elapsed = now - t0;
        const cw = cv.width, ch = cv.height;
        const sx = cw / SRC_W;
        ctx.clearRect(0, 0, cw, ch);
        ctx.save();
        ctx.beginPath();
        let allDone = true;
        for (let i = 0; i < glyphs.length; i++) {
          const g = glyphs[i];
          let u = (elapsed - g.delay) / g.dur;
          if (u < 1) allDone = false;
          if (u <= 0) continue;
          if (u > 1) u = 1;
          const e = 1 - Math.pow(1 - u, 2);
          ctx.rect(g.a * sx, 0, (g.b - g.a) * sx * e, ch);
        }
        ctx.clip();
        ctx.drawImage(srcImg, 0, 0, cw, ch);
        ctx.restore();
        if (!allDone) requestAnimationFrame(paint);
        else {
          sign.classList.remove('is-live');
          sign.classList.add('written');
          cv.remove();
        }
      };

      const start = () => requestAnimationFrame(paint);
      if (srcImg.complete && srcImg.naturalWidth) start();
      else srcImg.addEventListener('load', start, { once: true });
    };

    if (calm) {
      sign.classList.add('written');
    } else {
      sign.classList.add('is-waiting');
      const nearEnd = () => {
        if (window.scrollY < window.innerHeight * 0.55) return false;
        const r = sign.getBoundingClientRect();
        return r.top < window.innerHeight * 0.82 && r.bottom > 48;
      };
      const tryPlay = () => {
        if (!nearEnd()) return;
        playSign();
        removeEventListener('scroll', tryPlay);
      };
      addEventListener('scroll', tryPlay, { passive: true });
      if ('IntersectionObserver' in window) {
        const signOnce = new IntersectionObserver((es, o) => {
          if (!es.some(en => en.isIntersecting)) return;
          if (!nearEnd()) return;
          playSign();
          o.disconnect();
          removeEventListener('scroll', tryPlay);
        }, { threshold: 0.35, rootMargin: '0px 0px -14% 0px' });
        signOnce.observe(sign);
      }
    }
  }

  /* ── Local clock ───────────────────────────────────────── */
  const clock = $('#clock');
  if (clock) {
    const tick = () => {
      clock.textContent = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: 'h23', timeZone: 'Asia/Kolkata'
      }).format(new Date());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Like: count persists; look returns to rest when the pointer leaves ─ */
  const likeBtn = $('#likeBtn');
  const likeN = $('#likeCount');
  if (likeBtn && likeN) {
    const LIKE_KEY = 'sd-likes';
    const read = () => {
      const n = parseInt(localStorage.getItem(LIKE_KEY) || '0', 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    const paint = n => { likeN.textContent = String(n); };
    paint(read());
    let liked = false;
    likeBtn.addEventListener('click', () => {
      if (liked) return;
      liked = true;
      const n = read() + 1;
      try { localStorage.setItem(LIKE_KEY, String(n)); } catch (_) {}
      paint(n);
      likeBtn.setAttribute('aria-pressed', 'true');
    });
  }

  /* ── Feedback form ─────────────────────────────────────────
     Web3Forms AJAX (stay on the page). Needs data-access-key.
     No key -> open the visitor's mail app, pre-filled.        */
  const form = $('#contactForm');
  const note = $('#formNote');
  let token = 0;

  const flag = (input, msg) => {
    input.closest('.fld')?.classList.toggle('bad', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const slot = $(`.err[data-for="${input.id}"]`);
    if (slot) slot.textContent = msg || '';
  };
  const say = (msg, kind) => {
    if (!note) return;
    note.innerHTML = msg;                // trusted, author-written strings only
    note.className = 'note__status' + (kind ? ' ' + kind : '');
  };

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const mine = ++token;

    const name = $('#name'), email = $('#email'), message = $('#message');
    const rating = form.querySelector('input[name="rating"]:checked')?.value;
    let valid = true, first = null;

    if (!rating) { say('Pick a rating.', 'bad'); valid = false; }
    if (!name.value.trim()) { flag(name, 'Required'); valid = false; first = name; }
    else flag(name);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      flag(email, 'Check this address'); valid = false; first = first || email;
    } else flag(email);

    if (message.value.trim().length < 10) {
      flag(message, 'A little more detail'); valid = false; first = first || message;
    } else flag(message);

    if (!valid) {
      if (!note.textContent) say('Please fix the marked fields.', 'bad');
      first?.focus();
      return;
    }

    const data = {
      name: name.value.trim(),
      email: email.value.trim(),
      rating: rating,
      message: message.value.trim()
    };

    const endpoint = form.dataset.endpoint?.trim() || 'https://api.web3forms.com/submit';
    const accessKey = form.dataset.accessKey?.trim();
    const to = form.dataset.fallbackEmail || '';

    const openMail = () => {
      const body = `Rating: ${data.rating}\n\n${data.message}\n\n—\nFrom: ${data.name}\nEmail: ${data.email}`;
      say('Opening your mail app…', 'ok');
      location.href = `mailto:${to}?subject=${encodeURIComponent('[Portfolio] Website feedback — ' + data.rating)}&body=${encodeURIComponent(body)}`;
      setTimeout(() => {
        if (mine === token) say('If nothing opened, write to ' + to, '');
      }, 2500);
    };

    if (!accessKey) {
      openMail();
      return;
    }

    const btn = form.querySelector('.send');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    say('');

    try {
      const honey = form.querySelector('[name="botcheck"]');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          name: data.name,
          email: data.email,
          Rating: data.rating,
          message: data.message,
          subject: `[Portfolio] Website feedback — ${data.rating} — ${data.name}`,
          from_name: 'soumyadeep.space',
          replyto: data.email,
          botcheck: !!(honey && honey.checked)
        })
      });

      let sent = false;
      try {
        const j = await res.json();
        sent = !!(j && (j.success === true || String(j.success) === 'true'));
        if (!sent && j && j.message) console.warn('[contact form]', j.message);
      } catch (_) { /* ignore non-JSON */ }

      if (!sent) throw new Error('send');

      form.reset();
      say('Thanks — that reached me.', 'ok');
    } catch (err) {
      say(
        'That didn\'t send. Email me directly at ' +
        `<a href="mailto:${to}">${to}</a>`, 'bad'
      );
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });

  ['#name', '#email', '#message'].forEach(sel => {
    const el = $(sel);
    el?.addEventListener('input', () => flag(el));
  });


  /* ── Cat helper ──────────────────────────────────────────
     Scripted, not AI. Every answer is a fact that's already on
     the page, so it can never invent anything.               */
  const cat     = $('#cat');
  const catTab  = $('#catTab');
  const catBox  = $('#catBox');
  const catLog  = $('#catLog');
  const catAsks = $('#catAsks');
  const toTop   = $('#toTop');
  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });

  const ASKS = [
    { q: 'Available?', a: "Yes — he's looking for a <b>Summer 2027 internship</b>, and open to interesting collaborations any time. Best route is <a href=\"mailto:soumyadeepdas044@gmail.com\">soumyadeepdas044@gmail.com</a>." },
    { q: 'What has he built?', a: "Three live products: <b><a href=\"/hushhconnect\">hushhconnect</a></b>, private realtime messaging built around Chat IDs; <b><a href=\"/bookyuniverse\">BookyUniverse</a></b>, a searchable digital library; and <b><a href=\"/tellsgroup\">Tellsgroup</a></b>, one home for eighteen media brands. See <a href=\"/#projects\">Projects</a>." },
    { q: 'Tech stack?', a: "Java and C++ for algorithms; JavaScript and React for the web. Also Python, MySQL, MongoDB, Supabase Realtime, Git and AWS. Full list under <a href=\"#skills\">Skills</a>." },
    { q: 'Studying what?', a: "<b>B.Tech in Computer Science</b> at Parul University, Vadodara — specialising in AI &amp; ML, graduating 2028. CGPA 7.17." },
    { q: 'Any code cred?', a: "<b>501 problems solved</b> across seven platforms — LeetCode, GeeksforGeeks, CodeChef, Codeforces and more. 220 active days, current streak 107. All verifiable on <a href=\"https://codolio.com/profile/soumyadeepdas\" target=\"_blank\" rel=\"noopener\">Codolio</a>." },
    { q: 'Résumé?', a: "Right here — <a href=\"assets/Soumyadeep_Das_Resume.pdf\" download>download the PDF</a>. One page, no fluff." },
    { q: 'Where is he?', a: "Vadodara, Gujarat, India — that's IST, UTC+5:30. Happy to work remotely." },
    { q: 'Are you a real cat?', a: "I'm a few lines of JavaScript in a trench coat. No API, no training data, just answers Soumyadeep wrote himself. 🐾" }
  ];

  fetch('/data/practice.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(applyPractice)
    .catch(() => {});

  function bubble(html, who) {
    const el = document.createElement('div');
    el.className = 'msg msg--' + who;
    el.innerHTML = html;
    catLog.appendChild(el);
    catLog.scrollTop = catLog.scrollHeight;
    return el;
  }

  function think(then) {
    if (calm) { then(); return; }
    const el = bubble('<span class="dots"><i></i><i></i><i></i></span>', 'cat');
    setTimeout(() => { el.remove(); then(); }, 520);
  }

  function drawAsks() {
    catAsks.innerHTML = '';
    ASKS.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ask';
      btn.textContent = item.q;
      btn.addEventListener('click', () => {
        bubble(item.q, 'me');
        think(() => bubble(item.a, 'cat'));
      });
      catAsks.appendChild(btn);
    });
  }

  let catStarted = false;
  let catReturnFocus = null;

  const catFocusable = () => $$('a[href], button:not([disabled])', catBox)
    .filter(el => !el.hidden && el.getClientRects().length);

  function openCat() {
    catReturnFocus = document.activeElement;
    cat.classList.add('open');
    catBox.hidden = false;
    catTab.setAttribute('aria-expanded', 'true');

    if (!catStarted) {
      catStarted = true;
      const hour = new Date().getHours();
      const greet = hour < 5 ? 'Up late?' : hour < 12 ? 'Morning.' : hour < 18 ? 'Afternoon.' : 'Evening.';
      bubble(greet + " Got doubts? I only know what's on this page.", 'cat');
      drawAsks();
    }
    catBox.querySelector('.ask')?.focus();
  }

  function closeCat() {
    cat.classList.remove('open');
    catBox.hidden = true;
    catTab.setAttribute('aria-expanded', 'false');
    (catReturnFocus?.isConnected ? catReturnFocus : catTab)?.focus();
  }

  catTab?.addEventListener('click', openCat);
  $('#catClose')?.addEventListener('click', closeCat);
  addEventListener('keydown', e => {
    if (!cat?.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCat(); return; }
    if (e.key !== 'Tab') return;

    const items = catFocusable();
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first?.focus();
    }
  });

  /* ── Copy email ────────────────────────────────────────── */
  const copyMail = $('#copyMail');
  if (copyMail) {
    const address = copyMail.dataset.mail || copyMail.textContent.trim();
    const label = () => { copyMail.textContent = address; copyMail.classList.remove('is-copied'); };
    copyMail.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(address);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = address;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      copyMail.textContent = 'copied';
      copyMail.classList.add('is-copied');
      clearTimeout(copyMail._t);
      copyMail._t = setTimeout(label, 1400);
    });
  }

  /* ── Greeting belt: exact half-width so the loop doesn’t hitch ─ */
  const greetTrack = $('#greetTrack');
  function lockGreet() {
    if (!greetTrack || calm) return;
    const bits = [...greetTrack.children];
    if (bits.length < 2) return;
    const half = bits.length / 2;
    let w = 0;
    for (let i = 0; i < half; i++) w += bits[i].getBoundingClientRect().width;
    if (w < 8) return;
    greetTrack.style.setProperty('--greet-x', w + 'px');
    greetTrack.classList.remove('is-on');
    void greetTrack.offsetWidth;
    greetTrack.classList.add('is-on');
  }
  if (greetTrack && !calm) {
    const startGreet = () => lockGreet();
    if (document.fonts?.ready) document.fonts.ready.then(startGreet);
    else startGreet();
    addEventListener('resize', () => {
      clearTimeout(lockGreet._t);
      lockGreet._t = setTimeout(lockGreet, 120);
    }, { passive: true });
  }

  /* ── Year ──────────────────────────────────────────────── */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
