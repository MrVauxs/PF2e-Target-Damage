# 2.4.10

- Updated the damage function to have parity with PF2e 4.10.4.

# 2.4.9

- Updated the module to be compatible with PF2e 4.10.0.
- Fixed popped out Target Damage messages not being full height.

# 2.4.8

- Fixed an issue with multiple users trying to edit a message they have no permissions to.

# 2.4.7

- Fixed a CSS issue with Classic layout mode and whether a token has been damaged or not. Again.
- Fixed an issue when using the "Hide non-Player Token Targets" setting causing the damage button to not pass the GM-only targets to the damage roll.

# 2.4.6

- Fixed a CSS issue with Classic layout mode and whether a token has been damaged or not.
- Fixed a CSS issue with the suggested damage buttons not becoming greyed out upon usage.
- Fixed an issue with players being unable to grey out buttons upon dealing damage to themselves.

# 2.4.5

- Fixed an issue regarding damage hints spilling over to the wrong damage rolls.

# 2.4.4

- Improved used damage buttons styling.
- Fixed Chinese translation.

# 2.4.3

- Removed auto-scrolling to the last message due to bugs.

# 2.4.2

- Fixed a harmless console error.
- Fixed a bug where rolling too many targets at once caused not all of them to be linked to the save card.
- Fixed a Dice so Nice incompatibility with how fast the results get shown in the save card. ([#37](https://github.com/MrVauxs/PF2e-Target-Damage/issues/37))

# 2.4.1 "The Minute One Bugfix"

- Fixed a harmless console error.

# 2.4.0

- Updated localization files (French, Polish, Simplified Chinese).
- Made the modules errors slightly more readable, and made an erroring token not stop the entire rendering process, allowing other targets to be shown.
- Added a censor to Damage Buttons that have already been pressed ([#34](https://github.com/MrVauxs/PF2e-Target-Damage/issues/34))
- On Basic Saves, the appropriate damage button will now be highlighted depending on the saving throw of the target. ([#32](https://github.com/MrVauxs/PF2e-Target-Damage/issues/32))
- When rolling damage, the module will automatically add the save card's targets to the damage roll.
- Added the ability to remove specific targets with Ctrl-Click on their name. ([#31](https://github.com/MrVauxs/PF2e-Target-Damage/issues/31))

# 2.3.3

- Made the Target Button able to reset your targets list to 0 in replace mode ("Shift-Click" by default). If you try adding a target without having one, the module will let you know.
- Added Roll All and Roll NPCs buttons. Only available for GMs.
- Fixed the issue of jumping messages when adding targets and improved the fix for having to scroll down to see added targets in new messages by scrolling down only if the last message is affected by the module.

# 2.3.2

- Changed the location of the Target Button for saving throws to be inside the Saving Throw button instead of the Template placement button. As such, now Template-less spells can make use of the post-targeting feature.

# 2.3.1

- Created a socket so that players can actually update the saving throw message.
- Fixed Saving Throw buttons not respecting private rolls. The buttons now will only update with the result if the roll is visible to the user in chat.
- Fixed Saving Throw buttons not appearing on castings of a spell from Scrolls and Wands.
- Fixed Saving Throw buttons in spells with Variants. The buttons disappear if there is no saving throw present in the variant. The saving throw results are persistent, so if you come back to another variant and then go back to one with a saving throw, the buttons will re-appear as normal with the previous results.

# 2.3.0

- Added support for Saving Throws in spells.
- Added hover tooltips to compact names.
- Added an exposed `pf2eTargetDamage` object containing functions to update a message's target flags, for ease of use in macros and other modules.
  - Currently the only functions that exist are `updateFlags` and `replaceFlags`. The latter of which is just a shortcut for `updateFlags` with `opts.replace = true`.
- Updated localization files.

# 2.2.2

- Fixed the target token being selected when clicking the Splash button. The splash damage is already calculated into the target damage by the system.
- Fixed the Splash button dialog defaulting to 5 feet range when empty, instead of the default number shown in the menu.

# 2.2.1

- Added automatic scroll down to the last row of buttons on the message.

# 2.2.0

- Updated the settings to no longer require a refresh when changing them, the module now refreshes every damage roll that is affected by PF2e Damage Target.

# 2.1.3

- Adjusted how long target names overflow and wrap around the message.

# 2.1.2

- Added support for Expanded Splash feat in the Select Splashed Tokens button. With the feat, the default is now 10 feet.
- Fixed multi-damage roll messages only applying damage from the first roll.
- Fixed multi-damage roll messages only collapsing the first row of system buttons.

# 2.1.1

- Fixed errors in console.

# 2.1.0

- Added a "Classic" formatting client setting, putting the names on top of the buttons. Thank you Dorako for the help!
- Removed buttons from the chat message if the token is not owned by the player, i.e. cannot apply damage to it anyway.
- Clicking the names now will either:
  - Select the token if owned by the player.
  - Target the token if not owned by the player.
  - Pan to the token if double clicked.

# 2.0.2

- Fixed bug the Shield button not turning off once used.
- Removed part of the module that referred to outdated `data` property.
- "aaaaaaaaaaaaaa" is now properly translated.
- Fixed "Needs some more CSS touch ups" from 2.0.0. Thank you Dorako for the help!

# 2.0.1

- Fixed release workflow not including template files.

# 2.0.0

- Rewritten the module.
- Needs some more CSS touch ups.
- Makes use of the latest PF2e system (v4.6.5).

# 1.5.5 a.k.a. "Can I leave this module alone for 5 minutes?!"

- Fixed damage application not being up to date to v4.6.4 of the Pathfinder 2e system. ([#20](https://github.com/MrVauxs/PF2e-Target-Damage/issues/20))

# 1.5.4

- Fixed damage application not being up to date to v4.6.3 of the Pathfinder 2e system. ([#18](https://github.com/MrVauxs/PF2e-Target-Damage/issues/18))
- Fixed Persistent Damage Conditions being applied to both the target and a selected token. ([#17](https://github.com/MrVauxs/PF2e-Target-Damage/issues/17))

# 1.5.3

- Fixed typo.

# 1.5.2

- Added support for macros modifying the target flags, allowing the manipulating of what targets the module renders.

# 1.5.1

- Fixed an issue with Persistent Damage condition application.

# 1.5.0

- Updated compatibility with Pathfinder 2e system to 4.6.0, making it the new minimum version.
- Integrated the "Apply Persistent Damage Condition" button from PF2e Persistent Damage with the module. Now you don't have to select a token to apply those conditions as well.
- Fixed "Hide Collapsible Buttons" setting not actually hiding the buttons.

# 1.4.1

- Added localization.

# 1.4.0

- Added a button to collapse the damage buttons.
  - With that, improved "Hide original PF2e damage buttons" by allowing you to still access the buttons after they have been hidden. Now they are just automatically collapsed instead.

# 1.3.5

- Fixed release workflow.

# 1.3.4

- Made the module no longer make Foundry complain about using `data` paths.
- Fixed a bug when chat messages would error when a token that has been targeted no longer existed. ([#11](https://github.com/MrVauxs/PF2e-Target-Damage/issues/11))

# 1.3.3

- Fixed #9 Targets is Undefined error on flag-less damage messages.

# 1.3.2

- Fixed the module not working on PF2e 4.4.0
- Enabled previously commented out triple damage buttons.

# 1.3.1

- Fixed the module not working on PF2e 4.3.0

# 1.3.0

- Fixed an issue where damage buttons were shown to all players even if they didn't own the token, thus couldn't apply damage. Now the module hides damage buttons if you don't own the token itself, rather than having the token belong to _any_ player.
- Fixed only the first target being highlighted on hover. ([#5](https://github.com/MrVauxs/PF2e-Target-Damage/issues/5))
- Made the module override ignore targeting if the message comes from [PF2e Persistent Damage](https://github.com/CarlosFdez/pf2e-persistent-damage). ([#4](https://github.com/MrVauxs/PF2e-Target-Damage/issues/4))
  - Added a setting to replace the damage buttons with PF2e Target Damage buttons only for persistent damage.
- Fixed some holdover localization issues from Target Lock.

# 1.2.0

- Add token mystification based on "Tokens determine NPC name visibility" system setting.
- Added on hover and double click token selection on target names.
- Removed debug console logs.

# 1.1.1

- Fix styling on hidden target names.

# 1.1.0

- Fix localization breaking everything.
- Add setting to hide original system buttons. ([#1](https://github.com/MrVauxs/PF2e-Target-Damage/issues/1))

# 1.0.1

- Added back classes to buttons
- Added Module Management+ conflicts with Target Lock.
- Fixed localization issue with Shield Block.

# 1.0.0

Release!
