# UI/UX Audit — the design milestone

Audited 2026-11-11 against the UI/UX specification (sections 01–71) and the follow-up
request for "more images as per the categories". Every status below was checked against
the built site in a real browser (headless Chromium, production build), not assumed.

**Status key:** DONE · PARTIAL · BLOCKED (waiting on content or a postponed backend) ·
NOT IMPLEMENTED

## Summary

| Area | Requirement | Status | Evidence | Remaining |
|---|---|---|---|---|
| Homepage | Ten-chapter story: entry → Triyan → words → archive → book → Instagram → ABYSS → about → contact → exit | DONE | `features/home/*`; screenshots at 390 and 1440, dark and light | Looks its best only once real writing is published |
| Navigation | Minimal wordmark + mono line; transparent at top, darker layer on scroll; full-screen mobile chapter menu | DONE | `site-header.tsx`; E2E: mobile menu navigates; 9 widths | — |
| Writings | Giant heading, minimal search, editorial filters, numbered rows, mobile blocks, pagination, loading/empty/error | DONE | `writings/page.tsx`, `writing-row.tsx`, `shelf-strip.tsx`, `loading.tsx`; E2E: search + filter | Theme and emotion filters exist in the API but have no UI |
| Writing reader | Quiet room: category, title, space, poem at ~610px, share, themes, previous/next, related | DONE | `writings/[slug]/page.tsx`; E2E: whitespace preserved | Previous/next looks at the newest 60 writings only |
| About | Name, writer/poet, portrait, identity, literary timeline, themes, philosophy, current work | DONE (UI) · BLOCKED (portrait) | `about/page.tsx` | No portrait supplied: an honest "Portrait to be added" space |
| Book | Cover hero, why the book exists, excerpts, reviews, buy | DONE (UI) · BLOCKED (cover, excerpts, reviews) | `book/page.tsx` | Each missing piece shows a designed "to be added" state; nothing is invented |
| Instagram | Opening, editorial rhythm grid (feature + two), filters, detail page | DONE (UI) | `instagram-grid.tsx`, `instagram/*`; E2E: filter, pagination, original link | Tested with labelled mock posts only; real images untested |
| ABYSS | Separate world (always night), manifesto, clothing direction, future, waitlist | DONE | `abyss/page.tsx`, `features/abyss/*` | Waitlist is live (email + explicit consent, stored once, CSV export in the admin). No product imagery: a labelled silhouette study only |
| Contact | Quiet statement, channels, minimal form with all states | DONE | `contact/page.tsx`, `contact-form.tsx` + tests | Messages go to the admin inbox (`/admin/inbox`); no email forwarding yet |
| Footer | End of the journey, not a sitemap | DONE | `site-footer.tsx` | — |
| Category imagery | One original image per category, used across the site | DONE | `components/art/*`, 13 tests | Abstract artwork, not photography; replace with Triyan's photos when available (`CategoryPlate src`) |
| Responsive | 320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 | DONE | E2E: 13 routes × 9 widths, no horizontal overflow, one `h1` each | Spot-checked visually at 320, 375, 390 and 1440 only |
| Typography | Display / literary / mono roles; poems untouched | DONE | `fonts.ts` (adds Geist Mono), tokens | — |
| Dark / light | Both deliberate, monochrome, not inverted | DONE | `tokens.css`; contrast tests pass in both | — |
| Motion | Slow, intentional; text, blur and clip reveals; page and menu transitions; no scroll hijacking | DONE | `globals.css`, `reveal.tsx`, `split-text.tsx`; E2E: nothing left invisible under reduced motion | Hover motion can't be seen in headless Chrome; check on a real desktop |
| Cursor | Point; ring on links; READ on writing; VIEW on images; subtle nav expansion; off on touch | DONE | `cursor.tsx`; browser check of every state | — |
| Accessibility | Semantic HTML, focus, labels, alt text, reduced motion, touch, no hover dependency | PARTIAL | E2E: focus visible, skip link, reduced motion; decorative art hidden, standalone art described | No axe audit, no real screen-reader pass |
| Performance | Lazy, code-split, efficient | PARTIAL | First-load JS: home 145 KB gz (unchanged); HTML: home 26 KB gz, Instagram 22 KB gz | Measured locally only; no throttled mobile Lighthouse run |

## What changed in this milestone

### Design system
- **Palette** moved to the strict §04 monochrome in both themes: night is `#000` with
  off-white ink; day is near-black ink on `#E8E6E1`. The old sepia accent and warm-beige
  paper are gone. `--ember` survives only for error states. All contrast pairs pass in
  both themes.
