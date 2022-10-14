Hooks.on("init", async () => {
	game.settings.register("pf2e-target-damage", "hideNPCs", {
		scope: "world",
		config: true,
		name: "Hide non-Player Token Targets",
		hint: "Hides not owned by players tokens from the target list of a damage roll.",
		type: Boolean,
		default: false
	});
	game.settings.register("pf2e-target-damage", "hideOGButtons", {
		scope: "world",
		config: true,
		name: "Hide Original PF2e Damage Buttons",
		hint: "Hides original PF2e system damage buttons for those from Damage Target.",
		type: Boolean,
		default: false
	});
	game.settings.register("pf2e-target-damage", "persistentDamageInt", {
		scope: "world",
		config: true,
		name: "Integrate with Persistent Damage",
		hint: "Hides the original PF2e system damage buttons for those from Damage Target, but only for the PF2e Persistent Damage damage rolls.\nIs overriden by 'Hide Original PF2e Damage Buttons' setting.",
		type: Boolean,
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
				hasPlayerOwner: target.data.hasPlayerOwner,
				playersCanSeeName: target.data.playersCanSeeName,
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
		let targets

		// If message is from Persistent Damage module, there is only one target and that is the speaker
		if (message.flags.persistent) {
			targets = [{
				id: message.token.id,
				name: message.token.name,
				uuid: message.token.uuid,
				img: message.token.texture.src,
				hasPlayerOwner: message.token.hasPlayerOwner,
				playersCanSeeName: message.token.playersCanSeeName,
			}]
		} else {
			targets = message.getFlag('pf2e-target-damage', 'targets')
		}

		if (!targets.length) return;

		html.append("<div class='message-content' id='target-damage-chat-window'></div>")

		for (const [index, target] of targets.sort(function (x, y) {
			// sort by hasPlayerOwner so that players are first
			return (x.hasPlayerOwner === y.hasPlayerOwner) ? 0 : x.hasPlayerOwner ? -1 : 1;
		}).entries()) {
			let tokenID = target.id

			//render template
			const innerHtml = $(await renderTemplate("systems/pf2e/templates/chat/damage/buttons.html", {
				showTripleDamage: game.settings.get("pf2e", "critFumbleButtons"),
			}));

			innerHtml.attr('id', 'target-damage-damage-buttons');
			if (!(await fromUuid(target.uuid)).isOwner) innerHtml.attr('data-visibility', 'gm');
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

			// triple === null || triple === void 0 ? void 0 : triple.on("click", (event) => {
			//     applyDamage(message, tokenID, 3, 0, event.shiftKey);
			// });

			heal.on("click", (event) => {
				applyDamage(message, tokenID, -1, 0, event.shiftKey);
			});

			$shield.on("click", async (event) => {
				console.info(`Toggle Shield for TokenID: ${tokenID}`);
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

			if (game.settings.get("pf2e", "metagame.tokenSetsNameVisibility") && !target.playersCanSeeName && !game.user.isGM) target.name = `Unknown Token ${index + 1}`;

			const nameHTML = $(`<div data-visibility='${game.settings.get('pf2e-target-damage', 'hideNPCs') ? !target.hasPlayerOwner ? "gm" : "all" : "all"}' id='target-damage-target-name'>Target: ${target.name}</div>`)
			nameHTML.mouseenter(async (event) => onHoverIn(await fromUuid(target.uuid), event));
			nameHTML.mouseleave(async (event) => onHoverOut(await fromUuid(target.uuid), event));
			nameHTML.dblclick(async (event) => onClickSender(await fromUuid(target.uuid), event));

			html.find('#target-damage-chat-window').append(nameHTML)
			html.find('#target-damage-chat-window').append(innerHtml);
		};

		html.find(".select-shield").hide()
		if (!game.user.isGM) html.find("[data-visibility=gm]").hide()
		html.find("#target-damage-chat-window").find("div.chat-damage-buttons").first().remove();
		if (game.settings.get('pf2e-target-damage', 'hideOGButtons') || (message.flags.persistent && game.settings.get('pf2e-target-damage', 'persistentDamageInt'))) html.find("div.chat-damage-buttons").first().remove();
	});

async function applyDamage(message, tokenID, multiplier, adjustment = 0, promptModifier = false) {
	console.group("target-damage | Apply Damage");
	console.info(`Message ID: ${message.id}`);
	console.info(`Token ID: ${tokenID}`);
	console.info(`Base Damage': ${message.rolls[0].total}`);
	console.info(`Multiplier: ${multiplier}`);
	console.info(`Adjustment: ${adjustment}`);
	console.info(`Total Damage: ${message.rolls[0].total * multiplier + adjustment}`);
	console.groupEnd();
	var _a;
	if (promptModifier)
		return shiftModifyDamage(message, tokenID, multiplier);
	//Modified here to include TokenID
	const tokens = canvas.tokens.ownedTokens.filter((token) => token.document._id === tokenID && token.actor);
	if (tokens.length === 0) {
		const errorMsg = game.i18n.localize("PF2E.UI.errorTargetToken");
		ui.notifications.error(errorMsg);
		return;
	}
	const shieldBlockRequest = CONFIG.PF2E.chatDamageButtonShieldToggle;
	const damage = message.rolls[0].total * multiplier + adjustment;
	for (const token of tokens) {
		await ((_a = token.actor) === null || _a === void 0 ? void 0 : _a.applyDamage(damage, token, shieldBlockRequest));
	}
	toggleOffShieldBlock(message.id);
}

function shiftModifyDamage(message, tokenID, multiplier) {
	console.info("target-damage | Modify Damage");
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
	console.info("target-damage | ToggleOffShieldBlock");
	const $message = $(`#chat-log > li.chat-message[data-message-id="${messageId}"]`);
	const $button = $message.find("button.shield-block");
	$button.removeClass("shield-activated");
	CONFIG.PF2E.chatDamageButtonShieldToggle = false;
}

