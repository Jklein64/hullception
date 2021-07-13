import * as THREE from "three"

import { controls, scene, getPointCloud } from "./initialize"
import { LARGE_POINT, SELECTED_COLOR } from "./constants"
import { showPointsInImage } from "./image"
import VectorRGBXY from "./VectorRGBXY"

type State = {
    selectionEnabled: boolean,
    selectionBox: [THREE.Vector2, THREE.Vector2] | undefined,
    selectedList: VectorRGBXY[],
    blendMultiply: boolean
}

const state: State = new Proxy({
    selectionEnabled: false,
    selectionBox: undefined,
    selectedList: [],
    blendMultiply: false
}, {
    set(target: State, p: keyof State, value: unknown, receiver) {
        if (p === "selectionEnabled") {
            // disable controls when selecting
            controls.enabled = !(value as boolean)
            if (value as boolean === false)
                // clear `selectionBox` when `selectionEnabled` is disabled
                state.selectionBox = undefined
        }

        else if (p === "selectionBox") {
            // update selection polygon on changes to `selectionBox`
            const polygon = document.getElementById("selection-box")!
            if (value === undefined) polygon.removeAttribute("points")
            else polygon.setAttribute("points",
                rectangleFromTwoPoints(...(value as [THREE.Vector2, THREE.Vector2]))
                    .map(v => `${v.x}, ${v.y}`)
                    .join(" "))
        }

        else if (p === "selectedList") {
            const selectedList = value as VectorRGBXY[]

            // remove old selection
            const previous = scene.getObjectByName("selectedPoints")
            if (previous) scene.remove(previous)

            // update selected points to be white in color
            const selectedGeometry = new THREE.BufferGeometry()
            selectedGeometry.setFromPoints(selectedList.map(v => v.xyz))
            const selectedMaterial = new THREE.PointsMaterial({ size: LARGE_POINT, color: SELECTED_COLOR })
            const selectedPoints = new THREE.Points(selectedGeometry, selectedMaterial)
            selectedPoints.name = "selectedPoints"

            // add to scene
            scene.add(selectedPoints)
            showPointsInImage(selectedList, state.blendMultiply ? "multiply" : "source-over")
        }

        else if (p === "blendMultiply") {
            const blendMultiply = value as boolean
            showPointsInImage(state.selectedList, blendMultiply ? "multiply" : "source-over")
        }

        // pass state change through
        return Reflect.set(target, p, value, receiver)
    }
})

window.addEventListener("keydown", ({ key }) => {
    if (key === "Shift") state.selectionEnabled = true
    if (key === "Escape")
        state.selectionEnabled
            ? (state.selectionEnabled = false)
            : (state.selectedList = [])
    if (key === "Enter") controls.reset()

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
    if (state.selectionEnabled && state.selectionBox) {
        handleSelection(state.selectionBox)
        state.selectionBox = undefined
    }
})

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("image-blendmode")!.addEventListener("change", e => {
        // NOTE typescript is being dumb here... it isn't very good at events
        const checked = (<any>e.target).checked as boolean
        state.blendMultiply = checked
    })
})

/**
 * Given a selection box, calculates all of the points in `pointCloud` that
 * should be selected.
 */
function handleSelection([start, end]: [THREE.Vector2, THREE.Vector2]) {
    [start, end] = [start, end].map(toNormalizedDeviceCoordinates)
    // clear previous selection.
    // TODO maybe add a feature for additive selection, like photoshop?
    const selected: VectorRGBXY[] = []
    for (const point of getPointCloud()) {
        const { x, y } = toNormalizedDeviceCoordinates(point.xyz)
        if (Math.min(start.x, end.x) <= x && x <= Math.max(start.x, end.x)) // horizontal
            if (Math.min(start.y, end.y) <= y && y <= Math.max(start.y, end.y)) // vertical
                selected.push(point)
    }

    // NOTE must replace reference instead of pushing to trigger Proxy `set()` handler
    state.selectedList = selected
}

/**
 * Given opposing corners, returns exactly four points that, when connected with lines,
 * will create a rectangle whose edges are parallel to either the x or y axis.
 * Note that the `start` and `end` points can be in any order (which is why this
 * function doesn't accept a width and a height since those cannot be negative).
 */
function rectangleFromTwoPoints(start: THREE.Vector2, end: THREE.Vector2) {
    return [
        new THREE.Vector2(start.x, start.y),
        new THREE.Vector2(start.x, end.y),
        new THREE.Vector2(end.x, end.y),
        new THREE.Vector2(end.x, start.y),
    ]
}

/**
 * Calculate and return the Normalized Device Coordinates (NDC) of the given vector.
 * Returns a `THREE.Vector2` which represents the `x` and `y` positions of the point on the screen on the range [-1, 1]
 */
function toNormalizedDeviceCoordinates(vector: THREE.Vector3 | THREE.Vector2) {
    const camera = scene.getObjectByName("camera") as THREE.Camera
    if (vector instanceof THREE.Vector3)
        // NOTE assumes that `vector` is in world space
        // remove z since NDC only really cares about x and y
        return new THREE.Vector2(
            ...vector.project(camera).toArray().slice(0, 2))
    else
        return new THREE.Vector2(
            (vector.x / window.innerWidth) * 2 - 1,
            -1 * ((vector.y / window.innerHeight) * 2 - 1))
}
