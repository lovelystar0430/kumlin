/**
 * Progressive enhancement for the contact form: submit with fetch and show the
 * inline success/error state (like Webflow did) instead of navigating away.
 */
declare global {
  interface Window {
    turnstile?: { reset: (widget?: string | HTMLElement) => void };
  }
}

document.querySelectorAll<HTMLElement>('[data-contact-form]').forEach((root) => {
  const form = root.querySelector('form');
  const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  const success = root.querySelector<HTMLElement>('.contact-form__success');
  const error = root.querySelector<HTMLElement>('.contact-form__error');
  if (!form || !submit || !success || !error) return;

  const label = submit.textContent ?? '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    submit.disabled = true;
    submit.textContent = form.dataset.wait ?? label;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      form.hidden = true;
      success.hidden = false;
    } catch {
      error.hidden = false;
      window.turnstile?.reset(form.querySelector<HTMLElement>('.cf-turnstile') ?? undefined);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
});

export {};
