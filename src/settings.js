import { TJSGameSettings } from '@typhonjs-fvtt/svelte-standard/store';
import { localize } from './lib/utils.js';

const moduleID = "pf2e-target-damage";
export const gameSettings = new TJSGameSettings(moduleID);

Hooks.on("init", () => {
    gameSettings.register({
        namespace: moduleID,
        key: "classic",
        options: {
            scope: 'client',
            config: true,
            name: localize("pf2e-target-damage.settings.classic.name"),
            hint: localize("pf2e-target-damage.settings.classic.hint"),
            type: Boolean,
            default: false
        }
    });

    gameSettings.register({
        namespace: moduleID,
        key: "targetButton",
        options: {
            scope: "client",
            config: true,
            name: localize("pf2e-target-damage.settings.targetButton.name"),
            hint: localize("pf2e-target-damage.settings.targetButton.hint"),
            type: Boolean,
            default: false
        }
    });

    gameSettings.register({
        namespace: moduleID,
        key: "hideTheHidingButtons",
        options: {
            scope: "user",
            config: true,
            name: localize("pf2e-target-damage.settings.hideTheHidingButtons.name"),
            hint: localize("pf2e-target-damage.settings.hideTheHidingButtons.hint"),
            type: Boolean,
            default: false
        }
    });

    gameSettings.register({
        namespace: moduleID,
        key: "hideOGButtons",
        options: {
            scope: "user",
            config: true,
            name: localize("pf2e-target-damage.settings.hideOGButtons.name"),
            hint: localize("pf2e-target-damage.settings.hideOGButtons.hint"),
            type: Boolean,
            default: false
        }
    });

    gameSettings.register({
        namespace: moduleID,
        key: "hideNPCs",
        options: {
            scope: "world",
            config: true,
            name: localize("pf2e-target-damage.settings.hideNPCs.name"),
            hint: localize("pf2e-target-damage.settings.hideNPCs.hint"),
            type: Boolean,
            default: false
        }
    });
});