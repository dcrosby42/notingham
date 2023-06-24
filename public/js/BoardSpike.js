import MyEditor from "./MyEditor.js"
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

const NUM_SETS = 3
const CARD_SET_SIZE = 23

export default {
    data() {
        return {
            cardSets: [],
            csidx: null,
        }
    },
    async mounted() {
        window.board = this// deleteme debug

        // build card sets
        for (let i = 0; i < NUM_SETS; i++) {
            // build notes
            const cards = []
            for (let j = 0; j < CARD_SET_SIZE; j++) {
                cards.push({
                    id: uuidv4(),
                    note: { content: `**Card ${i}-${j}**`, id: uuidv4() }
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
