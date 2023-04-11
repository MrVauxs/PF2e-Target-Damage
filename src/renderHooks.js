import TargetDamageStore from "./lib/flagStores.js";
import TargetDamage from './view/TargetDamage.svelte';
import SplashButton from './view/Buttons/SplashButton.svelte';
import TargetButton from './view/Buttons/TargetButton.svelte';
import HideButton from './view/Buttons/HideButton.svelte';
import TargetSaves from './view/TargetSaves.svelte';
import Debug from "./debug.svelte"
//import GrabDamageButton from './view/Buttons/GrabDamageButton.svelte';

Hooks.on('renderChatMessage', (message, html) => {
    const DamageRoll = CONFIG.Dice.rolls.find((r) => r.name === "DamageRoll");
    const rolls = message.rolls.filter((roll) => roll instanceof DamageRoll);
    const props = { props: new TargetDamageStore(message) };
    props.props.html = html;

    if (props) {
        message._svelteTargetDamage = {};

        return message._svelteTargetDamage.debug = new Debug({ props, target: html[0].getElementsByClassName("message-content")[0] });
        // Is a Roll.
        rolls.forEach((roll, index) => {
            props.index = index;
            if (roll.options.splashOnly) {
                const target = html[0].getElementsByClassName("dice-roll damage-roll")[index].getElementsByClassName("dice-total")[0];
                const anchor = target.getElementsByClassName("total")[0];

                message._svelteTargetDamage.splashButton = new SplashButton({ target, props, anchor });
            } else {
                const target = html[0].getElementsByClassName("message-content")[0];
                const anchor = target.getElementsByClassName("damage-application")[0].nextSibling

                message._svelteTargetDamage.damageButtons = new TargetDamage({ target, props, anchor });

                if (message.isAuthor || message.isOwner) {
                    const target = html[0].getElementsByClassName("message-content")[0].getElementsByClassName("dice-total")[0];
                    const anchor = target.getElementsByClassName("total")[0];

                    message._svelteTargetDamage.targetButtons = new TargetButton({ target, props, anchor });
                };

                message._svelteTargetDamage.targetButtons = new HideButton({ target: html[0].getElementsByClassName("message-content")[0].getElementsByClassName("dice-total")[0], props });
            }
        });

        // Is Not a Roll.
        if (rolls.length < 1) {
            const target = html[0].getElementsByClassName("message-content")[0];

            // Is a saving throw spell.
            if (message.flags?.pf2e?.origin?.type === "spell" && message?.item?.system?.save?.value && !message.isRoll) {
                const target = html[0].getElementsByClassName("card-buttons")[0]
                const saveButton = target.querySelector('[data-action="save"]');
                const damageButton = target.querySelector('[data-action="spellDamage"]');

                jQuery(saveButton).wrap('<div class="spell-button pf2e-td target-section"></div>')
                jQuery(damageButton).wrap('<div class="spell-button pf2e-td target-section"></div>')

                if (message.isAuthor || message.isOwner) {
                    message._svelteTargetDamage.targetButtons = new TargetButton({ target: saveButton, props });
                    //message._svelteTargetDamage.grabDamageButtons = new GrabDamageButton({ target: damageButton, props });
                };

                message._svelteTargetDamage.saveButtons = new TargetSaves({ target, props, anchor: target.getElementsByClassName("owner-buttons")[0] });

                // Add hook to Damage
                jQuery(html[0]).find("[data-action='spellDamage']").click((e) => {
                    Hooks.once("preCreateChatMessage", (damageMessage) => {
                        damageMessage.updateSource({ "flags.pf2e-target-damage": { origin: message.id, targets: props.targets } });
                    });
                })
            }
        }
    }
});

Hooks.on('preDeleteChatMessage', (message) => {
    Object.keys(message?._svelteTargetDamage).forEach((key) => {
        if (typeof message?._svelteTargetDamage[key]?.$destroy === 'function') {
            message._svelteTargetDamage[key].$destroy();
        }
    });
});