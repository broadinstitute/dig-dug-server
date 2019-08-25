Vue.component("dataset-select", {
	data() {
		return {
			selectedDataset: null
		};
	},
	computed: {
		datasetList() {
			return this.$store.state.datasetList;
		}
	},
	methods: {
		updateStore() {
			this.$store.dispatch("selectedDataset", this.selectedDataset);
		}
	}
});
