<script>
	/* global game */
	import { TargetDamageTarget } from "../../lib/target";
	import { localize } from "../../lib/utils";
	import { gameSettings } from "../../settings.js";
	export let props = void 0;

	let message = props._message;
	let writableTargets = $props;

	// Settings
	const targetButton = gameSettings.getReadableStore("targetButton");

	function updateMessageWithFlags(message, event) {
		const targetsFlags = message.flags["pf2e-target-damage"].targets;
		const targetsCurrent = Array.from(game.user.targets);
		let targetsFinal = [];

		targetsFinal.push(...targetsFlags);
		targetsFinal.push(...targetsCurrent);

		if ($targetButton) {
			// Replace by default, Shift to Add
			if (!(event.type === "contextmenu" || event.shiftKey)) {
				// Removes non-current targets
				targetsFinal = targetsFinal.filter((target) =>
					targetsCurrent.find((current) => current?.id === target?.id)
				);
			} else if (!targetsCurrent.length) {
				return ui.notifications.error(localize("pf2e-target-damage.noTargets"));
			}
		} else {
			// Add by default, Shift to Replace
			if (event.type === "contextmenu" || event.shiftKey) {
				// Removes non-current targets
				targetsFinal = targetsFinal.filter((target) =>
					targetsCurrent.find((current) => current?.id === target?.id)
				);
			} else if (!targetsCurrent.length) {
				return ui.notifications.error(localize("pf2e-target-damage.noTargets"));
			}
		}

		// De-duplicate
		targetsFinal = [...new Set(targetsFinal.map((target) => target.id))].map((id) =>
			targetsFinal.find((target) => target.id === id)
		);

		message.update({
			flags: {
				"pf2e-target-damage": {
					targets: targetsFinal.map((target) => {
						return {
							id: target.id,
							tokenUuid: target.tokenUuid || target.document.uuid,
							actorUuid: target.actorUuid || target.actor.uuid,
							roll: target.roll,
							damage: target.damage,
							applied: target.applied,
							debugOwner: target.debugOwner,
						};
					}),
				},
			},
		});

		writableTargets = targetsFinal.map((x) => new TargetDamageTarget(x));
	}
</script>

<button
	type="button"
	on:click|stopPropagation={(e) => updateMessageWithFlags(message, e)}
	on:contextmenu|stopPropagation|preventDefault={(e) => updateMessageWithFlags(message, e)}
	class="pf2e-td target-button small-button"
	title={localize("pf2e-target-damage.targetButton.hint-" + $targetButton)}
>
	<i class="fa-solid fa-crosshairs-simple fa-fw" />
</button>
