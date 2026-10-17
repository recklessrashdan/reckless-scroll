# Devices and the engine contract

## What the engine gives you
- `[data-rs-stage]` is a tall box (`--rs-length`, in vh, default 300). Its `.rs-sticky` child stays on screen while you scroll through it.
- `--rs-p` on a stage is progress through that stage (0 to 1). On `<html>` it is progress through the whole page.
- `data-rs-at="a,b"` on any element inside a stage writes `--rs-t` (0 to 1) as stage progress moves from a to b. Pair it with `.rs-fade`, `.rs-rise`, `.rs-wipe`, `.rs-scale`, or your own CSS.
- `data-rs-split` on a plain-text heading assembles it word by word (needs `data-rs-at` too).
- `[data-rs-track]` inside a stage is panned sideways by progress.
- `<canvas data-rs-frames="frames/f%04d.jpg" data-rs-count="120">` scrubs a numbered image sequence (1-based names).
- `--rs-x`, `--rs-y` on `<html>` are the pointer, -1 to 1, on devices with a fine pointer.
- `RecklessScroll.onUpdate(fn)` runs every settled or in-flight update. `RecklessScroll.settled` is true when nothing is still easing.

## The cue contract
1. **Every cue reaches full opacity and holds.** The reader must be able to stop on it. Leave at least 0.12 of stage progress after `b` before the next thing replaces it.
2. **Cues do not overlap in time** unless they are meant to read as one thing.
3. **No dead scroll.** Any stretch of roughly three quarters of a screen height where nothing on screen changes is a bug. Shorten `--rs-length` or add a cue.
4. **Early cues start above zero** (a = 0.05 or more) so the first frame of a stage is stable.

## Recipes
- **Scale-through:** `.rs-scale` on a big element plus `transform-origin` set on the element you fall into.
- **Ground shift:** on `<html>`, interpolate a custom property with `onUpdate` and set it from `p`, or hard-cut with a stage whose background differs.
- **Counter that is real:** only animate a number the user supplied. Never invent one.
- **Pointer lean:** `transform: translate(calc(var(--rs-x) * 1rem), calc(var(--rs-y) * 1rem))`.
- **Film with copy:** canvas absolute behind, text above with `data-rs-at` cues at the film's beats. Verify contrast: film frames change brightness.

## Performance floor
Animate only `transform`, `opacity` and `clip-path`. Keep frame sequences under about 150 frames at 1600px wide, JPEG or WebP. Do not add a second scroll library: the engine is the only scroll listener.
