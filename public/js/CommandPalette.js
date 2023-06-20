import CommandSearcher from "./CommandSearcher.js"

// TODO: TestCommands and CommandSearcher are prototypical! Need design/refactor!
const TestCommands = [
    {
        name: "delete_note",
        title: "Delete Note",
        description: "Delete the currently editing note"
    },
    // {
    //     name: "star_wars",
    //     title: "Play Fanfare",
    //     description: "Play the Star Wars title theme"
    // }
]


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
            maxResults: 50,
            commandSearcher: null,
        }
    },
    mounted() {
        this.commandSearcher = Vue.shallowRef(new CommandSearcher(TestCommands))
        console.log("CommandPalette: mounted")
    },

    computed: {
        choices() {
            console.log("CommandPalette: recalc choices")
            let items = []
            if (this.searchString.startsWith(">")) {
                const term = this.searchString.slice(1).trimStart()
                const commands = this.commandSearcher.search(term)
                return commands.map(cmd => {
                    return {
                        kind: "command",
                        text: cmd.title,
                        data: cmd,
                    }
                })
            } else {
                let notes = []
                if (this.searchString.length > 0) {
                    notes.push(...this.searcher.search(this.searchString))
                } else {
                    notes.push(...this.searcher.search(null))
                }
                return _.take(notes, this.maxResults).map(note => {
                    return {
                        kind: "note",
                        text: note.name,
                        data: note,
                    }
                })
            }
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

        focus({ text } = {}) {
            this.$refs.commandInput.focus()
            if (text) {
                this.$refs.commandInput.value = text
            }
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
    `
}

export default CommandPalette
