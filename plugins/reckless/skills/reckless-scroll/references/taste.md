# The design floor

These are floors, not a style. Break one only with a written reason.

## Type
- Two families maximum. If two, make them clearly different. Name them for this subject, not your usual defaults.
- Tracking tightens as size grows: roughly -0.03em on display, -0.01em on large text, 0 on body.
- Measure 45 to 75 characters. Shorter measure gets slightly more line height.
- Display line height 0.9 to 1.05, body 1.5 to 1.7. Light text on dark gets +0.05 line height, +0.01em tracking, and one weight step lighter than you think.
- The headline must fit on a 390px screen in four lines or fewer.
- Do not accent a single word in a headline. Do not set small labels in tracked ALL CAPS by reflex.

## Spacing
- 4px base unit. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- More space above a heading than below it. Section padding is fluid (`clamp()`), so a phone does not inherit desktop air.

## Colour
- Six roles: ground, surface, ink, mute, line, accent. One accent. Secondary text is tinted toward the ground, not flat grey.
- No pure `#000` or `#fff` text on a large field. Body text 4.5:1 minimum, large text 3:1, measured on the composited page.
- If the page hard-cuts between light and dark grounds, define the roles twice and swap the whole set, never a few colours.

## Depth
Use at most two of: offset shadow, edge light, scale-and-blur as distance, overlap, grain. A soft grey drop shadow under every card is not depth.

## Motion
- Motion earns its place by explaining something: progress, change, cause. Decoration fades.
- No fade-and-slide-up on every section. Pick the acts where motion matters and keep the rest still.
- Reduced motion shows everything, in order, readable.

## Copy
- Words are design content. Say what the thing is and does in plain verbs. Sentence case.
- No filler lines, no invented numbers, no fake quotes, no em dashes.
