// Init cannot be changed or else buttons stop linking after a refresh
Hooks.once("init", async () => {
    await Object.defineProperty(CONFIG.ChatMessage.documentClass.prototype, "oldItem", Object.getOwnPropertyDescriptors(CONFIG.ChatMessage.documentClass.prototype).item)

    await Object.defineProperty(CONFIG.ChatMessage.documentClass.prototype, "item", {
        get() {
            try {
                let newItem = this.oldItem
                const trait = "pf2e-td-" + this.id;
                newItem.system.traits.newContent = ["This should only be in item but not oldItem"]
                return newItem;
            } catch (error) {
                ui.notifications.error("An error has occured in PF2e Target Damage. <a href='https://github.com/MrVauxs/PF2e-Target-Damage/issues'>Please report the error</a> in the console to the developer.")
                console.error(error)
                return this.oldItem
            }
        }
    })
})