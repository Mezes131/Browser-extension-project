# Carbon Footprint — Browser Extension (ElectricityMaps)

Small browser extension (Chrome / Chromium) that shows carbon intensity and electricity mix for a region using the ElectricityMaps API.

This repository contains source files under `src/` and a simple popup UI in `dist/index.html` used as the extension popup. A background service worker performs API requests so the API key can remain out of page context.

---

## Contents
- `src/` — popup source (unbundled JS used for development)
- `dist/` — distributable files (popup HTML, built scripts, background worker, manifest)
- `background.js` — service worker (in `dist/` for the loaded extension)
- `manifest.json` — extension manifest (MV3)
- `webpack.config.js`, `package.json` — optional build tooling

---

## Quick start (development)
1. Open PowerShell and cd to the project root (where `package.json` and `manifest.json` live):

```powershell
cd 'Browser-extension-project'
```

2. Install dev dependencies (optional, only if you want to bundle with webpack):

```powershell
npm install
```

3. Build (optional) — produces bundles in `dist/` if you use webpack:

```powershell
npm run build
```

4. Load the extension in Chrome/Edge:
   - Open `chrome://extensions` (or `edge://extensions`).
   - Enable *Developer mode*.
   - Click *Load unpacked* and select the `dist/` folder (or the project root if `manifest.json` is there).

Notes:
- Make sure `manifest.json` and `background.js` are present in the folder you load.

---

## API key handling (recommended)
To avoid embedding a secret in the code, the extension uses `.env.example` to persist the user's ElectricityMaps API key.

Workflow implemented in the project:
- The popup provides (or can be extended to provide) an input to save the API token into `dist/background.js` and `src/index.js`.

You should NOT commit your API key. Add `.env` and any local secrets to `.gitignore`.

---

## How the popup works
- The popup form accepts:
  - `Region` (examples: `US-NEISO`, `CM`).
  - `Data Type` (a `<select>` with values `carbon-intensity` and `electricity-mix`).
- Validation:
  - Region is validated using the regex `/^[A-Z]{2}(?:-[A-Z0-9]+)*$/`.
  - `data_type` is validated against the allowed list `['carbon-intensity','electricity-mix']`.
- On submit the popup sends `{ action: 'fetchCarbon', data_type, region }` to the background worker. The worker performs the API request and returns JSON which the popup displays.

---

## Background worker behavior
- Listens for messages with `action: 'fetchCarbon'`, reads `message.data_type` and `message.region` and attempts to obtain an API token from `message.apiKey` or `chrome.storage.local.apiKey`.
- Builds the request to: `https://api.electricitymaps.com/v3/${data_type}/latest?zone=${encodeURIComponent(region)}` and includes `Authorization: Bearer <token>` if available.

---

## Troubleshooting
- Error "Could not load icon 'icons/icon16.png' specified in 'icons'":
  - Ensure the folder you load into Chrome contains the `icons/` files referenced by `manifest.json`.
  - Or remove / fix the `icons` entries in `manifest.json` before loading.
- Popup not working / JS errors:
  - If `dist/index.html` loads `src/index.js` directly, ensure you load the project root where `src/` exists or bundle to `dist/popup.bundle.js` and update the HTML to load the bundle.

---

## Security notes
- `chrome.storage.local` is acceptable for storing a user-provided API key in this extension, but it is not encrypted. Do not store production secrets that require stronger protections.
- Never commit your API key or `.env` files to source control.

---

## Next steps / improvements
- Add a small options page to manage the API key and persist it with a friendly UX.
- Improve UI styling and error messages.
- Add unit tests for validation functions.
- Consider a backend proxy if you want server-side rate-limiting, caching, or to avoid exposing tokens entirely to clients.

---

If you'd like, I can add a small form control in the popup to save the API key to storage and wire the UI to read the stored key automatically — tell me and I'll implement it.
