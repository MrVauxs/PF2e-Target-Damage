/**
 * Automatically localizes or formats a string if it is found in the language file.
 *
 * @param {string} string - The string to localize.
 *
 * @param {object} object - The object to format the string with.
 *
 * @returns {string} - The localized or formatted string.
 */
export function localize(string, object) {
    if (object.length > 0) {
        return game.i18n.format(string, object);
    } else {
        return game.i18n.localize(string, object);
    }
}