const CommandPalette = {
    props: {
        modelValue: { type: Object, required: true },
    },
    data() {
        return {
            selectedIndex: 0,
        }

    },
    computed: {
        lastIndex() {
            const len = this.modelValue.items.length
            if (len == 0) {
                return 0
            } else {
                return len - 1
            }
        }
    },
    methods: {
        focus() {
            this.$refs.commandInput.focus()
        },
        handleKeydown(e) {
            if (e.key == "ArrowDown") {
                e.preventDefault()
                this.selectNext()
            } else if (e.key == "ArrowUp") {
                e.preventDefault()
                this.selectPrev()
            }
        },
        selectNext() {
            this.selectedIndex += 1
            if (this.selectedIndex > this.lastIndex) {
                this.selectedIndex = 0
            }
        },
        selectPrev() {
            this.selectedIndex -= 1
            if (this.selectedIndex < 0) {
                this.selectedIndex = this.lastIndex
            }
        },
        resultStyle(i) {
            return {
                "select-highlight": i == this.selectedIndex 
            }
        },
        inputEvent(e) {
            // console.log("inputEvent:",this.modelValue.input)
        }
    },
    template: `
      <div class="command-palette box" style="z-index: 100">
        <input 
            class="command-input" 
            v-model="modelValue.input"
            :placeholder="modelValue.placeholder"
            ref="commandInput" 
            @keydown="handleKeydown"
            @input="inputEvent"
            style="z-index: 101">
        <div v-for="result,i in modelValue.items" :class="resultStyle(i)" style="z-index: 101">
            {{result.text}}
        </div>
      </div>
    })`
}

const CommandPaletteModel = {}
CommandPaletteModel.init = () => {
    return {
        input: "",
        placeholder: "Search / Command",
        items: [
            // { text: "Example" },
            // { text: "Example" },
            // { text: "Example" },
            // { text: "Example" },
            // { text: "Example" },
        ],
    }
}

export { CommandPalette, CommandPaletteModel }