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

  /* Theme-aware logos: each slot carries both variants in data
     attributes and only the active theme's file is ever fetched —
     the unused colourway never leaves the server. */
  function syncLogos() {
    const light = root.getAttribute('data-theme') === 'light';
    $$('.plogo[data-dark]').forEach(im => {
      im.src = light ? im.dataset.light : im.dataset.dark;
    });
  }

  const setTheme = (mode, save) => {
    root.setAttribute('data-theme', mode);
    if (save) localStorage.setItem('theme', mode);
    toggle?.setAttribute('aria-pressed', String(mode === 'light'));
    const next = mode === 'light' ? 'dark' : 'light';
    toggle?.setAttribute('aria-label', `Switch to ${next} theme`);
    toggle?.setAttribute('title', `Switch to ${next} theme`);
    syncLogos();
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
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      syncSpy();
      syncFills();
      mast?.classList.toggle('stuck', scrollY > 40);
      // The dock wakes when the projects section starts and travels with
      // the page from there; scrolled back up past it, it tucks away.
      // Pages without a #projects section (the case studies) fall back to
      // a plain scroll distance past the opening.
      const projects = document.getElementById('projects');
      // 2px tolerance: the browser's anchor scroll (#projects links) can
      // stop a fraction of a pixel short of the section.
      const underway = projects
        ? projects.getBoundingClientRect().top <= 2
        : scrollY > innerHeight * 0.7;
      document.getElementById('cat')?.classList.toggle('ready', underway);
      document.getElementById('rise')?.classList.toggle('is-on', underway);
      parkDock();
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ── Dock parking ─────────────────────────────────────────
     While you scroll, the dock floats at its corner. As the page
     end rises into view, the dock rides up with it and comes to
     rest EXACTLY on the Universe button's row — Universe on the
     left, the dock on the right, one aligned closing row — so the
     buttons never cover the timer above, the visits graph below,
     or the bleed wordmark. Anchored to the universe button itself
     (not the wordmark), so anything added below stays clear.
     Scrolling back up lowers it again. */
  const dockEl  = document.querySelector('.dock');
  const bleedEl = document.querySelector('.bleed');
  const uniEl   = document.querySelector('.colophon__universe');
  function parkDock() {
    if (!dockEl) return;
    // mirrors .dock's bottom clamp() in styles.css
    const rest = Math.min(28, Math.max(16, innerHeight * 0.026));
    // anchor: the Universe button's row (fall back to the wordmark)
    const anchor = uniEl || bleedEl;
    if (!anchor) return;
    // wanted bottom offset: the dock's lower edge rests on the
    // Universe button's lower edge — one aligned row
    const wanted = innerHeight - anchor.getBoundingClientRect().bottom;
    dockEl.style.setProperty('--park', Math.max(0, wanted - rest) + 'px');
  }

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

  const endMarks = $$('.band__end');

  function syncSpy() {
    if (!spied.length) return;

    const line = spyLineOffset;
    const atBottom = innerHeight + scrollY >= pageHeight - 2;
    let id = null;

    if (atBottom) {
      id = spied[spied.length - 1].id;
    } else if (spied[0].getBoundingClientRect().top <= line) {
      id = spied[0].id;
      for (let i = 0; i < endMarks.length; i++) {
        if (endMarks[i].getBoundingClientRect().top <= line) {
          const next = spied[i + 1];
          if (next) id = next.id;
        } else {
          break;
        }
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
    const phone = innerWidth <= 720;
    const end = viewTop + (viewBot - viewTop) * 0.42;
    const span = Math.max(viewBot - end, 1);
    fillLabels.forEach(el => {
      const y = el.getBoundingClientRect().top;
      let p;
      if (phone) {
        p = y < viewBot - 24 ? 1 : 0;
      } else {
        p = (viewBot - y) / span;
        if (p < 0) p = 0;
        else if (p > 1) p = 1;
      }
      el.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
    });
  }

  measureSpy();
  syncFills();
  addEventListener('resize', () => requestAnimationFrame(() => { measureSpy(); syncFills(); parkDock(); }), { passive: true });
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
    ['  int', 'k'], [' problemsSolved = ', ''], ['570', 'n'], [';\n\n', ''],
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
  if (tally) tally.textContent = tally.dataset.to || '570';

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
      const n = solvedText || '570';
      const dayBit = days != null
        ? `${days} active days, current streak ${streak}`
        : '237 active days, current streak 124';
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

    /* The signature is the last beat of the page: if the travelling full
       stop is going to run, let it finish first, then sign. A safety timer
       means the signature still appears even if that effect never reports
       back. */
    let signQueued = false;
    const requestSign = () => {
      if (window.__fullstopActive !== true || window.__fullstopDone === true) { playSign(); return; }
      if (signQueued) return;
      signQueued = true;
      document.addEventListener('fullstop:done', () => playSign(), { once: true });
      setTimeout(() => playSign(), 9000);
    };

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
        requestSign();
        removeEventListener('scroll', tryPlay);
      };
      addEventListener('scroll', tryPlay, { passive: true });
      if ('IntersectionObserver' in window) {
        const signOnce = new IntersectionObserver((es, o) => {
          if (!es.some(en => en.isIntersecting)) return;
          if (!nearEnd()) return;
          requestSign();
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
  const toTop   = $('#rise');
  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });

  const ASKS = [
    { q: 'Available?', a: "Yes — he's looking for a <b>Summer 2027 internship</b>, and open to interesting collaborations any time. Best route is <a href=\"mailto:soumyadeepdas044@gmail.com\">soumyadeepdas044@gmail.com</a>." },
    { q: 'What has he built?', a: "Five live products: <b><a href=\"/hushhconnect\">hushhconnect</a></b>, private realtime messaging built around Chat IDs; <b><a href=\"/bookyuniverse\">BookyUniverse</a></b>, a searchable digital library; <b><a href=\"/tellsgroup\">Tellsgroup</a></b>, one home for eighteen media brands; <b><a href=\/meow\>Meow Reminder</a></b>, Telegram reminders with no app; <b><a href=\/openrail\>OpenRail</a></b>, unreserved train discovery. See <a href=\"/#projects\">Projects</a>." },
    { q: 'Tech stack?', a: "Java and C++ for algorithms; JavaScript and React for the web. Also Python, MySQL, MongoDB, Supabase Realtime, Git and AWS. Full list under <a href=\"#skills\">Skills</a>." },
    { q: 'Studying what?', a: "<b>B.Tech in Computer Science</b> at Parul University, Vadodara — specialising in AI &amp; ML, graduating 2028. CGPA 7.17." },
    { q: 'Any code cred?', a: "<b>570 problems solved</b> across seven platforms — LeetCode, GeeksforGeeks, CodeChef, Codeforces and more. 237 active days, current streak 124. All verifiable on <a href=\"https://codolio.com/profile/soumyadeepdas\" target=\"_blank\" rel=\"noopener\">Codolio</a>." },
    { q: 'Résumé?', a: "Right here — <a href=\"assets/Soumyadeep_Das_Resume.pdf?v=2\" download>download the PDF</a>. One page, no fluff." },
    { q: 'Where is he?', a: "Vadodara, Gujarat, India — that's IST, UTC+5:30. Happy to work remotely." }
  ];

  fetch('/data/practice.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(applyPractice)
    .catch(() => {});

  /* ── Footer: visits-per-day graph (public) ───────────────
     /api/visits returns aggregate daily counts only — no paths,
     browsers or referrers. Days without visits are zero-filled so
     the strip is always 30 bars. Hovering a bar highlights it and
     shows the count in a native tooltip, like the admin chart. */
  const visitsEl = $('#visits');
  if (visitsEl) {
    fetch('/api/visits', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => paintVisits(d.days || []))
      .catch(() => {}); /* the graph must never break the page */
  }
  function paintVisits(rows) {
    const bars = $('#visitsBars');
    if (!bars || !rows.length) return;
    const byDay = new Map();
    for (const r of rows) byDay.set(r.day, r.visits);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      days.push(new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
    }
    const max = Math.max(1, ...days.map(d => byDay.get(d) || 0));
    bars.innerHTML = days.map(d => {
      const v = byDay.get(d) || 0;
      const label = (+d.slice(8)) + ' ' + MONTHS[(+d.slice(5, 7)) - 1];
      return '<i' + (d === today ? ' class="v-today"' : '') +
        ' style="height:' + Math.max(2, Math.round((v / max) * 64)) + 'px"' +
        ' title="' + label + ' — ' + v + (v === 1 ? ' visit' : ' visits') + '"></i>';
    }).join('');
    visitsEl.hidden = false;
  }

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

  /* ── Feedback window ───────────────────────────────────── */
  const pane = $('#feedbackPane');
  const paneWin = pane?.querySelector('.pane__win');
  const paneOpenBtn = $('#openFeedback');
  let paneFocus = null;

  const paneFocusable = () => {
    if (!paneWin) return [];
    return $$('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])', paneWin)
      .filter(el => !el.hidden && !el.closest('.sr') && el.getClientRects().length);
  };

  function openPane() {
    if (!pane) return;
    paneFocus = document.activeElement;
    if (cat?.classList.contains('open')) closeCat();
    pane.hidden = false;
    document.documentElement.classList.add('pane-on');
    (pane.querySelector('#paneClose') || paneWin)?.focus();
  }
  function closePane() {
    if (!pane || pane.hidden) return;
    pane.hidden = true;
    document.documentElement.classList.remove('pane-on');
    (paneFocus?.isConnected ? paneFocus : paneOpenBtn)?.focus();
  }

  paneOpenBtn?.addEventListener('click', openPane);
  $('#paneClose')?.addEventListener('click', closePane);
  pane?.querySelector('[data-pane-close]')?.addEventListener('click', closePane);
  addEventListener('keydown', e => {
    if (!pane || pane.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closePane(); return; }
    if (e.key !== 'Tab') return;
    const items = paneFocusable();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first?.focus();
    }
  });
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('feedback') === '1' || location.hash === '#feedback') {
      openPane();
      history.replaceState(null, '', location.pathname + (location.hash === '#feedback' ? '' : location.hash));
    }
  } catch (_) {}

  /* ── Architecture flow: play the diagram when it scrolls in ── */
  $$('.case__archfig').forEach(fig => {
    if (!fig.querySelector('svg')) return;
    fig.classList.add('arch-anim');
    if (calm) { fig.classList.add('is-live'); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { fig.classList.add('is-live'); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    io.observe(fig);
  });

  /* ── Certificate lean: the card tips toward your cursor ── */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !calm) {
    $$('.cert__img').forEach(card => {
      const img = card.querySelector('img');
      if (!img) return;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;          // 0 = left edge, 1 = right edge
        img.style.transform =
          'perspective(900px) rotateY(' + ((px - 0.5) * 16).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', () => { img.style.transform = ''; });
    });
  }

  /* ── More certificates: quiet same-page window ─────────── */
  const certsPane  = $('#certsPane');
  const certsOpen  = $('#openCerts');
  let certsReturn  = null;
  const certsFocusable = () =>
    [...certsPane.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);

  function openCerts() {
    if (!certsPane) return;
    if (cat?.classList.contains('open')) closeCat();
    certsReturn = document.activeElement;
    certsPane.hidden = false;
    document.documentElement.classList.add('pane-on');
    $('#certsClose')?.focus();
  }
  function closeCerts() {
    if (!certsPane || certsPane.hidden) return;
    certsPane.hidden = true;
    document.documentElement.classList.remove('pane-on');
    (certsReturn?.isConnected ? certsReturn : certsOpen)?.focus();
  }
  certsOpen?.addEventListener('click', openCerts);
  $('#certsClose')?.addEventListener('click', closeCerts);
  certsPane?.querySelector('[data-certs-close]')?.addEventListener('click', closeCerts);
  addEventListener('keydown', e => {
    if (!certsPane || certsPane.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeCerts(); return; }
    if (e.key !== 'Tab') return;
    const items = certsFocusable();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first?.focus();
    }
  });

  /* ── Year ──────────────────────────────────────────────── */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Initial sync: covers anchor loads (#projects, #skills…) and restored
     scroll positions, where no scroll event ever fires. */
  onScroll();
})();

