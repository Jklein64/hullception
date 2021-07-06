import matplotlib.pyplot as plt
import PIL.Image
import scipy.cluster
import scipy.spatial
import numpy as np

with PIL.Image.open("turquoise.png") as image:
    points = np.array(image)/255  # force float
    w, h = points.shape[:2]
    # [x][y][rgb] -> [i][rgb]
    points = points.reshape((w*h, 3))
    # remove colors made identical with above dimension drop
    points = np.unique(points, axis=0)
"""
Yotam's proposed algorithm: Given a set of N points p_i and an outlier percentage λ, run k-means with k = N/(100-λ), and then compute the convex hull k times, leaving out one cluster each time. Return the smallest convex hull.
"""

λ = 5
N = w*h
K = N // (100 - λ)
print(K)

clusters = scipy.cluster.vq.kmeans(points, K)
print(clusters)


# hull = scipy.spatial.ConvexHull(points)


def show_hull(points, hull):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")
    # Plot defining corner points
    ax.plot(points.T[0], points.T[1], points.T[2], "k.")
    # 12 = 2 * 6 faces are the simplices (2 simplices per square face)
    for s in hull.simplices:
        s = np.append(s, s[0])  # Here we cycle back to the first coordinate
        ax.plot(points[s, 0], points[s, 1], points[s, 2], "r-")
    # Make axis label
    for i in ["x", "y", "z"]:
        eval(f"ax.set_{i}label('{i}')")
    plt.show()
