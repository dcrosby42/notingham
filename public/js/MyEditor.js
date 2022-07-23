import VueEditor from "./vue-editor/VueEditor.js"

const { Editor } = toastui;
// const { uml } = Editor.plugin


// MyEditor
export default {
    props: {
        modelValue: { type: String, required: true },
        height: { type: String, default: "100%", required: false }
    },
    data() {
        return {
            options: {
                theme: "dark",
                // plugins: [uml]
            },
            // content: "# CAP Triage",
            editor: null,
        }
    },
    created() {
        window.App = this;
    },
    updated() {
        // console.log("updated", this.modelValue)
        // this.editor.setMarkdown("crap")
        const e = this.$refs.editor.editor
        if (e.getMarkdown() != this.modelValue) {
            e.setMarkdown(this.modelValue, false)
        }
    },
    mounted() {
        // this.editor = this.$refs.editor; //.editor
        // window.Editor = this.$refs.editor.editor
        // window.Editor = this.$refs.editor.getRootElement()
    },
    methods: {
        handleChange(editorMode) {
            const content = this.$refs.editor.editor.getMarkdown()
            this.$emit("update:modelValue", content)
            // console.log(this.$refs.editor.editor.getMarkdown())
        }
    },
    template: `
      <!-- <div style="height: 100%"> -->
      <div style="">
          <VueEditor 
            ref="editor" 
            previewStyle="tab" 
            initialEditType="wysiwyg" 
            :initialValue="modelValue" 
            @change="handleChange"
            :height="height" 
            :options="options" />
      </div>
    `,
    components: {
        VueEditor
    }
};
