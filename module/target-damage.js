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

// Flag what targets were at the time of the roll
Hooks.on("preCreateChatMessage", (message) => {
	if (message.flags.persistent) return;
	message.updateSource({
		"flags.pf2e-target-damage.targets": Array.from(game.user.targets).map((target) => {
			return {
				id: target.id,
				name: target.name,
				uuid: target.document.uuid,
				img: target.document.texture.src,
				hasPlayerOwner: target.document.hasPlayerOwner,
				playersCanSeeName: target.document.playersCanSeeName,
			}
		}),
	});
});

// borrowed from PF2e system, document.ts#210
function onHoverIn(token) {
	if (!canvas.ready) return;
	token = token?.object;
	if (token?.isVisible && !token.controlled) {
		token.emitHoverIn();
	}
}

function onHoverOut(token) {
	if (canvas.ready) token?.object?.emitHoverOut();
}

function onClickSender(token, event) {
	if (!canvas) return;
	token = token?.object;
	if (token?.isVisible && token.isOwner) {
		token.controlled ? token.release() : token.control({ releaseOthers: !event.shiftKey });
		// If a double click, also pan to the token
		if (event.type === "dblclick") {
			const scale = Math.max(1, canvas.stage.scale.x);
			canvas.animatePan({ ...token.center, scale, duration: 1000 });
		}
	}
}
// end

