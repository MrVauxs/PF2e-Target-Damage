# 1.3.1
- Fixed the module not working on PF2e 4.3.0

# 1.3.0
- Fixed an issue where damage buttons were shown to all players even if they didn't own the token, thus couldn't apply damage. Now the module hides damage buttons if you don't own the token itself, rather than having the token belong to *any* player.
- Fixed only the first target being highlighted on hover. (#5)
- Made the module override ignore targeting if the message comes from [PF2e Persistent Damage](https://github.com/CarlosFdez/pf2e-persistent-damage). (#4)
  - Added a setting to replace the damage buttons with PF2e Target Damage buttons only for persistent damage.
- Fixed some holdover localization issues from Target Lock.

# 1.2.0
- Add token mystification based on "Tokens determine NPC name visibility" system setting.
- Added on hover and double click token selection on target names.
- Removed debug console logs.

# 1.1.1
- Fix styling on hidden target names

# 1.1.0
- Fix localization breaking everything
- Add setting to hide original system buttons ([#1](https://github.com/MrVauxs/PF2e-Target-Damage/issues/1))

# 1.0.1
- Added back classes to buttons
- Added Module Management+ conflicts with Target Lock
- Fixed localization issue with Shield Block

# 1.0.0
Release!
