import { IMAGE_WIDTH } from "./constants"
import { setPointCloud } from "./initialize"
import VectorRGBXY from "./VectorRGBXY"

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
            const dimensions: [number, number, number, number] = [0, 0, canvas.width, canvas.height]
            context.drawImage(image, ...dimensions)

            // get image data and create points
            const { data: rgbaFlat } = context.getImageData(...dimensions)
            const data: VectorRGBXY[] = []
            for (let i = 0; i < rgbaFlat.length; i += 4) {
                const [r, g, b,] = rgbaFlat.slice(i, i + 4)
                const x = (i / 4) % canvas.width
                const y = Math.trunc((i / 4) / canvas.width)
                data.push(new VectorRGBXY(r / 255, g / 255, b / 255, x, y))
            }

            // add points to scene
            setPointCloud(data)
        }
    })
})