import { setImage } from "./image"

const source = new EventSource("/image")
source.addEventListener("message", ({ data }) => {
    // NOTE data is a base64-encoded image
    fetch(`data:image/jpeg;base64,${data}`)
        .then(res => res.blob())
        .then(setImage)
})

