import * as THREE from "three"

import { CUBE_SIDE } from "./constants"

export default class VectorRGBXY {
    rgb: THREE.Color
    xy: THREE.Vector2

    constructor(r: number, g: number, b: number, x: number, y: number) {
        this.rgb = new THREE.Color(r, g, b)
        this.xy = new THREE.Vector2(x, y)
    }

    get xyz() {
        return new THREE.Vector3(...this.rgb.toArray()).multiplyScalar(CUBE_SIDE).subScalar(CUBE_SIDE / 2)
    }
}