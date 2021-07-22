import * as THREE from "three"

import { setImage } from "./image"
import { scene, controls } from "./initialize"
import { CUBE_SIDE, LARGE_POINT } from "./constants"
import pointCloud from "./pointCloud"

export type ServerSentEvent = {
    type: "image"
    data: string // base64 encoded image
} | {
    type: "lines"
    data: Array<[
        x: number,
        y: number,
        z: number
    ]> // connect even indices to odd indices (but not the other way)
} | {
    type: "particles"
    data: Array<[
        r: number,
        g: number,
        b: number,
        x: number,
        y: number
    ]> // turn into VectorRGBXY[], setting color to rgb
} | {
    type: "colors",
    data: number[]
} // data.slice(i, i+3) is rgb for vertex i

const source = new EventSource("/image")
source.addEventListener("message", async ({ data }) => {
    const body = JSON.parse(data) as ServerSentEvent

    switch (body.type) {
        case "image":
            await fetch(`data:image/jpeg;base64,${body.data}`)
                .then(res => res.blob())
                .then(setImage)
            break

        case "lines":
            const lines = new THREE.Group()

            // NOTE lines are cleared when pointCloud is cleared
            lines.name = "lines"

            for (let i = 0; i < body.data.length; i += 2) {
                const v1 = new THREE.Vector3(...body.data[i + 0]).subScalar(0.5).multiplyScalar(CUBE_SIDE)
                const v2 = new THREE.Vector3(...body.data[i + 1]).subScalar(0.5).multiplyScalar(CUBE_SIDE)

                lines.add(
                    new THREE.LineSegments(
                        new THREE.BufferGeometry().setFromPoints([v1, v2]),
                        new THREE.LineBasicMaterial({ color: 0xffffff })))
            }

            scene.add(lines)
            break

        case "particles":
            scene.add(
                new THREE.Points(
                    new THREE.BufferGeometry().setFromPoints(
                        body.data.map(([r, g, b]) => new THREE.Vector3(r, g, b).subScalar(.5).multiplyScalar(CUBE_SIDE))),
                    new THREE.PointsMaterial({ size: LARGE_POINT, vertexColors: true })))
            break

        case "colors":
            pointCloud.geometry.setAttribute("color", new THREE.Float32BufferAttribute(body.data, 3))
            break

        default:
            // see https://stackoverflow.com/questions/39419170/how-do-i-check-that-a-switch-block-is-exhaustive-in-typescript
            return badEventType(body)
    }

    controls.reset()
})

function badEventType(_: never): never
function badEventType(body: { type: string }) {
    throw new Error(`Unknown ServerSentEvent type: ${body.type}`)
}

