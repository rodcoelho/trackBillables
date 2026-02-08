# Chrome Extension — TrackBillables New Tab

## Overview

A minimal Chrome extension that replaces the default new tab page with a redirect to [trackbillables.com](https://trackbillables.com). When a user opens a new tab, they land directly on the TrackBillables app.

## How it works

1. Chrome opens `newtab.html` instead of the default new tab page
2. `newtab.html` loads `newtab.js`
3. `newtab.js` runs `window.location.replace('https://trackbillables.com')`
4. The user is redirected to TrackBillables (dashboard if logged in, homepage if not)

## File structure

```
chrome-extension/
├── manifest.json    # Extension config (Manifest V3)
├── newtab.html      # Shell HTML loaded on new tab
├── newtab.js        # Single-line redirect script
└── icons/
    ├── icon16.png   # Favicon / toolbar icon
    ├── icon48.png   # Extensions page icon
    └── icon128.png  # Chrome Web Store icon
```

## Manifest

- **Manifest version**: 3 (Chrome's latest)
- **Permissions**: None — no access to browsing data, cookies, tabs, or any browser APIs
- **chrome_url_overrides**: Overrides `newtab` only

## Building and publishing

1. Zip the `chrome-extension/` directory (excluding `.DS_Store`):
   ```bash
   cd chrome-extension && zip -r ../trackbillables-extension.zip . -x ".*"
   ```
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload `trackbillables-extension.zip`
4. Fill in the store listing:
   - **Privacy policy URL**: `https://trackbillables.com/extension-privacy`
   - **Permissions justification**: No remote code, no special permissions
   - **Distribution**: Free of charge (no in-app purchases)
5. Submit for review

## Chrome Web Store settings

| Setting | Value |
|---|---|
| Privacy policy | `https://trackbillables.com/extension-privacy` |
| Remote code | No |
| In-app purchases | No (free of charge) |
| Contact email | `support@trackbillables.com` |

## Updating the extension

1. Bump `version` in `manifest.json`
2. Re-zip and upload to the Developer Dashboard
3. Submit the new version for review
