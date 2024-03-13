Hooks.once("ready", () => {
	ui.notifications.warn("PF2e Target Damage is no longer in development and has been superceded by PF2e Toolbelt. Please disable this module.", { permanent: true })
})

Hooks.once("init", () => {
	function reRenderDamageButtons() {
		const messages = game.messages
			.filter((w) => w instanceof ChatMessage) // Is a message
			.filter((w) => w.getFlag("pf2e-target-damage", "targets")?.length); // Is actually affected by pf2e-target-damage
		for (const message of messages) {
			ui.chat.updateMessage(message)
		}
	}
	game.settings.register("pf2e-target-damage", "targetButton", {
		scope: "client",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.targetButton.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.targetButton.hint"),
		type: Boolean,
		onChange: () => {
			reRenderDamageButtons();
		},
		default: false
	});
	game.settings.register("pf2e-target-damage", "hideNPCs", {
		scope: "world",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.hideNPCs.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.hideNPCs.hint"),
		type: Boolean,
		onChange: () => {
			reRenderDamageButtons();
		},
		default: false
	});
	game.settings.register("pf2e-target-damage", "hideTheHidingButtons", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.hideTheHidingButtons.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.hideTheHidingButtons.hint"),
		type: Boolean,
		onChange: () => {
			reRenderDamageButtons();
		},
		default: false
	});
	game.settings.register("pf2e-target-damage", "hideOGButtons", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.hideOGButtons.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.hideOGButtons.hint"),
		type: Boolean,
		onChange: () => {
			reRenderDamageButtons();
		},
		default: false
	});
	game.settings.register("pf2e-target-damage", "persistentDamageInt", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.persistentDamageInt.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.persistentDamageInt.hint"),
		type: Boolean,
		onChange: () => {
			reRenderDamageButtons();
		},
		default: true
	});
	game.settings.register("pf2e-target-damage", "classic", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.classic.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.classic.hint"),
		type: Boolean,
		onChange: () => {
			reRenderDamageButtons();
		},
		default: false
	});
});
