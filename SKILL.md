---
name: reckless-scroll
description: Build premium scroll-driven websites (pinned stories, horizontal rails, frame-scrubbed film, word-by-word headlines, pointer-reactive moves) that take real design risks and then pass a browser audit. Use when the user asks for a scrollytelling site, an immersive or scroll-animated landing page, a scroll-driven product page, or invokes reckless scroll.
---

# Reckless Scroll

Reckless on the surface, rigorous underneath. The page may do something bold. It may not have unreadable text, dead scroll, or a layout that breaks on a phone. You prove that in a real browser before you say you are done.

Created by recklessplyer. MIT. `<skill>` below means the folder this SKILL.md lives in (for example `~/.claude/skills/reckless-scroll`).

## The rules that outrank everything else

1. **The engine is never edited per project.** `engine/reckless-scroll.js` and `.css` are copied in as-is. Theme with CSS on top. Anything bespoke is driven off the custom properties the engine publishes (`--rs-p`, `--rs-t`, `--rs-x`, `--rs-y`) or `RecklessScroll.onUpdate(fn)`.
2. **Three risks, no more.** Every build spends a fixed risk budget (step 2). Everything outside the budget is disciplined on purpose.
3. **One peak.** One act gets the asset budget, the longest scroll, and silence in front of it.
4. **Nothing ships unaudited.** `scripts/verify.mjs` must run clean on desktop and mobile, then you read the contact sheet.
5. **The user's brand rules beat this skill.** If they supply a brand kit, its hard rules win, even over the refuse list.

## Procedure

### 0. Preflight
Run `node <skill>/scripts/doctor.mjs` from the build folder. Fix what it reports before anything else. If `playwright-core` is missing: `npm i playwright-core` in the build folder. ffmpeg is only needed for video or frame work.

### 1. Brief
Ask at most five questions, in one message, skipping anything already answered: what is the thing, who is it for, what single feeling should the visitor leave with, which assets exist (photos, footage, logo, copy), and any brand rules. If assets are missing, say what you will do instead (typography, CSS shapes, generated stills) rather than blocking.

### 2. Risk budget
Pick exactly three from this menu and write them down. Anything not picked is forbidden for this build.

- Hard cut to an inverted ground mid-page
- Scale-through transition (the camera "falls into" an element)
- Pointer-driven distortion or lean
- Frame-scrubbed film under the wheel
- Type takeover (a headline larger than the viewport, cropped on purpose)
- Horizontal rail that hijacks vertical scroll
- A page with no visible section boundaries
- A close that is not a button

### 3. Beat sheet
One row per act, before any code: **feeling** (a single word), **cause** (what on screen produces it), **scroll length** (in vh). Two adjacent acts with the same feeling means one is filler: cut or merge. Mark exactly one row PEAK. Four to six acts total.

### 4. Pick a stage mode
Read `references/modes.md`. Choose one mode per page and say why it fits the subject. Then run the **echo check**: open `RECKLESS.md` in the workspace (create it from the table in `references/modes.md` if absent). The new build must differ from every earlier row in at least 3 of 5 columns: mode, navigation, hero, ending, signature move. If it does not, change the plan, never the record.

### 5. Signature move
Invent one interaction that exists on this site alone. Apply the delete test: if you removed it, would this site be interchangeable with another? If yes, it is not a signature move. A recoloured spotlight does not count.

### 6. Build
- Start from `templates/starter.html`. Copy the engine files beside it.
- Semantic HTML first. Headings in order, real `<a>` and `<button>`, alt text, visible focus.
- Follow `references/taste.md` for type, spacing, colour and depth. Follow `references/devices.md` for cues and the engine contract.
- Mobile is designed, not inherited: check the headline at 390px wide before anything else.
- Respect `prefers-reduced-motion` (the engine does the heavy lifting, do not undo it).
- Real copy only. If you do not have content, say so and use plainly marked placeholders. Never invent statistics, testimonials, or logos.

### 7. Audit
Serve and verify:
```
node <skill>/scripts/verify.mjs . --out audit
```
Fix every FAIL, rerun until clean. Then open `audit/contact.html` and answer, in writing: does the feeling curve from step 3 actually show up, is the peak the strongest frame, is the ending quiet enough? A machine can prove the page works. Only you can say whether it means anything.

### 8. Log
Append the build to `RECKLESS.md` (name, mode, navigation, hero, ending, signature move). Report to the user: what was built, the three risks taken, anything you assumed, and the audit result. Do not claim the audit passed if you could not run it.

## Refuse list
Identical three-card feature grids. `01 / 06` counters on content that is not a sequence. "Scroll down" cues. Gradient text. Em dashes in copy. Invented stats. Fake dashboards. Purple-to-blue AI gradients. Cream background with a serif and a terracotta accent. A fade-and-slide-up on every section. Anything that makes the page look like every other generated page.

## Files
- `references/modes.md`: the five stage modes, the echo-check ledger
- `references/devices.md`: engine contract, cue timing, recipes
- `references/taste.md`: the design floor
- `references/verify.md`: what the audit checks and what it cannot
- `engine/`: the mechanism. `templates/starter.html`: a skeleton, not a layout
- `scripts/`: `doctor`, `serve`, `verify`
