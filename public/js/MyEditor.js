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
        editorMode: { type: String, default: "wysiwyg", required: false },
    },
    data() {
        return {
        }
    },
    created() {
        // window.App = this;
    },
    updated() {
        if (this.editor.getMarkdown() != this.modelValue) {
            this.editor.setMarkdown(this.modelValue, false)
        }
    },
    mounted() {
        window.Editor = this.editor
    },
    watch: {
        editorMode(mode, _oldMode) {
            this.editor.changeMode(mode, true)
        }
    },
    methods: {
        handleChange(editorMode) {
            this.$emit("update:modelValue", this.editor.getMarkdown())
        },
        // Dirty tricksie.  Couldn't find an "a-priori" means to invoke the addLink UI functionality.  (The addLink command works ok, but it doesn't include the link editor popup)
        startAddLink() {
            const toolbarUrlButton = document.getElementsByClassName("link toastui-editor-toolbar-icons")
            if (_.size(toolbarUrlButton) >= 1) {
                toolbarUrlButton[0].click()
                this.$nextTick(() => {
                    document.getElementById('toastuiLinkUrlInput').focus()
                })
            }
        },
        toggleLink() {
            const fn = _.get(this.editor, "wwEditor.commands.toggleLink")
            if (fn) { fn() }
            // this.editor.wwEditor.commands.toggleLink()
        },
        toggleTask() {
            const fn = _.get(this.editor, "wwEditor.commands.taskList")
            if (fn) { fn() }
        }
    },
    computed: {
        options() {
            const opts = {}
            if (this.darkMode) {
                opts.theme = "dark"
            }
            return opts
        },
        editor() {
            return this.$refs.editor.editor
        }
    },
    template: `
      <div>
          <VueEditor 
            ref="editor" 
            previewStyle="tab" 
            :initialEditType="editorMode" 
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
