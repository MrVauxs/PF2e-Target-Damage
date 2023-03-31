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
});