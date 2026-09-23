/* Pixel portrait — cut-out stays put; a few chips break off the sides. No hover. */
(function () {
  const wrap = document.getElementById('pixPortrait');
  const canvas = document.getElementById('pixCanvas');
  if (!wrap || !canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    wrap.classList.add('is-static');
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
    img.onerror = function () { wrap.classList.add('is-static'); };
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

    function besideRGB() {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      return light ? [23, 21, 15] : [242, 238, 230];
    }
    const onShirtRGB = [242, 238, 230];
    const chips = [];
    const [br, bg, bb] = besideRGB();
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const nx = p.x / sw, ny = p.y / sh;
      const head = ny < 0.40;
      const left = nx < 0.28;
      const shirtEdge = nx > 0.86 && ny > 0.58;
      const bottomRight = nx > 0.68 && ny > 0.72;

      if (shirtEdge && rnd() < 0.12) p.hide = true;

      if (shirtEdge && rnd() < 0.20) {
        chips.push({
          x: p.x + (rnd() - 0.35) * 3,
          y: p.y + (rnd() - 0.5) * 3,
          r: onShirtRGB[0], g: onShirtRGB[1], b: onShirtRGB[2],
          a: 0.82 + rnd() * 0.18,
          phase: rnd() * Math.PI * 2,
          onShirt: true
        });
      }
      if (shirtEdge && rnd() < 0.10) {
        chips.push({
          x: p.x + 10 + rnd() * 30,
          y: p.y + (rnd() - 0.5) * 16,
          r: br, g: bg, b: bb,
          a: 0.55 + rnd() * 0.4,
          phase: rnd() * Math.PI * 2,
          onShirt: false
        });
      }
      if (bottomRight && rnd() < 0.22) {
        chips.push({
          x: p.x + 8 + rnd() * 34,
          y: p.y + 6 + rnd() * 24,
          r: br, g: bg, b: bb,
          a: 0.55 + rnd() * 0.4,
          phase: rnd() * Math.PI * 2,
          onShirt: false
        });
      } else if (head && rnd() < 0.016) {
        const side = nx > 0.5 ? 1 : (rnd() < 0.5 ? 1 : -1);
        chips.push({
          x: p.x + side * (5 + rnd() * 14),
          y: p.y + (rnd() - 0.5) * 10 - rnd() * 6,
          r: br, g: bg, b: bb,
          a: 0.5 + rnd() * 0.35,
          phase: rnd() * Math.PI * 2,
          onShirt: false
        });
      } else if (left && rnd() < 0.018) {
        chips.push({
          x: p.x - (5 + rnd() * 12),
          y: p.y + (rnd() - 0.5) * 8,
          r: br, g: bg, b: bb,
          a: 0.5 + rnd() * 0.35,
          phase: rnd() * Math.PI * 2,
          onShirt: false
        });
      }
    }

    wrap.classList.add('is-live');

    const padL = 18, padR = 48, padY = 36;
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

    function overBody(x, y) {
      const ix = Math.round(x), iy = Math.round(y);
      if (ix < 0 || iy < 0 || ix >= sw || iy >= sh) return false;
      return data[(iy * sw + ix) * 4 + 3] > 40;
    }
    const whiteRGB = [242, 238, 230];
    const inkRGB = [23, 21, 15];

    let t = 0;
    function tick() {
      t += 1;
      const cw = canvas.width, ch = canvas.height;
      const sx = cw / fw, sy = ch / fh;
      ctx.clearRect(0, 0, cw, ch);
      const cell = Math.max(1.2, step * sx * 0.95);
      const light = document.documentElement.getAttribute('data-theme') === 'light';

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.hide) continue;
        ctx.globalAlpha = Math.max(0.72, p.a);
        ctx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
        ctx.fillRect((p.x + padL) * sx, (p.y + padY / 2) * sy, cell, cell);
      }
      for (let i = 0; i < chips.length; i++) {
        const p = chips[i];
        const drift = p.onShirt ? 0 : 1;
        const dx = p.x + Math.sin(t * 0.018 + p.phase) * 1.15 * drift;
        const dy = p.y + Math.cos(t * 0.014 + p.phase) * 0.9 * drift;
        let r, g, b;
        if (p.onShirt) {
          r = whiteRGB[0]; g = whiteRGB[1]; b = whiteRGB[2];
        } else if (!light) {
          r = whiteRGB[0]; g = whiteRGB[1]; b = whiteRGB[2];
        } else if (overBody(dx, dy)) {
          r = whiteRGB[0]; g = whiteRGB[1]; b = whiteRGB[2];
        } else {
          r = inkRGB[0]; g = inkRGB[1]; b = inkRGB[2];
        }
        ctx.globalAlpha = Math.max(0.42, p.a);
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect((dx + padL) * sx, (dy + padY / 2) * sy, cell, cell);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    tick();
  }
})();
