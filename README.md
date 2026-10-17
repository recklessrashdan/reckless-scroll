# reckless scroll

**A Claude skill for scroll-driven websites that take real risks on the surface and stay rigorous underneath.**

Made by **recklessplyer** ([github.com/recklessrashdan](https://github.com/recklessrashdan)). MIT.

Most generated scroll sites are either safe and forgettable, or flashy with unreadable text and dead scroll. Reckless Scroll spends a fixed **risk budget** (three bold moves per build), engineers **one peak**, and then **audits itself in a real browser** before it calls the page done.

## Add it to Claude

This repo *is* the skill: `SKILL.md` sits at the root.

**Claude Code, all your projects (one command):**

```
git clone https://github.com/recklessrashdan/reckless-scroll ~/.claude/skills/reckless-scroll
```

On Windows (Command Prompt):

```
git clone https://github.com/recklessrashdan/reckless-scroll "%USERPROFILE%\.claude\skills\reckless-scroll"
```

**Claude Code, one project only:** clone into `<your-project>/.claude/skills/reckless-scroll` instead.

**No git:** download the ZIP from GitHub, unzip, and put the folder at `~/.claude/skills/reckless-scroll` so that `SKILL.md` is directly inside it.

**Claude.ai (web or app):** zip the folder so `reckless-scroll/SKILL.md` is inside the zip, then Settings, Capabilities, Skills, upload.

Restart Claude Code if it was open. Then describe what you want ("build me a scroll-driven site for...") or run `/reckless-scroll`.

To update later: `git pull` inside the skill folder.

## What it does

- **Scroll is the timeline.** Pinned stories, a horizontal rail, frame-scrubbed film, word-by-word headlines, pointer-reactive moves, all driven by one small engine that publishes progress as CSS variables.
- **Risk budget.** Pick exactly three from a menu. Everything else is disciplined on purpose.
- **Beat sheet first.** One line per act: the feeling, then what on screen causes it.
- **Five stage modes** plus an **echo check** so a new build differs from your earlier ones in at least 3 of 5 columns.
- **A signature move** on every build, with a delete test.
- **A design floor** for type, spacing, colour, depth and motion, and a refuse list of the usual AI tells.
- **A self-audit.** A headless browser scrolls the finished page and reports dead scroll, cues that never reach full opacity, contrast on the composited page, failed frames, sideways overflow and console errors, then writes a contact sheet.

## First run (needed for the audit)

In the folder where you build a site:

```
npm i playwright-core
node ~/.claude/skills/reckless-scroll/scripts/doctor.mjs
```

| Needs | Why |
|---|---|
| Node 18+ | every script |
| `playwright-core` | the audit |
| Chrome or Edge | the audit. Override with `RECKLESS_CHROME` |
| ffmpeg (full build) | only for turning video into scrub frames. Override with `RECKLESS_FFMPEG` |

## Layout

```
SKILL.md               procedure: brief, risk budget, beat sheet, mode, signature, build, audit, log
references/            modes, devices, taste, verify
engine/                reckless-scroll.js + .css. Never edited per project
templates/starter.html a skeleton, not a layout
scripts/               doctor, serve, verify
```

## Honest limitations

- v0.1. The engine and scripts are syntax-checked, but the audit has not been run against a real Chrome yet. Run it once on the starter template and fix anything it flags.
- No asset generation is bundled. Bring your own photos and footage, or build type-led.
- It is opinionated on purpose and will argue with you about your peak.
