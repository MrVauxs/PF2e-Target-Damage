import { writable, get } from 'svelte/store';
import { TargetDamageTarget } from './target.js';

export default class TargetDamageStore {
    constructor(message) {
        this._message = message;
        if (!this?._message?.flags?.['pf2e-target-damage']) {
            console.log(message)
            throw new Error('PF2e Target Damage | No flag found on message above.');
        }

        this._targets = writable(this._message.flags['pf2e-target-damage'].targets.map(t => new TargetDamageTarget(t, this._message)) || [])
    }

    get flag() {
        return this._message.flags['pf2e-target-damage'];
    }

    get json() {
        return get(this._targets).map(t => t.json);
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

    updateMessage(targets = this.json) {
        const objectsEqual = (o1, o2) =>
            typeof o1 === 'object' && Object.keys(o1).length > 0
                ? Object.keys(o1).length === Object.keys(o2).length
                && Object.keys(o1).every(p => objectsEqual(o1[p], o2[p]))
                : o1 === o2;

        const arraysEqual = (a1, a2) => a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

        if (arraysEqual(this.flag.targets, targets)) {
            return console.log('PF2e Target Damage | No change in targets, skipping update');
        };
        this._message.setFlag('pf2e-target-damage', 'targets', targets).then(() => {
            return console.log('PF2e Target Damage | Updated message flag', this.flag);
        });
    }

    add(target) {
        if (target.document.documentName === "Token") {
            target = {
                actorUuid: target.document.actor.uuid,
                tokenUuid: target.document.uuid,
                id: target.document.id,
            }
        }

        if (Array.isArray(target)) {
            target.forEach(t => this.add(t));
            return;
        }

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