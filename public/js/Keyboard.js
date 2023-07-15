
const DefaultKeybinds = {
    "Escape": "closeCommandPalette",
    "$mod+KeyP": "toggleCommandPalette",
    "Shift+$mod+KeyP": ["openCommandPalette", { mode: "command" }],
    "F1": ["openCommandPalette", { mode: "command" }],
    "Shift+Control+KeyN": "newNote",
    "Shift+Control+KeyB": "toggleLeftbarShowing",
    "Shift+Control+KeyD": "toggleDarkMode",
    "Shift+Alt+KeyB": "cycleLeftbarState",
    "$mod+1": ["selectPinnedNote", 0],
    "$mod+2": ["selectPinnedNote", 1],
    "$mod+3": ["selectPinnedNote", 2],
    "$mod+4": ["selectPinnedNote", 3],
    "$mod+5": ["selectPinnedNote", 4],
    "$mod+6": ["selectPinnedNote", 5],
    "$mod+7": ["selectPinnedNote", 6],
    "$mod+8": ["selectPinnedNote", 7],
    "$mod+9": ["selectPinnedNote", 8],
    // "$mod+0": ["selectPinnedNote", 9],
    "Shift+Control+BracketLeft": "navBack",
    "Shift+Control+BracketRight": "navForward",

    // current note:
    "Shift+Control+p p": "toggleNotePinned",
    "Shift+Control+p k": "movePinnedNoteUp",
    "Shift+Control+p j": "movePinnedNoteDown",
    // "$mod+k p ArrowDown": "movePinnedNoteDown", // couldn't get this binding working?

    // current editor:
    "$mod+KeyK ": "editor_addUrl",
    "Shift+Control+KeyT ": "editor_toggleTask",
    "$mod+KeyM": "editor_toggleEditorMode",
    "Shift+Control+KeyF": "editor_toggleToolbarVisible",

}

function bindKeys({ from, target, bindings }) {
    tinykeys(from, _.mapValues(bindings, (action, bindingExpr) => {
        let method
        let args = []
        if (_.isString(action)) {
            method = action
        } else if (_.isPlainObject(action)) {
            method = action.method
        } else if (_.isArray(action)) {
            method = action[0]
            args = _.tail(action)
        }
        if (!_.has(target, method)) {
            console.warn(`Key binding for ${bindingExpr}: method ${method} invalid`)
            method = null
        }
        return (e) => {
            if (method) {
                target[method](...args)
                e.preventDefault()
            } else {
                console.warn(`Key binding for ${bindingExpr}: no method given`)
            }
        }
    }))
}

export { bindKeys, DefaultKeybinds }
