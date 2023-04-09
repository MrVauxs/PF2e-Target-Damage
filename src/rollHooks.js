// Flag what targets were at the time of the roll
Hooks.on("preCreateChatMessage", (message) => {
    if (message?.flags?.["pf2e-target-damage"]?.targets) {
        // If flag already exists, whether because of a macro or existing code, don't do anything.
        return;
    }
    if (message.rolls[0]?.options.evaluatePersistent) {
        // If it's persistent damage (which hopefully should just be the first and only roll... ever), only use the token that takes the persistent damage, presumably the author.
        message.updateSource({
            "flags.pf2e-target-damage.targets": [message.token.object].map((target) => {
                return {
                    id: target.id,
                    tokenUuid: target.document.uuid,
                    actorUuid: target.actor.uuid,
                };
            }),
        });
    } else {
        // Otherwise, create the flag using the current targets.
        message.updateSource({
            "flags.pf2e-target-damage.targets": Array.from(game.user.targets).map((target) => {
                return {
                    id: target.id,
                    tokenUuid: target.document.uuid,
                    actorUuid: target.actor.uuid,
                };
            }),
        });
    }
});

// Link the saving throw to the message that caused it
Hooks.on("ready", () => {
    if (game.modules.get("dice-so-nice")?.active) {
        Hooks.on("diceSoNiceRollComplete", async (message) => {
            message = game.messages.get(message);
            if (game.user.isGM) {
                await linkRolls(message);
            } else {
                game.socket.emit("module.pf2e-target-damage", { type: "linkRolls", message });
            }
        });
    } else {
        Hooks.on("createChatMessage", async (message) => {
            if (game.user.isGM) {
                await linkRolls(message);
            } else {
                game.socket.emit("module.pf2e-target-damage", { type: "linkRolls", message });
            }
        });
    }
});

Hooks.on("deleteChatMessage", (message) => {
    if (message.flags?.pf2e?.context?.options.find((x) => x.includes("pf2e-td-"))) {
        message.flags?.pf2e?.context?.options.filter((x) => x.includes("pf2e-td-")).forEach((option) => {
            // Go through every message that has a link to this message and update it
            const id = option.split("pf2e-td-")[1];
            const saveMessage = game.messages.get(id);
            if (saveMessage?.id) {
                ui.chat.updateMessage(saveMessage);
            }
            if (saveMessage?.flags["pf2e-target-damage"].targets.length > 0) {
                saveMessage.flags["pf2e-target-damage"].targets.forEach((target) => {
                    if (game.messages.get(target.damage)?.id) {
                        ui.chat.updateMessage(game.messages.get(target.damage));
                    }
                });
            }
        });
    }
});

Hooks.on("ready", async () => {
    game.socket.on("module.pf2e-target-damage", async (args) => {
        switch (args.type) {
            case "linkRolls": await linkRolls(args.message); break;
            case "updateDealtDamage": await updateDealtDamage(args.args); break;
        }
    });
});


/**
 * Link the rolls between messages
 *
 * @param {ChatMessage} message The message to link
 */
async function linkRolls(message) {
    if (!(message.isAuthor || game.user.isGM)) {
        return;
    }
    const rollOption = message?.flags?.pf2e?.context?.options?.filter((x) => x.includes("pf2e-td-")) ?? [];

    if (message?.flags?.["pf2e-target-damage"]?.origin) {
        rollOption.push(`pf2e-td-${message.flags["pf2e-target-damage"].origin}`);
    }

    if (rollOption?.length > 0) {
        rollOption.forEach((option) => {
            const id = option.split("pf2e-td-")[1];
            const saveMessage = game.messages.get(id);

            if (!(saveMessage?.isAuthor || saveMessage?.isOwner)) {
                return;
            }

            const newFlag = saveMessage.flags["pf2e-target-damage"].targets || [];

            if (!newFlag.length) {
                return;
            }

            const index = newFlag.findIndex((target) => target.id === message.speaker.token);

            if (message.isDamageRoll) {
                // Update every target in save card that is the damage roll
                newFlag.map((target) => {
                    if (message?.flags?.["pf2e-target-damage"].targets.map((t) => t.id).includes(target.id)) {
                        target.damage = message._id || message.id;
                    }
                    return target;
                });
                saveMessage.update({
                    "flags.pf2e-target-damage.targets": newFlag
                });
                ui.chat.updateMessage(saveMessage);
            } else {
                newFlag[index].roll = message._id || message.id;
                saveMessage.update({
                    "flags.pf2e-target-damage.targets": newFlag
                });
                ui.chat.updateMessage(saveMessage);

                // Also update the damage to account for reroll
                if (newFlag[index].damage) {
                    if (game.messages.get(newFlag[index].damage)?.id) {
                        ui.chat.updateMessage(game.messages.get(newFlag[index].damage));
                    }
                }
            }
        });
    }
}

/**
 * Link the rolls between messages
 *
 * @param {ChatMessage} message The message to link
 */
export async function updateDealtDamage(args) {
    let { degree, targets, message, tokenID } = args;

    if (Number.isNumeric(degree)) {
        switch (degree) {
            case -1: degree = "heal"; break;
            case 0.5: degree = "half"; break;
            case 1: degree = "full"; break;
            case 2: degree = "double"; break;
            case 3: degree = "triple"; break;
        }
    }

    message = game.messages.get(message.id ?? message._id);
    if (!(message.isAuthor || game.user.isGM)) return;

    const newTargets = targets.map((target) => {
        if (target.id === tokenID) {
            Array.isArray(target.applied) ? target.applied.push(degree) : target.applied = [target.applied, degree];
        }
        return target;
    });
    message.update({ flags: { "pf2e-target-damage": { targets: newTargets } } })
}