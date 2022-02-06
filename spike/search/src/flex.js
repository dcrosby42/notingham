const fs = require('fs');
const _ = require('lodash');

const { Index, Document, Worker } = require("flexsearch");

const { listFiles } = require("./dirlist")

function writeJsonFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data))
    console.log(`Wrote ${file}`)
}


async function main() {

    const index = new Index();
    // const document = new Document(options);
    // const worker = new Worker(options);

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
            const id = toId(path)
            const buf = fs.readFileSync(path, "utf8")
            index.add(id, buf.toString());
        }
    })

    x = index.search("+js")
    console.log(x)

    // const outfile = "searchindex.json";
    // fs.writeFileSync(outfile, JSON.stringify(index))
    // console.log("Wrote", outfile)
    await new Promise(r => {
        index.export((key, data) => {
            // writeJsonFile(key, data)
            console.log("export:", key)
        })
    })
    console.log("done")
}

main().catch(e => console.log(e))