/* ═══════════════════════════════════════════════════════════
   Travelling full stop (Contact)
   Fires once per page load, when the Contact section scrolls into view.
   Fails safe: if any precondition is unmet the page stays exactly as
   designed — the effect is opt-in via the .fx-on class on <html>.
   ═══════════════════════════════════════════════════════════ */
(function(){
  var root  = document.documentElement;
  var sec   = document.getElementById('contact');
  var dot   = document.getElementById('fullstop');
  var ghost = document.getElementById('storyStop');
  var sub   = document.getElementById('connectSub');
  var stop  = document.getElementById('connectStop');
  if (!sec || !dot || !ghost || !sub || !stop) return;

  var words  = document.getElementById('fullstopWords');
  var period = dot.querySelector('.fullstop__p');
  var line   = sec.querySelector('.connect__line');
  if (!words || !period || !line) return;

  var running = false, armed = false;
  var K = 1, cBig = null, cSmall = null, letters = null;

  /* Claimed synchronously so the signature knows to wait. Released by
     done() the moment this effect finishes, aborts or bails out. */
  window.__fullstopActive = true;
  window.__fullstopDone = false;
  function done(){
    if (window.__fullstopDone) return;
    window.__fullstopDone = true;
    try{ document.dispatchEvent(new Event('fullstop:done')); }
    catch(e){
      var ev = document.createEvent('Event');
      ev.initEvent('fullstop:done', true, true);
      document.dispatchEvent(ev);
    }
  }

  function rel(el){
    var a = el.getBoundingClientRect(), b = sec.getBoundingClientRect();
    return { x:a.left-b.left, y:a.top-b.top, w:a.width, h:a.height,
             cx:a.left-b.left+a.width/2, cy:a.top-b.top+a.height/2 };
  }

  function buildWords(){
    if (letters) return;
    var label = (sub.textContent || "let's connect").replace(/\.\s*$/, '').trim();
    words.innerHTML = label.split('').map(function(c){
      return '<i>' + (c === ' ' ? '&nbsp;' : c) + '</i>';
    }).join('');
    letters = words.querySelectorAll('i');
  }

  /* Measure the stop's real centre at both sizes, then drive every frame
     from those numbers — no assumptions about how scale and origin interact. */
  function calibrate(){
    var csL = getComputedStyle(line), csS = getComputedStyle(sub);
    dot.style.fontSize = csS.fontSize;
    K = parseFloat(csL.fontSize) / parseFloat(csS.fontSize);
    dot.style.left = '0px'; dot.style.top = '0px';
    dot.style.transform = 'translate3d(0,0,0) scale(' + K + ')';
    cBig = rel(period);
    dot.style.transform = 'translate3d(0,0,0) scale(1)';
    cSmall = rel(period);
    dot.style.visibility = 'visible';
  }

  function put(tx, ty, k, sx, sy){
    var cx = cBig.cx + (cSmall.cx - cBig.cx) * k;
    var cy = cBig.cy + (cSmall.cy - cBig.cy) * k;
    var s  = K + (1 - K) * k;
    dot.style.transform =
      'translate3d(' + (tx - cx).toFixed(2) + 'px,' + (ty - cy).toFixed(2) + 'px,0) ' +
      'scale(' + (s * (sx || 1)).toFixed(3) + ',' + (s * (sy || 1)).toFixed(3) + ')';
  }

  function tween(ms, step, done){
    var t0 = null;
    function f(ts){
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / ms);
      step(t);
      if (t < 1) requestAnimationFrame(f); else if (done) done();
    }
    requestAnimationFrame(f);
  }
  function hop(p0, p1, lift, t){
    return { x:p0.x+(p1.x-p0.x)*t, y:p0.y+(p1.y-p0.y)*t - 4*lift*t*(1-t) };
  }
  function easeInQuad(t){ return t*t; }
  function pang(el){ el.classList.remove('pang'); void el.offsetWidth; el.classList.add('pang'); }

  function home(){
    buildWords();
    calibrate();
    dot.classList.add('no-anim');
    dot.classList.remove('is-text');
    for (var n = 0; n < letters.length; n++) letters[n].style.transitionDelay = '';
    void dot.offsetWidth;
    dot.classList.remove('no-anim');
    var g = rel(ghost);
    put(g.cx, g.cy, 0);
  }

  function settle(){                       /* finished state, no replay */
    buildWords();
    calibrate();
    var s = rel(stop);
    put(s.cx, s.cy, 1);
    for (var n = 0; n < letters.length; n++) letters[n].style.transitionDelay = '';
    dot.classList.add('is-text');
    done();
  }

  function giveUp(){
    try{ root.classList.remove('fx-on'); }catch(e){}
    running = false;
    window.__fullstopActive = false;
    done();
  }

  function supported(){
    if (!('IntersectionObserver' in window)) return false;
    if (!('requestAnimationFrame' in window)) return false;
    if (!(window.CSS && CSS.supports && CSS.supports('transform','scale(1)'))) return false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    /* No arbitrary desktop cut-off: the only things that actually matter
       are that the icons sit on ONE row and that there is enough height
       between the stop and that row for the fall to read. Both are
       measured below, so phones run it whenever the layout allows. */
    if (window.innerWidth < 320) return false;
    var row = sec.querySelectorAll('.connect__social a, .connect__social button');
    if (row.length < 2) return false;
    var top0 = row[0].getBoundingClientRect().top;
    for (var n = 1; n < row.length; n++){
      if (Math.abs(row[n].getBoundingClientRect().top - top0) > 2) return false;
    }
    if (rel(row[0]).y - rel(ghost).cy < 44) return false;
    return true;
  }

  function run(){
    if (running || !root.classList.contains('fx-on')) return;
    running = true;
    try{ home(); }catch(e){ return giveUp(); }

    var g  = rel(ghost);
    var pr = rel(period).h / 2 || 5;

    var all = Array.prototype.slice.call(
      sec.querySelectorAll('.connect__social a, .connect__social button')
    ).map(function(el){ var a = rel(el); return { x:a.cx, y:a.y - pr, el:el }; });

    /* land on the icon directly beneath the stop, then walk left */
    var hit = 0, best = Infinity;
    all.forEach(function(p, n){
      var d = Math.abs(p.x - g.cx);
      if (d < best){ best = d; hit = n; }
    });
    var pts = all.slice(0, hit + 1).reverse();
    var S   = rel(stop);
    var END = { x:S.cx, y:S.cy };

    var REST  = 0.6;
    var gap   = pts[1] ? Math.abs(pts[1].x - pts[0].x) : 90;
    var APEX0 = Math.max(64, gap * 0.9);
    var i = 0;

    function squash(p, ms, amt, next){
      tween(ms, function(t){
        var w = Math.sin(t * Math.PI);
        put(p.x, p.y, 0, 1 + amt*w, 1 - amt*0.85*w);
      }, next);
    }

    tween(620, function(t){                                  /* 1 · the fall */
      var e = easeInQuad(t);
      put(g.cx + (pts[0].x - g.cx) * t, g.cy + (pts[0].y - g.cy) * e, 0, 1 - .12*e, 1 + .18*e);
    }, function(){
      if (!running) return;
      pang(pts[0].el);
      squash(pts[0], 105, .32, bounce);
    });

    function bounce(){                                       /* 2 · leftward hops */
      if (!running) return;
      i++;
      if (i >= pts.length) return finish();
      var from = pts[i-1], to = pts[i];
      var apex = APEX0 * Math.pow(REST, i-1);
      var ms   = 300 + 440 * Math.sqrt(apex / APEX0);
      tween(ms, function(t){ var p = hop(from, to, apex, t); put(p.x, p.y, 0); }, function(){
        if (!running) return;
        pang(to.el);
        squash(to, 100, .28 * Math.pow(REST, i-1) + .07, bounce);
      });
    }

    function finish(){                                       /* 3 · rise and become the line */
      var last = pts[pts.length-1];
      tween(880, function(t){
        var p = hop(last, END, 150, t);
        put(p.x, p.y, t);
      }, function(){
        if (!running) return;
        for (var n = 0; n < letters.length; n++) letters[n].style.transitionDelay = (n*32) + 'ms';
        dot.classList.add('is-text');
        setTimeout(function(){ running = false; done(); }, 420 + letters.length * 32);
      });
    }
  }

  var io = null;
  function boot(){
    try{
      if (!supported()) return giveUp();
      root.classList.add('fx-on');
      home();
      io = new IntersectionObserver(function(es){
        for (var n = 0; n < es.length; n++){
          if (es[n].isIntersecting && !armed){
            armed = true;
            /* Hold the beat: the drop waits 3s after the reader arrives,
               so the section is read before the full stop travels. If the
               tab is hidden when the timer fires, it waits for them to
               come back. */
            setTimeout(function(){
              if (document.hidden){
                document.addEventListener('visibilitychange', function v(){
                  if (document.hidden) return;
                  document.removeEventListener('visibilitychange', v);
                  run();
                });
              } else { run(); }
            }, 3000);
          }
        }
      }, { threshold:.3 });
      io.observe(sec);
    }catch(e){ giveUp(); }
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot, boot);
  else if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

  window.addEventListener('load', function(){
    setTimeout(function(){
      if (!running && !armed && root.classList.contains('fx-on')){ try{ home(); }catch(e){} }
    }, 300);
  });

  var rt;
  function onResize(){
    clearTimeout(rt);
    rt = setTimeout(function(){
      try{
        if (!root.classList.contains('fx-on')) return;
        if (!supported()) return giveUp();
        if (running){ running = false; settle(); }
        else if (armed) settle();
        else home();
      }catch(e){ giveUp(); }
    }, 160);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
})();
