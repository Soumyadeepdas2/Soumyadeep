/* Pixel portrait — cut-out stays put; a few chips break off the sides. No hover. */
(function () {
  const wrap = document.getElementById('pixPortrait');
  const canvas = document.getElementById('pixCanvas');
  if (!wrap || !canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    canvas.remove();
    return;
  }

  const img = new Image();
  img.decoding = 'async';
  img.src = 'assets/portrait.webp';
  img.onload = function () { boot(img); };
  img.onerror = function () {
    img.src = 'assets/portrait.png';
    img.onload = function () { boot(img); };
  };

  function boot(image) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const sw = 200;
    const sh = Math.round(image.height * (sw / image.width));
    const off = document.createElement('canvas');
    off.width = sw;
    off.height = sh;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(image, 0, 0, sw, sh);
    const data = octx.getImageData(0, 0, sw, sh).data;

    const parts = [];
    const step = 2;
    for (let y = 0; y < sh; y += step) {
      for (let x = 0; x < sw; x += step) {
        const i = (y * sw + x) * 4;
        const a = data[i + 3];
        if (a < 40) continue;
        parts.push({
          x: x, y: y,
          r: data[i], g: data[i + 1], b: data[i + 2], a: a / 255
        });
      }
    }

    let seed = 20260922;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    function chipColor() {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      return light ? [28, 24, 20] : [242, 238, 230];
    }

    const [cr, cg, cb] = chipColor();
    const chips = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const nx = p.x / sw, ny = p.y / sh;
      let side = 0, odds = 0;
      if (nx > 0.58) { side = 1; odds = 0.09; }
      else if (nx < 0.16) { side = -1; odds = 0.045; }
      if (ny < 0.22 && nx > 0.42) { side = 1; odds = Math.max(odds, 0.07); }
      if (rnd() >= odds) continue;
      const dist = 10 + rnd() * 34;
      const jitter = (rnd() - 0.5) * 22;
      chips.push({
        x: p.x + side * dist,
        y: p.y + jitter - (ny < 0.25 ? rnd() * 10 : 0),
        r: cr, g: cg, b: cb,
        a: 0.42 + rnd() * 0.5,
        phase: rnd() * Math.PI * 2
      });
    }

    wrap.classList.add('is-live');

    const padL = 18, padR = 40, padY = 14;
    const fw = sw + padL + padR;
    const fh = sh + padY;

    function fit() {
      const cssW = wrap.clientWidth * (fw / sw);
      const cssH = wrap.clientWidth * (fh / sw);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      canvas.style.marginLeft = -(wrap.clientWidth * (padL / sw)) + 'px';
      canvas.style.marginTop = -(wrap.clientWidth * ((padY / 2) / sw)) + 'px';
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
    else addEventListener('resize', fit);

    new MutationObserver(function () {
      const c = chipColor();
      for (let i = 0; i < chips.length; i++) {
        chips[i].r = c[0]; chips[i].g = c[1]; chips[i].b = c[2];
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let t = 0;
    function tick() {
      t += 1;
      const cw = canvas.width, ch = canvas.height;
      const sx = cw / fw, sy = ch / fh;
      ctx.clearRect(0, 0, cw, ch);
      const cell = Math.max(1.2, step * sx * 0.95);

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        ctx.globalAlpha = Math.max(0.72, p.a);
        ctx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
        ctx.fillRect((p.x + padL) * sx, (p.y + padY / 2) * sy, cell, cell);
      }
      for (let i = 0; i < chips.length; i++) {
        const p = chips[i];
        const dx = p.x + Math.sin(t * 0.018 + p.phase) * 1.15;
        const dy = p.y + Math.cos(t * 0.014 + p.phase) * 0.9;
        ctx.globalAlpha = Math.max(0.42, p.a);
        ctx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
        ctx.fillRect((dx + padL) * sx, (dy + padY / 2) * sy, cell, cell);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    tick();
  }
})();
