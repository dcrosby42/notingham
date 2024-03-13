
const CollapsingPanel = {
  props: {
    panel: String,
    title: String,
    panelStates: Object,
    isExpanded: Boolean,
    togglePanel: Function,
  },
  computed: {
    // isPanelOpen() {
    //   return !!this.panelStates[this.panel]
    // }
  },
  template: `
      <div v-if="isExpanded">
        <div @click="togglePanel(panel)" style="cursor:pointer">[-] {{title}}</div>
        <slot></slot>
      </div>
      <div v-else @click="togglePanel(panel)" style="cursor:pointer">[+] {{title}}</div>
    `
}
export default CollapsingPanel
