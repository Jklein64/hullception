import * as THREE from "three"

import VectorRGBXY from "./VectorRGBXY"
import { pointCloud } from "./pointCloud"
import { showPointsInImage } from "./image"
import { controls, scene } from "./initialize"
import { LARGE_POINT, SELECTED_COLOR } from "./constants"

type State = {
    selectionEnabled: boolean,
    selectionMode: "new" | "add" | "subtract",
    selectionPath: SelectionPath | undefined,
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
                    // clear `selectionBox` when `selectionEnabled` is disabled
                    state.selectionPath = undefined
                break

            case "selectionMode":
                const buttons = document.querySelector("#image-form .selectionmode")!.children
                Array.prototype.forEach.call(buttons, (button: HTMLElement) => button.removeAttribute("disabled"))
                const active = document.querySelector(`#image-form .selectionmode input[value=${state.selectionMode}]`)!
                active.setAttribute("disabled", "")
                break

            case "selectionPath":
                // update selection polygon on changes to `selectionBox`
                const polygon = document.getElementById("selection-box")!
                if (state.selectionPath === undefined) {
                    polygon.removeAttribute("points")
                } else {
                    const path: THREE.Vector2[] = []
                    for (let node = state.selectionPath; node !== undefined; node = node.next!)
                        path.push(node.position)
                    polygon.setAttribute("points", path.map(v => `${v.x}, ${v.y}`).join(" "))
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
            handleSelection()
        state.selectionEnabled = false
    }
})

document.addEventListener("pointerdown", ({ clientX, clientY }) => {
    if (state.selectionEnabled) {
        state.selectionPath = {
            position: new THREE.Vector2(clientX, clientY),
            next: undefined
        }
    }
})

document.addEventListener("pointermove", ({ clientX, clientY }) => {
    if (state.selectionEnabled && state.selectionPath) {
        state.selectionPath = {
            position: new THREE.Vector2(clientX, clientY),
            next: state.selectionPath
        }
        // state.selectionPath = rectangleFromTwoPoints(start.position, new THREE.Vector2(clientX, clientY))
        //     .reduce((path, curr) => ({ position: curr, next: path }), start)
    }
})

document.addEventListener("pointerup", () => {
    if (state.selectionEnabled && state.selectionPath) {
        handleSelection()
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
 * Given a selection box, calculates all of the points in `pointCloud` that should be selected.  This is calculated using the point-in-polygon algorithm from https://towardsdatascience.com/is-the-point-inside-the-polygon-574b86472119 - "For any polygon, find all the edges of the polygon that cut through the line passing through f(x) = query point.y. For these edges check if the query point is on the left or right side of the edge when looking at all the edges in anticlockwise direction. Increase the value of winding number (wn) by one if query point is on the left side of an upward crossing and decrease the wn by one if query point is on the right side of an downward crossing. If the final winding number is non zero then the point lies inside the polygon."
 */
function handleSelection() {
    const pathPositions: THREE.Vector2[] = []
    for (let node = state.selectionPath; node !== undefined; node = node.next!)
        pathPositions.push(toNormalizedDeviceCoordinates(node.position))

    // include starting point at the end to wrap around
    const pathDisplacements = pathPositions.map((position, i) => ({
        from: position, to: pathPositions[i + 1] ?? pathPositions[0]
    }))

    const selected: VectorRGBXY[] = []
    for (const point of pointCloud.get().slice(0, 1)) {
        const { x, y } = toNormalizedDeviceCoordinates(point.xyz)
        const relevantEdges = pathDisplacements.filter(({ from, to }) =>
            Math.sign(from.x + x) === -Math.sign(to.x + x))
        // let left and right be defined as if we were standing at an edge's `from` position and looking at its `to` position.  Increment `windingNumber` when the point is on the left and the edge's net y component is positive.  Decrement when negative.
        let windingNumber = 0
        relevantEdges.forEach(({ from, to }, i) => {
            // see https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
            const left = ((to.x - from.x) * (y - to.y) - (to.y - from.y) * (x - to.x)) > 0
            console.log(`is edge ${i} to the left? ${left}`)
            const vertical = to.x - from.x
            console.log(`is edge ${i} pointing up? ${vertical > 0}`)
            windingNumber += left ? ((vertical > 0) ? 1 : -1) : 0
        })
        console.log(`winding number is ${windingNumber}`)
        // if (windingNumber !== 0)
        selected.push(point)
        //     if (Math.min(start.x, end.x) <= x && x <= Math.max(start.x, end.x)) // horizontal
        //         if (Math.min(start.y, end.y) <= y && y <= Math.max(start.y, end.y)) // vertical
        //             selected.push(point)
    }

    // NOTE must replace reference instead of pushing to trigger Proxy `set()` handler
    // this is where the selectionMode magic happens
    switch (state.selectionMode) {
        case "new": return void (state.selectedList = selected)
        case "add": return void (state.selectedList = [...state.selectedList, ...selected])
        case "subtract":
            return void (state.selectedList = state.selectedList.filter(inV =>
                selected.every(outV => !outV.equals(inV))))
    }
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

interface SelectionPath {
    position: THREE.Vector2
    next: SelectionPath | undefined
}
