export default class ItemSearcher {
    constructor(items, { id = "id", index = [] } = {}) {
        this.id_field = id
        this.index_fields = index
        this.reindex(items)
    }
    reindex(items) {
        this.items = items
        this.byId = _.keyBy(this.items, this.id_field)
        this.searchModel = new FlexSearch.Document({
            tokenize: "forward",
            document: {
                id: this.id_field,
                index: this.index_fields,
            },
            preset: "score"
        });
        this.items.forEach(item => this.searchModel.add(item))
    }
    search(str) {
        if (!str || str.length === 0) {
            return [...this.items]
        } else {
            const searchRes = this.searchModel.search(str)
            return _(searchRes)
                .flatMap(sr => sr.result)
                .uniq()
                .map(id => this.byId[id])
                .value()
        }
    }
}
