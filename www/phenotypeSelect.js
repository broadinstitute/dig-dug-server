Vue.component("phenotype-select", {
	data() {
		return {
			selectedPhenotype: null,
			phenotypeMap: null
		};
	},
	mounted() {
		fetch("/getPhenotypes")
			.then(response => response.json())
			.then(json => (this.phenotypeMap = json));
	},
	methods: {
		updateStore() {
			this.$store.commit(
				"updateSelectedPhenotype",
				this.selectedPhenotype
			);
			this.$store.dispatch("getDatasets");
		}
	}
});

Vue.component("variant-table", {
	data() {
		return {
			tableData: null
		};
	},
	computed: {
		getData() {
			return this.$store.state.tableData;
		}
	}
});
