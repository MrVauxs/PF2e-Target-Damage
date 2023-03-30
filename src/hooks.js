import TargetDamage from './view/TargetDamage.svelte';

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
        return { targets: flagData };
    }

    return false;
}

/**
 * This hook is necessary for _modules_ that include Svelte components attached to chat messages. As things go on
 * initial setup and rendering of Foundry the chat log is rendered before modules initially can register for the
 * `renderChatMessage` hook. This hook is _not_ necessary for game systems as systems are initialized / loaded before
 * Foundry core renders the chat log for the first time.
 */
Hooks.once('ready', () => {
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
});

Hooks.on('renderChatMessage', (message, html) => {
    const flagData = getFlagData(message);

    if (flagData) {
        message._svelteComponent = new TargetDamage({ target: html[0], props: flagData });
    }
});

Hooks.on('preDeleteChatMessage', (message) => {
    const flagData = getFlagData(message);

    if (flagData && typeof message?._svelteComponent?.$destroy === 'function') {
        message._svelteComponent.$destroy();
    }
});