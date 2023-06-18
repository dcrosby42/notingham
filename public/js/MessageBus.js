export default class MessageBus {
    static UnhandledEvent = "MESSAGEBUS_UNHANDLED"


    constructor(name) {
        this.name = name
        this.channels = {} // double map of eventName -> token -> callbackFn
    }

    subscribe({ event, callback, token }) {
        if (_.has(this.channels, [event, token])) {
            // already subscribed
        } else {
            _.set(this.channels, [event, token], callback)
        }
    }
    unsubscribe({ token, event = null }) {
        if (event) {
            // Unsubscribe this token from the given event
            if (_.has(this.channels, [event, token])) {
                delete this.channels[event][token]
            }
        } else {
            // Unsubscribe this token from ALL events
            const events = _(this.channels)
                .toPairs()
                .filter(([event, subscribers]) => _.has(subscribers, token))
                .map(([event, _]) => event)
                .value()
            events.forEach(event => {
                delete this.channels[event][token]
            })
        }
    }

    publish({ event, data }) {
        const subs = this.channels[event]
        if (_.size(subs) == 0) {
            // No subscribers. Attempt to publish to special channel
            // TODO subs = this.channels[MessageBus.UnhandledEvent]

            // Just in case we're passing around error-ish things that nobody's listening for
            if (event.match(/error/i) || _.get(data, "error")) {
                console.error(`MessageBus: publish() unsubscribed event ${event} looks like it be an ignored error:`, data)
            }
        }
        if (_.size(subs) > 0) {
            _.forEach(subs, callback => { callback(data) })
        }
    }

    // subscribeUnhandled({ callback, token }) {
    //     this.subscribe({ event: MessageBus.UnhandledEvent, token, callback })
    // }
    // unsubscribeUnhandled({ token }) {
    //     this.unsubscribe({ event: MessageBus.UnhandledEvent, callback })
    // }

    static Default = new MessageBus("Default")

    static subscribe(...a) {
        MessageBus.Default.subscribe(...a)
    }
    static unsubscribe(...a) {
        MessageBus.Default.unsubscribe(...a)
    }
    static publish(...a) {
        MessageBus.Default.publish(...a)
    }
}

// export const globalBus = new MessageBus("global")

if (window) {
    // window.globalBus = globalBus
    window.MessageBus = MessageBus
}

