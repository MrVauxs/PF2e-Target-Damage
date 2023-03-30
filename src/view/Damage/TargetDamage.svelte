<script>
	import { gameSettings } from "../../settings.js";
	import { localize } from "../../lib/utils.js";
	export let targets = void 0;
	export let message = void 0;

	// Settings
	const classic = gameSettings.getWritableStore("classic");
	const showTripleDamage = game.settings.get("pf2e", "critFumbleButtons");

	console.log("Hello, world!", targets, message);
</script>

<div class="message-content">
	{#each targets as target}
		<wrapper class="pf2e-td" class:name-top={$classic} class:name-left={!$classic}>
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
					on:click|stopPropagation={() => console.log("Heck")}
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
