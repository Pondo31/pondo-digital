"use strict";
(() => {
  const dictionaries = window.PONDO_PRIVACY_I18N;
  const email = window.PONDO_CONFIG.contacts.privacyEmail;
  document.querySelectorAll('.privacy-email').forEach(link => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      link.href = 'mailto:' + email;
      link.textContent = email;
    }
  });
  function setLanguage(next) {
    const language = Object.hasOwn(dictionaries, next) ? next : 'ua';
    const dictionary = dictionaries[language];
    document.documentElement.lang = language === 'ua' ? 'uk' : language;
    document.querySelectorAll('[data-privacy]').forEach(el => {
      const pending = window.PONDO_CONFIG.form.privacyReviewed !== true;
      const key = pending ? ({draft:'pendingLabel',state:'pendingState',p8:'pendingDate'}[el.dataset.privacy] || el.dataset.privacy) : el.dataset.privacy;
      el.textContent = dictionary[key];
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    const ownerName = (window.PONDO_CONFIG.privacyOwnerFullName || '').trim();
    document.querySelector('[data-owner-name]').textContent = ownerName || dictionary.ownerNameMissing;
    document.title = dictionary.title + ' — PONDO DIGITAL';
    document.querySelector('meta[name="description"]').content = dictionary.intro;
    try { localStorage.setItem('pondo-language', language); } catch (_) { /* Storage is optional. */ }
  }
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  let initial = 'ua';
  try { initial = localStorage.getItem('pondo-language') || 'ua'; } catch (_) { /* Ukrainian default. */ }
  setLanguage(initial);
})();
