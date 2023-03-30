import { SvelteApplication }  from '@typhonjs-fvtt/runtime/svelte/application';
import SplashMenu from './SplashMenu.svelte';
import { localize } from '../../../lib/utils';

export default class SplashMenuApplication extends SvelteApplication
{
    constructor(target, multiplier) {
        super();
        this.splashTarget = target
        this.multiplier = multiplier
    }
   /**
    * Default Application options
    *
    * @returns {object} options - Application options.
    * @see https://foundryvtt.com/api/interfaces/client.ApplicationOptions.html
    */
   static get defaultOptions()
   {
      return foundry.utils.mergeObject(super.defaultOptions, {
         id: 'pf2e-target-damage',
         resizable: true,
         minimizable: true,
         title: localize("pf2e-target-damage.splashButton.radiusDialog.title"),
         width: 385,
         height: "auto",
         maxWidth: 385,
         svelte: {
            class: SplashMenu,
            target: document.body
         }
      });
   }
}