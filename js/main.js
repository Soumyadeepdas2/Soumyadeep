/* =========================================================
   Soumyadeep Das — Portfolio  |  main.js
   Vanilla JS. No dependencies.
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Theme (light / dark, remembered) ----------
     The initial theme is set by the inline script in <head> to avoid a
     flash of the wrong theme. This block only handles switching.        */
  const root   = document.documentElement;
  const toggle = $('#themeToggle');
  const media  = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(mode, persist) {
    root.setAttribute('data-theme', mode);
    if (persist) localStorage.setItem('theme', mode);
    toggle?.setAttribute('aria-pressed', String(mode === 'dark'));
    toggle?.setAttribute('title', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  applyTheme(root.getAttribute('data-theme') || 'light', false);

  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    // Cross-fade the whole page during the swap so it doesn't "snap".
    if (!reduced) {
      root.classList.add('theme-switching');
      setTimeout(() => root.classList.remove('theme-switching'), 420);
    }
    applyTheme(next, true);
  });

  // Follow the OS if the visitor has never chosen manually.
  media.addEventListener?.('change', e => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light', false);
  });

  /* ---------- 2. Mobile menu ---------- */
  const burger = $('#burger');
  const links  = $('#navLinks');

  const closeMenu = () => {
    links.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  $$('#navLinks a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- 3. Sticky nav + scroll progress + back-to-top ---------- */
  const nav      = $('#nav');
  const progress = $('#scrollProgress');
  const toTop    = $('#toTop');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-stuck', y > 8);
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    toTop.classList.toggle('is-visible', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  toTop?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  );

  /* ---------- 4. Scrollspy (highlight the active nav link) ---------- */
  const sections = $$('main section[id]');
  const navMap = new Map(
    $$('#navLinks a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a])
  );

  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navMap.forEach(a => a.classList.remove('is-active'));
      navMap.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(s => spy.observe(s));

  /* ---------- 5. Reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      obs.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => revealer.observe(el));

  /* ---------- 6. Skill bars fill when seen ---------- */
  const barObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-filled');
      obs.unobserve(en.target);
    });
  }, { threshold: 0.5 });

  $$('.bar').forEach(b => barObs.observe(b));

  /* ---------- 7. Animated stat counters ---------- */
  function countUp(el) {
    const target = +el.dataset.target;
    if (reduced) { el.textContent = target; return; }
    const dur = 1400;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  const countObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countUp(en.target);
      obs.unobserve(en.target);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(c => countObs.observe(c));

  /* ---------- 8. Typewriter in the hero ---------- */
  const typedEl = $('#typed');
  const WORDS = ['actually works.', 'people can use.', 'solves real problems.', 'I\'m proud to ship.'];
  if (typedEl) {
    if (reduced) {
      typedEl.textContent = WORDS[0];
    } else {
      let w = 0, i = 0, deleting = false;
      (function tick() {
        const word = WORDS[w];
        typedEl.textContent = word.slice(0, i);
        let wait = deleting ? 45 : 78;
        if (!deleting && i === word.length) { deleting = true; wait = 1700; }
        else if (deleting && i === 0) { deleting = false; w = (w + 1) % WORDS.length; wait = 320; }
        else { i += deleting ? -1 : 1; }
        setTimeout(tick, wait);
      })();
    }
  }

  /* ---------- 9. Contact form ----------
     Two delivery modes, chosen by the form's data-endpoint attribute:
       - endpoint set   -> POSTs JSON to it (Formspree, Getform, your API)
       - endpoint empty -> opens the visitor's mail client, pre-filled
     Either way the visitor gets real feedback, never a fake "sent". */
  const form = $('#contactForm');
  const note = $('#formNote');

  const setError = (input, msg) => {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const slot = $(`.error[data-for="${input.id}"]`);
    if (slot) slot.textContent = msg || '';
  };

  // Each submit gets a token; late timers from an older submit are ignored
  // so a stale message can never overwrite a newer one.
  let submitToken = 0;

  const say = (msg, kind) => {
    note.textContent = msg;
    note.className = 'form__note' + (kind ? ' ' + kind : '');
  };

  function validate() {
    const name = $('#name'), email = $('#email'), message = $('#message');
    let ok = true, first = null;

    if (!name.value.trim()) {
      setError(name, 'Please tell me your name.'); ok = false; first = first || name;
    } else setError(name);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setError(email, 'That email looks off.'); ok = false; first = first || email;
    } else setError(email);

    if (message.value.trim().length < 10) {
      setError(message, 'A little more detail, please (10+ characters).');
      ok = false; first = first || message;
    } else setError(message);

    return { ok, first };
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const token = ++submitToken;

    const { ok, first } = validate();
    if (!ok) {
      say('Please fix the highlighted fields.', 'err');
      first?.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const data = {
      name:    $('#name').value.trim(),
      email:   $('#email').value.trim(),
      subject: $('#subject').value,
      message: $('#message').value.trim()
    };

    const endpoint = form.dataset.endpoint?.trim();

    // --- Mode A: no backend configured -> hand off to the mail client ---
    if (!endpoint) {
      const to = form.dataset.fallbackEmail || '';
      const body =
        `${data.message}\n\n—\nFrom: ${data.name}\nEmail: ${data.email}`;
      const href =
        `mailto:${to}?subject=${encodeURIComponent('[Portfolio] ' + data.subject)}` +
        `&body=${encodeURIComponent(body)}`;

      say('Opening your email app…', 'ok');
      window.location.href = href;

      // If no mail client handles it, offer a copy-paste path instead —
      // but only if this is still the most recent submission.
      setTimeout(() => {
        if (token === submitToken) {
          say('If nothing opened, email me directly at ' + to, '');
        }
      }, 2500);
      return;
    }

    // --- Mode B: POST to a real form endpoint ---
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Sending…';
    say('');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      form.reset();
      say('✓ Thanks — your message is on its way. I\'ll reply soon.', 'ok');
    } catch (err) {
      say(
        'Something went wrong sending that. Please email me directly at ' +
        (form.dataset.fallbackEmail || ''),
        'err'
      );
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });

  ['#name', '#email', '#message'].forEach(sel => {
    const el = $(sel);
    el?.addEventListener('input', () => setError(el));
  });

  /* ---------- 10. Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
