import * as THREE from "three"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { ConvexHull } from "three/examples/jsm/math/ConvexHull";

const CUBE_SIDE = 750
let selecting = false
let down = false
let start: THREE.Vector2 = null, end: THREE.Vector2 = null

// #region init
// create camera
const far = 5000
const fov = 45
const near = 1
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
camera.position.set(CUBE_SIDE * 2, CUBE_SIDE * 2, CUBE_SIDE * 2)
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
geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
const material = new THREE.PointsMaterial({ size: 15, vertexColors: true })

// create and add point cloud
const points = new THREE.Points(geometry, material);
const bodies = new THREE.Group()
// bodies.add(points)
bodies.add(...createAxes())
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

// set up orbit controls
const controls = new TrackballControls(camera, renderer.domElement)
controls.noPan = true
controls.noZoom = true
controls.rotateSpeed = Math.PI
controls.target.set(0, 0, 0)

renderer.setAnimationLoop(() => {
    controls.update()
    renderer.render(scene, camera)
})

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

// mouse selection
window.addEventListener("keydown", ({ key }) => {
    if (key === "Shift") {
        selecting = true
        controls.enabled = false
    }
})

window.addEventListener("keyup", ({ key }) => {
    if (key === "Shift") {
        selecting = false
        controls.enabled = true
    }
})


document.addEventListener("pointerdown", e => {
    down = true

    if (selecting) {
        start = new THREE.Vector2(e.clientX, e.clientY)
    }
})

document.addEventListener("pointermove", e => {
    if (selecting && down) {

        end = new THREE.Vector2(e.clientX, e.clientY)

        // create selection box
        const polygon = document.getElementById("selection-box")
        polygon.setAttribute("points", rectangleFromMouse(start, end).map(v => `${v.x}, ${v.y}`).join(" "))
    }
})

document.addEventListener("pointerup", e => {
    down = false
    // remove selection box
    const polygon = document.getElementById("selection-box")
    polygon.removeAttribute("points")

    if (selecting) {

        // handle projection of selection
        const cameraLookVector = camera.getWorldDirection(new THREE.Vector3(0, 0, 0))
        const plane = new THREE.Plane(cameraLookVector)
        const pointsGeometry = new THREE.BufferGeometry()
        const projectedPoints: THREE.Vector3[] = []
        const projectedColors: number[] = []
        for (let i = 0; i < particles; i += 3) {
            const x = points.geometry.getAttribute("position").array[i]
            const y = points.geometry.getAttribute("position").array[i + 1]
            const z = points.geometry.getAttribute("position").array[i + 2]
            const point = new THREE.Vector3(x, y, z)
            const projected = new THREE.Vector3()
            plane.projectPoint(point, projected)
            projectedPoints.push(projected)
            projectedColors.push(x / CUBE_SIDE + .5, y / CUBE_SIDE + .5, z / CUBE_SIDE + .5)
        }
        pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(projectedPoints.flatMap(p => p.toArray()), 3))
        pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(projectedColors, 3))
        scene.add(new THREE.Points(pointsGeometry, material))

        const intersections: THREE.Vector3[] = []
        const raycast = new THREE.Raycaster()
        rectangleFromMouse(start, end).forEach(point => {
            raycast.setFromCamera({
                x: (point.x / window.innerWidth) * 2 - 1,
                y: -1 * ((point.y / window.innerHeight) * 2 - 1)
            }, camera)

            const ray = raycast.ray
            const intersection = new THREE.Vector3()
            ray.intersectPlane(plane, intersection)
            intersections.push(intersection)
        })
        // complete the loop
        intersections.push(intersections[0])

        const lineg = new THREE.BufferGeometry()
        lineg.setFromPoints(intersections)
        scene.add(new THREE.Line(lineg, new THREE.LineBasicMaterial({ color: "#ffffff" })))

        console.log(projectedPoints[0].project(camera))
        console.log(new THREE.Vector2(end.x / window.innerWidth, -start.y / window.innerHeight).multiplyScalar(2).subScalar(1))
    }
})


// update canvas on window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera)
})

function rectangleFromMouse(start: THREE.Vector2, end: THREE.Vector2) {
    return [
        new THREE.Vector2(start.x, start.y),
        new THREE.Vector2(start.x, end.y),
        new THREE.Vector2(end.x, end.y),
        new THREE.Vector2(end.x, start.y),
    ]
}
