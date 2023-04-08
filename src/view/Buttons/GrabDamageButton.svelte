<script>
	import { localize } from "../../lib/utils";
	import TargetDamage from "../Damage/TargetDamage.svelte";
	import { getFlagData } from "../../renderHooks";
	export let targets = void 0;
	export let message = void 0;

	async function cloneButtons() {
		const html = await message.getHTML();
		const damageMessage = game.messages.get(targets[0].damage);
		if (!damageMessage) return ui.notifications.error(localize("pf2e-target-damage.error.cantFindMessage"));

		const target = html[0].getElementsByClassName("card-buttons")[0];
		const damageButton = target.querySelector('[data-action="spellDamage"]');

		jQuery(damageButton).wrap('<div class="spell-button pf2e-td target-section"></div>');
		// Doesn't work
		const props = getFlagData(damageMessage);
		props.html = html;
		damageMessage._svelteTargetDamage.linkedDamageButton = new TargetDamage({ target, props });
	}
</script>

<button
	type="button"
	class="pf2e-td target-button small-button"
	title={localize("pf2e-target-damage.linkDamage")}
	on:click|stopPropagation={cloneButtons}
>
	<i class="fa-solid fa-paperclip fa-fw" />
</button>
