# Data attribution

## BodyParts3D anatomical meshes

The real anatomical mesh files distributed in `public/models/skeletal/`,
`public/models/circulatory/`, and `public/models/respiratory/` are derived
from **BodyParts3D, Database Center for Life Science (DBCLS)**.

> BodyParts3D, © The Database Center for Life Science, licensed under
> Creative Commons Attribution-ShareAlike 2.1 Japan.

- Database: [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/)
- Source mesh archive: [`isa_BP3D_4.0_obj_99.zip`](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip)
- Source ID/name table: [`isa_parts_list_e.txt`](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_parts_list_e.txt)
- License: [Creative Commons Attribution-ShareAlike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)
- Database license information: [BodyParts3D license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)

### Modifications

The source Wavefront OBJ meshes were selected from the 99% polygon-reduction
IS-A Tree dataset, uniformly rescaled from BodyParts3D millimetre coordinates
to this viewer's scene scale, converted to binary glTF (`.glb`), and compressed
with the `KHR_draco_mesh_compression` extension. Display colors and opacity are
applied by the viewer at runtime and are not part of the original data.

The converted mesh derivatives are distributed under the same
**CC BY-SA 2.1 Japan** license. Application source code is separate from the
BodyParts3D mesh data and remains subject to its own repository terms.
