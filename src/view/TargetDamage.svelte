<script>
   import { gameSettings } from "../settings.js";
   import { TargetDamageTarget } from "../lib/target.js";
   export let targets = void 0;

   const Targets = targets.map((target) => {
      return new TargetDamageTarget(target);
   });

   const classic = gameSettings.getWritableStore("classic");

   console.log("Hello, world!", $classic, Targets);
</script>

<hr />
Svelte Messages, this will be interesting