- **Mono register** added (Geist Mono) for dates, categories, numbering, labels and nav.
- **Primitives:** `SectionIntro` ("03 — WORDS"), `Label`, `ArrowLink` (the site's only
  call to action), `ContentPending` (the honest empty state), reveal variants
  (rise / clip / blur).
- Buttons and fields lost their rounded boxes: underline fields, mono labels.

### Category imagery (the request for more images)
- Eight original monochrome artworks drawn in code, one per category: two lights that
  never meet; an empty lit doorway; rain into still water; one figure in a vast field;
  an eclipse shedding dust; a fracture of light; a receding crowd with one brighter mark;
  rings on dark water beneath a moon.
- They follow the theme, carry film grain, and on hover come closer (rain falls, dust
  turns).
- Where they appear: the homepage archive wall; the archive's shelf filter and category
  band; the words-wall hover panel; the reading-page band; behind text-only Instagram
  posts; Book's related shelves; the 404 page.
- They are never presented as Triyan's photographs or as a post's own image.

### Pages
Every public page was recomposed: asymmetric 12-column layouts on a 1440px canvas,
large negative space, display type for identity, reading type for words, mono for facts.

### Honesty fix (backend touched, deliberately)
The contact API **logged each message and discarded it**, while the form told visitors
"Triyan reads everything that arrives here". Now:
- `/settings` reports `contactDelivery: "NONE"`.
- The contact page shows the form closed, with a plain note pointing visitors to
  Instagram.
- If a message is ever sent while delivery is unavailable, the form says it was **not**
  delivered.

This was the only backend change, and it was needed to stop the site making a false
claim.

### Removed
- The sepia accent and the beige "manuscript" paper.
- Rounded buttons and boxed inputs.
- The text-only category filter, replaced by the visual shelves.
- The "Triyan reads everything" success message.
- `post-tile.tsx`, replaced by the editorial `InstagramGrid`.

## Defects found during visual QA, all fixed

1. **Clip reveals never fired.** The observed element was clipped to nothing, so
   IntersectionObserver never saw it. The clip now applies to its children.
2. **The reading page inherited the archive's loading skeleton**, so it would flash
   "WRITINGS" before a poem. It now has its own quiet skeleton.
3. **Inlined artwork bloated the HTML** (Instagram page 139 KB gz). Strokes were merged
   into a few paths per opacity bucket: now 22 KB gz.
4. **Two font families competed on "ABYSS" in the mobile menu.** One class is now chosen
   explicitly.
5. **The swipeable shelf strip ignored the side gutter** when snapping. Added
   scroll-padding.
6. **The footer repeated About's philosophy line** right below it. The footer now ends
   on the mark.

## Backend work intentionally postponed (§67)
- Waitlist storage (UI built; closed until an endpoint exists).
- Email transport for the contact form.
- Real Instagram sync (still blocked on Meta credentials; see `docs/INSTAGRAM.md`).
- UI for theme and emotion filters.

## Verification
| Check | Result |
|---|---|
| `npm run verify` (lint, typecheck, test, build) | Pass |
| Tests | **546 passing** (shared 163 · client 138 · server 245) |
| `npm run e2e:browser` (production build) | 28 / 28 checks pass, 0 failures |
| Overflow and headings | 13 routes × 9 widths, all clean |

## Update — owner questionnaire applied (2026-11-11)

Triyan's own answers replaced or tightened the copy across the site.

**Content now on the site**
- **About** is in the first person: who Triyan is, why the writing began, what forms it
  takes, the journey, and the larger vision.
- **About** adds "For the reader" and the line to remember. The themes follow
  Triyan's own list and order.
- **Homepage:** while nothing is published, the words wall shows Triyan's favourite
  pieces as labelled working titles, not links. The exit ends on "words can contain
  entire worlds…".
- **Book:** adds the inspiration and "the beginning rather than the conclusion".
- **ABYSS:** adds why it exists, what makes it different, who it is for, the feeling it
  should give, and the wider ventures.

**Behaviour changes**
- **Book:** the Amazon link was removed. The owner now lists Amazon availability as
  "to be confirmed", so the site says "availability to be announced".
- **Waitlist** (owner wants pre-launch registration): `POST /waitlist` stores an
  address once, with explicit consent. The admin can view it and export it as CSV.
- **Contact** (owner wants direct contact, no email yet): messages are stored in an
  admin inbox with read and delete. `contactDelivery` is `INBOX`, so the form is open
  and every message actually arrives.
- **Instagram** is curated first. Featured posts lead the homepage and a "Selected"
  section on `/instagram`; the latest posts appear only when none are featured.
- **Contact:** @triyxnn was removed. The owner lists only @triyanwrites as public.

**Deliberately not used**
- "Since I was 10": it would publish a birth year, against the owner's request for no
  unnecessary personal information.
