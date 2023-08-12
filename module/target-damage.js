class TargetDamageTarget {
  constructor(target, message) {
    this.id = target?.id;
    this.roll = target?.roll;
    this.tokenUuid = target?.tokenUuid;
    this.actorUuid = target?.actorUuid;
    this.applied = Array.isArray(target?.applied)
      ? target?.applied
      : [target?.applied].filter((x) => !!x);
    this.messageUuid = message?.uuid;
    this.debugOwner = target?.debugOwner; // For testing purposes
  }

  // returns the DOCUMENT
  get token() {
    try {
      return fromUuidSync(this.tokenUuid);
    } catch (error) {
      console.error(
        `PF2e Target Damage | "${this.tokenUuid}" Token UUID was not found in "${this.messageUuid}" chat message.`
      );
    }
  }

  // returns the DOCUMENT
  get actor() {
    try {
      return fromUuidSync(this.actorUuid);
    } catch (error) {
      console.error(
        `PF2e Target Damage | "${this.actorUuid}" Actor UUID was not found in "${this.messageUuid}" Chat Message.`
      );
    }
  }

  get visibility() {
    // If false, only the GM can see it. If true, everyone can see it.
    return game.settings.get("pf2e-target-damage", "hideNPCs")
      ? this.token.hasPlayerOwner
      : true;
  }

  get mystified() {
    // If false, only the GM can see it and players see it mystified.
    return game.settings.get("pf2e", "metagame_tokenSetsNameVisibility")
      ? this.token.playersCanSeeName
      : true;
  }

  get isOwner() {
    return this.debugOwner ?? this.token.isOwner;
  }

  get name() {
    // If tokens set name visibility and the players can't see the name and the user isn't a GM, hide the name.
    return !this.mystified && !game.user.isGM
      ? game.i18n.localize("pf2e-target-damage.hidden")
      : this.token.name ?? this.actor.name;
  }

  get img() {
    return this.token?.texture.src ?? this.actor?.prototypeToken.texture.src;
  }
}

// Flag what targets were at the time of the roll
Hooks.on("preCreateChatMessage", (message) => {
  if (message?.flags?.["pf2e-target-damage"]?.targets) return;
  if (
    message.rolls[0]?.options.evaluatePersistent ||
    "<div>Received fast healing</div>" === message.flavor
  ) {
    message.updateSource({
      "flags.pf2e-target-damage.targets": [message.token.object].map(
        (target) => {
          return {
            id: target.id,
            tokenUuid: target.document.uuid,
            actorUuid: target.actor.uuid,
          };
        }
      ),
    });
  } else {
    message.updateSource({
      "flags.pf2e-target-damage.targets": Array.from(game.user.targets).map(
        (target) => {
          return {
            id: target.id,
            tokenUuid: target.document.uuid,
            actorUuid: target.actor.uuid,
          };
        }
      ),
    });
  }
});

// Fix Popout
Hooks.on("renderChatPopout", (app, html, data) => {
  self.popoutApp = app;

  console.log(app);

  setTimeout(() => {
    //app.message.render() // because apparently it only renders Target Damage stuff the second time around without this
    app.setPosition(); // Fix the popout not being fully extended to full height
  }, 100);
});

// Link the saving throw to the message that caused it
Hooks.on("ready", () => {
  if (game.modules.get("dice-so-nice")?.active) {
    Hooks.on("diceSoNiceRollComplete", async (message) => {
      message = game.messages.get(message);
      if (game.user.isGM) {
        await linkRolls(message);
      } else {
        game.socket.emit("module.pf2e-target-damage", {
          type: "linkRolls",
          message,
        });
      }
    });
  } else {
    Hooks.on("createChatMessage", async (message) => {
      if (game.user.isGM) {
        await linkRolls(message);
      } else {
        game.socket.emit("module.pf2e-target-damage", {
          type: "linkRolls",
          message,
        });
      }
    });
  }
});

Hooks.on("deleteChatMessage", (message) => {
  if (
    message.flags?.pf2e?.context?.options.find((x) => x.includes("pf2e-td-"))
  ) {
    message.flags?.pf2e?.context?.options
      .filter((x) => x.includes("pf2e-td-"))
      .forEach((option) => {
        // Go through every message that has a link to this message and update it
        const id = option.split("pf2e-td-")[1];
        const saveMessage = game.messages.get(id);
        if (saveMessage?.id) ui.chat.updateMessage(saveMessage);
        if (saveMessage?.flags["pf2e-target-damage"].targets.length > 0) {
          saveMessage.flags["pf2e-target-damage"].targets.forEach((target) => {
            if (game.messages.get(target.damage)?.id)
              ui.chat.updateMessage(game.messages.get(target.damage));
          });
        }
      });
  }
});

Hooks.on("ready", async () => {
  game.socket.on("module.pf2e-target-damage", async (args) => {
    switch (args.type) {
      case "linkRolls":
        await linkRolls(args.message);
        break;
      case "updateDealtDamage":
        await updateDealtDamage(args.args);
        break;
    }
  });
});

