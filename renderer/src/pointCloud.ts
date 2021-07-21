import * as THREE from "three"

import { scene } from "./initialize"
import VectorRGBXY from "./VectorRGBXY"
import { SMALL_POINT, PARTICLES } from "./constants"
import { state } from "./input"

export default new class PointCloud {
    #particles =
        new Array(PARTICLES).fill(undefined)
            .map(() => new VectorRGBXY(Math.random(), Math.random(), Math.random(), 0, 0))
    #geometry =
        new THREE.BufferGeometry()
            .setFromPoints(this.particles.map(particle => particle.xyz))
            .setAttribute("color", new THREE.Float32BufferAttribute(this.particles.flatMap(particle => particle.rgb.toArray()), 3))
    #material =
        new THREE.PointsMaterial({ size: SMALL_POINT, vertexColors: true })

    constructor() {
        scene.add(new THREE.Points(this.geometry, this.material))
    }

    get particles() {
        return this.#particles
    }

    set particles(value) {
        // clear selection on point cloud change
        state.selectedList = []

        this.#particles = value
        this.geometry
            .setFromPoints(value.map(particle => particle.xyz))
            .setAttribute("color", new THREE.Float32BufferAttribute(value.flatMap(particle => particle.rgb.toArray()), 3))
    }

    get geometry() {
        return this.#geometry
    }

    get material() {
        return this.#material
    }
}