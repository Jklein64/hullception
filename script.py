from __future__ import annotations

import PIL.Image
import numpy as np
import scipy.spatial
import scipy.cluster
import export

# The kmeans warning for when K isn't picked well is annoying
import warnings
warnings.filterwarnings("ignore")

# open image
image = PIL.Image.open("turquoise.png")
# preview image
export.send_image(image)
# convert to np array
points = np.array(image.convert("RGB"))
image.close()

# convert to (i, rgbxy)
# TODO there has to be a better way to do this using numpy methods; but I can't seem to find a way to go from index to value]
points = np.array([
    [*(points[row, col] / 255), col/image.width, row/image.height]
    for row in range(np.shape(points)[0])
    for col in range(np.shape(points)[1])
])

# TODO figure out why 50 seems to be a magic number
# centroids has shape (k, 3) and represents where the centers of the clusters are
# labels has shape (npoints, ) where labels[i] is the label for points[i].  0 <= label < k
centroids, labels = scipy.cluster.vq.kmeans2(points, 50)
# clusters is a *python list* where clusters[i] is an np.ndarray of points.
# this removes clusters of size zero, so *indices won't line up with those from labels*
clusters = [points[labels == label] for label in np.unique(labels)]

export.send_colors(centroids[labels].T[:3].T)
