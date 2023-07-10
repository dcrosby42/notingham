// import CommandSearcher from "./CommandSearcher.js"


const CommandPalette = {
    props: {
        getChoices: Function,
    },
    emits: [
        "chosen"
    ],
    data() {
        return {
            searchString: "",
            selectedIndex: 0,
            maxResults: 50,
        }
    },
    mounted() {
    },

    computed: {
        choices() {
            // console.log("CommandPalette: recalc choices")
            const cs = this.getChoices(this.searchString)
            cs.forEach((choice, i) => choice.i = i)
            return cs
        },
        choiceGroups() {
            const groups = []
            let cgroup = { kind: null, choices: [] }
            groups.push(cgroup)
            if (!_.isEmpty(this.choices)) {
                let currentKind = this.choices[0].kind
                cgroup.kind = currentKind
                _.each(this.choices, choice => {
                    if (choice.kind !== currentKind) {
                        currentKind = choice.kind
                        cgroup = { kind: currentKind, choices: [] }
                        groups.push(cgroup)
                    }
                    cgroup.choices.push(choice)
                })
            }
            return groups
        },
        selectedChoice() {
            if (this.selectedIndex >= 0 && this.selectedIndex <= this.lastIndex) {
                return this.choices[this.selectedIndex]
            }
            return null
        },
        lastIndex() {
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
        <div v-for="group in choiceGroups" class="choice-holder">
            <div class="choice-separator">{{group.kind}}</div>
            <div v-for="choice,i in group.choices" 
                 :class="choiceStyle(choice.i)" 
                 @click="e => {e.preventDefault(); choiceClicked(choice.i)}"
                 style="z-index: 101">
                {{choice.text}}
            </div>
        </div>
      </div>
    `
}

export default CommandPalette
