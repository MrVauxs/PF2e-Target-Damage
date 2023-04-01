<svelte:options accessors={true} />

<script>
	import { getContext } from "svelte";
	import { fade } from "svelte/transition";
	import { localize } from "../../../lib/utils";
	import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
	export let elementRoot = void 0;
	const application = getContext("#external").application;
	const targets = application.splashTargets;
	let multiplier = application.multiplier;

	let splashTargets = [];
	let target = targets[0];

	$: updateSplashTargets(multiplier);

	function updateSplashTargets(multiplier) {
		const targets = target.tokensInRange(multiplier).filter((x) => x !== target.token.object);
		splashTargets = targets;
	}
</script>

<ApplicationShell bind:elementRoot>
	<main>
		<div class="container">
			<select bind:value={target} on:change={updateSplashTargets(multiplier)}>
				{#each targets as target}
					<option value={target}>{target.name}</option>
				{/each}
			</select>
			<input type="number" on:input={updateSplashTargets(multiplier)} bind:value={multiplier} />
			<input type="range" min="0" max="30" bind:value={multiplier} step="5" />
		</div>
		<table class="targets">
			{#each splashTargets as splashed}
				<tr class="target" transition:fade|local>
					<img
						src={splashed.document.texture.src}
						class="token-image"
						alt={splashed.name}
						style="transform: scale({splashed.document.texture.scaleX})"
					/>
					<td class="token-name">{splashed.name}</td>
					<td class="token-distance">
						{localize("pf2e-target-damage.splashButton.radiusDialog.away", {
							name: target.name,
							distance: target.token.object.distanceTo(splashed),
						})}
					</td>
				</tr>
			{/each}
		</table>
	</main>

	<!-- svelte-ignore missing-declaration -->
	<footer class="container buttons">
		<button
			type="submit"
			on:click={() => {
				splashTargets.forEach((x, index) => {
					x.control({ releaseOthers: index === 0 ? true : false });
					game.canvas.ping(x.document.center);
				});
				application.close();
			}}
		>
			{localize("CONTROLS.BasicSelect")}
		</button>
		<button
			type="submit"
			on:click={() => {
				splashTargets.forEach((x, index) => {
					x.setTarget(true, { releaseOthers: index === 0 ? true : false });
					game.canvas.ping(x.document.center);
				});
				application.close();
			}}
		>
			{localize("CONTROLS.TargetSelect")}
		</button>
	</footer>
</ApplicationShell>

<style lang="scss">
	.token-image {
		width: 7.5em;
		border: 0;
	}
	.token-distance {
		text-align: left;
		padding: 0 1em;
	}
	.token-name {
		font-weight: bold;
		font-size: 1.25em;
		text-align: center;
		padding: 0 1em 0 2em;
	}
	.container {
		display: flex;
	}
	select {
		flex: 1;
		z-index: 1;
		height: 2em;
		border-radius: 3px 0 0 3px;
	}
	input[type="range"] {
		flex: 1;
		z-index: 1;
		height: 2em;
		margin-left: 0.25em;
	}
	input[type="number"] {
		z-index: 1;
		width: 2em;
		height: 2em;
		border-radius: 0 3px 3px 0;
	}
</style>