Hooks.on("renderChatMessage",
	async (message, html, data) => {
		if (!message.isDamageRoll) return;
		setTimeout(async () => {
			let targets = []

			// If message is from Persistent Damage module, there is only one target and that is the speaker
			if (message.rolls[0].options.evaluatePersistent) {
				targets = [{
					id: message.token.id,
					name: message.token.name,
					uuid: message.token.uuid,
					img: message.token.texture.src,
					hasPlayerOwner: message.token.hasPlayerOwner,
					playersCanSeeName: message.token.playersCanSeeName,
				}]
			} else {
				targets = message.getFlag('pf2e-target-damage', 'targets') ?? []
			}
			if (!targets.length) return;

			html.append("<div class='message-content' id='target-damage-chat-window'></div>")

			// sort by hasPlayerOwner so that players are first
			for (const [index, target] of targets.sort((x, y) => (x.hasPlayerOwner === y.hasPlayerOwner) ? 0 : x.hasPlayerOwner ? -1 : 1).entries()) {
				let tokenID = target.id

				// render template
				const innerHtml = await $(await renderTemplate("systems/pf2e/templates/dice/damage-roll.hbs", {
					showTripleDamage: game.settings.get("pf2e", "critFumbleButtons"),
				}));

				innerHtml.attr('id', 'target-damage-damage-buttons');
				if (!((await fromUuid(target.uuid))?.isOwner)) innerHtml.attr('data-visibility', 'gm');
				// #region get elements to target
				const full = innerHtml.find("button.full-damage");
				const half = innerHtml.find("button.half-damage");
				const double = innerHtml.find("button.double-damage");
				const triple = innerHtml.find("button.triple-damage");
				const heal = innerHtml.find("button.heal-damage");
				const contentSelector = `li.chat-message[data-message-id="${message.id}"] div.hover-content`;
				const $shield = innerHtml
					.find("button.shield-block")
					.attr({ "data-tooltip-content": contentSelector })
					.tooltipster({
						animation: "fade",
						trigger: "click",
						arrow: false,
						contentAsHtml: true,
						interactive: true,
						side: ["top"],
						theme: "crb-hover",
					});
				$shield.tooltipster("disable");
				innerHtml.find("button.shield-block").attr({ title: game.i18n.localize("PF2E.Actions.ShieldBlock.SelectAShield") });

				//Add click events to apply damage
				full.on("click", (event) => {
					applyDamage(message, tokenID, 1, 0, event.shiftKey);
				});

				half.on("click", (event) => {
					applyDamage(message, tokenID, 0.5, 0, event.shiftKey);
				});

				double.on("click", (event) => {
					applyDamage(message, tokenID, 2, 0, event.shiftKey);
				});

				triple === null || triple === void 0 ? void 0 : triple.on("click", (event) => {
				     applyDamage(message, tokenID, 3, 0, event.shiftKey);
				});

				heal.on("click", (event) => {
					applyDamage(message, tokenID, -1, 0, event.shiftKey);
				});

				$shield.on("click", async (event) => {
					const tokens = canvas.tokens.ownedTokens.filter((token) => token.data._id === tokenID && token.actor);
					if (tokens.length === 0) {
						const errorMsg = game.i18n.localize("PF2E.UI.errorTargetToken");
						ui.notifications.error(errorMsg);
						event.stopPropagation();
						return;
					}
					// If the actor is wielding more than one shield, have the user pick which shield to block for blocking.
					const actor = tokens[0].actor;
					const heldShields = actor.itemTypes.armor.filter((armor) => armor.isEquipped && armor.isShield);
					const nonBrokenShields = heldShields.filter((shield) => !shield.isBroken);
					const multipleShields = tokens.length === 1 && nonBrokenShields.length > 1;
					const shieldActivated = $shield.hasClass("shield-activated");
					if (multipleShields && !shieldActivated) {
						$shield.tooltipster("enable");
						// Populate the list with the shield options
						const $list = $buttons.find("ul.shield-options");
						$list.children("li").remove();
						const $template = $list.children("template");
						for (const shield of nonBrokenShields) {
							const $listItem = $($template.innerHtml());
							$listItem.children("input.data").val(shield.id);
							$listItem.children("span.label").text(shield.name);
							const hardnessLabel = game.i18n.localize("PF2E.ShieldHardnessLabel");
							$listItem.children("span.tag").text(`${hardnessLabel}: ${shield.hardness}`);
							$list.append($listItem);
						}
						$list.find("li input").on("change", (event) => {
							const $input = $(event.currentTarget);
							$shield.attr({ "data-shield-id": $input.val() });
							$shield.tooltipster("close").tooltipster("disable");
							$shield.addClass("shield-activated");
							CONFIG.PF2E.chatDamageButtonShieldToggle = true;
						});
						$shield.tooltipster("open");
						return;
					}
					else {
						$shield.tooltipster("disable");
						$shield.removeAttr("data-shield-id");
						event.stopPropagation();
					}
					$shield.toggleClass("shield-activated");
					CONFIG.PF2E.chatDamageButtonShieldToggle = !CONFIG.PF2E.chatDamageButtonShieldToggle;
				});

				if (game.settings.get("pf2e", "metagame_tokenSetsNameVisibility") && !target.playersCanSeeName && !game.user.isGM) target.name = `Unknown Token ${index + 1}`;

				const nameHTML = $(`<div data-visibility='${game.settings.get('pf2e-target-damage', 'hideNPCs') ? !target.hasPlayerOwner ? "gm" : "all" : "all"}' id='target-damage-target-name'>Target: ${target.name}</div>`)
				nameHTML.mouseenter(async (event) => onHoverIn(await fromUuid(target.uuid), event));
				nameHTML.mouseleave(async (event) => onHoverOut(await fromUuid(target.uuid), event));
				nameHTML.dblclick(async (event) => onClickSender(await fromUuid(target.uuid), event));

				html.find('#target-damage-chat-window').append(nameHTML);
				html.find('#target-damage-chat-window').append(innerHtml);

				setTimeout(async () => {
					// Persistent Damage Integration
					if (game.modules.get("pf2e-persistent-damage")?.active && message.rolls[0].instances.some((i) => i.persistent) && !("evaluatePersistent" in roll.options)) {
						let applyConditionButton = html.find(".pf2e-pd-card").eq(index + 1).children().children()

						if (!applyConditionButton.length) {
							const template = await renderTemplate("modules/pf2e-persistent-damage/templates/chat/apply-persistent-button.html");
							html.find("#target-damage-chat-window").append(template);
							applyConditionButton = html.find(".pf2e-pd-card").eq(index + 1).children().children()
						}

						applyConditionButton.on("click", async (evt) => {
							evt.preventDefault();
							const token = await fromUuid(target.uuid);
							const instances = message.rolls[0].instances.filter((i) => i.persistent);
							const conditions = instances.map((instance) => {
								const damageType = instance.type;
								const formula = instance.head.expression;
								const dc = 15; // from a message, the dc is always 15

								return {
									type: "condition",
									name: "Persistent Damage",
									system: {
										slug: "persistent-damage",
										removable: true,
										persistent: {
											damageType, formula, dc
										}
									}
								}
							});

							token.actor?.createEmbeddedDocuments("Item", conditions);
						})
					}
				}, 50);
			};

			html.find(".select-shield").hide()
			if (!game.user.isGM) html.find("[data-visibility=gm]").hide();

			html.find("#target-damage-chat-window").find(".dice-roll.damage-roll").remove()
			html.find("#target-damage-chat-window").find("div.damage-application").not("#target-damage-damage-buttons").remove()

			const hideDamageButton = $("<button id='target-damage-hide-button'></div>").click(function() {
				// find the button, get it's parent, then get all the children of that parent that aren't the button, and toggle them.
				$(this)
					.parent()
					.children()
					.not("#target-damage-hide-button")
				.toggle();

				// find the pf2e persistent damage button
				$(this)
					.parent()
					.parent()
					.find(".pf2e-pd-card")
				.toggle();

				// Toggle the button's icon
				$(this).find(".fa").toggleClass('fa-plus fa-minus');

				// Toggle the parent's alignment and other things
				$(this).parent().toggleClass('hidden');
			}).append("<i class='fa fa-minus fa-2xs'></i>")

			const hideDamageButtonRight = $("<button id='target-damage-hide-button'></div>").click(function() {
				// find the button, get it's parent, then get all the children of that parent that aren't the button, and toggle them.
				$(this)
					.parent()
					.children()
					.not("#target-damage-hide-button")
				.toggle();

				// find the pf2e persistent damage button
				$(this)
					.parent()
					.parent()
					.find(".pf2e-pd-card")
				.toggle();

				// Toggle the button's icon
				$(this).find(".fa").toggleClass('fa-plus fa-minus');

				// Toggle the parent's alignment and other things
				$(this).parent().toggleClass('hidden right');
			}).append("<i class='fa fa-minus fa-2xs'></i>")

			// Add a button to hide the damage buttons
			html.find(".damage-application:not(#target-damage-damage-buttons)").prepend(hideDamageButton)
			html.find(".damage-application#target-damage-damage-buttons").append(hideDamageButtonRight)

			if (game.settings.get('pf2e-target-damage', 'hideTheHidingButtons')) {
				// REMOVE the original buttons, whether it's the main one or the persistent damage one.
				html.find("[id*=target-damage-hide-button]").remove()
			}

			// Hide buttons after HOPEFULLY EVERYTHING has been RENDERED
			setTimeout(() => {
				if (game.settings.get('pf2e-target-damage', 'hideOGButtons') || (message.rolls[0].options.evaluatePersistent && game.settings.get('pf2e-target-damage', 'persistentDamageInt'))) {
					// Hide the original buttons, whether it's the main one or the persistent damage one.
					html.find("#target-damage-hide-button").first().trigger("click")
				}
			}, 100);
		}, 0);
	}
);

