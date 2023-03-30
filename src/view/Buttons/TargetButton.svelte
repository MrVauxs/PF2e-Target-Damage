<script>
	/* global game */
	import { localize } from "../../lib/utils";

	// Settings
	const targetButton = gameSettings.getWritableStore("targetButton");
</script>

<button
	class="pf2e-td target-button small-button"
	title={localize("pf2e-target-damage.targetButton.hint-" + $targetButton)}
>
	<i class="fa-solid fa-crosshairs-simple fa-fw" />
</button>
