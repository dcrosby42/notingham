
const CollapsingPanel = {
    props: {
        panel: String,
        title: String,
        panelStates: Object,
        togglePanel: Function,
    },
    computed: {
        isPanelOpen() {
            return !!this.panelStates[this.panel]
        }
    },
    template: `
      <div v-if="isPanelOpen">
        <div @click="togglePanel(panel)" style="cursor:pointer">[-] {{title}}</div>
        <slot></slot>
      </div>
      <div v-else @click="togglePanel(panel)" style="cursor:pointer">[+] {{title}}</div>
    `
}
export default CollapsingPanel
