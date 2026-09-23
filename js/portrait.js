/* Pixel portrait — cells gather in the hero and stay. No hover, no loose chips. */
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

    const lede = wrap.closest('.lede');
    if (!lede) {
      wrap.classList.add('is-static');
      canvas.remove();
      return;
    }

    canvas.classList.add('lede__pix-layer');
    lede.appendChild(canvas);

    function measure() {
      const lr = lede.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      return {
        lr: lr, wr: wr,
        scale: wr.width / sw,
        left: lr.left, top: lr.top,
        w: lr.width, h: lr.height,
        ox: wr.left - lr.left,
        oy: wr.top - lr.top
      };
    }

    let M = measure();
    let dpr = 1;
    let phase = 'assemble';

    function applySize(m) {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.round(m.w * dpr);
      const bh = Math.round(m.h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      canvas.style.left = (m.left - m.lr.left) + 'px';
      canvas.style.top = (m.top - m.lr.top) + 'px';
      canvas.style.width = m.w + 'px';
      canvas.style.height = m.h + 'px';
    }

    applySize(M);

    function drawPart(p, x, y, cell, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgb(' + p.r + ',' + p.g + ',' + p.b + ')';
      ctx.fillRect(x, y, cell, cell);
    }

    function paintSettled() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, M.w, M.h);
      const cell = Math.max(1.2, M.scale * step * 0.95);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        drawPart(p, M.ox + p.x * M.scale, M.oy + p.y * M.scale, cell, Math.max(0.72, p.a));
      }
      ctx.globalAlpha = 1;
    }

    function settle() {
      phase = 'idle';
      wrap.classList.add('is-live');
      canvas.classList.add('is-live');
      paintSettled();
    }

    function onResize() {
      M = measure();
      applySize(M);
      if (phase === 'idle') paintSettled();
    }
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(onResize);
      ro.observe(lede);
      ro.observe(wrap);
    } else {
      addEventListener('resize', onResize);
    }

    if (wrap.clientWidth < 40) {
      settle();
      return;
    }

    const mobile = window.matchMedia('(max-width:900px)').matches;
    const dur = mobile ? 2700 : 4100;
    const stagger = mobile ? 850 : 1300;

    const flyers = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      flyers.push({
        p: p,
        sx: Math.random() * M.w,
        sy: Math.random() * M.h,
        delay: Math.random() * stagger
      });
    }

    const t0 = performance.now();

    function tick(now) {
      if (phase !== 'assemble') return;
      const elapsed = now - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, M.w, M.h);
      const cell = Math.max(1.2, M.scale * step * 0.95);
      let allDone = true;
      for (let i = 0; i < flyers.length; i++) {
        const f = flyers[i];
        const hx = M.ox + f.p.x * M.scale;
        const hy = M.oy + f.p.y * M.scale;
        let u = (elapsed - f.delay) / dur;
        if (u < 1) allDone = false;
        if (u < 0) u = 0;
        else if (u > 1) u = 1;
        const e = 1 - Math.pow(1 - u, 4);
        drawPart(
          f.p,
          f.sx + (hx - f.sx) * e,
          f.sy + (hy - f.sy) * e,
          cell,
          Math.max(0.72, f.p.a) * Math.min(1, 0.2 + u)
        );
      }
      ctx.globalAlpha = 1;
      if (allDone) settle();
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