- Follower and view counts: the owner does not want to be presented as a social media
  poet.
  (Later the owner supplied a bio for About that mentions 65,000 followers in their own
  words; it is shown beneath the portrait exactly as given.)
- Working titles are kept exactly as written, including "alot".

**Also fixed**
- Display names wrapped at some widths ("TRI / YAN" on About at 1280px, ABYSS at
  320px). Split-letter headings now never break inside a word.

**Verification:** 561 tests pass. 72 page/width combinations checked with no overflow
and one `h1` each. Waitlist sign-up → admin and contact message → admin inbox both
verified in a real browser.

## Update — black-hole background, Aquiline Two, theme switch (2026-11-11)

- **Black hole as a living background, not a loading screen.** The intro was removed.
  The same shader now runs behind the homepage "Welcome to Abyss" opening and the
  ABYSS page hero. "Abyss" sits inside the shadow; the type is laid out in units of
  the hole's radius so it lands in the same place on every screen.
- **Animation, deliberately irregular.** The disk turns and breathes; flares run
  through it at random moments. A light travels round the photon ring. Lensed stars
  twinkle and drift. Random sparkles pop across the sky, and shooting stars arrive at
  irregular times, directions and speeds. Glittering stars spiral in and vanish at the
  shadow (random turns, tilts and brightness), and glints orbit in the disk plane. The
  camera drifts and rolls, follows the pointer for parallax, and scrolling draws the
  viewer into the hole while the opening's words fade.
- **Restraint:**
  - It pauses off screen and in background tabs.
  - Reduced motion gets one still frame.
  - Without WebGL, or on very modest devices, a 64 KB still image is shown instead
    (fetched only then).
  - Three.js was removed entirely. The old star field is gone, and the shader needs no
    library.
- **Aquiline Two** (Manfred Klein + CybaPee; DaFont "100% Free"; fsType 0) is the
  ABYSS wordmark. It is subset to Latin and served as WOFF2 (200 KB → 36 KB). A script
  face reads best in title case, so the mark is set as "Abyss" wherever this font is
  used, with room left for its swashes.
- **Day/night switch.** The text link became a real switch (`role="switch"`, "Night
  mode"): a sliding knob between a sun and a moon. It appears in the desktop header,
  the phone header and the menu.
- **Bundle:** the homepage is 152 KB gz first load. The waitlist dropped its zod import
  (the API still validates), taking `/abyss` from 186 to 153 KB.
- **Verification:** 569 tests pass. Browser E2E passes, including "black hole behind
  the opening (animated)", the switch, and 13 routes × 9 widths.

## Update — the owner's front-page image as the opening (2026-11-11)

- **The opening's backdrop is now the owner's own image** (`frontpage.png`), not a
  drawing of it. The original is only 533 × 346, so it was prepared once, offline:
  - the light screenshot border was trimmed;
  - it was rotated 10.4° so the disk lies level (it crops cleanly at any aspect ratio);
  - it was centred on the hole and enlarged 3× (Lanczos, light sharpening);
  - the corners the rotation exposed were filled by mirroring the sky.
  The colours are untouched. It is `public/images/abyss-front.jpg` (1560 × 1000,
  137 KB), served through `next/image` as AVIF/WebP, preloaded, with a `sizes` hint
  that accounts for tall phone screens.
- **The effects run on top of it.** The black-hole shader gained an overlay mode that
  draws only the living layers, screen-blended so they only add light:
  - twinkling lensed stars, sparkles and shooting stars;
  - glittering stars that spiral in and vanish at the shadow, and glints orbiting in
    the disk plane;
  - a light running round the upper rim of the shadow;
  - an occasional flare along the disk.
  The shader is sized to the hole in the photo (cover-fit, radius 146 image px), so
  the stars vanish exactly at its edge.
- **"abyss" sits in the middle of the hole.** "Welcome to" is above the arch and
  "Triyan Writes" below the lower arc, all in units of the hole's radius as displayed.
- **Scrolling** zooms the photo with the stars (the same `--bh-zoom`) into the shadow,
  then the line "A soul is deeper than the abyss…" appears in the dark.
- **Without WebGL, or under reduced motion,** the photo stands alone (reduced motion
  gets one still frame of the effects).
- **Unchanged:**
  - The ABYSS page keeps the drawn black hole, in the front-page colours.
  - The wordmark is lowercase "abyss", as in the owner's logo, which is also the site
    icon.
- **Caveat:** the source is small. It holds up as a background, but a higher-resolution
  original would be sharper on large screens, and dropping it in is a one-file swap.
- **Verification:** 573 tests pass. Browser E2E passes 31/31, including the new
  "front-page image behind the opening".
