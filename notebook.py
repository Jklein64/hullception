# %%
import matplotlib.pyplot as plot
from IPython.display import clear_output
import export

# %%
# import deps
import PIL.Image
import scipy.cluster
import scipy.spatial
import numpy as np

# %%
# open image and save into `points`
import requests
with PIL.Image.open(requests.get("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1200px-Image_created_with_a_mobile_phone.png", stream=True).raw) as image:
    # remove alpha
    image = image.convert("RGB")

    # display image in viewer
    export.send_image(image)

    points = np.array(image)/255  # [0, 255] -> [0, 1]
    print(np.shape(points))
    w, h = points.shape[:2]
    points = points.reshape((w*h, 3))  # [x][y][rgb] -> [i][rgb]
    # remove colors made identical with above dimension drop
    points = np.unique(points, axis=0)

# %% [markdown]
# k-means method
# *Given a set of $N$ points $p_i$ and an outlier percentage $\lambda$, run k-means with $k = \frac N {100 - \lambda}$, and then compute the convex hull $k$ times, leaving out one cluster each time. Return the smallest convex hull.*

# %%
λ = 5
N = points.shape[0]  # not w*h since duplicates were removed
K = int(N / (100 - λ))
K = 50
print(f"K = {K}")

# create clusters using k-means
clusters = scipy.cluster.vq.kmeans2(points, K)
centroids, labels = clusters
# hide warning if a cluster was empty
clear_output(wait=True)
print(f"centroids: {centroids.shape}")
print(f"labels: {labels.shape}")

# create every hull that excludes exactly one cluster
hulls = list()
for label in range(K):
    # exclude the current label (a cluster)
    mask = np.where(labels != label)
    included = points[mask]
    # create convex hull
    hull = scipy.spatial.ConvexHull(included)
    hulls.append((hull, label))

# find the hull that has the smallest volume
smallest_hull, label = min(hulls, key=lambda hull: hull[0].volume)
starting_hull = scipy.spatial.ConvexHull(points)
print(
    f"volume reduced by {(starting_hull.volume - smallest_hull.volume) / starting_hull.volume * 100:.2f}%")
# `.points` is taken straight from the input
print(
    f"excluded {len(starting_hull.points) - len(smallest_hull.points)} points")

# Results


def prep(axes):
    axes.set_xlabel("x")
    axes.set_xlim3d(0, 1)
    axes.set_ylabel("y")
    axes.set_ylim3d(0, 1)
    axes.set_zlabel("z")
    axes.set_zlim3d(0, 1)


# %%
# No Manipulation
figure = plot.figure()
axes = figure.add_subplot(111, projection="3d")
axes.scatter(
    points.T[0],
    points.T[1],
    points.T[2],
    c=np.array([labels/(K-1)]*3).T,
    s=1)

vertices = np.reshape(points[starting_hull.simplices], (-1, 3))
export.send_lines(vertices)

for simplex in starting_hull.simplices:
    # NOTE simplex contains the indices of the points that form the triangular faces of the hull.  We wrap the end to the beginning and then connect them using four lines.  `points[simplex, n]` will get the four coordinates along the n'th axes (x=0, y=1, z=2).
    simplex = np.append(simplex, simplex[0])
    x = points[simplex, 0]
    y = points[simplex, 1]
    z = points[simplex, 2]
    axes.plot(x, y, z, "r-")

prep(axes)

# plot.savefig("out/before.png", transparent=False, dpi=300)
"""
plot.show()
# %%
# With Manipulation
figure = plot.figure()
axes = figure.add_subplot(111, projection="3d")
mask = np.where(labels != label)
axes.scatter(
    points[mask].T[0],
    points[mask].T[1],
    points[mask].T[2],
    c=np.array([labels[mask]/(K-1)]*3).T,
    s=1)

for simplex in smallest_hull.simplices:
    simplex = np.append(simplex, simplex[0])
    axes.plot(
        points[mask][simplex, 0],
        points[mask][simplex, 1],
        points[mask][simplex, 2],
        "r-")

prep(axes)

plot.savefig("out/after.png", transparent=False, dpi=300)
plot.show()

# difference
excluded = points[labels == label]

figure = plot.figure()
axes = figure.add_subplot(111, projection="3d")
axes.scatter(
    excluded.T[0],
    excluded.T[1],
    excluded.T[2],
    c=np.array([labels[labels == label]/(K-1)]*3).T,
    s=1)

prep(axes)

plot.savefig("out/excluded.png", transparent=False, dpi=300)
plot.show()

# %% [markdown]
# newer method
"""
