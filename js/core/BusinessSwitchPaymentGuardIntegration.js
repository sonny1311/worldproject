// ORVUNO – harte Trennung zwischen Betriebsnavigation und Echtgeld-Kauf.
// Ein Wechsel zu einem bereits vorhandenen Betrieb darf niemals einen Checkout starten.
import { businessPortfolio } from './AccountMultiplayerIntegration.js';

const originalActivate = businessPortfolio.activate.bind(businessPortfolio);
const SWITCH_BLOCK_MS = 1500;
let switchDepth = 0;
let blockedUntil = 0;
let cleanupTimer = null;
let observer = null;

function closeUnexpectedPaymentOverlay() {
  document.querySelectorAll('[data-orvuno-payment-overlay]').forEach(node => node.remove());
}

function stopObserverLater() {
  clearTimeout(cleanupTimer);
  cleanupTimer = setTimeout(() => {
    observer?.disconnect();
    observer = null;
    closeUnexpectedPaymentOverlay();
  }, SWITCH_BLOCK_MS + 100);
}

function guardDelayedPaymentOverlay() {
  blockedUntil = Math.max(blockedUntil, Date.now() + SWITCH_BLOCK_MS);
  closeUnexpectedPaymentOverlay();

  if (!observer && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      if (paymentBlockedByBusinessSwitch()) closeUnexpectedPaymentOverlay();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  stopObserverLater();
}

function releaseSwitchGuard() {
  queueMicrotask(() => {
    switchDepth = Math.max(0, switchDepth - 1);
  });
}

if (!businessPortfolio.__orvunoPaymentSwitchGuardInstalled) {
  businessPortfolio.__orvunoPaymentSwitchGuardInstalled = true;
  businessPortfolio.activate = function (...args) {
    switchDepth += 1;
    guardDelayedPaymentOverlay();
    try {
      const result = originalActivate(...args);
      closeUnexpectedPaymentOverlay();
      return result;
    } finally {
      releaseSwitchGuard();
    }
  };
}

export function paymentBlockedByBusinessSwitch() {
  return switchDepth > 0 || Date.now() < blockedUntil;
}

export function runBusinessSwitchPaymentGuardTest() {
  const oldUntil = blockedUntil;
  switchDepth += 1;
  try {
    if (!paymentBlockedByBusinessSwitch()) throw new Error('Betriebswechsel sperrt Checkout nicht');
  } finally {
    switchDepth = Math.max(0, switchDepth - 1);
    blockedUntil = oldUntil;
  }
  return true;
}

if (typeof window !== 'undefined') {
  window.worldBusinessSwitchPaymentGuard = {
    blocked: paymentBlockedByBusinessSwitch,
    test: runBusinessSwitchPaymentGuardTest
  };
}