async function updateDealtDamage(args) {
  let { degree, targets, message, tokenID } = args;
  message = game.messages.get(message.id ?? message._id);
  if (!(message.isAuthor || game.user.isGM)) return;

  const newTargets = targets.map((target) => {
    if (target.id === tokenID) {
      Array.isArray(target.applied)
        ? target.applied.push(degree)
        : (target.applied = [target.applied, degree]);
    }
    return target;
  });
  message.update({ flags: { "pf2e-target-damage": { targets: newTargets } } });
}

async function linkRolls(message) {
  if (!(message.isAuthor || game.user.isGM)) return;
  const rollOption =
    message?.flags?.pf2e?.context?.options?.filter((x) =>
      x.includes("pf2e-td-")
    ) ?? [];

  if (message?.flags?.["pf2e-target-damage"]?.origin)
    rollOption.push("pf2e-td-" + message.flags["pf2e-target-damage"].origin);

  if (rollOption?.length > 0) {
    rollOption.forEach((option) => {
      const id = option.split("pf2e-td-")[1];
      const saveMessage = game.messages.get(id);

      if (!(saveMessage?.isAuthor || saveMessage?.isOwner)) return;

      const newFlag = saveMessage.flags["pf2e-target-damage"].targets || [];

      if (!newFlag.length) return;

      const index = newFlag.findIndex(
        (target) => target.id === message.speaker.token
      );

      if (message.isDamageRoll) {
        // Update every target in save card that is the damage roll
        newFlag.map((target) => {
          if (
            message?.flags?.["pf2e-target-damage"].targets
              .map((t) => t.id)
              .includes(target.id)
          ) {
            target.damage = message._id || message.id;
          }
          return target;
        });
        saveMessage.update({
          "flags.pf2e-target-damage.targets": newFlag,
        });
        ui.chat.updateMessage(saveMessage);
      } else {
        newFlag[index].roll = message._id || message.id;
        saveMessage.update({
          "flags.pf2e-target-damage.targets": newFlag,
        });
        ui.chat.updateMessage(saveMessage);

        // Also update the damage to account for reroll
        if (newFlag[index].damage) {
          if (game.messages.get(newFlag[index].damage)?.id)
            ui.chat.updateMessage(game.messages.get(newFlag[index].damage));
        }
      }
    });
  }
}

//#region borrowed from PF2e system, document.ts#210
function onHoverIn(token, event) {
  if (!canvas.ready) return;
  token = token?.object ?? token;
  if (token?.isVisible && !token.controlled) {
    token.emitHoverIn();
  }
}

function onHoverOut(token, event) {
  token = token?.object ?? token;
  if (canvas.ready) token?.emitHoverOut();
}

