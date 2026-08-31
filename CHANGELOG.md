# Changelog

## 2.5-native-kick (2026-08-31) - Native Message popup same as kick
- Decoded with a0a/a0b scripts: `handleSelfKick` uses `createPopUpMessage(t("Mesh-Kick-Message"), popUpType=Message)` - now Changelog uses SAME `Ay.actions.createPopUp({content, popUpType: Fq.Message})` via webpackChunkrave_desktop scan - 100% native look (same overlay, box, OK button as "You were kicked")
- No custom CSS guess - uses original popUp/Message template
- Fallback custom div only if webpack not found

## 2.4-modal (2026-08-31)
- Changelog centered modal (previous custom)

## 2.3-stable (2026-08-31)
- Stable base

