import VueEditor from "./vendor/toastui-editor-vue/VueEditor.js"

const { Editor } = toastui;
// const { uml } = Editor.plugin


// MyEditor
export default {
    props: {
        modelValue: { type: String, required: true },
        height: { type: String, default: "100%", required: false },
        darkMode: { type: Boolean, default: true, required: false },
        toolbarVisible: { type: Boolean, default: true, required: false },
    },
    data() {
        return {
        }
    },
    created() {
        // window.App = this;
    },
    updated() {
        // console.log("updated", this.modelValue)
        const e = this.$refs.editor.editor
        if (e.getMarkdown() != this.modelValue) {
            e.setMarkdown(this.modelValue, false)
        }
    },
    mounted() {
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
    computed: {
        options() {
            const opts = {}
            if (this.darkMode) {
                opts.theme = "dark"
            }
            return opts
        }
    },
    template: `
      <div>
          <VueEditor 
            ref="editor" 
            previewStyle="tab" 
            initialEditType="wysiwyg" 
            :initialValue="modelValue" 
            @change="handleChange"
            :height="height" 
            :toolbarVisible="toolbarVisible"
            :options="options" />
      </div>
    `,
    components: {
        VueEditor
    }
};
