// Access Notingham's object storage api
class ObjectsApi {
    constructor({ notebook }) {
        this.notebook = notebook
    }

    _obj_url(kind, id) {
        return `/api/v1/notebooks/${this.notebook}/objects/${kind}/${id}`
    }

    async getObject(kind, id, { throw_on_error = false } = {}) {
        const resp = await fetch(this._obj_url(kind, id))
        if (resp.ok) {
            return await resp.json()
        } else {
            if (throw_on_error) {
                console.error(`FAIL: ObjectsApi.getObject('${kind}','${id}')`, resp)
                throw new Error(`No object kind=${kind} id=${id}`)
            }
            MessageBus.Default.publish({
                event: "ObjetsApi.error",
                data: { method: "getObject", kind, id, response }
            })
        }
    }

    async storeObject(kind, id, object) {
        try {
            const resp = await fetch(this._obj_url(kind, id), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(object)
            })
            if (resp.ok) {
                if (this.logging) {
                    console.log(`OK: ObjectsApi.storeObject('${kind}','${id}') ->`, object)
                }
                MessageBus.Default.publish({
                    event: "ObjectsApi.objectStored",
                    data: { method: "storeObject", kind, id, object }
                })
            } else {
                console.error(`FAIL: ObjectsApi.storeObject('${kind}','${id}') ->`, object, resp)
                MessageBus.Default.publish({
                    event: "ObjetsApi.error",
                    data: { method: "storeObject", kind, id, object, response }
                })
            }
        } catch (error) {
            console.error(`ERROR: ObjectsApi.storeObject('${kind}','${id}') ->`, object, error)
            MessageBus.Default.publish({
                event: "ObjectsApi.error",
                data: { method: "storeObject", kind, id, object, error }
            })
        }
    }
}
if (window) {
    window.ObjectsApi = ObjectsApi
}
export default ObjectsApi