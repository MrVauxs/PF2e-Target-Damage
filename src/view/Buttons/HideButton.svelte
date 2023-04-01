<script>
	import { localize } from "../../lib/utils";
	export let html = void 0;
	export let index = void 0;
	export let writableTargets = void 0;
	import { gameSettings } from "../../settings.js";
	import { fade } from "svelte/transition";

	let icon = false;
	let hideButton = gameSettings.getReadableStore("hideTheHidingButtons");
	let auto = gameSettings.getReadableStore("hideOGButtons");

	function hide(hide = false) {
		// TODO: Replace with actual javascript
		const buttons = jQuery(html).find('section[data-roll-index="' + index + '"]');
		if (hide) {
			buttons.slideUp(350, () => {
				icon = Boolean(buttons[0].style.display);
			});
		} else {
			buttons.slideToggle(350, () => {
				icon = Boolean(buttons[0].style.display);
			});
		}
	}

	$: if ($auto) {
		hide(true);
	}
</script>

<button
	class="pf2e-td hide-button small-button"
	title={!icon ? localize("pf2e-target-damage.hideButton") : localize("pf2e-target-damage.showButton")}
	on:click|stopPropagation|preventDefault={() => hide()}
	style={$hideButton || !$writableTargets.length ? "display: none" : ""}
>
	{#if icon}
		<i class="fa fa-fw fa-eye" transition:fade={{ duration: 350 }} />
	{:else}
		<i class="fa fa-fw fa-eye-slash" transition:fade={{ duration: 350 }} />
	{/if}
</button>

<style>
	i {
		position: absolute;
	}
</style>
