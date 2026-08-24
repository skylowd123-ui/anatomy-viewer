export interface KnownLimitation {
  title: string
  detail: string
}

export const knownLimitations: KnownLimitation[] = [
  {
    title: 'Coverage is uneven across systems',
    detail: 'The atlas contains 819 structures, but coverage is intentionally uneven. Skeletal and muscular structures are most detailed, while lymphatic, endocrine, urinary, and reproductive systems contain comparatively few structures.'
  },
  {
    title: 'Not a complete anatomical reference',
    detail: 'Many fine structures, anatomical variants, developmental anatomy, and full connective-tissue relationships are not represented. Absence from the viewer does not imply absence from the human body.'
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
  sourceNote: 'Mesh attribution and licensing information is available in ATTRIBUTION.md.'
}
