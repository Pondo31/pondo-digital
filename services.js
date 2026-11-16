"use strict";
(() => {
  const section = document.getElementById('services');
  const viewport = section.querySelector('.service-viewport');
  const track = section.querySelector('.service-track');
  const original = track.querySelector('.service-grid');
  const toggle = section.querySelector('.service-motion-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 767px)');
  const serviceDetailKeys = [119, 124, 129, 134];
  const triggers = [...original.querySelectorAll('.service-details-trigger')];
  triggers.forEach(button => { button.hidden = false; });
  // Exactly one visual copy. Originals remain the only focusable/accessibility set.
  const duplicate = original.cloneNode(true);
  duplicate.classList.add('service-duplicate');
  duplicate.setAttribute('aria-hidden', 'true');
  // Visual copies accept pointer clicks; only original controls enter the tab order.
  duplicate.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  duplicate.querySelectorAll('[aria-labelledby]').forEach(el => el.removeAttribute('aria-labelledby'));
  duplicate.querySelectorAll('a,button').forEach(control => control.tabIndex = -1);
  duplicate.addEventListener('pointerdown', event => event.preventDefault());
  track.append(duplicate);
  section.classList.add('services-enhanced');
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const paused = toggle.getAttribute('aria-pressed') !== 'true';
    toggle.setAttribute('aria-pressed', String(paused));
    section.classList.toggle('services-paused', paused);
  });
  const dialog = document.getElementById('service-dialog');
  const close = dialog.querySelector('.service-dialog-close');
  let opener = null;
  const setTranslatedText = (element, key) => {
    element.dataset.i18n = String(key);
    const lang = document.documentElement.lang === 'uk' ? 'ua' : document.documentElement.lang;
    element.textContent = window.PONDO_I18N[lang][key];
  };
  const closeDetails = (restoreFocus = true) => {
    if (!dialog.open) return;
    dialog.close();
    if (restoreFocus && opener) opener.focus({preventScroll: true});
  };
  viewport.addEventListener('click', event => {
    const trigger = event.target.closest('.service-details-trigger');
    if (!trigger) return; // Existing CTA anchors retain their native behaviour.
    const index = Number(trigger.dataset.service);
    const card = original.children[index];
    opener = triggers[index];
    dialog.querySelector('.service-dialog-icon').textContent = card.querySelector('.service-icon').textContent;
    dialog.querySelector('#service-dialog-title').textContent = card.querySelector('h3').textContent;
    const key = serviceDetailKeys[index];
    setTranslatedText(dialog.querySelector('#service-dialog-description'), key);
    const features = dialog.querySelector('.service-dialog-features');
    features.replaceChildren(...Array.from({length: 4}, (_, i) => {
      const item = document.createElement('li');
      setTranslatedText(item, key + i + 1);
      return item;
    }));
    section.classList.add('services-modal-open');
    document.documentElement.classList.add('service-modal-open');
    dialog.showModal();
    dialog.scrollTop = 0;
    close.focus({preventScroll: true});
  });
  // Keep Tab within the dialog instead of briefly sending it to browser chrome.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), a[href]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  close.addEventListener('click', () => closeDetails());
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeDetails();
  });
  dialog.addEventListener('close', () => {
    section.classList.remove('services-modal-open');
    document.documentElement.classList.remove('service-modal-open');
  });
  dialog.querySelector('.service-dialog-cta').addEventListener('click', () => {
    closeDetails(false);
    const contact = document.getElementById('contact');
    contact.setAttribute('tabindex', '-1');
    contact.focus({preventScroll: true});
  });
  // A static, natively scrollable original set keeps keyboard targets in view.
  viewport.addEventListener('focusin', () => {
    section.classList.add('services-keyboard');
    const link = document.activeElement;
    if (viewport.contains(link)) {
      const card = link.closest('.service-card');
      if (card) viewport.scrollLeft = card.offsetLeft;
    }
  });
  viewport.addEventListener('focusout', event => {
    if (!viewport.contains(event.relatedTarget)) {
      section.classList.remove('services-keyboard');
      viewport.scrollLeft = 0;
    }
  });
  const updateMode = () => {
    viewport.scrollLeft = 0;
    // Native scrolling is available to keyboard and touch users in static modes.
    viewport.tabIndex = (mobile.matches || reduced.matches) ? 0 : -1;
  };
  mobile.addEventListener('change', updateMode);
  reduced.addEventListener('change', updateMode);
  updateMode();
  const updateVisibility = () => section.classList.toggle('services-background', document.hidden);
  document.addEventListener('visibilitychange', updateVisibility);
  updateVisibility();
  // Both text layers share the same start time, duration and duplicate geometry.
  // No per-frame JS, timers or independent geometry measurements are needed.
  const synchronizeType = () => {
    if (reduced.matches) return;
    const start = document.timeline.currentTime;
    // An inactive/not-yet-ready timeline can return null. Assigning null to
    // startTime pauses the CSS animation instead of letting CSS start it.
    // Both layers are created in the same style update, so keep their native
    // CSS timing until there is a usable timeline; never override a user pause.
    if (!Number.isFinite(start) || section.classList.contains('services-paused') || document.hidden) return;
    const animations = [...section.querySelectorAll('.service-type-track')]
      .flatMap(el => el.getAnimations());
    animations.forEach(animation => { animation.startTime = start; });
  };
  document.fonts.ready.then(synchronizeType);
  reduced.addEventListener('change', synchronizeType);
})();
