import * as THREE from "three"

import { setImage } from "./image"
import { ServerSentEvent } from "./constants"
import { scene } from "./initialize"
import { CUBE_SIDE } from "./constants"

const source = new EventSource("/image")
source.addEventListener("message", ({ data }) => {
    const body = JSON.parse(data) as ServerSentEvent

    switch (body.type) {
        case "image":
            fetch(`data:image/jpeg;base64,${body.data}`)
                .then(res => res.blob())
                .then(setImage)
            break

        case "lines":
            const lines = new THREE.Group()
            lines.name = "convexHull"

            for (let i = 0; i < body.data.length; i += 3) {
                const v1 = new THREE.Vector3(...body.data[i + 0]).subScalar(0.5).multiplyScalar(CUBE_SIDE)
                const v2 = new THREE.Vector3(...body.data[i + 1]).subScalar(0.5).multiplyScalar(CUBE_SIDE)
                const v3 = new THREE.Vector3(...body.data[i + 2]).subScalar(0.5).multiplyScalar(CUBE_SIDE)

                lines.add(
                    new THREE.LineSegments(
                        new THREE.BufferGeometry().setFromPoints([v1, v2, v3, v1]),
                        new THREE.LineBasicMaterial({ color: 0xffffff })))
            }

            scene.add(lines)
            break
    }
})