async function applyDamage(message, tokenID, multiplier, adjustment = 0, promptModifier = false) {
	if (promptModifier) return shiftModifyDamage(message, tokenID, multiplier);
	// Modified here to include TokenID
	const tokens = canvas.tokens.ownedTokens.filter((token) => token.document._id === tokenID && token.actor);
	if (tokens.length === 0) {
		const errorMsg = game.i18n.localize("pf2e-target-damage.error.cantFindToken");
		ui.notifications.error(errorMsg);
		return;
	}

	const shieldBlockRequest = CONFIG.PF2E.chatDamageButtonShieldToggle;
	const roll = message.rolls.find((r) => r.constructor.name === "DamageRoll");

	if (!roll) throw Error("Unexpected error retrieving damage roll");
	for (const token of tokens) {
        await token.actor?.applyDamage({
            damage: roll,
            token: token.document,
            adjustment,
            multiplier,
            shieldBlockRequest,
        });
    }
	toggleOffShieldBlock(message.id);
}

function shiftModifyDamage(message, tokenID, multiplier) {
	new Dialog({
		title: game.i18n.localize("PF2E.UI.shiftModifyDamageTitle"),
		content: `<form>
				<div class="form-group">
					<label>${game.i18n.localize("PF2E.UI.shiftModifyDamageLabel")}</label>
					<input type="number" name="modifier" value="" placeholder="0">
				</div>
				</form>
				<script type="text/javascript">
				$(function () {
					$(".form-group input").focus();
				});
				</script>`,
		buttons: {
			ok: {
				label: "Ok",
				callback: async ($dialog) => {
					// In case of healing, multipler will have negative sign. The user will expect that positive
					// modifier would increase healing value, while negative would decrease.
					const adjustment = (Number($dialog.find('[name="modifier"]').val()) || 0) * Math.sign(multiplier);
					applyDamage(message, tokenID, multiplier, adjustment);
				},
			},
		},
		default: "ok",
		close: () => {
			toggleOffShieldBlock(message.id);
		},
	}).render(true);
}
/** Toggle off the Shield Block button on a damage chat message */
function toggleOffShieldBlock(messageId) {
	const $message = $(`#chat-log > li.chat-message[data-message-id="${messageId}"]`);
	const $button = $message.find("button.shield-block");
	$button.removeClass("shield-activated");
	CONFIG.PF2E.chatDamageButtonShieldToggle = false;
}

