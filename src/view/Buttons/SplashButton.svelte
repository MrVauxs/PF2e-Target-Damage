<script>
	import SplashMenuApplication from "./SplashMenu/SplashMenu.js";
	import { localize } from "../../lib/utils";
	import { TargetDamageTarget } from "../../lib/target.js";
	export let targets = void 0;
	export let message = void 0;

	function onClick(e) {
		const target = targets[0] ?? new TargetDamageTarget(Array.from(game.user.targets)[0]);
		if (!target) {
			return;
		}

		// Increase Radius Dialogue
		let multiplier = 5;

		if (message.flags.pf2e?.context?.options.includes("feat:expanded-splash")) {
			multiplier = 10;
		}

		if (e.type === "contextmenu" || e.shiftKey) {
			new SplashMenuApplication(targets, multiplier).render(true);
		} else {
			target
				.tokensInRange(multiplier)
				.filter((x) => x !== target.token.object)
				.forEach((x, index) => {
					x.control({ releaseOthers: index === 0 ? true : false });
					game.canvas.ping(x.document.center);
				});
		}
	}
</script>

<button
	class="pf2e-td splash-button small-button"
	title={localize("pf2e-target-damage.splashButton.hint")}
	data-tooltip={localize("pf2e-target-damage.splashButton.selectTarget", { name: targets[0]?.name })}
	data-tooltip-direction="LEFT"
	on:click={onClick}
	on:contextmenu|stopPropagation|preventDefault={onClick}
>
	<i class="fa-solid fa-bomb fa-fw" />
</button>
