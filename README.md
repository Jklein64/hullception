# About

This is a special image viewer built using [python](https://www.python.org/), [three.js](https://threejs.org/), [typescript](https://www.typescriptlang.org/), and [expressjs](https://expressjs.com/) (and using the [parcel](https://parceljs.org/) dev server). Given an image, the viewer will plot each unique RGB color as a single point in RGB space inside of an interactive cube.

Holding <kbd>Shift</kbd> and clicking and dragging with the mouse allows for the lasso-style selection of either individual points or of all of the points that share a color with the selected points (which is helpful after, for example, setting the colors to correspond to clusters using `export.send_colors()`). When there is a selection, the image will only show the selected pixels (with the option to show them as white or as their actual color). Pressing <kbd>Enter</kbd> will reset the camera view to its initial state, looking at the cube from white.

This viewer hopes to bridge the gap between the image and its point-cloud representation to see how deformities or irregularities in 3D plots of the colors of an image affect the image.

# Usage

1. Clone the repository
1. Change directory to `/renderer` and run `npm install`
1. Run `npm run build`, then `npm run serve`, then navigate to `localhost:8000/`

Upload an image by either pressing the <button style="pointer-events:none">Choose File</button> button or by sending a base64 encoded image in the body of a `POST` request to `localhost:8000/image`. The request may look like this, for example (in bash):

```sh
echo -n $(base64 ./image.jpeg) | curl -d @- http://localhost:8000/image
```

Other things that can be uploaded are documented in the methods of `export.py`. `script.py` is an example of how these upload methods can be used.

# Development

1. Clone the repository
1. Change directory to `/renderer` and run `npm install`
1. Run `npm run dev` and navigate to `localhost:1234` (not `8000`!). Changes to any of the files within `src/` will be reloaded automatically. Follow the usage instructions above for development on the server (no automatic reloading).
