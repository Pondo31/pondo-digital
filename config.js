"use strict";
// Public configuration only. Never add API keys or other secrets.
window.PONDO_CONFIG = Object.freeze({
  form: Object.freeze({
    // Owner-provided Formspree URL. Sending also requires the privacy and delivery checks below.
    endpoint: "https://formspree.io/f/xgakoyvl",
    deliveryVerified: true,
    // Delivery and fields confirmed by the owner for this configuration; policy approval still blocks public submission.
    privacyUrl: "privacy.html",
    privacyReviewed: false
  }),
  // Full name supplied by the owner; this does not approve the policy.
  privacyOwnerFullName: "Сидоров Денис",
  contacts: Object.freeze({ email: "volk2002d@gmail.com", telegram: "gvonix26185", instagram: "https://www.instagram.com/pondo.digital/", privacyEmail: "volk2002d@gmail.com" })
});
