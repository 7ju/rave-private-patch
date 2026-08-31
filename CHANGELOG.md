# Changelog

## 2.6-native-fix (2026-08-31) - Fix changelog not showing
- Fixed: v2.5 native popUp/Message returned true even when invisible, suppressing fallback -> now tries native then checks DOM after 700ms, shows fallback custom if native not visible
- Native still uses decoded handleSelfKick template (Ay.actions.createPopUp + Fq.Message via webpackChunkrave_desktop)
- Bumped version to retrigger display (localStorage 2.5 -> 2.6)

## 2.5-native-kick (2026-08-31) - Native Message popup same as kick
- Decoded: handleSelfKick uses createPopUpMessage(t("Mesh-Kick-Message"), popUpType=Message)

## 2.4-modal (2026-08-31) - Center modal

## 2.3-stable
- Stable base
