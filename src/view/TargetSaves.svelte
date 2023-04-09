<script>
	/* global game */
	import { gameSettings } from "../settings.js";
	import { localize } from "../lib/utils.js";
	export let message = void 0;
	export let html = void 0;
	export let writableTargets = void 0;

	const classic = gameSettings.getWritableStore("classic");

	const spell = message.item;
	const save = spell?.system?.save?.value;

	function getText(target) {
		let text = "";
		let outcome = "";
		if (target.roll && game.messages.get(target.roll)?.isContentVisible) {
			outcome = game.messages.get(target.roll).flags.pf2e.context.outcome;
			text = outcome ? localize(`PF2E.Check.Result.Degree.Check.${outcome}`) : "Error!";
		} else {
			text = game.i18n.format("PF2E.SavingThrowWithName", {
				saveName: localize(`PF2E.Saves${save.charAt(0).toUpperCase() + save.slice(1)}`),
			});
		}
		return { text, outcome };
	}

	function rollSave(target, e) {
		if (!target.isOwner) return;
		const item = spell;
		const actor = target.actor?.actor ?? target.actor;

		const saveType = item.system.save.value;

		const dc = Number(html[0].querySelector('[data-action="save"]').getAttribute("data-dc") ?? "NaN");
		const itemTraits = item.system.traits?.value ?? [];

		const save = actor?.saves?.[saveType];
		if (!save) return;

		const rollOptions = [];
		if (item.isOfType("spell")) {
			rollOptions.push("magical", "spell");
			if (Object.keys(item.system.damage.value).length > 0) {
				rollOptions.push("damaging-effect");
			}
		}

		rollOptions.push(...itemTraits);
		rollOptions.push("pf2e-td-" + message.id);

		function eventToRollParams(event) {
			var skipDefault = !game.user.settings.showRollDialogs;
			if (!event) return { skipDialog: skipDefault };
			var params = { skipDialog: event.shiftKey ? !skipDefault : skipDefault };
			if (event.ctrlKey || event.metaKey) params.rollMode = "blindroll";
			return params;
		}

		const rollParams = {
			...eventToRollParams(e),
			dc: Number.isInteger(dc) ? { value: Number(dc) } : null,
			item,
			origin: actor,
			extraRollOptions: rollOptions,
		};

		save.check.roll(rollParams);
	}
</script>

{#each $writableTargets as target}
	<!-- svelte-ignore missing-declaration -->
	{#if game.user.isGM || target.visibility}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<wrapper class="pf2e-td" class:name-top={$classic} class:name-left={!$classic}>
			<span
				class="pf2e-td name"
				on:mouseenter={(e) => {
					target.onHoverIn();
					if (e.ctrlKey) {
						game.tooltip.activate(e.target, { text: localize("pf2e-target-damage.removeTarget") });
					} else {
						game.tooltip.activate(e.target, { text: target.name });
					}
				}}
				on:click={(e) => {
					if (e.ctrlKey) {
						message.update({
							flags: {
								"pf2e-target-damage": {
									targets: $writableTargets.filter((t) => t.token.id !== target.token.id),
								},
							},
						});
						game.tooltip.deactivate();
					}
				}}
				on:dblclick={target.onClickSender()}
				on:mouseleave={target.onHoverOut()}
				data-tooltip-direction="LEFT"
			>
				{target.name}
			</span>
			<button
				class="pf2e-td save"
				data-target-type={target.actor.hasPlayerOwner ? "pc" : "npc"}
				class:applied={!target.isOwner}
				on:click={(e) => rollSave(target, e)}
			>
				{getText(target).text}
			</button>
		</wrapper>
	{/if}
{/each}

<style>
	.pf2e-td.save.applied {
		box-shadow: none;
		cursor: no-drop;
	}
</style>