function onClickSender(token, event) {
  if (!canvas) return;
  token = token?.object;
  if (token?.isVisible) {
    if (token.isOwner) {
      token.controlled
        ? token.release()
        : token.control({ releaseOthers: !event.shiftKey });
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
//#endregion

function updateMessageWithFlags(message, event) {
  if (event) event.stopPropagation();
  const targetsFlags = message.flags["pf2e-target-damage"].targets;
  const targetsCurrent = Array.from(game.user.targets);
  let targetsFinal = [];

  targetsFinal.push(...targetsFlags);
  targetsFinal.push(...targetsCurrent);

  if (game.settings.get("pf2e-target-damage", "targetButton")) {
    // Replace by default, Shift to Add
    if (!event.shiftKey) {
      // Removes non-current targets
      targetsFinal = targetsFinal.filter((target) =>
        targetsCurrent.find((current) => current?.id === target?.id)
      );
    } else if (!targetsCurrent.length) {
      return ui.notifications.error(
        game.i18n.localize("pf2e-target-damage.noTargets")
      );
    }
  } else {
    // Add by default, Shift to Replace
    if (event.shiftKey) {
      // Removes non-current targets
      targetsFinal = targetsFinal.filter((target) =>
        targetsCurrent.find((current) => current?.id === target?.id)
      );
    } else if (!targetsCurrent.length) {
      return ui.notifications.error(
        game.i18n.localize("pf2e-target-damage.noTargets")
      );
    }
  }

  // De-duplicate
  targetsFinal = [...new Set(targetsFinal.map((target) => target.id))].map(
    (id) => targetsFinal.find((target) => target.id === id)
  );

  message.update({
    flags: {
      "pf2e-target-damage": {
        targets: targetsFinal.map((target) => {
          return {
            id: target.id,
            tokenUuid: target.tokenUuid || target.document.uuid,
            actorUuid: target.actorUuid || target.actor.uuid,
            roll: target.roll,
            damage: target.damage,
            applied: target.applied,
            debugOwner: target.debugOwner,
          };
        }),
      },
    },
  });
}

async function extractEphemeralEffects({
  affects,
  origin,
  target,
  item,
  domains,
  options,
}) {
  if (!(origin && target)) return [];

  const [effectsFrom, effectsTo] =
    affects === "target" ? [origin, target] : [target, origin];
  const fullOptions = [...options, ...effectsTo.getSelfRollOptions(affects)];
  const resolvables = item
    ? item.isOfType("spell")
      ? { spell: item }
      : { weapon: item }
    : {};
  return (
    await Promise.all(
      domains
        .flatMap(
          (s) => effectsFrom.synthetics.ephemeralEffects[s]?.[affects] ?? []
        )
        .map((d) => d({ test: fullOptions, resolvables }))
    )
  ).flatMap((e) => e ?? []);
}

async function applyDamage(
  message,
  tokenID,
  multiplier,
  addend = 0,
  promptModifier = false,
  rollIndex = 0
) {
  if (promptModifier)
    return shiftModifyDamage(message, tokenID, multiplier, rollIndex);
  // Modified here to include TokenID
  const tokens = canvas.tokens.ownedTokens.filter(
    (token) => token.document._id === tokenID && token.actor
  );
  // End modif
  if (tokens.length === 0) {
    const errorMsg = game.i18n.localize(
      "pf2e-target-damage.error.cantFindToken"
    );
    ui.notifications.error(errorMsg);
    return;
  }

  const shieldBlockRequest = CONFIG.PF2E.chatDamageButtonShieldToggle;
  const roll = message.rolls.at(rollIndex);

  if (!(roll instanceof DamageRoll))
    throw Error("Unexpected error retrieving damage roll");

  const damage =
    multiplier < 0
      ? multiplier * roll.total + addend
      : roll.alter(multiplier, addend);

  // Get origin roll options and apply damage to a contextual clone: this may influence condition IWR, for example
  const messageRollOptions = message.flags.pf2e.context?.options ?? [];
  const originRollOptions = messageRollOptions
    .filter((o) => o.startsWith("self:"))
    .map((o) => o.replace(/^self/, "origin"));

  for (const token of tokens) {
    if (!token.actor) continue;

    const ephemeralEffects =
      multiplier > 0
        ? await extractEphemeralEffects({
            affects: "target",
            origin: message.actor,
            target: token.actor,
            item: message.item,
            domains: ["damage-received"],
            options: messageRollOptions,
          })
        : [];
    await token.actor
      .getContextualClone(originRollOptions, ephemeralEffects)
      .applyDamage({
        damage,
        token,
        skipIWR: multiplier <= 0,
        rollOptions: new Set(message.flags.pf2e.context?.options ?? []),
        shieldBlockRequest,
      });
  }
  toggleOffShieldBlock(message.id);
}

function shiftModifyDamage(message, tokenID, multiplier, rollIndex) {
  new Dialog({
    title: game.i18n.localize("PF2E.UI.shiftModifyDamageTitle"),
    content: `<form>
				<div class="form-group">
					<label>${game.i18n.localize("PF2E.UI.shiftModifyDamageLabel")}</label>
					<input type="number" name="modifier" value="" placeholder="0">
				</div>
				</form>
				<script type="text/javascript">
				$(function () {
					$(".form-group input").focus();
				});
				</script>`,
    buttons: {
      ok: {
        label: "Ok",
        callback: async ($dialog) => {
          // In case of healing, multipler will have negative sign. The user will expect that positive
          // modifier would increase healing value, while negative would decrease.
          const adjustment =
            (Number($dialog.find('[name="modifier"]').val()) || 0) *
            Math.sign(multiplier);
          applyDamage(
            message,
            tokenID,
            multiplier,
            adjustment,
            false,
            rollIndex
          );
        },
      },
    },
    default: "ok",
    close: () => {
      toggleOffShieldBlock(message.id);
    },
  }).render(true);
}
/** Toggle off the Shield Block button on a damage chat message */
function toggleOffShieldBlock(messageId) {
  const $message = $(
    `#chat-log > li.chat-message[data-message-id="${messageId}"]`
  );
  const $button = $message.find("button.pf2e-td-shield-block");
  $button.removeClass("shield-activated");
  CONFIG.PF2E.chatDamageButtonShieldToggle = false;
}

function tokensInRange(target, range = 5) {
  const allTokens = canvas.tokens.placeables;
  // Get all tokens that are within range of the target
  const splashedTokens = allTokens.filter((x) => target.distanceTo(x) <= range);
  return splashedTokens;
}

const DamageRoll = CONFIG.Dice.rolls.find((R) => R.name === "DamageRoll");

Hooks.on("renderChatMessage", (message, html) => {
  setTimeout(() => {
    html = html.find(".message-content");
    const targets =
      message.flags["pf2e-target-damage"]?.targets?.map(
        (target) => new TargetDamageTarget(target, message)
      ) || [];
    const rolls = message.rolls.filter((roll) => roll instanceof DamageRoll);

    rolls.forEach(async (roll, index, array) => {
      if (roll.options.splashOnly) {
        const splashSection = $(html.find(`.dice-roll.damage-roll`)[index]);
        splashSection.find(".dice-total").prepend(
          $(
            `<button class='pf2e-td splash-button small-button' title="${game.i18n.localize(
              "pf2e-target-damage.splashButton.hint"
            )}"><i class='fa-solid fa-bomb fa-fw'></i></button>`
          ).on({
            click: (e) => {
              const target = (targets.map((t) => t.token.object) ??
                Array.from(game.user.targets))[0];
              if (!target) return;

              // Increase Radius Dialogue
              let multiplier = 5;

              // Expanded Splash and Bomb
              if (
                message.flags.pf2e?.context?.options.includes(
                  "feat:expanded-splash"
                ) &&
                message.flags.pf2e?.context?.options.includes("bomb")
              )
                multiplier = 10;

              // Scatter
              if (
                message.flags.pf2e?.context?.options.includes(
                  "item:trait:scatter"
                )
              ) {
                message.flags.pf2e?.context?.options
                  .filter((o) => o.startsWith("item:trait:scatter-"))
                  .forEach((o) => {
                    const [_, radius] = o.split("-");
                    multiplier = Math.max(multiplier, Number(radius));
                  });
              }

              if (e.shiftKey) {
                new Dialog({
                  title: game.i18n.localize(
                    "pf2e-target-damage.splashButton.radiusDialog.title"
                  ),
                  content: `<form>
												<div class="form-group">
													<label>${game.i18n.localize(
                            "pf2e-target-damage.splashButton.radiusDialog.content"
                          )}</label>
													<input type="number" name="modifier" value="" placeholder="${multiplier} feet">
												</div>
												</form>
												<script type="text/javascript">
												$(function () {
													$(".form-group input").focus();
												});
												</script>`,
                  buttons: {
                    ok: {
                      label: game.i18n.localize("CONTROLS.CanvasSelectAll"),
                      callback: async ($dialog) => {
                        multiplier =
                          Number($dialog.find('[name="modifier"]').val()) ||
                          multiplier;
                        tokensInRange(target, multiplier)
                          .filter((x) => x !== target)
                          .forEach((x) => x.control({ releaseOthers: false }));
                      },
                    },
                  },
                  default: "ok",
                }).render(true);
              } else {
                tokensInRange(target, multiplier)
                  .filter((x) => x !== target)
                  .forEach((x) => x.control({ releaseOthers: false }));
              }
            },
            // Doesn't highlight everything
            //mouseenter: (e) => {tokensInRange((targets.map(t => t.token.object) ?? Array.from(game.user.targets))[0], 5).forEach(t => onHoverIn(t, e))},
            //mouseleave: (e) => {tokensInRange((targets.map(t => t.token.object) ?? Array.from(game.user.targets))[0], 5).forEach(t => onHoverOut(t, e))},
          })
        );
        return;
      }

      const damageSection = $(html.find(`.dice-roll.damage-roll`)[index]);

      // Add the target button
      if (message.isAuthor || message.isOwner) {
        damageSection
          .find(".dice-total")
          .prepend(
            $(
              `<button class='pf2e-td target-button small-button' title="${game.i18n.localize(
                "pf2e-target-damage.targetButton.hint-" +
                  game.settings.get("pf2e-target-damage", "targetButton")
              )}"><i class='fa-solid fa-crosshairs-simple fa-fw'></i></button>`
            ).click((e) => updateMessageWithFlags(message, e))
          );
      }

      if (targets.length) {
        html
          .find($('section[data-roll-index="' + index + '"]'))
          .after(`<hr class='pf2e-td' data-roll-index="${index}"></hr>`);

        // Add target and hiding buttons
        damageSection.find(".dice-total").append(
          $(
            `<button class='pf2e-td hide-button small-button' title="${game.i18n.localize(
              "pf2e-target-damage.hideButton"
            )}"><i class='fa fa-minus fa-fw'></i></button>`
          ).click(function (e, auto = false) {
            const slideToggleSpeed = auto ? [0, 0] : [350, 500];
            html
              .find($('section[data-roll-index="' + index + '"]'))
              .slideToggle(slideToggleSpeed[0]);
            html.find($("hr.pf2e-td")).slideToggle(slideToggleSpeed[1]);
            $(this).find(".fa").toggleClass("fa-plus fa-minus");
            e.stopPropagation();
          })
        );

        const buttonTemplate = $(
          await renderTemplate(
            "modules/pf2e-target-damage/templates/buttons.html",
            {
              showTripleDamage: game.settings.get("pf2e", "critFumbleButtons"),
            }
          )
        );

        const buttonTemplates = [];

        const originID = message.flags["pf2e-target-damage"].origin;
        if (originID) origin = game.messages.get(originID);
        const originTargets =
          origin?.flags?.["pf2e-target-damage"]?.targets ?? [];

        // Add button template for each target to buttonTemplates
        for (let i = 0; i < targets.length; i++) {
          const target = targets[i];
          const targetTemplate = $(buttonTemplate.clone());
          const nameHTML = targetTemplate.find(".pf2e-td.name");
          const tokenID = target.token?.id;

          if (!tokenID) continue; // Even if the target errors, we still want to show the other targets

          // replace stuff in template
          nameHTML.text(target.name);
          nameHTML.mouseenter(function (e) {
            onHoverIn(target.token, e);
            if (e.ctrlKey) {
              $(this).attr(
                "data-tooltip",
                game.i18n.localize("pf2e-target-damage.removeTarget")
              );
            }
          });
          nameHTML.mouseleave(function (e) {
            onHoverOut(target.token, e);
            if (e.ctrlKey) {
              $(this).attr("data-tooltip", target.name);
            }
          });
          nameHTML.click(function (e) {
            if (!($(this).attr("data-tooltip") === target.name)) {
              message.update({
                flags: {
                  "pf2e-target-damage": {
                    targets: targets.filter((t) => t.token.id !== tokenID),
                  },
                },
              });
              $(document).find("#tooltip").removeClass("active");
            }
            onClickSender(target.token, e);
          });
          nameHTML.dblclick((e) => onClickSender(target.token, e));
          nameHTML
            .attr("data-tooltip", target.name)
            .attr("data-tooltip-direction", "UP");
          // targetTemplate.find(".pf2e-td.image").attr("src", target.img);
          // targetTemplate.find(".pf2e-td.image").attr("title", target.name);

          // this is really just to let the GM know the targets are mystified or hidden
          if (game.user.isGM) {
            if (!target.visibility) {
              targetTemplate
                .find(".damage-application")
                .attr("data-visibility", "gm");
            } else if (!target.mystified) {
              targetTemplate
                .find(".pf2e-td.name")
                .attr("data-visibility", "gm");
            }
          } else {
            if (!target.visibility) return;
          }

          // Classic style
          if (game.settings.get("pf2e-target-damage", "classic")) {
            $(targetTemplate[0]).addClass("name-top");
          } else {
            $(targetTemplate[0]).addClass("name-left");
          }

          // Hide damage buttons if you can't do anything with them
          if (!target.isOwner) {
            targetTemplate.find("button.pf2e-td").remove();
            targetTemplate.find("hover-content").remove();
            $(targetTemplate[0]).addClass("name-top").removeClass("name-left");
          }

          if (targetTemplate.hasClass("name-left"))
            nameHTML.attr("data-tooltip-direction", "LEFT");

          if (
            target.applied.length &&
            (target.isOwner ||
              !game.settings.get("pf2e", "metagame_secretDamage"))
          ) {
            target.applied.forEach((damage) => {
              switch (damage) {
                case "full": {
                  targetTemplate.find(".full-damage").addClass("applied");
                  break;
                }
                case "half": {
                  targetTemplate.find(".half-damage").addClass("applied");
                  break;
                }
                case "double": {
                  targetTemplate.find(".double-damage").addClass("applied");
                  break;
                }
                case "triple": {
                  targetTemplate.find(".triple-damage").addClass("applied");
                  break;
                }
                case "heal": {
                  targetTemplate.find(".heal-damage").addClass("applied");
                  break;
                }
              }
            });
            if (targetTemplate.hasClass("name-top")) {
              $(
                `<i class="fa-solid fa-check pf2e-td name-icon" data-tooltip="${game.i18n.localize(
                  "pf2e-target-damage.applied"
                )}"></i>`
              ).appendTo(targetTemplate.find(".pf2e-td.name"));
            }
          }

          //#region The Buttons
          const full = targetTemplate.find("button.pf2e-td.full-damage");
          const half = targetTemplate.find("button.pf2e-td.half-damage");
          const double = targetTemplate.find("button.pf2e-td.double-damage");
          const triple = targetTemplate.find("button.pf2e-td.triple-damage");
          const heal = targetTemplate.find("button.pf2e-td.heal-damage");
          const contentSelector = `li.chat-message[data-message-id="${message.id}"] div.hover-content`;
          const $shield = targetTemplate
            .find("button.pf2e-td.shield-block")
            .attr({ "data-tooltip-content": contentSelector })
            .tooltipster({
              animation: "fade",
              trigger: "click",
              arrow: false,
              contentAsHtml: true,
              interactive: true,
              side: ["top"],
              theme: "crb-hover",
            });
          $shield.tooltipster("disable");

          // Add click events to apply damage
          full.on("click", (event) => {
            event.stopPropagation();
            applyDamage(message, tokenID, 1, 0, event.shiftKey, index);
            if (message.isAuthor || game.user.isGM) {
              updateDealtDamage({ degree: "full", targets, message, tokenID });
            } else {
              game.socket.emit("module.pf2e-target-damage", {
                type: "updateDealtDamage",
                args: { degree: "full", targets, message, tokenID },
              });
            }
          });

          half.on("click", (event) => {
            event.stopPropagation();
            applyDamage(message, tokenID, 0.5, 0, event.shiftKey, index);
            if (message.isAuthor || game.user.isGM) {
              updateDealtDamage({ degree: "half", targets, message, tokenID });
            } else {
              game.socket.emit("module.pf2e-target-damage", {
                type: "updateDealtDamage",
                args: { degree: "half", targets, message, tokenID },
              });
            }
          });

          double.on("click", (event) => {
            event.stopPropagation();
            applyDamage(message, tokenID, 2, 0, event.shiftKey, index);
            if (message.isAuthor || game.user.isGM) {
              updateDealtDamage({
                degree: "double",
                targets,
                message,
                tokenID,
              });
            } else {
              game.socket.emit("module.pf2e-target-damage", {
                type: "updateDealtDamage",
                args: { degree: "double", targets, message, tokenID },
              });
            }
          });

          triple === null || triple === void 0
            ? void 0
            : triple.on("click", (event) => {
                event.stopPropagation();
                applyDamage(message, tokenID, 3, 0, event.shiftKey, index);
                if (message.isAuthor || game.user.isGM) {
                  updateDealtDamage({
                    degree: "triple",
                    targets,
                    message,
                    tokenID,
                  });
                } else {
                  game.socket.emit("module.pf2e-target-damage", {
                    type: "updateDealtDamage",
                    args: { degree: "triple", targets, message, tokenID },
                  });
                }
              });

          heal.on("click", (event) => {
            event.stopPropagation();
            applyDamage(message, tokenID, -1, 0, event.shiftKey, index);
            if (message.isAuthor || game.user.isGM) {
              updateDealtDamage({ degree: "heal", targets, message, tokenID });
            } else {
              game.socket.emit("module.pf2e-target-damage", {
                type: "updateDealtDamage",
                args: { degree: "heal", targets, message, tokenID },
              });
            }
          });

          $shield.on("click", async (event) => {
            event.stopPropagation();
            const tokens = canvas.tokens.ownedTokens.filter(
              (token) => token.id === tokenID && token.actor
            );
            if (tokens.length === 0) {
              const errorMsg = game.i18n.localize("PF2E.UI.errorTargetToken");
              ui.notifications.error(errorMsg);
              event.stopPropagation();
              return;
            }
            // If the actor is wielding more than one shield, have the user pick which shield to block for blocking.
            const actor = tokens[0].actor;
            const heldShields = actor.itemTypes.armor.filter(
              (armor) => armor.isEquipped && armor.isShield
            );
            const nonBrokenShields = heldShields.filter(
              (shield) => !shield.isBroken
            );
            const multipleShields =
              tokens.length === 1 && nonBrokenShields.length > 1;
            const shieldActivated = $shield.hasClass("shield-activated");
            if (multipleShields && !shieldActivated) {
              $shield.tooltipster("enable");
              // Populate the list with the shield options
              const $list = targetTemplate.find("ul.shield-options");
              $list.children("li").remove();
              const $template = $list.children("template");
              for (const shield of nonBrokenShields) {
                const $listItem = $($template.html());

                $listItem.children("input.data").val(shield.id);
                $listItem.children("span.label").text(shield.name);
                const hardnessLabel = game.i18n.localize(
                  "PF2E.ShieldHardnessLabel"
                );
                $listItem
                  .children("span.tag")
                  .text(`${hardnessLabel}: ${shield.hardness}`);

                $list.append($listItem);
              }
              $list.find("li input").on("change", (event) => {
                const $input = $(event.currentTarget);
                $shield.attr({ "data-shield-id": $input.val() });
                $shield.tooltipster("close").tooltipster("disable");
                $shield.addClass("shield-activated");
                CONFIG.PF2E.chatDamageButtonShieldToggle = true;
              });
              $shield.tooltipster("open");
              return;
            } else {
              $shield.tooltipster("disable");
              $shield.removeAttr("data-shield-id");
              event.stopPropagation();
            }
            $shield.toggleClass("shield-activated");
            CONFIG.PF2E.chatDamageButtonShieldToggle =
              !CONFIG.PF2E.chatDamageButtonShieldToggle;
          });

          //#endregion

          // Check the origin message if the token has done saving throws.
          // If so, highlight the appropriate button to damage / heal with.
          if (originID && originTargets.length > 0) {
            originTargets
              .map((t) => new TargetDamageTarget(t))
              .filter((target) => target.token?.id === tokenID)
              .forEach((target) => {
                const outcome = game.messages.get(target.roll)?.flags?.pf2e
                  ?.context?.outcome;
                switch (outcome) {
                  case "criticalSuccess":
                    targetTemplate
                      .find(".damage-application")
                      .addClass("applied");
                    break;
                  case "success":
                    half.addClass("select");
                    break;
                  case "failure":
                    full.addClass("select");
                    break;
                  case "criticalFailure":
                    double.addClass("select");
                    break;
                }
              });
          }

          // push
          buttonTemplates.push(targetTemplate);
        }

        // Sort the buttons by the number of buttons they have, so that the ones with the most buttons are at the top.
        buttonTemplates.sort((a, b) => {
          const aButtons = a.find("button.pf2e-td").length;
          const bButtons = b.find("button.pf2e-td").length;

          return bButtons - aButtons;
        });

        html
          .find($('hr[data-roll-index="' + index + '"]'))
          .after(buttonTemplates);
      }
    });

    if (
      targets.length &&
      (game.settings.get("pf2e-target-damage", "hideOGButtons") ||
        (message.rolls[0]?.options.evaluatePersistent &&
          game.settings.get("pf2e-target-damage", "persistentDamageInt")))
    ) {
      // Hide the original buttons, whether it's the main one or the persistent damage one.
      html.find(".pf2e-td.hide-button").trigger("click", true);
    }
    if (game.settings.get("pf2e-target-damage", "hideTheHidingButtons")) {
      // REMOVE the original buttons, whether it's the main one or the persistent damage one.
      html.find(".pf2e-td.hide-button").remove();
    }

    // Not a damage roll, proceed with Target Saves
    if (rolls.length < 1) {
      const targetSection = $(
        html.find('[data-action="save"], [data-action="spell-save"]')
      );
      targetSection.wrap(
        '<div class="spell-button pf2e-td target-section"></div>'
      );

      // Add the target button
      if (message.isAuthor || message.isOwner) {
        targetSection.before(
          $(
            `<button class='pf2e-td target-button small-button' title="${game.i18n.localize(
              "pf2e-target-damage.targetButton.hint-" +
                game.settings.get("pf2e-target-damage", "targetButton")
            )}"><i class='fa-solid fa-crosshairs-simple fa-fw'></i></button>`
          ).click((e) => updateMessageWithFlags(message, e))
        );
      }

      if (message.flags?.pf2e?.origin?.type === "spell" && targets.length) {
        const spell =
          message.item || fromUuidSync(message.flags.pf2e.origin.uuid);
        const save = spell?.system?.save?.value;
        if (
          !html
            .find('[data-action="save"], [data-action="spell-save"]')
            .attr("data-dc")
        )
          return; // Message has no saving throw button
        if (!save) return; // Not a saving throw spell

        // Add hook to Damage
        html
          .find("[data-action='spellDamage'], [data-action='spell-damage']")
          .click((e) => {
            Hooks.once("createChatMessage", (damageMessage) => {
              damageMessage.update({
                "flags.pf2e-target-damage": {
                  origin: message.id,
                  targets: targets,
                },
              });
            });
          });

        const buttonTemplate = $(
          `<wrapper class="pf2e-td"><span class="pf2e-td name"></span><button class="pf2e-td save"></button></wrapper>`
        );

        const buttonTemplates = [];

        for (let i = 0; i < targets.length; i++) {
          const target = targets[i];
          const targetTemplate = $(buttonTemplate.clone());
          const nameHTML = targetTemplate.find(".pf2e-td.name");
          const saveHTML = targetTemplate.find(".pf2e-td.save");

          // replace stuff in template
          nameHTML.text(target.name);
          nameHTML.mouseenter(function (e) {
            onHoverIn(target.token, e);
            if (e.ctrlKey) {
              $(this).attr(
                "data-tooltip",
                game.i18n.localize("pf2e-target-damage.removeTarget")
              );
            }
          });
          nameHTML.mouseleave(function (e) {
            onHoverOut(target.token, e);
            if (e.ctrlKey) {
              $(this).attr("data-tooltip", target.name);
            }
          });
          nameHTML.click(function (e) {
            if (!($(this).attr("data-tooltip") === target.name)) {
              message.update({
                flags: {
                  "pf2e-target-damage": {
                    targets: targets.filter(
                      (t) => t.token.id !== target.token.id
                    ),
                  },
                },
              });
              $(document).find("#tooltip").removeClass("active");
            }
            onClickSender(target.token, e);
          });
          nameHTML.dblclick((e) => onClickSender(target.token, e));

          saveHTML.attr(
            "data-target-type",
            target.actor.hasPlayerOwner ? "pc" : "npc"
          );

          if (target.roll && game.messages.get(target.roll)?.isContentVisible) {
            const outcome = game.messages.get(target.roll).flags.pf2e.context
              .outcome;
            saveHTML.text(
              outcome
                ? game.i18n.localize(
                    `PF2E.Check.Result.Degree.Check.${outcome}`
                  )
                : "Error!"
            );
            saveHTML.addClass(outcome);
          } else {
            saveHTML.text(
              game.i18n.format("PF2E.SavingThrowWithName", {
                saveName: game.i18n.localize(
                  `PF2E.Saves${save.charAt(0).toUpperCase() + save.slice(1)}`
                ),
              })
            );
          }

          if (target.isOwner)
            saveHTML.click((e) => {
              const item = spell;
              const actor = target.actor?.actor ?? target.actor;

              const saveType = item.system.save.value;

              const dc = Number(
                html
                  .find('[data-action="save"], [data-action="spell-save"]')
                  .attr("data-dc") ?? "NaN"
              );
              const itemTraits = item.system.traits?.value ?? [];

              const save = actor?.saves?.[saveType];
              if (!save) return;

              const rollOptions = [];
              if (item.isOfType("spell")) {
                rollOptions.push("magical", "spell");
                if (Object.keys(item.system.damage.value).length > 0) {
                  rollOptions.push("damaging-effect");
                }
              }

              rollOptions.push(...itemTraits);
              rollOptions.push("pf2e-td-" + message.id);

              function eventToRollParams(event) {
                var skipDefault = !game.user.settings.showRollDialogs;
                if (!event) return { skipDialog: skipDefault };
                var params = {
                  skipDialog: event.shiftKey ? !skipDefault : skipDefault,
                };
                if (event.ctrlKey || event.metaKey)
                  params.rollMode = "blindroll";
                return params;
              }

              const rollParams = {
                ...eventToRollParams(e),
                dc: Number.isInteger(dc) ? { value: Number(dc) } : null,
                item,
                origin: actor,
                extraRollOptions: rollOptions,
              };

              save.check.roll(rollParams);
            });

          // this is really just to let the GM know the targets are mystified or hidden
          if (game.user.isGM) {
            if (!target.visibility) {
              targetTemplate
                .find("wrapper.pf2e-td")
                .attr("data-visibility", "gm");
            } else if (!target.mystified) {
              targetTemplate
                .find(".pf2e-td.name")
                .attr("data-visibility", "gm");
            }
          } else {
            if (!target.visibility) return;
          }

          if (game.settings.get("pf2e-target-damage", "classic")) {
            $(targetTemplate[0]).addClass("name-top");
          } else {
            $(targetTemplate[0]).addClass("name-left");
          }

          if (targetTemplate.hasClass("name-left"))
            nameHTML
              .attr("data-tooltip", target.name)
              .attr("data-tooltip-direction", "LEFT");

          buttonTemplates.sort((a, b) => {
            const aButtons = a.find("button.pf2e-td").length;
            const bButtons = b.find("button.pf2e-td").length;

            return bButtons - aButtons;
          });

          buttonTemplates.push(targetTemplate);
        }
        html.find(".card-buttons").append(buttonTemplates);

        const quickButtons = $(
          `<wrapper class="pf2e-td quick-buttons"><button class="pf2e-td quick-button all">${game.i18n.localize(
            "COMBAT.RollAll"
          )}</button><button class="pf2e-td quick-button npc">${game.i18n.localize(
            "COMBAT.RollNPC"
          )}</button></wrapper>`
        );

        quickButtons.find(".npc").click((e) => {
          html.find(".pf2e-td.save").each((i, button) => {
            if (
              $(button).hasClass("success") ||
              $(button).hasClass("failure") ||
              $(button).hasClass("criticalFailure") ||
              $(button).hasClass("criticalSuccess")
            )
              return;
            if ($(button).attr("data-target-type") === "npc") {
              $(button).trigger(e);
            }
          });
        });

        quickButtons.find(".all").click((e) => {
          html.find(".pf2e-td.save").each((i, button) => {
            if (
              $(button).hasClass("success") ||
              $(button).hasClass("failure") ||
              $(button).hasClass("criticalFailure") ||
              $(button).hasClass("criticalSuccess")
            )
              return;
            $(button).trigger(e);
          });
        });

        if (game.user.isGM) html.find(".card-buttons").append(quickButtons);
      }
    }

    // html.find(".tag:contains('pf2e-td'), .tag[data-trait*='pf2e-td']").remove();

    // Scroll down to the last roll
    setTimeout(() => {
      if (game.messages.contents.at(-1).id === message.id) {
        // Only on last message
        const lastRoll = html.find("wrapper.pf2e-td").last();
        if (lastRoll.length) {
          ui.chat.scrollBottom();
        }
      }
    }, 0);
  }, 0);
});

self.pf2eTargetDamage = {
  /**
   * Updates a message with an array of targets.
   * It adds the targets to the current ones by default, or replaces them if opts.replace is true.
   * @param {ChatMessage} message Message to update
   * @param {Array} targets Array of targets
   * @param {Object} opts Options
   * @param {boolean} opts.replace Whether to replace the current targets with the new ones
   */
  updateFlags: (message, targets, opts = {}) => {
    const targetsFlags = message.flags?.["pf2e-target-damage"]?.targets;
    const targetsCurrent = targets || [];
    let targetsFinal = [];

    targetsFinal.push(...targetsFlags);
    targetsFinal.push(...targetsCurrent);

    // Remove anything that doesn't already exist
    if (opts.replace) {
      targetsFinal = targetsFinal.filter((target) =>
        targetsCurrent.find((current) => current.id === target.id)
      );
    }

    // Remove duplicates
    targetsFinal = [...new Set(targetsFinal.map((target) => target.id))].map(
      (id) => targetsFinal.find((target) => target.id === id)
    );

    message.update({
      "flags.pf2e-target-damage.targets": targetsFinal.map((target) => {
        return {
          id: target.id,
          tokenUuid: target.tokenUuid || target.document.uuid,
          actorUuid: target.actorUuid || target.actor.uuid,
          roll: target.roll,
          damage: target.damage,
          applied: target.applied,
          debugOwner: target.debugOwner,
        };
      }),
    });
  },
  replaceFlags: (message, targets, opts = {}) =>
    pf2eTargetDamage.updateFlags(message, targets, { ...opts, replace: true }),
};
