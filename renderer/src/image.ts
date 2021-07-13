import { IMAGE_WIDTH } from "./constants";

document.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector("#image-form > input")!

    const canvas = document.createElement("canvas")
    input.parentElement!.append(canvas)

    const context = canvas.getContext("2d")!

    input.addEventListener("change", e => {
        // get file
        const target = e.target as HTMLInputElement
        const file = target.files?.item(0)
        if (!file) throw new Error("Could not find image.")

        // create image element from blob
        const image = document.createElement("img")
        image.src = window.URL.createObjectURL(file)

        image.onload = () => {
            // resize
            const { width, height } = image
            canvas.width = IMAGE_WIDTH
            canvas.height = IMAGE_WIDTH * height / width

            // draw to canvas
            context.drawImage(image, 0, 0, canvas.width, canvas.height)
            console.log(image.width, image.height)
        }
    })
})