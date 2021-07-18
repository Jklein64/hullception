from __future__ import annotations
import numpy as np
import PIL.Image

import requests


def send_lines(data: np.ndarray):
    """ Given an array of size-3 arrays (representing vertices), send this data, formatted, to the javascript server.  For every group of three vertices, drawing lines from 1->2, 2->3, and 3->1 will create one of the faces of the convex hull. """
    import json

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
    print(response.ok)
