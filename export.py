from __future__ import annotations
import numpy as np
import PIL.Image
import json
import requests


def send_colors(colors: np.ndarray):
    """ Given an array of colors of shape (n, 3) where 3 represents r, g, and b, send the colors to the renderer.  This will change the colors of the current set of particles without affecting the values of the particles themself.  The first dimension of `colors` must be equivalent to the number of particles in the most recent call to `send_particles()` or `w * h` of the image of the most recent call to `send_image()`, whichever is the most recent. """
    send("colors", json.dumps(np.ravel(colors).tolist()))


def send_particles(data: np.ndarray):
    """ Given an array of points, send them to the javascript server to be displayed.  This could be used, for example, to highlight which points are up for removal.  Assumes that data has shape (n, 5) where the 5 is for r, g, b, x, and y. """
    send("particles", json.dumps(data.tolist()))


def simplices_to_lines(simplices: np.ndarray):
    """ For every group of three vertices, drawing lines from 1->2, 2->3, and 3->1 will create one of the faces of the convex hull.  `simplices` as returned by `scipy.spatial.ConvexHull()` is an array of shape (n, 3, 3) where each index along axis=0 is an array of three vertices.  Returns an array of vertices such that drawing a line from every even index to every odd index draws every line of the simplices. """
    i = 0
    formatted = np.zeros((simplices.shape[0] * 3 * 2, 3))
    for vertex_group in simplices:
        v1 = vertex_group[0]
        v2 = vertex_group[1]
        v3 = vertex_group[2]
        formatted[i:i + 6] = np.array([v1, v2, v2, v3, v3, v1])
        i += 6

    return formatted


def send_lines(data: np.ndarray):
    """ Given an array of size-3 arrays (representing vertices), send this data to the javascript server.   """
    # NOTE look into this maybe? https://stackoverflow.com/questions/49098466/plot-3d-convex-closed-regions-in-matplot-lib/49115448
    send("lines", json.dumps(data.tolist()))


def send_image(image: PIL.Image.Image):
    """ Given an image, encodes it in base64 and sends it to the javascript server. """
    import base64
    import io

    image = image.convert("RGB")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_b64 = base64.b64encode(buffer.getvalue())
    send("image", image_b64.decode("utf-8"))


def send(path, data):
    response = requests.post(f"http://localhost:8000/{path}", data)
