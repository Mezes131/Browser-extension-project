
/* eslint-disable no-undef */
import AUTH_TOKEN from '../.env';

// Background worker: accepts { action: 'fetchCarbon', data_type, region, apiKey? }
// It tries to use message.apiKey, or falls back to chrome.storage.local.apiKey.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'fetchCarbon') return;
  const { data_type, region } = message;
  if (!data_type || !region) {
    sendResponse({ ok: false, error: 'Missing data_type or region' });
    return;
  }

  const url = `https://api.electricitymaps.com/v3/${encodeURIComponent(data_type)}/latest?zone=${encodeURIComponent(region)}`;

  fetch(url, {
    method: 'GET',
    headers: {
        'auth-token': AUTH_TOKEN,
    }
  })
    .then(response => response.json())
    .then((json) => {
      sendResponse({ ok: true, data: json });
    })
    .catch((err) => {
      sendResponse({ ok: false, error: err.message || String(err) });
    });

  // Indicates we'll call sendResponse asynchronously
  return true;
});
