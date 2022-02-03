// https://stackoverflow.com/questions/42872002/in-vue-js-component-how-to-use-props-in-css
// https://vuetifyjs.com/en/getting-started/installation/#usage-with-cdn
export default {
    data: function() {
        return {
            zoom: 1.0,
            zoomMin: 0.3,
            zoomMax: 2,
        }
    },
    computed: {
        cssProps() {
            return {
                '--zoom': this.zoom,
            }
        }
    },
    methods: {
        eventme(e) {
            console.log("e")
            e.preventDefault()
        },
        handleScroll(e) {
            this.zoom = _.clamp(this.zoom + e.deltaY * 0.01, this.zoomMin, this.zoomMax);
        }
    },
    template: `
		<div class="section">
			<div class="content main-header" :style="cssProps" @wheel.ctrl.prevent="handleScroll">
				<h1>Main</h1>
				<div class="row">
				<button @click="zoom = zoom - 0.1" class="button">-</button>
				<div>{{zoom.toFixed(2)}}</div>
				<button @click="zoom = zoom + 0.1" class="button">+</button>
				</div>
			</div>
		</div>
	`
}