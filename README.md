# kumlin.no — Astro

Static Astro rebuild of the Webflow site at https://kumlin.no, hosted on Cloudflare Pages.
Audit findings, URL map and intentional deviations from the Webflow build: [MIGRATION.md](MIGRATION.md).

## Commands

| Command              | What it does                                                             |
| -------------------- | ------------------------------------------------------------------------ |
| `npm run dev`        | Dev server at http://localhost:4321 (no Pages Functions)                 |
| `npm run build`      | Static build to `dist/`                                                  |
| `npm run preview:cf` | Build + run with Wrangler, including `/api/contact` (needs `.dev.vars`)  |
| `npm run check`      | Type-check Astro files and the Pages Function                            |

Node ≥ 22.12. TypeScript is pinned to 6.x because `astro check` does not support TS 7 yet.

## Structure

```
src/
  pages/            one file per URL (format: 'file' → /om-oss, no trailing slash)
    sitemap.xml.ts  /sitemap.xml, generated from the pages above
  layouts/          BaseLayout: <head>, SEO tags, fonts, analytics, header/footer
  components/       SiteHeader, SiteFooter, ContactSection/Form, ArticleList/Card, Icon, SvgSprite
    home/           home-page sections
    about/          /om-oss sections
  content/          articles.json, news.json  (Content Collections, schema in content.config.ts)
  data/site.ts      nav, contact details, people, site constants
  scripts/          nav.ts (mobile menu), reveal.ts (scroll animations), contact-form.ts
  styles/global.css tokens, fonts, type scale, buttons, reveal states
  assets/           images (optimised at build time by astro:assets) and SVG icons
functions/api/contact.ts   Cloudflare Pages Function for the contact form
public/             _redirects, _headers, robots.txt, fonts, favicons, og-image
```

Styling: global tokens and utilities in `global.css` (`t-h1…t-h5`, `t-body…`, `btn--*`), everything else is
component-scoped `<style>`. Breakpoints are the Webflow ones (desktop-first): 991 / 767 / 479 px.

## Editing content

- **Articles** (`/artikler`, three newest on `/`): add an object to `src/content/articles.json`. `order` sets the
  position (the list is curated, not strictly by year). The build fails if a field is missing or malformed.
- **News** (home page): `src/content/news.json`. `image` is optional; if set, `imageAlt` is required.
- **Contact details**: `src/data/site.ts` (footer, /om-oss cards, JSON-LD all read from it).

If non-developers need to edit, add a Git-based CMS (Sveltia CMS or Keystatic) on top of these same JSON
files. No code changes are needed in the templates.

## Contact form

`/api/contact` (Pages Function): origin check → honeypot → validation → Turnstile → email via Resend.

| Variable                    | Where                               | Notes                                                        |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `PUBLIC_TURNSTILE_SITE_KEY` | Pages → Variables (build time)      | Defaults to Cloudflare's always-pass test key if unset       |
| `TURNSTILE_SECRET_KEY`      | Pages → Variables & Secrets (secret)| From Cloudflare dashboard → Turnstile → add site `kumlin.no`  |
| `RESEND_API_KEY`            | secret                              | Resend account; verify the sending domain first              |
| `CONTACT_TO_EMAIL`          | variable                            | Comma-separated recipients                                   |
| `CONTACT_FROM_EMAIL`        | variable                            | e.g. `Kumlin webbplats <webb@kumlin.no>`                     |

For local testing copy `.dev.vars.example` → `.dev.vars` and run `npm run preview:cf`.

Resend domain verification adds DKIM (`resend._domainkey`) and a `send.` subdomain for bounces; the existing
root SPF record (`include:spf.protection.outlook.com …`) does **not** need to change.

## Deploying to Cloudflare Pages

1. Push the repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → select the repo.
3. Build settings: framework preset **Astro**, build command `npm run build`, output directory `dist`.
   Set `NODE_VERSION=22` as an environment variable.
4. Add the variables and secrets above for **Production** (and Preview if you want forms working on preview URLs).
5. Deploy. Every PR gets a preview URL (`<hash>.<project>.pages.dev`), which is where to do the visual QA below.

`_redirects` and `_headers` in `public/` are picked up automatically. `functions/` is deployed as Pages Functions.

## DNS cutover (from Webflow)

Current state (checked 2026-09-26): nameservers `ns01/ns02.one.com`; apex `A 198.202.211.1` (Webflow);
`www CNAME cdn.webflow.com`; **email is Microsoft 365** (`MX kumlin-no.mail.protection.outlook.com`,
SPF and `MS=` TXT records).

A Pages custom domain on the **apex** requires the zone to be on Cloudflare, so:

1. **Before anything else**, export/screenshot every record at one.com (MX, all TXT, any `autodiscover`,
   `_sip`/`_sipfederationtls` SRV, `lyncdiscover`, `enterpriseregistration` CNAMEs for M365).
2. Cloudflare → Add a site → `kumlin.no` (Free plan). Let it scan, then compare against step 1 and add
   anything missing. MX/TXT records must be **DNS only** (grey cloud).
3. Lower TTLs at one.com a day ahead if possible.
4. Change nameservers at the registrar to the two Cloudflare nameservers. Wait for the zone to become Active.
   Email keeps working throughout if step 2 is complete.
5. Pages project → Custom domains → add `kumlin.no` and `www.kumlin.no`. Cloudflare replaces the Webflow
   A/CNAME records with records for Pages.
6. Rules → Redirect Rules → "Redirect from WWW to root" template (301, preserve path and query).
   SSL/TLS → Edge Certificates → enable **Always Use HTTPS**.
7. Only after verification below: in Webflow, unpublish/remove the custom domain, then cancel the site plan.
   Webflow-hosted assets (`cdn.prod.website-files.com`) are no longer referenced by this build.

## Launch verification

```sh
for p in / /om-oss /artikler /kontakt /personvern /sitemap.xml /robots.txt; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://kumlin.no$p"; done
# Expect permanent redirects: 308 for /om-oss/ (Pages' built-in slash handling), 301 for the _redirects rules
for p in /om-oss/ /articles /contact /om /tjenester /hem-1; do
  curl -s -o /dev/null -w "%{http_code} $p -> %{redirect_url}\n" "https://kumlin.no$p"; done
curl -sI http://kumlin.no/ | head -3        # 301 → https
curl -sI https://www.kumlin.no/om-oss | head -3   # 301 → https://kumlin.no/om-oss
```

Then: submit the contact form on production and confirm the email arrives; in Google Search Console,
resubmit `https://kumlin.no/sitemap.xml` and use URL Inspection on each page; check Umami shows visits.
