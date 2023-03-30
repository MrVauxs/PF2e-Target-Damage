<svelte:options accessors={true} />

<script>
	import { getContext } from "svelte";
	import { fade } from "svelte/transition";
    import { localize } from "../../../lib/utils";
	import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
	export let elementRoot = void 0;
	const application = getContext("#external").application;
	const target = application.splashTarget;
	let multiplier = application.multiplier;

	let splashTargets = [];

	$: updateSplashTargets(multiplier);

	function updateSplashTargets(multiplier) {
		let targets = target.tokensInRange(multiplier).filter((x) => x !== target.token.object);

		splashTargets = targets
	}
</script>

<ApplicationShell bind:elementRoot>
	<main>
		<div class="container">
			<input type="number" on:input={updateSplashTargets(multiplier)} bind:value={multiplier} />
			<input type="range" min="0" max="30" bind:value={multiplier} step="5" />
		</div>
		<ul class="targets">
			{#each splashTargets as splashed}
				<li class="target" transition:fade>
					<img
						src={splashed.document.texture.src}
						class="token-image"
						alt={splashed.name}
						style="
                transform: scale({splashed.document.texture.scaleX})"
					/>
					<div class="token-name">{splashed.name}</div>
					<div class="token-distance">{localize("pf2e-target-damage.splashButton.radiusDialog.away", {name: target.name, distance: target.token.object.distanceTo(splashed)})}</div>
				</li>
			{/each}
		</ul>
	</main>

	<footer class="container buttons">
		<!-- svelte-ignore missing-declaration -->
		<button
			type="submit"
			on:click={() => {
				splashTargets.forEach((x) => {
					x.control({ releaseOthers: false });
					game.canvas.ping(x.document.center);
				});
				application.close();
			}}>Target</button
		>
		<button type="submit" on:click={() => application.close()}>Close</button>
	</footer>
</ApplicationShell>

<style lang="scss">
    ul.targets {
        list-style: none;
        padding: 1em;
    }
    .token-distance {
        margin-left: 2em;
    }
	.target {
        margin: 0 0 1em 0;
		display: flex;
		align-items: center;
	}
    .token-name {
        margin-left: 1.5em;
    }
	.token-image {
		width: 5em;
		border: 0;
	}
	.buttons {
		flex: 0;
	}
	.container {
		display: flex;
	}
	input[type="range"] {
        margin-left: 0.25em;
        flex: 1;
		height: 2em;
	}
	input[type="number"] {
		width: 2em;
		height: 2em;
	}
</style>
