import MyEditor from "./MyEditor.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

function mknote() {
    const id = uuidv4()
    return {
        id,
        content: "The note of " + id,
    }
}

export default {
    data() {
        return {
            cardSets: [],
            csidx: null,
        }
    },
    async mounted() {
        window.board = this// deleteme debug

        for (let i = 0; i < 3; i++) {
            const cards = []
            for (let j = 0; j < 9; j++) {
                cards.push({
                    id: uuidv4(),
                    // note: mknote(),
                    note: { content: `Card ${i}-${j}`, id: uuidv4() }
                })
            }
            this.cardSets.push(cards)
        }
        this.csidx = 0

        tinykeys(window, {
            "$mod+D": (e) => {
                this.csidx++
                if (this.csidx >= this.cardSets.length) {
                    this.csidx = 0
                }
                e.preventDefault()
            }
        })
    },

    methods: {
    },
    computed: {
    },
    template: `
    <div class="notingham-root board-spike-grid">
      <MyEditor v-for="card in cardSets[csidx]"
         v-model="card.note.content"
         :toolbarVisible="false"
         :darkMode="false"/>
      <!-- <div v-for="card in cards" class="box card-spike">
          <MyEditor v-model="card.note.content" :toolbarVisible="false"/>
      </div> -->
    </div>
  `,
    components: {
        MyEditor
    }
}
