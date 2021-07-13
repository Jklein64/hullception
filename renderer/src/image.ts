import { IMAGE_WIDTH } from "./constants"
import { setPointCloud } from "./initialize"
import VectorRGBXY from "./VectorRGBXY"

type State = {
    context: CanvasRenderingContext2D | undefined,
    imageData: ImageData | undefined,
    pointData: VectorRGBXY[] | undefined
}

const state: State = new Proxy({
    context: undefined,
    imageData: undefined,
    pointData: undefined
}, {
})

document.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector("#image-form > input")!

    const canvas = document.createElement("canvas")
    input.parentElement!.append(canvas)

    const context = canvas.getContext("2d", { alpha: false })!
    state.context = context

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
            const imageData = context.getImageData(...dimensions)
            const data: VectorRGBXY[] = []
            for (let i = 0; i < imageData.data.length; i += 4) {
                const [r, g, b,] = imageData.data.slice(i, i + 4)
                const x = (i / 4) % canvas.width
                const y = Math.trunc((i / 4) / canvas.width)
                data.push(new VectorRGBXY(r / 255, g / 255, b / 255, x, y))
            }

            // update state
            state.imageData = imageData
            state.pointData = data

            // add points to scene
            setPointCloud(data)
        }
    })
})

export function showPointsInImage(selected: VectorRGBXY[], blendmode: "source-over" | "multiply" = "source-over") {
    if (state.imageData && state.pointData && state.context) {
        const { imageData, context } = state

        // reset image if nothing is selected
        if (selected.length === 0)
            return context.putImageData(imageData, 0, 0)

        // multiply blend mode with a 0 or 255 only layer is effectively a mask
        context.globalCompositeOperation = blendmode
        window.createImageBitmap(imageData).then(bitmap => {
            context.drawImage(bitmap, 0, 0)

            // create new solid, opaque, black image
            const mask = new ImageData(
                new Uint8ClampedArray(imageData.data.length)
                    .map((_, i) => (i + 1) % 4 === 0 ? 255 : 0),
                imageData.width,
                imageData.height)

            // reveal the selected parts
            for (const vector of selected) {
                const { x, y } = vector.xy
                const i = y * IMAGE_WIDTH + x
                mask.data[i * 4 + 0] = 255 // r
                mask.data[i * 4 + 1] = 255 // g
                mask.data[i * 4 + 2] = 255 // b
                mask.data[i * 4 + 3] = 255 // a
            }

            window.createImageBitmap(mask).then(bitmap => {
                context.drawImage(bitmap, 0, 0)
            })
        })
    }
}