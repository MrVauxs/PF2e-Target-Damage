<script>
	import { gameSettings } from "../../settings.js";
	import { DamageRoll, localize } from "../../lib/utils.js";
	export let targets = void 0;
	export let message = void 0;
	export let index = void 0;

	// Settings
	const classic = gameSettings.getWritableStore("classic");
	const showTripleDamage = game.settings.get("pf2e", "critFumbleButtons");

	console.log("Hello, world!", targets, message, index);

	async function applyDamage(message, tokenID, multiplier, addend = 0, promptModifier = false, rollIndex = 0) {
		if (promptModifier) return shiftModifyDamage(message, tokenID, multiplier, rollIndex);
		// Modified here to include TokenID
		const tokens = canvas.tokens.ownedTokens.filter((token) => token.document._id === tokenID && token.actor);
		// End modif
		if (tokens.length === 0) {
			const errorMsg = game.i18n.localize("pf2e-target-damage.error.cantFindToken");
			ui.notifications.error(errorMsg);
			return;
		}

		const shieldBlockRequest = CONFIG.PF2E.chatDamageButtonShieldToggle;
		const roll = message.rolls.at(rollIndex);

		if (!(roll instanceof DamageRoll)) throw Error("Unexpected error retrieving damage roll");

		const damage = multiplier < 0 ? multiplier * roll.total + addend : roll.alter(multiplier, addend);

		for (const token of tokens) {
			await token.actor?.applyDamage({
				damage,
				token: token.document,
				skipIWR: multiplier <= 0,
				rollOptions: new Set(message.flags.pf2e.context?.options ?? []),
				shieldBlockRequest,
			});
		}
		// TODO: Shield Blocking, Other Buttons
		toggleOffShieldBlock(message.id);
	}
</script>

<div class="message-content">
	{#each targets as target}
		<wrapper class="pf2e-td" class:name-top={$classic} class:name-left={!$classic}>
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-mouse-events-have-key-events -->
			<span
				class="pf2e-td name"
				data-tooltip-direction="LEFT"
				data-tooltip={target.name}
				on:click={target.onClickSender()}
				on:dblclick={(e) => target.onClickSender(target.token, e)}
				on:mouseover={target.onHoverIn()}
				on:mouseout={target.onHoverOut()}
			>
				{target.token.name}
			</span>
			<section class="pf2e-td damage-application">
				<button
					type="button"
					class="pf2e-td full-damage"
					title="{localize('PF2E.DamageButton.Full')}&#013;{localize('PF2E.DamageButton.Adjust')}"
					on:click|stopPropagation={(e) => applyDamage(message, target.token?.id, 1, 0, e.shiftKey, index)}
				>
					<i class="fa-solid fa-heart-broken fa-fw" />
					<span class="label">{localize("PF2E.DamageButton.FullShort")}</span>
				</button>
				<button
					type="button"
					class="pf2e-td half-damage"
					title="{localize('PF2E.DamageButton.Half')}&#013;{localize('PF2E.DamageButton.Adjust')}"
				>
					<i class="fa-solid fa-heart-broken fa-fw" />
					<span class="transparent-half" />
					<span class="label">{localize("PF2E.DamageButton.HalfShort")}</span>
				</button>
				<button
					type="button"
					class="pf2e-td double-damage"
					title="{localize('PF2E.DamageButton.Double')}&#013;{localize('PF2E.DamageButton.Adjust')}"
				>
					<img src="systems/pf2e/icons/damage/double.svg" alt={localize("PF2E.DamageButton.Double")} />
					<span class="label">{localize("PF2E.DamageButton.DoubleShort")}</span>
				</button>
				{#if showTripleDamage}
					<button
						type="button"
						class="pf2e-td triple-damage"
						title="{localize('PF2E.DamageButton.Triple')}&#013;{localize('PF2E.DamageButton.Adjust')}"
					>
						<img src="systems/pf2e/icons/damage/triple.svg" alt={localize("PF2E.DamageButton.Triple")} />
						<span class="label">{localize("PF2E.DamageButton.TripleShort")}</span>
					</button>
				{/if}
				<button
					type="button"
					class="pf2e-td shield-block dice-total-shield-btn"
					title={localize("PF2E.DamageButton.ShieldBlock")}
				>
					<i class="fa-solid fa-shield-alt fa-fw" />
					<span class="label">{localize("PF2E.DamageButton.ShieldBlockShort")}</span>
				</button>
				<button
					type="button"
					class="pf2e-td heal-damage"
					title="{localize('PF2E.DamageButton.Healing')}&#013;{localize('PF2E.DamageButton.Adjust')}"
				>
					<span class="fa-stack fa-fw">
						<i class="fa-solid fa-heart fa-stack-2x" />
						<i class="fa-solid fa-plus fa-inverse fa-stack-1x" />
					</span>
					<span class="label">{localize("PF2E.DamageButton.HealingShort")}</span>
				</button>
			</section>
		</wrapper>
		<div class="hover-content select-shield">
			<div class="sidebar_title">
				<h2>{localize("PF2E.Actions.ShieldBlock.selectAShield")}</h2>
			</div>
			<ul class="pf2e-td shield-options">
				<template>
					<li class="item">
						<input class="data" name="shield-id" type="radio" value="" />
						<span class="label" />
						<span class="tag" />
					</li>
				</template>
			</ul>
		</div>
	{/each}
</div>
