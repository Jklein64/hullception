import * as THREE from "three"

import { IMAGE_WIDTH, CUBE_SIDE } from "./constants"
import { setPointCloud } from "./initialize"

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
            const { data } = context.getImageData(...dimensions)
            const positions: THREE.Vector3[] = []
            const colors: number[] = []
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b,] = data.slice(i, i + 4)
                colors.push(r / 255, g / 255, b / 255)
                positions.push(new THREE.Vector3(
                    r / 255 * CUBE_SIDE - CUBE_SIDE / 2,
                    g / 255 * CUBE_SIDE - CUBE_SIDE / 2,
                    b / 255 * CUBE_SIDE - CUBE_SIDE / 2
                ))
            }

            // add points to scene
            setPointCloud(positions, colors)
        }
    })
})