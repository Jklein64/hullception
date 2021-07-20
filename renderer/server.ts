import * as express from "express"
import * as cors from "cors"
import * as events from "events"

import * as SSE from "./src/SSE"

const emitter = new events.EventEmitter()

express()
    .use(cors())

    .get("/image", (req, res) => {
        // send SSE headers to client
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders()

        // keep client in sync with server
        emitter.on("post", ({ type, data }: SSE.ServerSentEvent) => {
            res.write(`data: ${JSON.stringify({ type, data })}\n\n`)
        })

        // client can terminate connection
        res.on("close", () => {
            emitter.removeAllListeners("post")
            res.end()
        })
    })

    .use("/", express.static("dist"))

    .get("/", (req, res) => res.sendFile("index.html"))

    .post("/:endpoint", (req, res) => {
        const endpoint = req.params.endpoint

        let collected = ""
        req.on("data", chunk => collected += chunk)
        req.on("end", () => {
            emitter.emit("post", { type: endpoint, data: primitiveOrJSON(collected) })
            res.status(200).send()
        })
    })

    .listen(process.env.PORT ?? 8000, () => console.log("listening!"))

function primitiveOrJSON(data: string): string | number | Object {
    try {
        return JSON.parse(data)
    } catch {
        return data
    }
}