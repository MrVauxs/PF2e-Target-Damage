<script>
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

		if (e.shiftKey) {
			new Dialog({
				// TODO: Convert this to a Svelte component
				// <input type="range" name="modifier" min="0" max="30" step="5" placeholder="${multiplier} feet">

				title: localize("pf2e-target-damage.splashButton.radiusDialog.title"),
				content: `<form>
            <div class="form-group">
               <label>${localize("pf2e-target-damage.splashButton.radiusDialog.content")}</label>
               <input type="number" name="modifier" value="" placeholder="${multiplier} feet">
            </div>
            </form>
            `,
				buttons: {
					ok: {
						label: localize("CONTROLS.CanvasSelectAll"),
						callback: async ($dialog) => {
							multiplier = Number($dialog.find('[name="modifier"]').val()) || multiplier;
							target
								.tokensInRange(multiplier)
								.filter((x) => x !== target.token.object)
								.forEach((x) => {
									x.control({ releaseOthers: false });
									game.canvas.ping(x.document.center);
								});
						},
					},
				},
				default: "ok",
			}).render(true);
		} else {
			target
				.tokensInRange(multiplier)
				.filter((x) => x !== target.token.object)
				.forEach((x) => {
					x.control({ releaseOthers: false });
					game.canvas.ping(x.document.center);
				});
		}
	}
</script>

<button
	class="pf2e-td splash-button small-button"
	title={localize("pf2e-target-damage.splashButton.hint")}
	on:click={onClick}
>
	<i class="fa-solid fa-bomb fa-fw" />
</button>
