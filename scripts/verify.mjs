#!/usr/bin/env node
// Reckless Scroll audit. Walks a finished page at every scroll position in a real browser.
//   node verify.mjs <build-folder-or-url> [--steps 80] [--out audit] [--dead 0.75]
// Reports: dead scroll, cues that never reach full opacity, contrast on the composited page,
// frames that never decoded, sideways overflow, console errors, tiny text. Writes contact.html.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';
import { findChrome } from './doctor.mjs';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--')) || '.';
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const STEPS = +opt('steps', 80), OUT = path.resolve(opt('out', 'audit')), DEAD = +opt('dead', 0.75), CONTRAST_EVERY = 5;

const { chromium } = createRequire(path.resolve('package.json'))('playwright-core');
const chrome = findChrome();
if (!chrome) { console.error('No Chrome or Edge found. Run doctor.mjs.'); process.exit(2); }

let url = target, srv = null;
if (!/^https?:/.test(target)) { srv = await serve(target); url = `http://127.0.0.1:${srv.port}/`; }

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const report = { url, steps: STEPS, viewports: {} };
let failures = 0;

for (const vp of VIEWPORTS) {
  const dir = path.join(OUT, vp.name);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const hashes = [], ys = [], contrast = [], small = new Set();
  const cueMax = new Map();

  for (let i = 0; i <= STEPS; i++) {
    const y = Math.round((i / STEPS) * total);
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForFunction(() => !window.RecklessScroll || window.RecklessScroll.settled, null, { timeout: 6000 }).catch(() => {});
    const shot = await page.screenshot({ type: 'jpeg', quality: 70 });
    fs.writeFileSync(path.join(dir, `step-${String(i).padStart(3, '0')}.jpg`), shot);
    hashes.push(crypto.createHash('sha1').update(shot).digest('hex'));
    ys.push(y);

    const cues = await page.evaluate(() => [...document.querySelectorAll('[data-rs-at]')].map((el, k) => {
      let o = 1; for (let n = el; n; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      return [k, (el.id || el.className || el.tagName) + '', o];
    }));
    for (const [k, label, o] of cues) { const prev = cueMax.get(k) || { label, o: 0 }; prev.o = Math.max(prev.o, o); cueMax.set(k, prev); }

    if (i % CONTRAST_EVERY === 0) contrast.push(...(await sampleContrast(page, y)));
    const tiny = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.textContent.trim().slice(0, 40)));
    tiny.forEach((t) => small.add(t));
  }

  /* dead scroll: identical frames across a long stretch */
  const dead = [];
  let run = 0;
  for (let i = 1; i <= STEPS; i++) {
    if (hashes[i] === hashes[i - 1]) run++;
    else { if (run && (ys[i - 1] - ys[i - 1 - run]) >= DEAD * vp.height) dead.push([ys[i - 1 - run], ys[i - 1]]); run = 0; }
  }
  if (run && (ys[STEPS] - ys[STEPS - run]) >= DEAD * vp.height) dead.push([ys[STEPS - run], ys[STEPS]]);

  const dim = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > innerWidth + 1, rs: window.RecklessScroll ? window.RecklessScroll.report() : null }));
  const dim_cues = [...cueMax.values()].filter((c) => c.o < 0.99).map((c) => `${c.label} (peak opacity ${c.o.toFixed(2)})`);
  const lowContrast = dedupe(contrast.filter((c) => c.ratio < c.need)).slice(0, 25);
  const framesFailed = dim.rs ? dim.rs.stages.reduce((n, s) => n + s.framesFailed, 0) : 0;

  const res = { deadScroll: dead, cuesNeverFull: dim_cues, lowContrast, framesFailed, overflowX: dim.overflowX, consoleErrors: errors, tinyText: [...small].slice(0, 10) };
  report.viewports[vp.name] = res;
  failures += dead.length + dim_cues.length + lowContrast.length + framesFailed + (dim.overflowX ? 1 : 0) + errors.length;
  await ctx.close();
}
await browser.close();
if (srv) srv.server.close();

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
writeContactSheet();
printSummary();
process.exit(failures ? 1 : 0);

/* ---------- helpers ---------- */

function dedupe(list) {
  const seen = new Set();
  return list.filter((c) => { const k = c.text + Math.round(c.ratio * 10); if (seen.has(k)) return false; seen.add(k); return true; });
}

