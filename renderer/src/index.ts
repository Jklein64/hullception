import * as THREE from "three"

// #region init
// create camera
const far = 10
const fov = 70
const near = 0.01
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
camera.position.z = 1

const scene = new THREE.Scene()

// create shape and material
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
const material = new THREE.MeshNormalMaterial()

// create and add mesh
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// position canvas
const canvas = document.createElement("canvas")
canvas.style.position = "fixed"
canvas.style.top = "0"
canvas.style.bottom = "0"
canvas.style.left = "0"
canvas.style.right = "0"

// create, configure, and add renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.setAnimationLoop(animation)
document.body.appendChild(renderer.domElement)
renderer.render(scene, camera)
// #endregion

// keyboard controls
// offsets are in global reference since relative would be confusing.


type Key = "w" | "a" | "s" | "d" | "q" | "e"

const pressed = new Proxy({
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
}, {
    // onPressedChange callback
    set(target, p, value, receiver) {
        const offset = THREE.MathUtils.degToRad(10)
        // pitch
        if (pressed.w)
            mesh.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -offset)
        if (pressed.s)
            mesh.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), offset)
        // yaw
        if (pressed.a)
            mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -offset)
        if (pressed.d)
            mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset)
        // roll
        if (pressed.q)
            mesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), offset)
        if (pressed.e)
            mesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -offset)
        // render
        renderer.render(scene, camera)
        // pass through
        return Reflect.set(target, p, value, receiver)
    }
}) as Record<Key, boolean>

// record keypress status
document.addEventListener("keydown", e => {
    if ("wasdqe".includes(e.key)) {
        const key = e.key as Key
        pressed[key] = true
        console.log(pressed)
    }
})

// record keypress status
document.addEventListener("keyup", e => {
    if ("wasdqe".includes(e.key)) {
        const key = e.key as Key
        pressed[key] = false
        console.log(pressed)
    }
})

// update canvas on window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})
