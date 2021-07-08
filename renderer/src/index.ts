import * as THREE from "three"

const CUBE_SIDE = 1000

// #region init
// create camera
const far = 5000
const fov = 45
const near = 1
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
camera.position.set(0, 0, CUBE_SIDE * 3)
camera.lookAt(new THREE.Vector3(0, 0, 0))

// create scene
const scene = new THREE.Scene()

// create particles and material
const geometry = new THREE.BufferGeometry()
const color = new THREE.Color()
const particles = 10000
const positions = [];
const colors = [];
// randomly set particles
for (let i = 0; i < particles; i++) {
    // positions
    const x = Math.random() * CUBE_SIDE - CUBE_SIDE / 2;
    const y = Math.random() * CUBE_SIDE - CUBE_SIDE / 2;
    const z = Math.random() * CUBE_SIDE - CUBE_SIDE / 2;
    positions.push(x, y, z);
    // colors
    const vx = (x / CUBE_SIDE) + 0.5;
    const vy = (y / CUBE_SIDE) + 0.5;
    const vz = (z / CUBE_SIDE) + 0.5;
    color.setRGB(vx, vy, vz);
    colors.push(color.r, color.g, color.b);
}
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
geometry.computeBoundingSphere();
const material = new THREE.PointsMaterial({ size: 15, vertexColors: true })

// create and add point cloud
const points = new THREE.Points(geometry, material);
const bodies = new THREE.Group()
bodies.add(points)
bodies.add(...createAxes())
// TODO figure out why 315 degrees is a magic number
bodies.setRotationFromEuler(new THREE.Euler(Math.PI / 4, 5.49779, 0))
scene.add(bodies)

// position canvas
const canvas = document.createElement("canvas")
canvas.style.position = "fixed"
canvas.style.top = "0"
canvas.style.bottom = "0"
canvas.style.left = "0"
canvas.style.right = "0"

// create, configure, and add renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.render(scene, camera)

function createAxes() {
    const rescale = (...[x, y, z]: number[]) => new THREE.Vector3(x, y, z).multiplyScalar(CUBE_SIDE).subScalar(CUBE_SIDE / 2)

    return new Array(
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
    ).map(({ from, to }) => {
        const vertices = [rescale(...from), rescale(...to)]

        const geometry = new THREE.BufferGeometry()
        geometry.setFromPoints(vertices)
        // make rainbow!
        geometry.setAttribute("color", new THREE.Float32BufferAttribute([...from, ...to], 3))

        const material = new THREE.LineBasicMaterial({ vertexColors: true })
        return new THREE.Line(geometry, material)
    })
}

// #endregion

// #region keyboard controls
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
        // offsets are in global reference since relative would be confusing.
        const offset = THREE.MathUtils.degToRad(10)
        // pitch
        if (pressed.w)
            bodies.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -offset)
        if (pressed.s)
            bodies.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), offset)
        // yaw
        if (pressed.a)
            bodies.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -offset)
        if (pressed.d)
            bodies.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), offset)
        // roll
        if (pressed.q)
            bodies.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), offset)
        if (pressed.e)
            bodies.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -offset)
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
    } else if (e.key == "Enter") {
        // reset camera
        bodies.setRotationFromEuler(new THREE.Euler(Math.PI / 4, 5.49779, 0))
        renderer.render(scene, camera)
    }
})

// record keypress status
document.addEventListener("keyup", e => {
    if ("wasdqe".includes(e.key)) {
        const key = e.key as Key
        pressed[key] = false
    }
})
// #endregion

// update canvas on window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera)
})
