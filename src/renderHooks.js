import { TargetDamageTarget } from "./lib/target.js";
import TargetDamage from './view/Damage/TargetDamage.svelte';
import SplashButton from './view/Buttons/SplashButton.svelte';
import TargetButton from './view/Buttons/TargetButton.svelte';
import HideButton from './view/Buttons/HideButton.svelte';
import { writable } from "svelte/store";


/**
 * Returns the flag data for the given message.
 *
 * @param {ChatMessage} message Message
 *
 * @returns {object} Flag data
 */
function getFlagData(message) {
    const flagData = message.getFlag('pf2e-target-damage', 'targets');

    if (Array.isArray(flagData)) {
        const targets = flagData.map((target) => {
            return new TargetDamageTarget(target);
        });

        const writableTargets = writable(targets);

        return { targets, message, writableTargets };
    }

    return false;
}

Hooks.on('renderChatMessage', (message, html) => {
    const DamageRoll = CONFIG.Dice.rolls.find((r) => r.name === "DamageRoll");
    const rolls = message.rolls.filter((roll) => roll instanceof DamageRoll);
    const flagData = getFlagData(message);

    if (flagData) {
        message._svelteTargetDamage = {};

        rolls.forEach((roll, index) => {
            flagData.index = index;
            flagData.html = html;
            if (roll.options.splashOnly) {
                const target = html[0].getElementsByClassName("dice-roll damage-roll")[index].getElementsByClassName("dice-total")[0];
                const anchor = target.getElementsByClassName("total")[0];

                message._svelteTargetDamage.splashButton = new SplashButton({ target, props: flagData, anchor });
            } else {
                const target = html[0].getElementsByClassName("message-content")[0];
                const anchor = target.getElementsByClassName("damage-application")[0].nextSibling

                message._svelteTargetDamage.damageButtons = new TargetDamage({ target, props: flagData, anchor });

                if (message.isAuthor || message.isOwner) {
                    const target = html[0].getElementsByClassName("message-content")[0].getElementsByClassName("dice-total")[0];
                    const anchor = target.getElementsByClassName("total")[0];

                    message._svelteTargetDamage.targetButtons = new TargetButton({ target, props: flagData, anchor });
                };

                message._svelteTargetDamage.targetButtons = new HideButton({ target: html[0].getElementsByClassName("message-content")[0].getElementsByClassName("dice-total")[0], props: flagData });
            }
        });
    }
});

Hooks.on('preDeleteChatMessage', (message) => {
    const flagData = getFlagData(message);

    if (flagData && typeof message?._svelteTargetDamage?.$destroy === 'function') {
        message._svelteTargetDamage.$destroy();
    }
});

/**
 * This hook is necessary for _modules_ that include Svelte components attached to chat messages. As things go on
 * initial setup and rendering of Foundry the chat log is rendered before modules initially can register for the
 * `renderChatMessage` hook. This hook is _not_ necessary for game systems as systems are initialized / loaded before
 * Foundry core renders the chat log for the first time.
 */
/* Hooks.once('ready', () => {
    for (const message of game.messages) {
        const flagData = getFlagData(message);

        if (flagData && !message._svelteComponent) {
            const el = document.querySelector(`.message[data-message-id="${message.id}"] .message-content`);
            if (el instanceof HTMLElement) {
                message._svelteComponent = new TargetDamage({ target: el, props: flagData });
            }
        }
    }

    // Scroll chat log to bottom.
    ui.chat.scrollBottom();
}); */