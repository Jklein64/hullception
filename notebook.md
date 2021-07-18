---
NOTE: The idea of this .md file is to hold the text for relevant definitions and whatnot that I would like to include in the VSCode Native Notebook (but whose built-in markdown styling is super ugly and cannot be changed :unamused:).  The markdown goes into this file, and the code goes into the notebook
---

# Hullception:

## Image Decomposition with Many Convex Hulls

Jason Klein

## So What is an Outlier?

> [Wikipedia] In statistics, an outlier is a data point that differs significantly from other observations.

When looking at the above definition in the context of image decomposition, it doesn't really make sense. An image could have a small splotch of yellow/orange while the rest of the image is blue (the splotch is sometimes the Sun), and by the above definition, this splotch would be considered an outlier. The outliers we are interested in aren't outliers in a statistical sense; rather, they are defined in terms of their effects on the image and the perceived color palette of that image.

**Definition 1.** _An "outlier" is a point of a group of points whose existance significantly affects the shape of the convex hull containing all of the groups of points and whose removal has an insignificant effect on the image._

### "whose existance significantly affects the shape of the convex hull containing all of the groups of points..."

-   First, divide the points into groups such that every point is in exactly _one_ group. This can be done with clustering algorithms such as [k-means](https://en.wikipedia.org/wiki/K-means_clustering) or tessellation methods such as [Delaunay tessellations](https://en.wikipedia.org/wiki/Delaunay_triangulation) (though the two are actually related).

-   Then, calculate the convex hull of each of the points, the convex hull of the union of all of the groups, and the volumes of each of these hulls. From now on, the convex hull of the union of all of the groups is called the "large hull" and the convex hull of an individual group is called a "small hull".

-   For each of the small hulls that lie on the border of the large hull, find the small hull that decreases the volume of a large hull the most when the large hull is recalculated to exclude the small hull (<span style="color: #D19A66">NOTE we might also want to try just keeping track of the small hull with the largest volume. These two are not guaranteed to be the same, and in fact are likely not</span>).

-   If the removal of the small hull found above would reduce the volume of the larger convex hull past a threshold, then it's existance significantly affects the shape of the convex hull containing all of the groups of points.

### "...whose removal has an insignificant effect on the image"

[<span style="color: red">TODO</span>]

## k-means

K-means is a clustering algorithm that assembles $k$ groups of points based on how close they are to each other. Working with groups of points is a lot more efficient than working with points individually, and also has the added benefit that removing _only one_ group will remove _more than one_ point. In this context, a point is a color and a group is all of the points that share a similar color (where the color shows up in the image is ignored for now). K-means can be used to create groups in order to identify groups whose existance significantly affects the shape of the convex hull containing all of the groups of points. The following algorithm finds one such group:

_Given a set of $N$ points $p_i$ and an outlier percentage $\lambda$, run k-means with $k = \frac N {100 - \lambda}$, and then compute the convex hull $k$ times, leaving out one cluster each time. Return the smallest convex hull._

### Results

Below is a comparison of the output convex hull made using just `points` and the output convex hull made by finding one of $k$ clusters whose removal minimizes the volume of the hull.  In this example, $k=50$ was decided as it looked like it split the points into reasonably-sized chunks.  Settling on this number programatically or mathematically may be difficult.

![summary](https://i.loli.net/2021/07/16/4UTyoEb1C9FDjcK.png)

## Hull of hulls

If we are only interested in removing a cluster that will affect the shape of the large hull, then by the definition of a convex hull we should ignore the small hulls that share no vertices with the large hull.  These small hulls with no vertices shared with the large hull are *internal* to the entire cluster and are *guaranteed* to not affect the shape of the hull.
