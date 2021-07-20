# open image
import PIL.Image
import numpy as np
import scipy.spatial
import export

image = PIL.Image.open("turquoise.png")
# preview image
# export.send_image(image)
# convert to np array
points = np.array(image.convert("RGB"))
image.close()

#  rgb int to rgb float
points = points / 255
# points is [x, y, rgb]
points = points.reshape((-1, 3))
# points is [i, rgb]
points = np.unique(points, axis=0)

delaunay_tessellation = scipy.spatial.Delaunay(points)
convex_hull = delaunay_tessellation.convex_hull
# export.send_lines(export.simplices_to_lines(points[convex_hull]))

print(np.shape(points))
print(np.shape(points[delaunay_tessellation.simplices]))
# print(points[delaunay_tesselation.simplices])
