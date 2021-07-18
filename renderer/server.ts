import * as express from "express"
import * as cors from "cors"

const image = new Proxy({
    value: "",
    subscribers: new Set<(image: string) => void>()
}, {
    set(target, property, value: unknown, receiver) {
        if (property === "value")
            image.subscribers.forEach(s => s(value as string))
        return Reflect.set(target, property, value, receiver)
    }
})

express()
    .use(cors())

    .get("/image", async (req, res) => {
        // send SSE headers to client
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.flushHeaders()

        // keep client in sync with server
        const callback = (image: string) => res.write(`data: ${image}\n\n`)
        image.subscribers.add(callback)

        // client can terminate connection
        res.on("close", () => {
            // Set can delete by reference :)
            image.subscribers.delete(callback)
            res.end()
        })
    })

    .use("/", express.static("dist"))

    .get("/", (req, res) => res.sendFile("index.html"))

    .post("/image", (req, res) => {
        // the body is streamed
        let collected = ""
        req.on("data", chunk => collected += chunk)
        req.on("end", () => {
            image.value = collected
            res.status(200).send()
        })
    })

    .listen(process.env.PORT ?? 8000, () => console.log("listening!"))