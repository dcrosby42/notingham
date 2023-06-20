

// TODO: TestCommands and CommandSearcher are prototypical! Need design/refactor!
// THIS CLASS IS NEARLY 100% COPY PASTE FROM NoteSearcher
export default class CommandSearcher {
    constructor(commands) {
        this.commands = commands
        commands.forEach((cmd, i) => { cmd.id = i })
        this.commandsById = _.keyBy(this.commands, "id")
        this._reset()
    }
    search(str) {
        if (!str || str.length === 0) {
            return [...this.commands]
        } else {
            const searchRes = this.searchModel.search(str)
            return _(searchRes)
                .flatMap(sr => sr.result)
                .uniq()
                .map(id => this.commandsById[id])
                .value()
        }
    }
    add(command) {
        this.searchModel.add(command)
        this.commandsById[command.id] = command
    }
    update(command) {
        this.searchModel.update(command)
    }
    remove(command) {
        this.searchModel.remove(command.id)
        delete this.commandsById[command.id]
    }


    _reset() {
        this.searchModel = new FlexSearch.Document({
            tokenize: "forward",
            document: {
                id: "id",
                index: ["title", "name", "description"],
            },
            preset: "score"
        });
        this.commands.forEach(c => this.searchModel.add(c))
    }
}
