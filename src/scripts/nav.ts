/**
 * Mobile navigation toggle (replaces Webflow's jQuery `w-nav` component).
 * Closes on link click, outside click, Escape, and when the viewport grows past
 * the collapse breakpoint.
 */
const header = document.querySelector<HTMLElement>('.site-header');
const toggle = header?.querySelector<HTMLButtonElement>('.site-header__toggle');
const menu = header?.querySelector<HTMLElement>('.site-header__menu');

if (header && toggle && menu) {
  const collapsed = window.matchMedia('(max-width: 991px)');

  const setOpen = (open: boolean) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Stäng meny' : 'Meny');
  };
  const isOpen = () => header.classList.contains('is-open');

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  menu.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !header.contains(event.target as Node)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  collapsed.addEventListener('change', (event) => {
    if (!event.matches) setOpen(false);
  });
}
