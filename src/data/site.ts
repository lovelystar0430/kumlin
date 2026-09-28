/** Site-wide content shared by the header, footer, contact sections and structured data. */

export const SITE = {
  name: 'Kumlin',
  url: 'https://kumlin.no',
  /** The content is Swedish. The Webflow site declared lang="no-NO", which makes screen readers use a Norwegian voice. */
  lang: 'sv-SE',
  ogLocale: 'sv_SE',
  tagline: '– Ett gemensamt mål för bygg- och fastighetssektorn. Tillsammans skapar vi byggnader som håller över tid.',
  address: 'Kungsholmstorg 13A, 112 27 Stockholm, Sverige',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4070.5227680883104!2d18.039944977288833!3d59.32858981107975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x465f9d622294d6d5%3A0x53f0fe1ba20c9fbe!2sKungsholmstorg%2013A%2C%20112%2027%20Stockholm%2C%20Sverige!5e0!3m2!1sno!2sno!4v1753042575629!5m2!1sno!2sno',
  umamiWebsiteId: 'ff594f0f-554d-4ccf-bde4-08ad1ffe9852',
} as const;

export interface NavLink {
  label: string;
  href: string;
}

/** Main navigation. "Vad vi gör" pointed at https://www.kumlin.no/#services (an extra redirect hop); now same-site. */
export const NAV_LINKS: NavLink[] = [
  { label: 'Vad vi gör', href: '/#services' },
  { label: 'Om oss', href: '/om-oss' },
  { label: 'Artiklar', href: '/artikler' },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: 'Om oss', href: '/om-oss' },
  { label: 'Tjänster', href: '/#services' },
  { label: 'Artiklar', href: '/artikler' },
];

export interface ContactLink {
  kind: 'phone' | 'mail';
  href: string;
  label: string;
}

export const FOOTER_CONTACTS: ContactLink[] = [
  { kind: 'phone', href: 'tel:+46760224191', label: '+46 760 224 191 (Elin)' },
  { kind: 'phone', href: 'tel:+46705167725', label: '+46 705 167 725 (Anders)' },
  { kind: 'mail', href: 'mailto:elin@fuktdimensionering.se', label: 'elin@fuktdimensionering.se' },
  { kind: 'mail', href: 'mailto:anders@kumlin.biz', label: 'anders@kumlin.biz' },
];

export const PEOPLE = {
  anders: {
    name: 'Anders Kumlin',
    phone: '+46705167725',
    email: 'anders@kumlin.biz',
    links: [
      { kind: 'phone', href: 'tel:+46705167725', label: '+46 705 167 725' },
      { kind: 'phone', href: 'tel:+4741334300', label: '+47 413 34 300' },
      { kind: 'mail', href: 'mailto:anders@kumlin.biz', label: 'anders@kumlin.biz' },
    ] satisfies ContactLink[],
  },
  elin: {
    name: 'Elin Kumlin',
    phone: '+46760224191',
    email: 'elin@fuktdimensionering.se',
    links: [
      { kind: 'phone', href: 'tel:+46760224191', label: '+46 760 224 191' },
      { kind: 'phone', href: 'tel:+4793005686', label: '+47 930 05 686' },
      { kind: 'mail', href: 'mailto:elin@kumlin.no', label: 'elin@kumlin.no' },
      { kind: 'mail', href: 'mailto:elin@fuktdimensionering.se', label: 'elin@fuktdimensionering.se' },
    ] satisfies ContactLink[],
  },
} as const;
