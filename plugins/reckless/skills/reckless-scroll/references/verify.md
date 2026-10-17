# What the audit checks

`node scripts/verify.mjs <folder-or-url> [--steps 80] [--out audit] [--dead 0.75]`

It serves the folder, opens it in Chrome at 1440x900 and at 390x844 (touch), scrolls through `--steps` positions, waits for the engine to settle at each one, and screenshots every position.

| Check | Fails when |
|---|---|
| Dead scroll | identical screenshots span at least `--dead` x the viewport height |
| Cues never full | an element with `data-rs-at` never reaches 0.99 effective opacity |
| Contrast | text is under 4.5:1 (3:1 if large) against the real pixels behind it, sampled with text hidden, using the worst pixel for that line |
| Frames | any frame in a `data-rs-frames` sequence fails to load |
| Sideways overflow | the page scrolls horizontally |
| Console errors | any error or uncaught exception |

Also warns on text under 12px.

## What it cannot tell you
- Whether the page is good. Read `audit/contact.html` and compare it to your beat sheet.
- Whether copy is true. That is on you and the user.
- Real-device performance. Check frame sequences on a mid-range phone if the page leans on film.

## Exit code
0 when clean, 1 when any check failed, 2 when no browser was found. Do not tell the user the page passed unless the exit code was 0.
