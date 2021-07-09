import * as THREE from "three"
import { controls, camera, scene, positions, CUBE_SIDE } from "./initialize";

type State = {
    selectionEnabled: boolean,
    selectionBox: [THREE.Vector2, THREE.Vector2] | undefined
}

const state: State = new Proxy({
    selectionEnabled: false,
    selectionBox: undefined
}, {
    set(target, p, value, receiver) {
        if (p === "selectionEnabled") {
            // disable controls when selecting
            controls.enabled = !value

            if (value === false) {
                // clear `selectionBox` when `selectionEnabled` is disabled
                state.selectionBox = undefined
            }
        } else if (p == "selectionBox") {
            // update selection polygon on changes to `selectionBox`
            const polygon = document.getElementById("selection-box")!
            if (value === undefined || !state.selectionBox) polygon.removeAttribute("points")
            else polygon.setAttribute("points",
                rectangleFromTwoPoints(...state.selectionBox)
                    .map(v => `${v.x}, ${v.y}`)
                    .join(" "))
        }

        // pass state change through
        return Reflect.set(target, p, value, receiver)
    }
})

window.addEventListener("keydown", ({ key }) => {
    if (key === "Shift") state.selectionEnabled = true
    if (key === "Escape") state.selectionEnabled = false

})

window.addEventListener("keyup", ({ key }) => {
    if (key === "Shift") {
        if (state.selectionBox)
            handleSelection(state.selectionBox)
        state.selectionEnabled = false
    }
})

document.addEventListener("pointerdown", ({ clientX, clientY }) => {
    if (state.selectionEnabled) {
        state.selectionBox = [new THREE.Vector2(clientX, clientY), new THREE.Vector2(clientX, clientY)]
    }
})

document.addEventListener("pointermove", ({ clientX, clientY }) => {
    if (state.selectionEnabled && state.selectionBox) {
        const [start, _] = state.selectionBox
        state.selectionBox = [start, new THREE.Vector2(clientX, clientY)]
    }
})

document.addEventListener("pointerup", () => {
    if (state.selectionEnabled) {
        if (state.selectionBox) {
            console.log(toNormalizedDeviceCoordinates(state.selectionBox[0]))
            handleSelection(state.selectionBox)
        }
        state.selectionEnabled = false
    }
})
const testpoint = positions[0]
scene.add(new THREE.Points(
    new THREE.BufferGeometry().setFromPoints([testpoint]),
    new THREE.PointsMaterial({ size: 50, color: "#ffffff" })
))

console.log(toNormalizedDeviceCoordinates(testpoint))

function handleSelection([start, end]: [THREE.Vector2, THREE.Vector2]) {
    // TODO
    console.log(`selected from ${start.toArray()} to ${end.toArray()}`)
}



function rectangleFromTwoPoints(start: THREE.Vector2, end: THREE.Vector2) {
    return [
        new THREE.Vector2(start.x, start.y),
        new THREE.Vector2(start.x, end.y),
        new THREE.Vector2(end.x, end.y),
        new THREE.Vector2(end.x, start.y),
    ]
}

function toNormalizedDeviceCoordinates(vector: THREE.Vector3 | THREE.Vector2) {
    if (vector instanceof THREE.Vector3) {
        // NOTE assumes that `vector` is in world space
        return vector.project(camera)
    } else {
        // TODO do I need to do all this projection stuff?
        const [x, y] = vector.toArray()
        const look = new THREE.Vector3()
        camera.getWorldDirection(look)

        const plane = new THREE.Plane(look)
        const helper = new THREE.PlaneHelper(plane, CUBE_SIDE)
        scene.add(helper)

        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(
            (x / window.innerWidth) * 2 - 1,
            -1 * ((y / window.innerHeight) * 2 - 1)
        ), camera)

        const intersection = new THREE.Vector3()
        raycaster.ray.intersectPlane(plane, intersection)!
        return intersection.project(camera)
    }
}
