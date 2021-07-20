import * as THREE from "three"

import { scene } from "./initialize"
import VectorRGBXY from "./VectorRGBXY"
import { CUBE_SIDE, SMALL_POINT } from "./constants"
import { state } from "./input"

type PointCloud = {
    value: VectorRGBXY[] | undefined,
    set: (data: VectorRGBXY[]) => void,
    get: () => VectorRGBXY[]
}

// expose the points for retrieval and modification
export const pointCloud: Omit<PointCloud, "value"> = Object.defineProperty({
    get() {
        return (this as PointCloud).value!
    },

    set(data) {
        (this as PointCloud).value = data

        // remove previous point cloud and convex hull if they exist
        const previousPointCloud = scene.getObjectByName("pointsObject")
        if (previousPointCloud) scene.remove(previousPointCloud)
        const previousLines = scene.getObjectByName("lines")
        if (previousLines) scene.remove(previousLines)

        // clear selection on point cloud change
        state.selectedList = []

        // convert from RGBXY to positions and colors
        const positions: THREE.Vector3[] = []
        const colors: number[] = []
        for (const { rgb } of data) {
            positions.push(new THREE.Vector3(...rgb.toArray()).multiplyScalar(CUBE_SIDE).subScalar(CUBE_SIDE / 2))
            colors.push(...rgb.toArray())
        }

        // create object
        const pointsGeometry = new THREE.BufferGeometry().setFromPoints(positions)
        pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
        const pointsMaterial = new THREE.PointsMaterial({ size: SMALL_POINT, vertexColors: true })
        const pointsObject = new THREE.Points(pointsGeometry, pointsMaterial)
        pointsObject.name = "pointsObject"

        // add to scene
        scene.add(pointsObject)
    }
}, "value", {
    value: undefined,
    writable: true
})