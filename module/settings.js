Hooks.on("init", async () => {
	game.settings.register("pf2e-target-damage", "hideNPCs", {
		scope: "world",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.hideNPCs.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.hideNPCs.hint"),
		type: Boolean,
		requiresReload: true,
		default: false
	});
	game.settings.register("pf2e-target-damage", "hideTheHidingButtons", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.hideTheHidingButtons.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.hideTheHidingButtons.hint"),
		type: Boolean,
		requiresReload: true,
		default: false
	});
	game.settings.register("pf2e-target-damage", "hideOGButtons", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.hideOGButtons.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.hideOGButtons.hint"),
		type: Boolean,
		requiresReload: true,
		default: false
	});
	game.settings.register("pf2e-target-damage", "persistentDamageInt", {
		scope: "user",
		config: true,
		name: game.i18n.localize("pf2e-target-damage.settings.persistentDamageInt.name"),
		hint: game.i18n.localize("pf2e-target-damage.settings.persistentDamageInt.hint"),
		type: Boolean,
		requiresReload: true,
		default: true
	});
});