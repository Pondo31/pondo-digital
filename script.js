"use strict";
(() => {
  const dictionaries = window.PONDO_I18N;
  const config = window.PONDO_CONFIG;
  let language = 'ua';
  let busy = false;
  let statusKey = null;
  const errors = new Map();
  const form = document.querySelector('#contact-form');
  const submit = form.querySelector('[type="submit"]');
  const status = document.querySelector('#form-status');
  const menu = document.querySelector('#navigation');
  const toggle = document.querySelector('.menu-toggle');
  const transferConsent = document.getElementById('transfer-consent');
  const consentVersions = window.PONDO_CONSENT;
  let consentEvent = null;
  transferConsent.checked = false;
  window.addEventListener('pageshow', () => {
    transferConsent.checked = false; consentEvent = null; clearError('transfer-consent');
  });
  const method = document.querySelector('#method');
  const reply = document.querySelector('#reply');
  const endpoint = (config.form.endpoint || '').trim();
  let validEndpoint = false;
  try {
    const url = new URL(endpoint);
    validEndpoint = url.origin === 'https://formspree.io' && !url.username && !url.password &&
      /^\/f\/[a-zA-Z0-9]+$/.test(url.pathname) && !url.search && !url.hash;
  } catch (_) { /* Empty or invalid config keeps the demo mode. */ }
  let policyUrl = '';
  try {
    if (config.form.privacyUrl?.trim()) {
      const url = new URL(config.form.privacyUrl.trim(), window.location.href);
      if (!url.username && !url.password && (url.protocol === 'https:' ||
          (url.origin === window.location.origin && ['http:', 'file:'].includes(url.protocol)))) policyUrl = url.href;
    }
  } catch (_) { /* Never render an unsafe privacy link. */ }
  const live = validEndpoint && config.form.deliveryVerified === true &&
    config.form.privacyReviewed === true && Boolean(policyUrl);
  const privacyLink = document.getElementById('privacy-link');
  document.getElementById('transfer-consent-block').hidden = !live;
  // Keep the transport intact, but expose no editable enquiry form before approval.
  form.classList.toggle('contact-form-unavailable', !live);
  form.querySelector('.form-grid').hidden = !live;
  form.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = !live; });
  submit.hidden = !live;
  status.hidden = !live;
  document.querySelector('.demo-notice').hidden = !live;
  if (policyUrl) {
    document.querySelectorAll('[data-policy-link]').forEach(link => { link.href = policyUrl; link.hidden = false; });
  }
  const tr = key => dictionaries[language][key];
  function refreshForm() {
    submit.firstElementChild.textContent = tr(busy ? (live ? 85 : 97) : (live ? 89 : 78));
    if (statusKey !== null) status.textContent = tr(statusKey);
    errors.forEach((key, id) => { document.getElementById(id + '-error').textContent = tr(key); });
  }
  function setLanguage(next) {
    if (!Object.hasOwn(dictionaries, next)) next = 'ua';
    if (next !== language) { transferConsent.checked = false; consentEvent = null; clearError('transfer-consent'); }
    language = next;
    document.documentElement.lang = next === 'ua' ? 'uk' : next;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(Number(el.dataset.i18n)); });
    document.querySelectorAll('[data-placeholder]').forEach(el => { el.placeholder = tr(Number(el.dataset.placeholder)); });
    document.querySelectorAll('[data-language]').forEach(el => { el.setAttribute('aria-pressed', String(el.dataset.language === next)); });
    toggle.setAttribute('aria-label', tr(toggle.getAttribute('aria-expanded') === 'true' ? 91 : 90));
    closeButton.setAttribute('aria-label', tr(91));
    document.title = 'PONDO DIGITAL — ' + tr(95);
    document.querySelector('meta[name="description"]').content = tr(96);
    document.querySelector('meta[property="og:title"]').content = document.title;
    document.querySelector('meta[property="og:description"]').content = tr(96);
    document.querySelector('meta[property="og:locale"]').content = {ua:'uk_UA',ru:'ru_RU',en:'en_US'}[next];
    if (live) {
      document.querySelector('.demo-notice strong').textContent = tr(89);
      document.querySelector('.demo-notice p').textContent = tr(88);
    }
    document.getElementById('privacy-notice').textContent = tr(99);
    document.getElementById('privacy-notice').hidden = live;
    refreshForm();
    try { localStorage.setItem('pondo-language', next); } catch (_) { /* Storage may be unavailable. */ }
  }
  const closeButton = menu.querySelector('.drawer-close');
  let menuClosing = false;
  let closeTimer;
  let savedScrollY = 0;
  function closeMenu(immediate = false, restoreFocus = true) {
    if (!menu.open) return;
    menuClosing = true;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', tr(90));
    const finish = () => {
      clearTimeout(closeTimer);
      menu.close();
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
      document.body.style.top = '';
      // Override smooth scroll while restoring the position frozen for iOS.
      const previous = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScrollY);
      document.documentElement.style.scrollBehavior = previous;
      menuClosing = false;
      if (restoreFocus) toggle.focus({preventScroll:true});
    };
    clearTimeout(closeTimer);
    if (immediate || window.matchMedia('(prefers-reduced-motion:reduce)').matches) finish();
    else {
      const duration = parseFloat(getComputedStyle(menu).getPropertyValue('--drawer-close-duration')) || 260;
      closeTimer = window.setTimeout(finish, duration);
    }
  }
  function openMenu() {
    if (menu.open || menuClosing) return;
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('menu-open');
    document.documentElement.classList.add('menu-open');
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', tr(91));
    closeButton.focus({preventScroll:true});
    // Resolve the initial transform before starting the entrance transition.
    void menu.offsetWidth;
    menu.classList.add('is-open');
  }
  toggle.addEventListener('click', openMenu);
  closeButton.addEventListener('click', () => closeMenu());
  menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  menu.addEventListener('click', event => {
    const rect = menu.getBoundingClientRect();
    if (event.target === menu && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeMenu();
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
    if (event.key !== 'Tab') return;
    const focusable = [...menu.querySelectorAll('a[href],button:not([disabled])')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const hash = link.getAttribute('href');
    closeMenu(true, false);
    if (hash.startsWith('#')) {
      const section = document.getElementById(hash.slice(1));
      if (section) {
        section.setAttribute('tabindex', '-1');
        section.focus({preventScroll:true});
      }
    } else toggle.focus({preventScroll:true});
  });
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  function clearError(id) {
    errors.delete(id);
    document.getElementById(id).removeAttribute('aria-invalid');
    document.getElementById(id + '-error').textContent = '';
  }
  transferConsent.addEventListener('change', () => {
    clearError('transfer-consent');
    consentEvent = transferConsent.checked ? Object.freeze({
      version:consentVersions.version, policyVersion:consentVersions.policyVersion,
      language, at:new Date().toISOString(), id:crypto.randomUUID()
    }) : null;
  });
  form.addEventListener('reset', () => { consentEvent = null; clearError('transfer-consent'); });
  form.addEventListener('input', event => {
    if (errors.has(event.target.id)) clearError(event.target.id);
    if (!busy) { statusKey = null; status.textContent = ''; }
  });
  method.addEventListener('change', () => {
    reply.type = method.value === 'email' ? 'email' : 'text';
    reply.autocomplete = method.value === 'email' ? 'email' : 'off';
    reply.inputMode = method.value === 'email' ? 'email' : 'text';
    reply.placeholder = method.value === 'email' ? 'you@example.com' : '@username';
    clearError('reply');
  });
  function validate() {
    [...errors.keys()].forEach(clearError);
    for (const id of ['name', 'reply', 'website', 'description']) {
      const el = document.getElementById(id);
      if (!el.value.trim()) errors.set(id, 81);
    }
    if (!errors.has('reply')) {
      if (method.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply.value.trim())) errors.set('reply', 82);
      if (method.value === 'telegram' && !/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(reply.value.trim())) errors.set('reply', 83);
    }
    for (const id of ['name', 'reply', 'description', 'budget']) {
      const el = document.getElementById(id);
      if (el.maxLength > 0 && el.value.length > el.maxLength) errors.set(id, 105);
    }
    if (!['email', 'telegram'].includes(method.value)) errors.set('method', 105);
    if (![...document.getElementById('website').options].some(option => option.value && option.value === document.getElementById('website').value)) errors.set('website', 105);
    if (!transferConsent.checked || !consentEvent || consentEvent.language !== language ||
        consentEvent.version !== consentVersions.version || consentEvent.policyVersion !== consentVersions.policyVersion) {
      errors.set('transfer-consent', 146);
    }
    errors.forEach((key, id) => {
      document.getElementById(id).setAttribute('aria-invalid', 'true');
      document.getElementById(id + '-error').textContent = tr(key);
    });
    if (errors.size) document.getElementById(errors.keys().next().value).focus();
    return !errors.size;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!live) {
      statusKey = 99;
      refreshForm();
      return;
    }
    if (busy) return;
    if (form.elements._gotcha.value.trim()) {
      statusKey = 102;
      status.classList.add('error');
      refreshForm();
      return;
    }
    if (!validate()) return;
    statusKey = null;
    status.textContent = '';
    status.classList.remove('error');
    busy = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.setAttribute('aria-busy', 'true');
    refreshForm();
    const submittedConsent = consentEvent;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const payload = new FormData();
      for (const key of ['name', 'method', 'reply', 'website', 'description', 'budget']) {
        const value = form.elements[key].value.trim();
        if (key !== 'budget' || value) payload.set(key, value);
      }
      payload.set('_gotcha', '');
      payload.set('transfer_consent', 'yes');
      payload.set('transfer_consent_version', submittedConsent.version);
      payload.set('privacy_version', submittedConsent.policyVersion);
      payload.set('consent_language', submittedConsent.language);
      payload.set('consent_at_client', submittedConsent.at);
      payload.set('consent_event_id', submittedConsent.id);
      if (method.value === 'email') payload.set('email', reply.value.trim());
      const response = await fetch(endpoint, {method:'POST', body:payload, headers:{Accept:'application/json'}, signal:controller.signal, credentials:'omit', referrerPolicy:'no-referrer', redirect:'error'});
      if (!response.ok) throw new Error('Delivery failed');
      statusKey = 86;
      form.reset();
      method.dispatchEvent(new Event('change'));
    } catch (_) {
      statusKey = controller.signal.aborted ? 103 : 104;
      status.classList.add('error');
    } finally {
      window.clearTimeout(timeout);
      busy = false;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      submit.removeAttribute('aria-busy');
      refreshForm();
    }
  });
  // Contacts are opt-in and allowlisted. No empty or invented links.
  const contacts = document.querySelector('#direct-contacts');
  const addContact = (label, href) => {
    const a = document.createElement('a'); a.textContent = label + ' ↗'; a.href = href;
    if (href.startsWith('https:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    document.querySelectorAll('[data-contacts]').forEach(container => {
      const link = a.cloneNode(true);
      if (container.id === 'footer-contacts' && ['Telegram', 'Email', 'Instagram'].includes(label)) {
        const badge = document.createElement('span');
        badge.className = 'footer-contact-icon';
        badge.setAttribute('aria-hidden', 'true');
        const icon = document.createElement('img');
        icon.src = {Telegram: 'images/telegram.svg', Email: 'images/email.svg', Instagram: 'images/instagram.svg'}[label];
        icon.width = 22;
        icon.height = 22;
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        badge.append(icon);
        const title = document.createElement('span');
        title.className = 'footer-contact-label';
        title.textContent = label;
        const arrow = document.createElement('span');
        arrow.className = 'footer-contact-arrow';
        arrow.textContent = '↗';
        arrow.setAttribute('aria-hidden', 'true');
        link.replaceChildren(badge, title, arrow);
      }
      if (container.id === 'direct-contacts' && label === 'Instagram') {
        const icon = document.createElement('img');
        icon.src = 'images/instagram.svg';
        icon.className = 'contact-inline-icon';
        icon.width = 18;
        icon.height = 18;
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        link.prepend(icon);
      }
      container.append(link);
    }); 
    const drawerLink = a.cloneNode(true);
    const key = label.toLowerCase();
    document.querySelector(`[data-contact="${key}"]`).replaceWith(drawerLink);
  };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contacts.email)) addContact('Email', 'mailto:' + config.contacts.email);
  for (const [key, host] of [['telegram','t.me'], ['instagram','www.instagram.com']]) {
    // Instagram is configured once as its canonical public profile URL.
    if (key === 'instagram' && config.contacts[key].startsWith('https://')) {
      try {
        const profile = new URL(config.contacts[key]);
        if (profile.origin === 'https://www.instagram.com' && !profile.username && !profile.password &&
            /^\/[a-zA-Z0-9_.]{1,30}\/$/.test(profile.pathname) && !profile.search && !profile.hash) {
          addContact('Instagram', profile.href);
        }
      } catch (_) { /* Ignore invalid profile URLs. */ }
      continue;
    }
    const handle = config.contacts[key].replace(/^@/, '');
    if (/^[a-zA-Z0-9_.]{1,64}$/.test(handle)) addContact(key === 'telegram' ? 'Telegram' : 'Instagram', 'https://' + host + '/' + encodeURIComponent(handle));
  }
  let initial = 'ua';
  try { initial = localStorage.getItem('pondo-language') || 'ua'; } catch (_) { /* Keep Ukrainian default. */ }
  setLanguage(initial);
  submit.disabled = !live;
  document.getElementById('year').textContent = new Date().getFullYear();
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    const work = document.querySelector('#work');
    const workHeading = work?.querySelector('.section-heading');
    const workCards = work ? [...work.querySelectorAll('.project')] : [];
    const workMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
    let workHeadingStarted = -Infinity;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.target === workHeading && entry.isIntersecting)) workHeadingStarted = performance.now();
      const enteringCards = entries.filter(entry => entry.isIntersecting && workCards.includes(entry.target));
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target === workHeading) {
          workHeading.classList.add('portfolio-visible');
        } else if (workCards.includes(entry.target)) {
          // Stagger cards seen together; a mobile card starts as soon as it is reached.
          const delay = Math.max(0, workHeadingStarted + 650 - performance.now()) + (enteringCards.indexOf(entry) > 0 ? 220 : 0);
          entry.target.style.setProperty('--portfolio-delay', `${delay}ms`);
          entry.target.classList.add('portfolio-visible');
        } else entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.08});
    document.querySelectorAll('.reveal:not(.process-grid > .step):not(#work .project), .section-divider').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
    if (workHeading) {
      observer.observe(workHeading);
      workCards.forEach(card => observer.observe(card));
      // Hide only after all portfolio targets have been registered successfully.
      work.classList.add('portfolio-motion');
      const showPortfolio = () => {
        if (!workMotion.matches) return;
        work.classList.remove('portfolio-motion');
        [workHeading, ...workCards].forEach(el => observer.unobserve(el));
        workMotion.removeEventListener('change', showPortfolio);
      };
      workMotion.addEventListener('change', showPortfolio);
    }
  }
  // One timeline for the heading and all four stages; start when the heading enters view.
  const processGrid = document.querySelector('.process-grid');
  const processSection = processGrid?.closest('section');
  const processTitle = processSection?.querySelector('h2');
  const processMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  if (processTitle && 'IntersectionObserver' in window && !processMotion.matches) {
    const processObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        processSection.classList.add('process-visible');
        processObserver.disconnect();
      }
    }, {threshold:0.25});
    processSection.classList.add('process-animation', 'process-pending');
    processObserver.observe(processTitle);
    const showWithoutMotion = () => {
      if (!processMotion.matches) return;
      processObserver.disconnect();
      processSection.classList.remove('process-pending');
      processSection.classList.add('process-visible');
      processMotion.removeEventListener('change', showWithoutMotion);
    };
    processMotion.addEventListener('change', showWithoutMotion);
  }
})();
