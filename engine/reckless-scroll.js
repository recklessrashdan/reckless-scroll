/*! Reckless Scroll engine v0.1.0 | recklessplyer | MIT
 *  Publishes scroll progress as CSS custom properties and nothing else.
 *    --rs-p   on <html>: whole-page progress, 0 to 1
 *    --rs-p   on each [data-rs-stage]: progress through that stage, 0 to 1
 *    --rs-t   on each [data-rs-at="a,b"]: local progress between stage progress a and b
 *    --rs-x / --rs-y on <html>: pointer position, -1 to 1 (fine pointers only)
 *  Public API: window.RecklessScroll { settled, onUpdate(fn), report() }
 */
(() => {
  'use strict';
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const EASE = reduce ? 1 : 0.16;
  const ease = (cur, target, k = EASE) => {
    const n = lerp(cur, target, k);
    return Math.abs(n - target) < 0.0004 ? target : n;
  };
  const listeners = new Set();

  /* Split headlines into words. Plain text only: markup inside is dropped. */
  document.querySelectorAll('[data-rs-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'rs-w';
      outer.setAttribute('aria-hidden', 'true');
      outer.style.setProperty('--i', i);
      const inner = document.createElement('span');
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.style.setProperty('--n', words.length);
  });

  /* Frame scrubbing: <canvas data-rs-frames="frames/f%04d.jpg" data-rs-count="120"> (1-based names) */
  function makeFrames(cv) {
    const ctx = cv.getContext('2d');
    const count = Math.max(1, +cv.dataset.rsCount || 1);
    const pattern = cv.dataset.rsFrames;
    const imgs = new Array(count);
    const bad = new Set();
    let last = -1;
    const name = (n) => pattern.replace(/%0(\d)d/, (_, w) => String(n).padStart(+w, '0'));
    const load = (i) => new Promise((res) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { imgs[i] = im; res(); };
      im.onerror = () => { bad.add(i); res(); };
      im.src = name(i + 1);
    });
    const order = [];
    for (let i = 0; i < count; i += 8) order.push(i);       /* coarse pass first */
    for (let i = 0; i < count; i++) if (i % 8) order.push(i); /* then fill in */
    (async () => { for (let k = 0; k < order.length; k += 6) { await Promise.all(order.slice(k, k + 6).map(load)); wake(); } })();
    const fit = () => {
      const r = cv.getBoundingClientRect();
      const d = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * d));
      cv.height = Math.max(1, Math.round(r.height * d));
      last = -1;
    };
    addEventListener('resize', fit);
    fit();
    const idx = (p) => Math.round(clamp(p) * (count - 1));
    return {
      ready: (p) => { const i = idx(p); return !!imgs[i] || bad.has(i); },
      failed: () => bad.size,
      draw(p) {
        const i = idx(p);
        let j = -1;
        for (let d = 0; d < count; d++) {
          if (imgs[i - d]) { j = i - d; break; }
          if (imgs[i + d]) { j = i + d; break; }
        }
        if (j < 0 || j === last) return;
        const im = imgs[j];
        const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
        const w = im.naturalWidth * s, h = im.naturalHeight * s;
        ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
        last = j;
      },
    };
  }

  const stages = [...document.querySelectorAll('[data-rs-stage]')].map((el) => {
    const cues = [...el.querySelectorAll('[data-rs-at]')].map((c) => {
      const [a, b] = c.dataset.rsAt.split(',').map(Number);
      return { c, a, b: b > a ? b : a + 0.01, t: -1 };
    });
    const cv = el.querySelector('canvas[data-rs-frames]');
    return { el, cues, target: 0, cur: 0, track: el.querySelector('[data-rs-track]'), frames: cv ? makeFrames(cv) : null };
  });

  let raf = 0, gp = 0, gt = 0, px = 0, py = 0, tx = 0, ty = 0;
  const api = (window.RecklessScroll = {
    settled: false,
    onUpdate: (fn) => listeners.add(fn),
    report: () => ({ stages: stages.map((s) => ({ id: s.el.id || null, framesFailed: s.frames ? s.frames.failed() : 0 })) }),
  });

  function wake() {
    api.settled = false;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    raf = 0;
    const vh = innerHeight;
    let busy = false;

    const max = doc.scrollHeight - vh;
    gt = max > 0 ? clamp(scrollY / max) : 0;
    gp = ease(gp, gt);
    if (gp !== gt) busy = true;
    doc.style.setProperty('--rs-p', gp.toFixed(4));

    for (const s of stages) {
      const span = s.el.offsetHeight - vh;
      s.target = span > 0 ? clamp(-s.el.getBoundingClientRect().top / span) : 0;
      s.cur = ease(s.cur, s.target);
      if (s.cur !== s.target) busy = true;
      s.el.style.setProperty('--rs-p', s.cur.toFixed(4));

      for (const q of s.cues) {
        const t = clamp((s.cur - q.a) / (q.b - q.a));
        if (t === q.t) continue;
        q.t = t;
        q.c.style.setProperty('--rs-t', t.toFixed(4));
        q.c.classList.toggle('is-on', t > 0);
        q.c.classList.toggle('is-done', t >= 1);
      }
      if (s.track && !reduce) {
        const dist = Math.max(0, s.track.scrollWidth - s.track.parentElement.clientWidth);
        s.track.style.transform = `translate3d(${(-s.cur * dist).toFixed(2)}px,0,0)`;
      }
      if (s.frames) {
        s.frames.draw(s.cur);
        if (!s.frames.ready(s.cur)) busy = true;
      }
    }

    if (fine && !reduce) {
      px = lerp(px, tx, 0.1); py = lerp(py, ty, 0.1);
      if (Math.abs(px - tx) < 0.002) px = tx;
      if (Math.abs(py - ty) < 0.002) py = ty;
      if (px !== tx || py !== ty) busy = true;
      doc.style.setProperty('--rs-x', px.toFixed(3));
      doc.style.setProperty('--rs-y', py.toFixed(3));
    }

    api.settled = !busy;
    listeners.forEach((fn) => fn({ p: gp, stages }));
    if (busy) raf = requestAnimationFrame(tick);
  }

  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', wake);
  addEventListener('load', wake);
  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      wake();
    }, { passive: true });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(wake);
  wake();
})();
