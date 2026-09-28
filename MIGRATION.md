# Webflow → Astro migration record

Audit of https://kumlin.no (Webflow, last published 2026-08-31), done 2026-09-26 from the live HTML, CSS, JS,
sitemap, redirects, DNS and Playwright measurements at 1440/1200/991/767/479/390 px.

## 1. Inventory

**Pages** (sitemap has exactly these 5; no Webflow CMS collection pages exist):

| URL           | Content                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `/`           | Hero, Nyheter (2), Om oss, Hållbarhet, Fukt i byggprocessen (5), Tjänster (9), Fuktskador i kallt klimat, 3 latest articles, FuktCentrum, SWESIAQ, contact form + map |
| `/om-oss`     | Group header (4 company logos), team (Anders, Elin), contact form + map                          |
| `/artikler`   | 27 article cards linking to PDFs                                                                   |
| `/kontakt`    | Contact form + map                                                                                  |
| `/personvern` | Privacy policy                                                                                       |
| `/404`        | Custom 404 (served with status 200 at `/404` by Webflow)                                           |

**"CMS" content is hard-coded.** No `w-dyn-*` markup anywhere. The 27 articles and 2 news items were static
components; they are now Content Collections (`src/content/*.json`). Article PDFs are hosted on
`kumlin.nettsidetjenester.no/doc-N.pdf` (all 27 return 200), which is the agency's domain, not Webflow's.

**Interactions.** Webflow IX2 is not used (no `ix2` module in the bundle). All motion came from:
- CSS keyframes in embeds: nav slide-down, hero entrance, /om-oss header entrance → ported as CSS.
- `cdn.odyn.dev` script + GSAP/ScrollTrigger: `data-gs-fade`, `data-gs-stagger`, `data-gs-grayscale`, the
  FuktCentrum backdrop slide, and `{…}` → blue `<span>` → ported to `src/scripts/reveal.ts` (IntersectionObserver
  + CSS transitions, same durations/delays/easings) and build-time `<span class="accent">`.
- `w-nav` (jQuery): mobile menu at ≤991 px → `src/scripts/nav.ts`.
Removed: jQuery, webflow.js chunks, GSAP, ScrollTrigger, Odyn, WebFont.js (280 KB of JS, uncompressed). Remaining
JS is ~2 KB inline, plus Turnstile on pages with the form.

**Forms.** One form (home, /om-oss, /kontakt) posting to `webflow.com/api/v1/form/<site>` with Webflow's own
Turnstile key. Fields: name, phone, email, message. Replaced by `functions/api/contact.ts`.

**Integrations kept:** Umami analytics (`analytics.nettsidetjenester.no`, same site ID; now limited to the
`kumlin.no` domain), Google Maps embed, schema.org JSON-LD on `/`.

**Fonts.** Raleway and Open Sans variable woff2, self-hosted (same files Webflow served). Webflow *also* loaded
Open Sans from Google Fonts via WebFont.js, which overrode the self-hosted face. Now self-hosted only, which
also removes the GDPR issue of loading Google Fonts from Google's servers.

## 2. URL map

| Old URL                             | New                   | How                                          |
| ----------------------------------- | --------------------- | -------------------------------------------- |
| `/`, `/om-oss`, `/artikler`, `/kontakt`, `/personvern` | identical | `build.format: 'file'` + `trailingSlash: 'never'` |
| `/om-oss/` (trailing slash)         | `/om-oss`             | Pages built-in (308)                         |
| `/articles`                         | `/artikler`           | `_redirects` 301. **Was a Webflow 301 setting, not visible in HTML** |
| `/contact`                          | `/kontakt`            | `_redirects` 301. Same                       |
| `/om`, `/tjenester`, `/hem-1`       | `/om-oss`, `/#services`, `/` | `_redirects` 301. Pre-Webflow URLs from the Wayback Machine (were 404) |
| `www.kumlin.no/*`                   | `kumlin.no/*`         | Cloudflare Redirect Rule (zone level)        |
| `http://*`                          | `https://*`           | Always Use HTTPS                             |
| `/sitemap.xml`, `/robots.txt`       | same URLs             | `src/pages/sitemap.xml.ts`, `public/robots.txt` |

