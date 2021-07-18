import * as express from "express"
import * as cors from "cors"

import * as SSE from "./src/constants";

const image = State<SSE.ImageData["data"]>("")
const lines = State<SSE.LinesData["data"]>([])

express()
    .use(cors())

    .get("/image", (req, res) => {
        // send SSE headers to client
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders()

        // keep client in sync with server
        const
            imageCallback = (image: string) => {
                const payload: SSE.ServerSentEvent = { type: "image", data: image }
                res.write(`data: ${JSON.stringify(payload)}\n\n`)
            },
            linesCallback = (lines: SSE.LinesData["data"]) => {
                const payload: SSE.ServerSentEvent = { type: "lines", data: lines }
                res.write(`data: ${JSON.stringify(payload)}\n\n`)
            }
        image.subscribers.add(imageCallback)
        lines.subscribers.add(linesCallback)



        // client can terminate connection
        res.on("close", () => {
            // Set can delete by reference :)
            image.subscribers.delete(imageCallback)
            lines.subscribers.delete(linesCallback)
            res.end()
        })
    })

    .use("/", express.static("dist"))

    .get("/", (req, res) => res.sendFile("index.html"))

    .post("/image", (req, res) => {
        let collected = ""
        req.on("data", chunk => collected += chunk)
        req.on("end", () => {
            image.value = collected
            res.status(200).send()
        })
    })

    .post("/lines", (req, res) => {
        let collected = ""
        req.on("data", chunk => collected += chunk)
        req.on("end", () => {
            lines.value = JSON.parse(collected)
            res.status(200).send()
        })
    })

    .listen(process.env.PORT ?? 8000, () => console.log("listening!"))

function State<T>(initial: T) {
    return new Proxy({
        value: initial,
        subscribers: new Set<(value: T) => void>()
    }, {
        set(target, property, value: unknown, receiver) {
            if (property === "value")
                target.subscribers.forEach(s => s(value as T))
            return Reflect.set(target, property, value, receiver)
        }
    })
}