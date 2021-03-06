import { IMAGE_WIDTH } from "./constants"
import pointCloud from "./pointCloud"
import VectorRGBXY from "./VectorRGBXY"

let
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    sourceImageData: ImageData,
    destImageData: ImageData

document.addEventListener("DOMContentLoaded", () => {
    // grab elements
    const input = document.querySelector("#image-form > input") as HTMLInputElement
    canvas = document.getElementById("image-canvas") as HTMLCanvasElement
    context = canvas.getContext("2d", { alpha: false })!

    input.addEventListener("change", e => {
        // get file
        const target = e.target as HTMLInputElement
        const file = target.files?.item(0)
        if (!file) throw new Error("Could not find image.")

        setImage(file)
    })
})

export function setImage(raw: Blob | File) {
    // create image element from blob
    const image = document.createElement("img")
    image.src = window.URL.createObjectURL(raw)

    image.onload = () => {
        // unhide
        if (canvas.style.display !== "block")
            canvas.style.display = "block"

        // resize canvas *but not image*
        const { width, height } = image
        canvas.width = width
        canvas.height = height

        // draw to canvas
        context.drawImage(image, 0, 0, width, height)

        // get image data and create points
        sourceImageData = context.getImageData(0, 0, width, height)
        const newPointData: VectorRGBXY[] = []
        for (let i = 0; i < sourceImageData.data.length; i += 4) {
            const [r, g, b,] = sourceImageData.data.slice(i, i + 4)
            const x = (i / 4) % canvas.width
            const y = Math.trunc((i / 4) / canvas.width)
            newPointData.push(new VectorRGBXY(r / 255, g / 255, b / 255, x, y))
        }

        // resize image
        canvas.width = IMAGE_WIDTH
        canvas.height = IMAGE_WIDTH * height / width
        context.drawImage(image, 0, 0, width, height, 0, 0, canvas.width, canvas.height)
        destImageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // add points to scene
        pointCloud.particles = newPointData
    }
}

export async function showPointsInImage(selected: VectorRGBXY[], blendmode: "source-over" | "multiply" = "source-over") {
    if (sourceImageData && destImageData) {
        context.clearRect(0, 0, destImageData.width, destImageData.height)

        // reset image if nothing is selected
        if (selected.length === 0)
            return context.putImageData(destImageData, 0, 0)

        // multiply blend mode with a 0 or 255 only layer is effectively a mask
        context.globalCompositeOperation = blendmode

        // lay down first layer
        const imageBitmap = await window.createImageBitmap(destImageData)
        context.drawImage(imageBitmap, 0, 0)

        // create new solid, opaque, black image
        const mask = new ImageData(
            new Uint8ClampedArray(sourceImageData.data.length)
                .map((_, i) => (i + 1) % 4 === 0 ? 255 : 0),
            sourceImageData.width,
            sourceImageData.height)

        // reveal the selected parts
        for (const vector of selected) {
            const { x, y } = vector.xy
            const i = y * sourceImageData.width + x
            mask.data[i * 4 + 0] = 255 // r
            mask.data[i * 4 + 1] = 255 // g
            mask.data[i * 4 + 2] = 255 // b
            mask.data[i * 4 + 3] = 255 // a
        }

        // mask out the unselected parts
        const maskBitmap = await window.createImageBitmap(mask)
        context.drawImage(maskBitmap,
            0, 0, sourceImageData.width, sourceImageData.height,
            0, 0, destImageData.width, destImageData.height)
    }
}