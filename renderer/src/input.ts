import * as THREE from "three"

import VectorRGBXY from "./VectorRGBXY"
import pointCloud from "./pointCloud"
import { showPointsInImage } from "./image"
import { controls, scene } from "./initialize"
import { LARGE_POINT, SELECTED_COLOR } from "./constants"

type State = {
    selectionEnabled: boolean,
    selectionMode: "new" | "add" | "subtract",
    selectionPath: THREE.Vector2[] | undefined,
    selectedList: VectorRGBXY[],
    blendMultiply: boolean
}

export const state: State = new Proxy({
    selectionEnabled: false,
    selectionMode: "new",
    selectionPath: undefined,
    selectedList: [],
    blendMultiply: false
}, {
    // first arg is old state
    set(_, property: keyof State) {
        // pass state change through before so it can be used later
        const result = Reflect.set(...(arguments as unknown as Parameters<typeof Reflect.set>))

        switch (property) {
            case "selectionEnabled":
                // disable controls when selecting
                controls.enabled = !state.selectionEnabled
                if (state.selectionEnabled === false)
                    // clear `selectionPath` when `selectionEnabled` is disabled
                    state.selectionPath = undefined
                break

            case "selectionMode":
                const buttons = document.querySelector("#image-form .selectionmode")!.children
                Array.prototype.forEach.call(buttons, (button: HTMLElement) => button.removeAttribute("disabled"))
                const active = document.querySelector(`#image-form .selectionmode input[value=${state.selectionMode}]`)!
                active.setAttribute("disabled", "")
                break

            case "selectionPath":
                // update selection polygon on changes to `selectionPath`
                const polygon = document.getElementById("selection-box")
                if (polygon) {
                    if (state.selectionPath === undefined)
                        polygon.removeAttribute("points")
                    else
                        polygon.setAttribute("points", state.selectionPath.map(v => `${v.x}, ${v.y}`).join(" "))
                }
                break

            case "selectedList":
                // remove old selection
                const previous = scene.getObjectByName("selectedPoints")
                if (previous) scene.remove(previous)

                // update selected points to be white in color
                const selectedGeometry = new THREE.BufferGeometry()
                selectedGeometry.setFromPoints(state.selectedList.map(v => v.xyz))
                const selectedMaterial = new THREE.PointsMaterial({ size: LARGE_POINT, color: SELECTED_COLOR })
                const selectedPoints = new THREE.Points(selectedGeometry, selectedMaterial)
                selectedPoints.name = "selectedPoints"

                // add to scene
                scene.add(selectedPoints)
                showPointsInImage(state.selectedList, state.blendMultiply ? "multiply" : "source-over")
                break

            case "blendMultiply":
                showPointsInImage(state.selectedList, state.blendMultiply ? "multiply" : "source-over")
                break
        }

        // should almost always be true
        return result
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
        if (state.selectionPath)
            handleSelection(state.selectionPath)
        state.selectionEnabled = false
    }
})

document.addEventListener("pointerdown", ({ clientX, clientY }) => {
    if (state.selectionEnabled) {
        state.selectionPath = [new THREE.Vector2(clientX, clientY)]
    }
})

document.addEventListener("pointermove", ({ clientX, clientY }) => {
    if (state.selectionEnabled && state.selectionPath) {
        state.selectionPath = [new THREE.Vector2(clientX, clientY), ...state.selectionPath]
        // state.selectionPath = rectangleFromTwoPoints(start.position, new THREE.Vector2(clientX, clientY))
        //     .reduce((path, curr) => ({ position: curr, next: path }), start)
    }
})

document.addEventListener("pointerup", () => {
    if (state.selectionEnabled && state.selectionPath) {
        handleSelection(state.selectionPath)
        state.selectionPath = undefined
    }
})

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("image-blendmode")!.addEventListener("change", e => {
        // NOTE typescript is being dumb here... it isn't very good at events
        const checked = (<any>e.target).checked as boolean
        state.blendMultiply = checked
    })

    document.querySelectorAll("#image-form .selectionmode input")!.forEach((button) =>
        button.addEventListener("click", () =>
            state.selectionMode = button.getAttribute("value") as State["selectionMode"]))
})


/**
 * Calculates all of the points in `pointCloud` that should be selected based on the given list of vertices of the selection lasso (typically taken from `state.selectionPath`).  Updates `state.selectedList`.
 */
function handleSelection(vertices: THREE.Vector2[]) {
    vertices = vertices.map(toNormalizedDeviceCoordinates)
    const selected: VectorRGBXY[] = []
    for (const point of pointCloud.particles) {
        const { x, y } = toNormalizedDeviceCoordinates(point.xyz)
        // adapted from https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html#Almost%20Convex%20Polygons
        let included = false
        // j = i-1 but wraps around back at the beginning
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++)
            if (vertices[i].y > y !== vertices[j].y > y)
                if (x < (vertices[j].x - vertices[i].x) * (y - vertices[i].y)
                    / (vertices[j].y - vertices[i].y) + vertices[i].x)
                    included = !included
        if (included) selected.push(point)
    }


    // NOTE must replace reference instead of pushing to trigger Proxy `set()` handler
    // this is where the selectionMode magic happens
    switch (state.selectionMode) {
        case "new":
            return void (state.selectedList = selected)
        case "add":
            return void (state.selectedList = [...state.selectedList, ...selected])
        case "subtract":
            return void (state.selectedList = state.selectedList.filter(inV =>
                selected.every(outV => !outV.equals(inV))))
    }
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
