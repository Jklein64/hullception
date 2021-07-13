# About

This is a special image viewer built using [three.js](https://threejs.org/) and [typescript](https://www.typescriptlang.org/) (and using the [parcel](https://parceljs.org/) dev server). Given an image, the viewer will plot each unique RGB color as a single point in RGB space inside of an interactive cube. Holding <kbd>shift</kbd> and clicking and dragging with the mouse allows for the selection of individual points. When there is a selection, the image will only show the selected pixels (with the option to show them as white or as their actual color).

This viewer hopes to bridge the gap between the image and its point-cloud representation to see how deformities or irregularities in 3D plots of the colors of an image affect the image.

# Usage

1. Clone the repository and run `npm install` in the root directory
1. Run `npm run dev` and navigate to `localhost:1234`
