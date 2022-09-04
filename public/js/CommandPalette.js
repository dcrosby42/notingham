const CommandPalette = {
    props: {
        modelValue: { type: String, required: true },
    },
    methods: {
        resultStyle(i) {
            console.log(`result ${i}`)
            return{}
        }

    },
    template: `
      <div ref="paletteDiv" class="command-palette">
        <input class="command-input" placeholder="Command Palette" ref="commandInput">
        <div v-for="result,i in modelValue.results" :class="resultStyle(i)">
            {{result.text}}
        </div>
      </div>
    })`
}

const CommandPaletteModel = {}
CommandPaletteModel.init = () => {
    return {
        results: [
            {text: "Example"},
            {text: "Example"},
            {text: "Example"},
            {text: "Example"},
            {text: "Example"},
        ],
    }
}

export {CommandPalette,CommandPaletteModel}