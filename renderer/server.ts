import * as express from "express"

express()
    .use("/", express.static("dist"))
    .get("/", (req, res) => res.sendFile("index.html"))
    .listen(process.env.PORT ?? 8000)