/* Contrast on the composited page: hide all text, screenshot, sample what is really behind each line. */
async function sampleContrast(page, y) {
  const items = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    for (let el = walker.currentNode; el; el = walker.nextNode()) {
      if (!el || ['SCRIPT', 'STYLE', 'CANVAS', 'VIDEO'].includes(el.tagName)) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      let o = 1; for (let n = el; n; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      if (o < 0.05) continue; /* not cued yet: the cue check covers it */
      const m = cs.color.match(/[\d.]+/g).map(Number);
      const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
      out.push({ text: el.textContent.trim().slice(0, 40), rect: [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)], fg: m.slice(0, 3), a: (m[3] ?? 1) * o, need: size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5 });
    }
    return out;
  });
  if (!items.length) return [];
  await page.addStyleTag({ content: '*{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important}' });
  const bare = (await page.screenshot({ type: 'png' })).toString('base64');
  await page.evaluate(() => { const s = [...document.querySelectorAll('style')].pop(); if (s && s.textContent.includes('text-fill-color:transparent')) s.remove(); });
  return page.evaluate(async ({ items, bare }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + bare; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const lum = ([r, gg, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
    return items.map((it) => {
      const [l, t, r, b] = it.rect.map(Math.round);
      const w = Math.max(1, r - l), h = Math.max(1, b - t);
      const d = g.getImageData(l, t, w, h).data;
      let sum = [0, 0, 0], n = 0, lo = 2, hi = -1, loC = null, hiC = null;
      for (let i = 0; i < d.length; i += 4 * Math.max(1, Math.floor(d.length / 4 / 400))) {
        const px = [d[i], d[i + 1], d[i + 2]]; const L = lum(px);
        sum = sum.map((s, k) => s + px[k]); n++;
        if (L < lo) { lo = L; loC = px; } if (L > hi) { hi = L; hiC = px; }
      }
      const mean = sum.map((s) => s / n);
      const fg = it.fg.map((v, k) => v * it.a + mean[k] * (1 - it.a));
      const Lf = lum(fg);
      const worst = Lf > lum(mean) ? hiC : loC; /* light text suffers on the brightest pixel, dark text on the darkest */
      const Lb = lum(worst);
      const ratio = (Math.max(Lf, Lb) + 0.05) / (Math.min(Lf, Lb) + 0.05);
      return { text: it.text, ratio: +ratio.toFixed(2), need: it.need };
    });
  }, { items, bare });
}

function writeContactSheet() {
  let html = '<!doctype html><meta charset="utf-8"><title>Reckless Scroll contact sheet</title><style>body{font:14px system-ui;margin:24px;background:#eee;color:#111}h2{margin:32px 0 8px}.g{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}.g img{width:100%;display:block;border:1px solid #bbb}.m .g{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}</style><h1>Contact sheet</h1><p>A machine can prove the page works. It cannot tell you the page means anything. Read this top to bottom and check the feeling curve.</p>';
  for (const vp of VIEWPORTS) {
    html += `<section class="${vp.name === 'mobile' ? 'm' : ''}"><h2>${vp.name}</h2><div class="g">`;
    for (let i = 0; i <= STEPS; i += Math.max(1, Math.round(STEPS / 16))) html += `<img loading="lazy" src="${vp.name}/step-${String(i).padStart(3, '0')}.jpg" alt="step ${i}">`;
    html += '</div></section>';
  }
  fs.writeFileSync(path.join(OUT, 'contact.html'), html);
}

function printSummary() {
  for (const [name, r] of Object.entries(report.viewports)) {
    console.log(`\n== ${name} ==`);
    console.log(r.deadScroll.length ? `FAIL dead scroll: ${r.deadScroll.map((d) => `${d[0]}-${d[1]}px`).join(', ')}` : 'PASS dead scroll');
    console.log(r.cuesNeverFull.length ? `FAIL cues never reach full opacity:\n  ${r.cuesNeverFull.join('\n  ')}` : 'PASS every cue reaches full opacity');
    console.log(r.lowContrast.length ? `FAIL contrast:\n  ${r.lowContrast.map((c) => `${c.ratio}:1 (needs ${c.need}) "${c.text}"`).join('\n  ')}` : 'PASS contrast on composited page');
    console.log(r.framesFailed ? `FAIL ${r.framesFailed} frame(s) never decoded` : 'PASS frames');
    console.log(r.overflowX ? 'FAIL page scrolls sideways' : 'PASS no sideways overflow');
    console.log(r.consoleErrors.length ? `FAIL console errors:\n  ${r.consoleErrors.join('\n  ')}` : 'PASS console clean');
    if (r.tinyText.length) console.log(`WARN text under 12px: ${r.tinyText.join(' | ')}`);
  }
  console.log(`\nWrote ${path.join(OUT, 'contact.html')} and report.json. Now read the contact sheet.`);
}
