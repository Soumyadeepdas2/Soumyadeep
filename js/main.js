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
    ['  int', 'k'], [' problemsSolved = ', ''], ['400', 'n'], [';\n\n', ''],
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
     caused crawlers to index the wrong number. */
  const tally = $('#tally');
  if (tally) tally.textContent = tally.dataset.to || '400';

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
     endpoint set   -> POST JSON to it (Formspree etc.)
     endpoint empty -> open the visitor's mail app, pre-filled  */
  const form = $('#contactForm');
  const note = $('#formNote');
  let token = 0;

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

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const mine = ++token;

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

    const data = {
      name: name.value.trim(),
      email: email.value.trim(),
      subject: form.querySelector('input[name="subject"]:checked')?.value || 'Portfolio enquiry',
      message: message.value.trim()
    };

    const endpoint = form.dataset.endpoint?.trim();
    const to = form.dataset.fallbackEmail || '';

    // No endpoint configured -> hand off to a mail client. Note this fails
    // silently on desktops with no mail app registered, which is why the
    // endpoint above is the default path.
    if (!endpoint) {
      const body = `${data.message}\n\n—\nFrom: ${data.name}\nEmail: ${data.email}`;
      say('Opening your mail app…', 'ok');
      location.href = `mailto:${to}?subject=${encodeURIComponent('[Portfolio] ' + data.subject)}&body=${encodeURIComponent(body)}`;
      setTimeout(() => {
        if (mine === token) say('If nothing opened, write to ' + to, '');
      }, 2500);
      return;
    }

    const btn = form.querySelector('.send');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    say('');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name:     data.name,
          email:    data.email,
          message:  data.message,
          _subject: `[Portfolio] ${data.subject} — ${data.name}`,
          _replyto: data.email,     // so replying goes straight to them
          _template: 'table',
          _captcha: 'false'
        })
      });

      let ok = res.ok;
      let why = '';
      try {
        const j = await res.json();
        // FormSubmit answers 200 with success:"false" for real problems
        if (j && String(j.success) === 'false') { ok = false; why = j.message || ''; }
      } catch (_) { /* non-JSON body on success is fine */ }

      if (!ok) {
        // Owner-facing hint: the most common cause is the one-time activation.
        if (/activat/i.test(why)) {
          console.warn(
            '[contact form] FormSubmit is not activated for ' + location.origin + '\n' +
            'Activation is PER DOMAIN — activating soumyadeep.space does not\n' +
            'activate www.soumyadeep.space (or localhost). Submit once from\n' +
            'THIS domain, then click the "Activate Form" link FormSubmit\n' +
            'emails to ' + to + ' (check spam).'
          );
        } else if (why) {
          console.warn('[contact form] ' + why);
        }
        throw new Error(why || 'HTTP ' + res.status);
      }

      form.reset();
      say('Thanks — that reached me. I\'ll reply soon.', 'ok');
    } catch (err) {
      // Never leave them stuck: offer a copyable address and a mail link.
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

  const ASKS = [
    { q: 'Available?', a: "Yes — he's looking for a <b>Summer 2027 internship</b>, and open to interesting collaborations any time. Best route is <a href=\"mailto:soumyadeepdas044@gmail.com\">soumyadeepdas044@gmail.com</a>." },
    { q: 'What has he built?', a: "Three live products: <b>hushh</b>, private realtime messaging built around Chat IDs instead of phone numbers or email; <b>BookyUniverse</b>, a searchable digital library with personal collections; and <b>Tellsgroup</b>, one searchable home for eighteen media brands. See <a href=\"#projects\">Projects</a>." },
    { q: 'Tech stack?', a: "Java and C++ for algorithms; JavaScript and React for the web. Also Python, MySQL, MongoDB, Supabase Realtime, Git and AWS. Full list under <a href=\"#skills\">Skills</a>." },
    { q: 'Studying what?', a: "<b>B.Tech in Computer Science</b> at Parul University, Vadodara — specialising in AI &amp; ML, graduating 2028. CGPA 7.17." },
    { q: 'Any code cred?', a: "<b>400 problems solved</b> across seven platforms — LeetCode, GeeksforGeeks, CodeChef, Codeforces and more. 178 active days, longest streak 69. All verifiable on <a href=\"https://codolio.com/profile/soumyadeepdas\" target=\"_blank\" rel=\"noopener\">Codolio</a>." },
    { q: 'Résumé?', a: "Right here — <a href=\"assets/Soumyadeep_Das_Resume.pdf\" download>download the PDF</a>. One page, no fluff." },
    { q: 'Where is he?', a: "Vadodara, Gujarat, India — that's IST, UTC+5:30. Happy to work remotely." },
    { q: 'Are you a real cat?', a: "I'm a few lines of JavaScript in a trench coat. No API, no training data, just answers Soumyadeep wrote himself. 🐾" }
  ];

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
