// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kumlin.no',
  // Webflow served every page without a trailing slash (/om-oss) and 301'd
  // /om-oss/ to it. `format: 'file'` emits om-oss.html, which Cloudflare Pages
  // serves at /om-oss and redirects /om-oss/ and /om-oss.html to it — so the
  // canonical URLs stay exactly as indexed.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
