
const CommandPalette = {
    props: {
        searcher: { type: Object, required: true }
    },
    emits: [
        "chosen"
    ],
    data() {
        return {
            searchString: "",
            selectedIndex: 0,
            maxResults: 15,
        }
    },

    computed: {
        choices() {
            let items = []
            if (this.searchString && this.searchString.length > 0) {
                items.push(...this.searcher.search(this.searchString))
            } else {
                items.push(...this.searcher.search(null))
            }
            return _.take(items,this.maxResults).map(item => {
                return {
                    kind: this.searcher.getKind(item),
                    text: this.searcher.getText(item),
                    data: item,
                }
            })
        },
        selectedChoice() {
            if (this.selectedIndex >= 0 && this.selectedIndex <= this.lastIndex) {
                return this.choices[this.selectedIndex]
            }
            return null
        },
        lastIndex() {
            // const len = this.modelValue.items.length
            const len = this.choices.length
            if (len == 0) {
                return 0
            } else {
                return len - 1
            }
        },
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
            } else if (e.key == "Enter") {
                this.emitChoiceEvent(this.selectedChoice)
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
        choiceStyle(i) {
            return {
                "is-clickable": true,
                "choice-highlight": i == this.selectedIndex 
            }
        },
        inputEvent(e) {
            // console.log("inputEvent:",this.modelValue.input)
        },
        choiceClicked(i) {
            this.selectedIndex = i
            this.emitChoiceEvent(this.selectedChoice)
        },
        emitChoiceEvent(choice) {
            this.$emit('chosen', choice)

        },
    },
    template: `
      <div class="command-palette box" style="z-index: 100">
        <input 
            class="command-input" 
            v-model="searchString"
            placeholder="Search"
            ref="commandInput" 
            @keydown="handleKeydown"
            @input="inputEvent"
            style="z-index: 101">
        <!-- <div v-for="result,i in modelValue.items" :class="resultStyle(i)" style="z-index: 101">
            {{result.text}}
        </div> -->
        <div class="choice-holder">
            <div v-for="choice,i in choices" 
                 :class="choiceStyle(i)" 
                 @click="e => {e.preventDefault(); choiceClicked(i)}"
                 style="z-index: 101">
                {{choice.text}}
            </div>
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