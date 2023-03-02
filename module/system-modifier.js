// Init cannot be changed or else buttons stop linking after a refresh
Hooks.once("init", () => {
    Object.defineProperty(CONFIG.ChatMessage.documentClass.prototype, "oldItem", Object.getOwnPropertyDescriptors(CONFIG.ChatMessage.documentClass.prototype).item)

    Object.defineProperty(CONFIG.ChatMessage.documentClass.prototype, "item", {
        get() {
            try {
                let newItem = this.oldItem
                if (!newItem?.system?.traits?.value.find(x => x.includes("pf2e-td-"))) { // The Item already has a Target Damage Trait
                    newItem?.system?.traits?.value?.push("pf2e-td-" + this.id)
                }
                return newItem;
            } catch (error) {
                ui.notifications.error("An error has occured in PF2e Target Damage. <a href='https://github.com/MrVauxs/PF2e-Target-Damage/issues'>Please report the error</a> in the console to the developer.")
                console.error(error)
                return this.oldItem
            }
        }
    })
})