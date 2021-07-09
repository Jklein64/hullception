import * as THREE from "three"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"

import { CUBE_SIDE, PARTICLES, SMALL_POINT } from "./constants"

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
controls.noZoom = true
controls.rotateSpeed = Math.PI
controls.target.set(0, 0, 0)

// create particles and material
const pointsGeometry = new THREE.BufferGeometry()
const color = new THREE.Color()
export const positions: THREE.Vector3[] = []
const colors: number[] = []
// randomly set particles
for (let i = 0; i < PARTICLES; i++) {
    // positions
    const x = Math.random() * CUBE_SIDE - CUBE_SIDE / 2
    const y = Math.random() * CUBE_SIDE - CUBE_SIDE / 2
    const z = Math.random() * CUBE_SIDE - CUBE_SIDE / 2
    positions.push(new THREE.Vector3(x, y, z))
    // colors
    const vx = (x / CUBE_SIDE) + 0.5
    const vy = (y / CUBE_SIDE) + 0.5
    const vz = (z / CUBE_SIDE) + 0.5
    color.setRGB(vx, vy, vz)
    colors.push(color.r, color.g, color.b)
}
pointsGeometry.setFromPoints(positions)
pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
const pointsMaterial = new THREE.PointsMaterial({ size: SMALL_POINT, vertexColors: true })
const points = new THREE.Points(pointsGeometry, pointsMaterial)

// add to scene
export const scene = new THREE.Scene()
scene.add(camera)
scene.add(points)

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

