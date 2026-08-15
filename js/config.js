// ORVUNO public runtime configuration.
// Secrets such as the HERE API key must NEVER be committed here.
// Put the real key in js/config.local.js on your own computer.

window.ORVUNO_CONFIG = window.ORVUNO_CONFIG || {};

// config.local.js is optional. The game continues to start without it.
export async function loadLocalConfig() {
  try {
    await import('./config.local.js');
  } catch (error) {
    // Missing local config is expected on GitHub and on fresh clones.
    if (!String(error?.message || error).includes('config.local.js')) {
      console.warn('[ORVUNO] Local configuration could not be loaded.', error);
    }
  }

  return window.ORVUNO_CONFIG;
}

export function getHereApiKey() {
  return String(window.ORVUNO_CONFIG?.HERE_API_KEY || '').trim();
}
