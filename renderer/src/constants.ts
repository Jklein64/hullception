export const CUBE_SIDE = 750
export const PARTICLES = 10000
export const SMALL_POINT = 15
export const LARGE_POINT = 30
export const IMAGE_WIDTH = 450

export const SELECTED_COLOR = "#ffffff"

export interface ImageData {
    type: "image"
    data: string // base64 encoded image
}

export interface LinesData {
    type: "lines"
    data: Array<[
        x: number,
        y: number,
        z: number
    ]> // connect even indices to odd indices (but not the other way)
}


export type ServerSentEvent = ImageData | LinesData