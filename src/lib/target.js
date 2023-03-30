/* global fromUuidSync*/

export class TargetDamageTarget {
    constructor(target, message) {
        this.id = target?.id;
        this.roll = target?.roll;
        this.tokenUuid = target?.tokenUuid;
        this.actorUuid = target?.actorUuid;
        this.applied = Array.isArray(target?.applied) ? target?.applied : [target?.applied].filter((x) => !!x);
        this.messageUuid = message?.uuid;
        this.debugOwner = target?.debugOwner; // For testing purposes
    }

    // returns the DOCUMENT
    get token() {
        const token = fromUuidSync(this.tokenUuid);
        if (token) {
            return token;
        } else {
            return console.error(`PF2e Target Damage | "${this.tokenUuid}" Token UUID was not found in "${this.messageUuid}" chat message.`);
        }
    }

    // returns the DOCUMENT
    get actor() {
        const actor = fromUuidSync(this.actorUuid);
        if (actor) {
            return actor;
        } else {
            return console.error(`PF2e Target Damage | "${this.actorUuid}" Actor UUID was not found in "${this.messageUuid}" chat message.`);
        }
    }

    get visibility() {
        // If false, only the GM can see it. If true, everyone can see it.
        return game.settings.get("pf2e-target-damage", "hideNPCs") ? this.token.hasPlayerOwner : true;
    }

    get mystified() {
        // If false, only the GM can see it and players see it mystified.
        return game.settings.get("pf2e", "metagame_tokenSetsNameVisibility") ? this.token.playersCanSeeName : true;
    }

    get isOwner() {
        return this.debugOwner ?? this.token.isOwner;
    }

    get name() {
        // If tokens set name visibility and the players can't see the name and the user isn't a GM, hide the name.
        return !this.mystified && !game.user.isGM ? game.i18n.localize("pf2e-target-damage.hidden") : this.token.name ?? this.actor.name;
    }

    get img() {
        return this.token?.texture.src ?? this.actor?.prototypeToken.texture.src;
    }

    // #region borrowed from PF2e system, document.ts#210
    onHoverIn(token = this.token) {
        if (!canvas.ready) {
            return;
        }
        token = token?.object ?? token;
        if (token?.isVisible && !token.controlled) {
            token.emitHoverIn();
        }
    }

    onHoverOut(token = this.token) {
        token = token?.object ?? token;
        if (canvas.ready) {
            token?.emitHoverOut();
        }
    }

    onClickSender(token = this.token, event = Event) {
        if (!canvas) {
            return;
        }
        token = token?.object;
        if (token?.isVisible) {
            if (token.isOwner) {
                token.controlled ? token.release() : token.control({ releaseOthers: !event.shiftKey });
            } else {
                token.setTarget(!token.isTargeted, { releaseOthers: !event.shiftKey });
            }
            // If a double click, also pan to the token
            if (event.type === "dblclick") {
                const scale = Math.max(1, canvas.stage.scale.x);
                canvas.animatePan({ ...token.center, scale, duration: 1000 });
            }
        }
    }
    // #endregion

    tokensInRange(token = this.token, range = 5) {
        if (!canvas) {
            return;
        }
        const allTokens = canvas.tokens.placeables;
        // Get all tokens that are within range of the token
        const splashedTokens = allTokens.filter((x) => token.distanceTo(x) <= range);
        return splashedTokens;
    }
}