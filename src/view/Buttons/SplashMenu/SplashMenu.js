import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';
import SplashMenu from './SplashMenu.svelte';
import { localize } from '../../../lib/utils';

export default class SplashMenuApplication extends SvelteApplication {
   constructor(targets, multiplier) {
      super();
      this.splashTargets = targets
      this.multiplier = multiplier
   }
   /**
    * Default Application options
    *
    * @returns {object} options - Application options.
    * @see https://foundryvtt.com/api/interfaces/client.ApplicationOptions.html
    */
   static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
         id: 'pf2e-target-damage',
         minimizable: true,
         title: localize("pf2e-target-damage.splashButton.radiusDialog.title"),
         width: "auto",
         height: "auto",
         minWidth: 385,
         svelte: {
            class: SplashMenu,
            target: document.body
         }
      });
   }
}