Added: `<link rel="canonical">` on every page (missing before), `og:url`, `og:locale`.

## 3. Intentional deviations from the Webflow build

Everything else matches the live site within 2 px on all 5 pages at 1440, 1200, 991, 767 and 390 px (plus 479 and
600 px on the home page). Document heights are identical except where a fix below changes them: /artikler
(title wrapping, +56 px at 1200, +26 px at 390) and every page at 991 px (footer fix, −48 px).

Accessibility and correctness fixes:
- `lang="no-NO"` → `sv-SE`. The content is Swedish, so screen readers were using a Norwegian voice.
- Mobile menu on `/`: white links on the pale `#c7d0e2` panel (~1.5:1 contrast) → dark links (as on other pages).
- Hamburger was a `<div>` made interactive by JS → real `<button>` with `aria-expanded`/`aria-controls`; closes on
  Escape, outside click and link click.
- Visible keyboard focus ring (Webflow removed outlines on form fields); skip link added.
- `/kontakt` and `/artikler` had no `<h1>` → their main heading is now `<h1>` (same styling).
- Informative images had empty `alt`: the sustainability Venn diagram, the FuktCentrum and SWESIAQ logos. Company
  logos on /om-oss now use the company name as alt text instead of a Norwegian description of the artwork.
- Map `<iframe>` got a `title`. PDF links announce "(PDF, öppnas i ny flik)" to screen readers and have `rel="noopener"`.
- Semantic lists for news, stages, services, articles, contact links, privacy rights and Elin's skills (visually identical).
- Footer headings are `<h2>` (were `<h3>` after the page's `<h2>`s).
- Form inputs have `autocomplete` (WCAG 1.3.5). The Webflow form was `method="get"`, so without JS it would have put
  personal data in the URL. Now it is a POST.

Visual fixes (small, deliberate):
- Article and service titles used `word-break: break-all`, which split words mid-way ("KLIM / ATANPASSNING").
  Now `overflow-wrap: anywhere` (breaks only a word that cannot fit). A few `/artikler` rows are one line taller.
- Footer at 992–768 px: the long email overflowed its 180 px column and squashed the icons. Now icons keep 24 px
  and the text isn't clipped (page 48 px shorter at that width).
- /om-oss contact cards: text colour follows the link (dark grey → blue on hover). Previously the text stayed black, so
  hover had no visible effect.

Performance:
- Hero image was `loading="lazy"` *and* a CSS background (downloaded twice) → single eager, `fetchpriority="high"` image.
- Images are resized at build time (e.g. the 748 KB stage photo is served at 9–41 KB).
- The 35 KB logo SVG (inlined twice per page) and the document icon (duplicate `id`s ×27) are now one SVG sprite.

## 4. Content issues for the owner (left unchanged)

- Privacy policy numbering skips section 8.
- Privacy policy does not mention the Google Maps embed (sets Google cookies) or Umami analytics.
- Footer's contact column is headed "Navigering" (same as the link column), probably meant to be "Kontakt".
- Form feedback texts are Norwegian ("Takk! Innsendingen din er mottatt!", "Vent litt …", "Ups! Noe gikk galt…")
  while the form is Swedish. The /om-oss meta description, the 404 text and several image alt texts are also Norwegian.
- Typos: "hållbar byggnader", "byggander" (Hållbarhet), "Kraver att byggnaden ar fuktsäker" (in the Venn image),
  "Peter Carlsson," trailing comma (article 17 authors).
- News item says "Byggstenen 2024", while /om-oss says Anders received it in 2025.
- Contrast below WCAG AA for small text: muted `#c7d1e8` on blue `#375eba` (≈3.9:1) in the hero lead and footer.
  It's a brand choice; a slightly lighter tint (e.g. `#dfe5f3`) would pass.
