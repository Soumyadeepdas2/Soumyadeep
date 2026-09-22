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
      mast?.classList.toggle('stuck', scrollY > 40);
      // the cat waits until you've started reading
      cat?.classList.toggle('ready', scrollY > innerHeight * 0.55);
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
    if (!sectionRanges.length) return;

    const line = scrollY + spyLineOffset;
    const atBottom = innerHeight + scrollY >= pageHeight - 2;
    let id = null;

    if (atBottom) {
      id = sectionRanges[sectionRanges.length - 1].id;
    } else {
      const match = sectionRanges.find(sec => line >= sec.top && line < sec.bottom);
      id = match?.id || null;
    }

    if (id === current) return;
    current = id;
    navLinks.forEach(a => a.classList.remove('on'));
    if (id) navLinks.get(id)?.classList.add('on');
  }

  measureSpy();
  addEventListener('resize', () => requestAnimationFrame(measureSpy), { passive: true });
  document.fonts?.ready?.then(measureSpy);

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

  /* ── Signature: writes itself when the footer arrives ──── */
  const sign = $('.sign');
  if (sign) {
    if (calm) {
      sign.classList.add('written');
    } else {
      // Only enhanced pages begin hidden; without JS the full name stays visible.
      sign.classList.add('enhanced');
      if ('IntersectionObserver' in window) {
        const signOnce = new IntersectionObserver((es, o) => {
          es.forEach(en => {
            if (!en.isIntersecting) return;
            sign.classList.add('writing');
            o.disconnect();
            setTimeout(() => sign.classList.add('written'), 3550);
          });
        }, { threshold: 0.9 });
        signOnce.observe(sign);
      } else {
        sign.classList.add('written');
      }
    }
  }

  /* ── Local clock ───────────────────────────────────────── */
  const clock = $('#clock');
  if (clock) {
    const tick = () => {
      clock.textContent = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
      }).format(new Date());
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ── Contact form ──────────────────────────────────────────
     Native POST to FormSubmit. AJAX/fetch to /ajax/ is what
     failed in the browser even when FormSubmit itself worked. */
  const form = $('#contactForm');
  const note = $('#formNote');
  const to = form?.dataset.fallbackEmail || 'soumyadeepdas044@gmail.com';

  const flag = (input, msg) => {
    input.closest('.fld').classList.toggle('bad', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const slot = $(`.err[data-for="${input.id}"]`);
    if (slot) slot.textContent = msg || '';
  };
  const say = (msg, kind) => {
    if (!note) return;
    note.innerHTML = msg;                // trusted, author-written strings only
    note.className = 'note__status' + (kind ? ' ' + kind : '');
  };

  if (form && new URLSearchParams(location.search).get('sent') === '1') {
    say('Thanks — that reached me. I\'ll reply soon.', 'ok');
    history.replaceState(null, '', location.pathname + '#contact');
    $('#contact')?.scrollIntoView({ block: 'start' });
  }

  form?.addEventListener('submit', e => {
    e.preventDefault();

    const name = $('#name'), email = $('#email'), message = $('#message');
    let ok = true, first = null;

    if (!name.value.trim()) { flag(name, 'Required'); ok = false; first = name; }
    else flag(name);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      flag(email, 'Check this address'); ok = false; first = first || email;
    } else flag(email);

    if (message.value.trim().length < 10) {
      flag(message, 'A little more detail'); ok = false; first = first || message;
    } else flag(message);

    if (!ok) { say('Please fix the marked fields.', 'bad'); first?.focus(); return; }

    const subject = form.querySelector('input[name="subject"]:checked')?.value || 'Portfolio enquiry';
    const subj = $('#fsSubject');
    if (subj) subj.value = `[Portfolio] ${subject} — ${name.value.trim()}`;
    const next = $('#fsNext');
    if (next) next.value = `${location.origin}/?sent=1#contact`;

    const btn = form.querySelector('.send');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    say('Sending…', '');
    form.submit();
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
      bubble(greet + " I'm Soumyadeep's cat. Ask me anything below — I only know what's on this page.", 'cat');
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

  /* ── Year ──────────────────────────────────────────────── */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
