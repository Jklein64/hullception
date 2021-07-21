import * as THREE from "three"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"

import VectorRGBXY from "./VectorRGBXY"
import { CUBE_SIDE, PARTICLES } from "./constants"

// position canvas
const canvas = document.createElement("canvas")
canvas.style.position = "fixed"
canvas.style.inset = "0"

// create, configure, and add renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// create camera
const far = 5000
const fov = 45
const near = 1
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
camera.position.set(CUBE_SIDE * 2, CUBE_SIDE * 2, CUBE_SIDE * 2)
camera.lookAt(new THREE.Vector3(0, 0, 0))
camera.name = "camera"

// set up orbit controls
export const controls = new TrackballControls(camera, renderer.domElement)
controls.noPan = true
// controls.noZoom = true
controls.rotateSpeed = Math.PI
controls.target.set(0, 0, 0)

// add to scene
export const scene = new THREE.Scene()
scene.add(camera)

// create axes
new Array(
    { from: [0, 0, 0], to: [1, 0, 0] },
    { from: [0, 0, 0], to: [0, 1, 0] },
    { from: [0, 0, 0], to: [0, 0, 1] },
    { from: [1, 1, 1], to: [0, 1, 1] },
    { from: [1, 1, 1], to: [1, 0, 1] },
    { from: [1, 1, 1], to: [1, 1, 0] },
    { from: [0, 0, 1], to: [1, 0, 1] },
    { from: [1, 0, 1], to: [1, 0, 0] },
    { from: [1, 0, 0], to: [1, 1, 0] },
    { from: [1, 1, 0], to: [0, 1, 0] },
    { from: [0, 1, 0], to: [0, 1, 1] },
    { from: [0, 1, 1], to: [0, 0, 1] },
).forEach(({ from, to }) => {
    const vertices = [
        new THREE.Vector3(...from).multiplyScalar(CUBE_SIDE).subScalar(CUBE_SIDE / 2),
        new THREE.Vector3(...to).multiplyScalar(CUBE_SIDE).subScalar(CUBE_SIDE / 2)
    ]

    const axesGeometry = new THREE.BufferGeometry()
    axesGeometry.setFromPoints(vertices)
    axesGeometry.setAttribute("color", new THREE.Float32BufferAttribute([...from, ...to], 3))
    const axesMaterial = new THREE.LineBasicMaterial({ vertexColors: true })
    scene.add(new THREE.Line(axesGeometry, axesMaterial))
})

// render scene
renderer.setAnimationLoop(() => {
    controls.update()
    renderer.render(scene, camera)
})

// update canvas on window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.updateProjectionMatrix()
    controls.handleResize()
    renderer.render(scene, camera)
})

