import { writable } from 'svelte/store';
import { TargetDamageTarget } from './target.js';

export default class TargetDamageStore {
    constructor(message) {
        this._message = message;
        if (!this?._message?.flags?.['pf2e-target-damage']) {
            console.log(message)
            throw new Error('PF2e Target Damage | No flag found on message above.');
        }

        this._targets = writable(this._message.flags['pf2e-target-damage'].targets || [])
    }

    get flag() {
        return this._message.flags['pf2e-target-damage'];
    }

    get targets() {
        let targetDamageTargets = []
        this._targets.subscribe((v) => { targetDamageTargets = v.map(v => new TargetDamageTarget(v, this._message)) })
        return targetDamageTargets
    }

    validate(target) {
        if (target.id === undefined) {
            throw new Error('PF2e Target Damage | Target must have an id');
        }
        if (target.tokenUuid === undefined) {
            throw new Error('PF2e Target Damage | Target must have a tokenUuid');
        }
        if (target.actorUuid === undefined) {
            throw new Error('PF2e Target Damage | Target must have an actorUuid');
        }
    }

    updateMessage() {
        this._targets.subscribe(targets => {
            this._message.setFlag('pf2e-target-damage', 'targets', targets).then(() => {
                console.log('PF2e Target Damage | Updated message flag', this.flag);
            });
        });
    }

    add(target) {
        this.validate(target)
        this._targets.update(v => {
            const allTargets = [...v, target];
            // Remove duplicates
            return [...new Set([...v, target].map(t => t.id))].map(id => allTargets.find(t => t.id === id))
        })
    }

    remove(target) {
        this.validate(target)
        this._targets.update(v => v.filter(t => t.id !== target.id))
    }

    update(target) {
        this.validate(target)
        this._targets.update(v => v.map(t => (t.id === target.id ? target : t)))
    }

    set(run) {
        this.updateMessage();
        return this._targets.set(run);
    }

    subscribe(run) {
        this.updateMessage();
        return this._targets.subscribe(run);
    }
}