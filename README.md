# reckless scroll

**A Claude Code skill for scroll-driven websites that take real risks on the surface and stay rigorous underneath.**

Made by **recklessplyer**. MIT.

Most generated scroll sites are either safe and forgettable, or flashy with unreadable text and dead scroll. Reckless Scroll spends a fixed **risk budget** (three bold moves per build), engineers **one peak**, and then **audits itself in a real browser** before it calls the page done.

## What it does

- **Scroll is the timeline.** Pinned stories, a horizontal rail, frame-scrubbed film, word-by-word headlines, pointer-reactive moves, all driven by one small engine that publishes progress as CSS variables.
- **Risk budget.** Pick exactly three from a menu. Everything else is disciplined on purpose.
- **Beat sheet first.** One line per act: the feeling, then what on screen causes it. Two neighbours with the same feeling means one is filler.
- **Five stage modes** that each forbid something, plus an **echo check** so a new build differs from your earlier ones in at least 3 of 5 columns.
- **A signature move** on every build, with a delete test.
- **A design floor** for type, spacing, colour, depth and motion, and a refuse list of the usual AI tells.
- **A self-audit.** A headless browser scrolls the finished page and reports dead scroll, cues that never reach full opacity, contrast measured on the composited page, frames that never decoded, sideways overflow and console errors, then writes a contact sheet.

## Install (Claude Code)

Push this folder to GitHub as `recklessplyer/reckless-scroll` (or edit the path below), then:

```
/plugin marketplace add recklessplyer/reckless-scroll
/plugin install reckless@reckless-scroll
```

Use it by describing what you want, or invoke it directly:

```
/reckless:reckless-scroll
```

To try it without installing:

```
claude --plugin-dir ./plugins/reckless
```

## First run

```
node plugins/reckless/skills/reckless-scroll/scripts/doctor.mjs
```

| Needs | Why |
|---|---|
| Node 18+ | every script |
| `playwright-core` | the audit. `npm i playwright-core` in the build folder |
| Chrome or Edge | the audit. Override with `RECKLESS_CHROME` |
| ffmpeg (full build) | only for turning video into scrub frames. Override with `RECKLESS_FFMPEG` |

## Layout

```
plugins/reckless/
├── .claude-plugin/plugin.json
└── skills/reckless-scroll/
    ├── SKILL.md               procedure: brief, risk budget, beat sheet, mode, signature, build, audit, log
    ├── references/            modes, devices, taste, verify
    ├── engine/                reckless-scroll.js + .css. Never edited per project
    ├── templates/starter.html a skeleton, not a layout
    └── scripts/               doctor, serve, verify
```

## The one rule that matters most

The engine is the mechanism and is never edited per project. Theme it with colour tokens and two fonts, write your own semantic HTML, and drive anything bespoke off `--rs-p`, `--rs-t`, `--rs-x` and `--rs-y`.

## Honest limitations

- v0.1. The engine and scripts are syntax-checked, but the audit has not been run against a real Chrome yet. Run it once on the starter template and fix anything it flags.
- No asset generation is bundled. Bring your own photos and footage, or build type-led.
- It is opinionated on purpose and will argue with you about your peak.
