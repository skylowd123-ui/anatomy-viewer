// Known limitations shown in the info modal.
//
// The dataset figures below were verified against:
// - the BodyParts3D v4.0 release statistics (1,651 elemental and 1,254
//   compound representations in the is-a tree) and its is-a parts list,
// - src/data/anatomy-manifest.json (819 structures across 10 systems), and
// - the converted GLB files under public/models (342 of the 819 retain
//   their BodyParts3D element file ids, e.g. FJ3176).
export interface KnownLimitation {
  title: string
  detail: string
}

export const knownLimitations: KnownLimitation[] = [
  {
    title: 'Only a subset of the source dataset is included',
    detail: 'The BodyParts3D v4.0 is-a tree provides 1,651 elemental parts plus 1,254 compound groupings. This viewer ships 819 selectable structures, so the atlas covers no more than about half of the available elemental parts, and the compound groupings are not represented.'
  },
  {
    title: 'Coverage is uneven across systems',
    detail: 'The manifest is dominated by muscular (384) and skeletal (239) structures, while lymphatic (3), endocrine (4), urinary (6), and reproductive (12) systems contain only a handful. The source database covers all ten systems, so the sparse counts are selection gaps, not source gaps.'
  },
  {
    title: 'Whole regions of the source are missing',
    detail: 'The manifest has no structures for the eye, pharynx, or larynx, although BodyParts3D 4.0 added internal eye-ball structures and pharynx and larynx parts. There is no whole-heart structure (the heart appears only as atrial and ventricular wall pieces) and no vascular anastomoses, even though the source lists both.'
  },
  {
    title: 'Vascular branching is only partly represented',
    detail: 'The source models the vascular tree at segment level — a single coronary branch appears as a run of numbered segment elements — while the circulatory system here ships 81 structures, so fine distal branching available in the source is not represented.'
  },
  {
    title: 'Provenance is incomplete for 477 meshes',
    detail: '342 of the 819 converted meshes still carry their BodyParts3D element file ids (FJxxxx) in the mesh metadata. The remaining 477 were re-exported under generic node names and can only be traced to the source by file name.'
  },
  {
    title: 'Single reference anatomy',
    detail: 'The meshes represent a generalized reference anatomy. They do not model patient-specific variation, age, sex characteristics, pathology, physiology, or dynamic movement.'
  },
  {
    title: 'Educational visualization, not clinical reference',
    detail: 'The models and labels are provided for exploration and learning. They must not be used for diagnosis, treatment planning, measurement, or surgical guidance.'
  },
  {
    title: 'Labels follow model geometry',
    detail: 'Structure labels use each model’s bounding-box center until curated anatomical anchor points are supplied. A label may therefore not identify a precise landmark.'
  }
]

export const datasetSummary = {
  includedStructures: 819,
  intendedSystems: 10,
  sourceElementalParts: 1651,
  sourceCompoundGroupings: 1254,
  sourceNote: 'BodyParts3D v4.0, Database Center for Life Science (CC BY-SA 2.1 Japan). Mesh attribution and licensing information is available in ATTRIBUTION.md.'
}
