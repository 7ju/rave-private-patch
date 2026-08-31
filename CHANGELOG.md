## 2.22-bandwidth-gate-killer (2026-08-31)
- Kill 'Bandwidth sharing has been disabled. Please re-enable it' gate directly
- GitHub-only triple loader

## 2.21-bandwidth-unlock-v2 (2026-08-31) - aggressive
- Hide any Bandwidth Sharing gate/modal/overlay fixed + dimmed background
- Force mesh grid visible (opacity 1)
- GitHub-only via triple loader

## 2.20-bandwidth-unlock (2026-08-31) - Bandwidth Sharing fix
- Remove enforcement when Bandwidth Sharing is OFF - no more forced re-enable to view content
- GitHub-only update via triple CDN loader (instant via API)

## 2.18-maximized-blur (2026-08-31) - Maximize + Blur Fix
- Auto maximize window on startup via window-setMaximize IPC (fullscreen fix)
- Blur overlay rgba(0,0,0,0.4) + backdrop-filter blur(30px) like native kick
- Changelog modal stays until OK pressed (no auto-close) - persistent
- Shows 5.3s after app fully loaded (readyState complete + store ready)

# Changelog

## 2.7-native-fix (2026-08-31) - Force visible (local patched)
- Same native Message popup as kick (decoded) + fallback after 700ms check - bumped to retrigger after 2.6 stored
- Local patched: RAVE-ChatMute-Portable 269108450, installed 157566072

## 2.6-native-fix - Fix changelog not showing
## 2.5-native-kick - Native Message popup
