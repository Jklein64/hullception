import * as THREE from "three"

export default class {
    vectorRGB: THREE.Vector3
    vectorXY: THREE.Vector2

    constructor(r: number, g: number, b: number, x: number, y: number) {
        this.vectorRGB = new THREE.Vector3(r, g, b)
        this.vectorXY = new THREE.Vector2(x, y)
    }
}