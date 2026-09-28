/**
 * Scroll-triggered reveal animations. Replaces the GSAP + ScrollTrigger bundle
 * (~110 KB incl. jQuery/webflow.js) with an IntersectionObserver and CSS
 * transitions defined in global.css. Behaviour matches the original:
 *
 *   data-reveal="fade"       fade up 30px          (was data-gs-fade)
 *   data-reveal="stagger"    children fade up, +0.1s each  (was data-gs-stagger)
 *   data-reveal="grayscale"  fade from grayscale, scale .98 (was data-gs-grayscale)
 *   data-reveal-delay="0.4"  delay in seconds (the attribute value in the original)
 *
 * Triggers once when the element's top crosses 90% of the viewport height
 * (ScrollTrigger `start: "top 90%"`).
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

const reveal = (el: HTMLElement) => el.classList.add('is-revealed');

if (reduceMotion || !('IntersectionObserver' in window)) {
  elements.forEach(reveal);
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // Reveal anything that is visible or already scrolled past (e.g. after a jump to #services).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  elements.forEach((el) => {
    const delay = el.dataset.revealDelay;
    if (delay) el.style.setProperty('--reveal-delay', `${delay}s`);
    if (el.dataset.reveal === 'stagger') {
      Array.from(el.children).forEach((child, i) => (child as HTMLElement).style.setProperty('--stagger-index', String(i)));
    }
    observer.observe(el);
  });
}
