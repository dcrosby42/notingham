const fs = require('fs');
const _ = require('lodash');
const elasticlunr = require('elasticlunr');
const { listFiles } = require("./dirlist")



async function main() {

    const index = elasticlunr(function() {
        this.addField('body')
    });

    let dir = process.argv.slice(2)[0]
    if (!dir) {
        console.log("Provide a dir to scan")
        process.exit()
    }

    const idcache = {}
    const toId = (path) => {
        let id = _.last(path.split("/")).replace(/[^A-Za-z0-9]+/g, " ").trim().replace(/ /g, "_")
        if (idcache[id]) {
            let c = 2
            let alt = `${id}_${c}`
            while (idcache[alt]) {
                c += 1
                alt = `${id}_${c}`
            }
            id = alt
        }
        idcache[id] = true
        return id
    }

    console.log("Scanning dir:", dir)
    const y = await listFiles(dir)
    y.forEach(path => {
        if (path.match(/\.md$/) || path.match(/\.txt/)) {
            // const id = toId(path)
            const buf = fs.readFileSync(path, "utf8")
            const doc = {
                    "id": path,
                    // "path": path,
                    "body": buf.toString(),
                }
                // console.log("indexing doc", id)
            index.addDoc(doc);
        }
    })

    // x = index.search("+js")
    // console.log(x)

    const outfile = "searchindex.json";
    fs.writeFileSync(outfile, JSON.stringify(index))
    console.log("Wrote", outfile)
}

main().catch(e => console.log(e))