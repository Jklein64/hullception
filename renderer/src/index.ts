import "./initialize"
import "./input"

//     if (selecting) {
//         const toNDC = (p: THREE.Vector2) =>
//             new THREE.Vector2((p.x / window.innerWidth) * 2 - 1, -1 * ((p.y / window.innerHeight) * 2 - 1))
//         // handle projection of selection
//         const cameraLookVector = camera.getWorldDirection(new THREE.Vector3(0, 0, 0))
//         const plane = new THREE.Plane(cameraLookVector)
//         const intersections: THREE.Vector3[] = []

//         const raycast = new THREE.Raycaster()
//         rectangleFromMouse(start, end).forEach(point => {
//             raycast.setFromCamera(toNDC(point), camera)

//             const intersection = new THREE.Vector3()
//             raycast.ray.intersectPlane(plane, intersection)
//             intersections.push(intersection)
//         })
//         // complete the loop
//         console.log(intersections)

//         const lineGeometry = new THREE.BufferGeometry()
//         lineGeometry.setFromPoints([...intersections, intersections[0]])
//         scene.add(new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#ffffff" })))

//         const pointsGeometry = new THREE.BufferGeometry()
//         const projectedPoints: THREE.Vector3[] = []
//         const projectedColors: number[] = []
//         for (let i = 0; i < particles; i += 3) {
//             const x = points.geometry.getAttribute("position").array[i]
//             const y = points.geometry.getAttribute("position").array[i + 1]
//             const z = points.geometry.getAttribute("position").array[i + 2]
//             const point = new THREE.Vector3(x, y, z)
//             const projected = new THREE.Vector3()
//             plane.projectPoint(point, projected)
//             projectedPoints.push(projected)
//             projectedColors.push(x / CUBE_SIDE + .5, y / CUBE_SIDE + .5, z / CUBE_SIDE + .5)
//         }
//         pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(projectedPoints.flatMap(p => p.toArray()), 3))
//         pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(projectedColors, 3))
//         scene.add(new THREE.Points(pointsGeometry, material))



//         // get normalized device coordinates (NDC) for the corners of the selection rectangle
//         // const [startNDC, endNDC] = new Array(start, end).map(p =>
//         //     new THREE.Vector2((p.x / innerWidth) * 2 - 1, -1 * ((p.x / innerHeight) * 2 - 1)))
//         const xMin = Math.min(...intersections.map(v => v.project(camera).x))
//         const xMax = Math.max(...intersections.map(v => v.project(camera).x))
//         const yMin = Math.min(...intersections.map(v => v.project(camera).y))
//         const yMax = Math.max(...intersections.map(v => v.project(camera).y))
//         // console.log(intersections.map(v => v.project(camera)))
//         // console.log(xMin, xMax, yMin, yMax)
//         // get NDCs for each of the points and compare against the selection's
//         const selected: THREE.Vector3[] = []
//         for (const position of positions) {
//             const projected = position.clone().project(camera)
//             const x = projected.x
//             const y = projected.y
//             if (xMin < x && x < xMax && yMin < y && y < yMax) {
//                 // TODO handle points inside of the selection
//                 // console.log(projected)
//                 selected.push(position.clone())
//             }
//         }

//         const g = new THREE.BufferGeometry()
//         g.setFromPoints(selected)
//         const m = new THREE.PointsMaterial({ size: 30, color: "#ffffff" })
//         scene.add(new THREE.Points(g, m))
//         // console.log(selected)
//     }
// })
