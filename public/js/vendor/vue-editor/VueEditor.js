const Editor = toastui.Editor; // import Editor from '@toast-ui/editor';
import { optionsMixin } from './optionsMixin.js';

export default {
    name: 'ToastuiEditor',
    template: `<div ref="toastuiEditor" :derp="options.theme=='dark'"></div>`,
    mixins: [optionsMixin],
    props: {
        previewStyle: {
            type: String,
        },
        height: {
            type: String,
        },
        initialEditType: {
            type: String,
        },
        initialValue: {
            type: String,
        },
        options: {
            type: Object,
        },
    },
    watch: {
        previewStyle(newValue) {
            this.editor.changePreviewStyle(newValue);
        },
        height(newValue) {
            this.editor.height(newValue);
        },
    },
    mounted() {
        const options = { ...this.computedOptions, el: this.$refs.toastuiEditor };
        this.editor = Vue.shallowRef(new Editor(options));
    },
    methods: {
        setMarkdown(txt) {
            this.editor.setMarkdown(txt)
        },
        getRootElement() {
            return this.$refs.toastuiEditor;
        },
    },
};
