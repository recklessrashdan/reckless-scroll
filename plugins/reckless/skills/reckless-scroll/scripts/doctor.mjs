#!/usr/bin/env node
// Reckless Scroll preflight. Tells you exactly what is missing before a build fails in a confusing way.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function findChrome() {
  const env = process.env.RECKLESS_CHROME;
  if (env && existsSync(env)) return env;
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA || '';
  const list = [
    path.join(pf, 'Google/Chrome/Application/chrome.exe'),
    path.join(pf86, 'Google/Chrome/Application/chrome.exe'),
    path.join(local, 'Google/Chrome/Application/chrome.exe'),
    path.join(pf, 'Microsoft/Edge/Application/msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ];
  return list.find((p) => p && existsSync(p)) || null;
}

const rows = [];
const add = (name, ok, note) => rows.push({ name, ok, note });

function main() {
const major = +process.versions.node.split('.')[0];
add('Node 18+', major >= 18, `found ${process.versions.node}`);

try {
  createRequire(path.resolve('package.json'))('playwright-core');
  add('playwright-core (from this folder)', true, 'resolved');
} catch {
  add('playwright-core (from this folder)', false, 'run: npm i playwright-core   (in the build folder, not globally)');
}

const chrome = findChrome();
add('Chrome or Edge', !!chrome, chrome || 'not found. Install Chrome or set RECKLESS_CHROME to the executable path');

const ff = process.env.RECKLESS_FFMPEG || 'ffmpeg';
const v = spawnSync(ff, ['-hide_banner', '-filters'], { encoding: 'utf8' });
if (v.error) add('ffmpeg (only needed for video/frame work)', false, 'not found. Optional: skip if you build from stills');
else add('ffmpeg has the scale filter', /\bscale\b/.test(v.stdout || ''), /\bscale\b/.test(v.stdout || '') ? 'ok' : 'stripped build: install a full ffmpeg or set RECKLESS_FFMPEG');

let bad = 0;
for (const r of rows) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  ${r.note}`);
  if (!r.ok && !r.name.startsWith('ffmpeg')) bad++;
}
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
