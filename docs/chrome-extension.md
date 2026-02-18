# Chrome Extension — TrackBillables

## Overview

A Chrome extension with a reminder timer and stopwatch to help users remember to track their billable hours. When the reminder timer fires with the "open tab" alert style, it focuses an existing TrackBillables tab if one is open, or opens a new one.

## Features

- **Reminder timer**: Configurable interval (e.g., every 30 minutes). Alert styles: sound, open tab, or both.
- **Work hours schedule**: Auto-run the reminder during configured work hours and timezone. No manual start needed.
- **Stopwatch**: Track elapsed time with a badge counter on the extension icon. Flashes every 15 minutes as a visual reminder.
- **Tab reuse**: When the timer fires with "open tab" alert, it focuses an existing `trackbillables.com` tab instead of opening duplicates.

## File structure

```
chrome-extension/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker: timers, alarms, schedule logic, tab reuse
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic: mode switching, timer controls, schedule config
├── offscreen.html     # Offscreen document for audio playback
├── offscreen.js       # Plays notification chime
├── newtab.html        # Unused (kept for reference)
├── newtab.js          # Unused (kept for reference)
└── icons/
    ├── icon16.png     # Favicon / toolbar icon
    ├── icon48.png     # Extensions page icon
    └── icon128.png    # Chrome Web Store icon
```

## Manifest

- **Manifest version**: 3
- **Permissions**: `alarms`, `storage`, `tabs`, `offscreen`
  - `alarms` — Timer intervals and schedule checks
  - `storage` — Persist timer state across sessions
  - `tabs` — Query/focus existing TrackBillables tabs
  - `offscreen` — Play notification sounds in the background

## How tab reuse works

When the reminder timer fires and the alert style is "open tab" (`notifyType` is `popup` or `both`):

1. Query all tabs matching `https://trackbillables.com/*`
2. If a tab exists — focus it and bring its window to front
3. If no tab exists — open a new tab to `https://trackbillables.com`

New browser tabs open normally (Chrome's default new tab page).

## Building and publishing

1. Zip the `chrome-extension/` directory (excluding dotfiles and unused files):
   ```bash
   cd chrome-extension && zip -r ../trackbillables-extension.zip . -x ".*" "newtab.*"
   ```
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload `trackbillables-extension.zip`
4. Submit for review

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
