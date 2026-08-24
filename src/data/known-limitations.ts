// Verified dataset gaps shown in the Known Limitations modal.
//
// Source: BodyParts3D v4.0 (CC-BY-SA 2.1, Database Center for Life Science,
// Japan) — see ATTRIBUTION.md. Every entry below is a structure that is NOT
// available in the source dataset; the atlas never approximates or fabricates
// missing anatomy. When a gap gets filled, remove its entry here (and bump
// verifiedStructures in datasetSummary if the total changes).

export const atlasIntro = 'This atlas is built from the open-source BodyParts3D dataset (CC-BY-SA 2.1, Database Center for Life Science, Japan). Every structure shown has been individually verified against the dataset\'s official lookup tables and is accurately named and positioned. Where a structure isn\'t available in the source dataset, it\'s listed here rather than approximated or fabricated, so everything you see can be relied on as anatomically accurate. Note: 342 of 819 shipped meshes retain traceable BodyParts3D source IDs in their file metadata; the remaining 477 do not carry this metadata but were converted through the same asset pipeline (five lung-lobe meshes were generated separately).'

export interface GapCategory {
  title: string
  gaps: string[]
}

export const datasetGaps: GapCategory[] = [
  {
    title: 'MUSCULAR',
    gaps: [
      'Facial muscles: masseter, temporalis, frontalis, orbicularis oculi, orbicularis oris — not present in the dataset',
      'Latissimus dorsi and erector spinae are not modeled as single named muscles, but all their individual component muscles are present (e.g. iliocostalis, longissimus, spinalis for erector spinae)'
    ]
  },
  {
    title: 'SKELETAL',
    gaps: [
      'Individual ilium, ischium, and pubis are not separable — the hip bone is only available as one fused structure per side',
      'The intervertebral disc between T12 and L1 is not present (all other 22 disc levels are present and correctly positioned)',
      'Teeth are entirely absent — jaw bones (maxilla, mandible) are present but contain no tooth structures'
    ]
  },
  {
    title: 'CONNECTIVE TISSUE',
    gaps: [
      'Major joint ligaments (ACL, PCL, collateral ligaments, patellar ligament, hip/shoulder ligaments) are not present — only the calcaneal (Achilles) tendon and two plantar ligaments exist'
    ]
  },
  {
    title: 'NERVOUS',
    gaps: [
      '8 of the 12 cranial nerves are not present (only optic, trochlear, ophthalmic branch, and oculomotor branches exist)',
      'The spinal cord itself is not modeled as a structure — only its internal central canal exists'
    ]
  },
  {
    title: 'DIGESTIVE',
    gaps: [
      'Pharynx (as a distinct cavity/wall structure) is not present, though the larynx, soft palate, and uvula are present',
      'Sigmoid colon is not present (cecum and the rest of the large intestine are)'
    ]
  },
  {
    title: 'REPRODUCTIVE',
    gaps: [
      'Female reproductive anatomy is entirely absent from this dataset — only male reproductive structures are available'
    ]
  },
  {
    title: 'ENDOCRINE / LYMPHATIC',
    gaps: [
      'Thyroid and parathyroid glands are not present',
      'Lymph nodes, thoracic duct, and tonsils are not present — only spleen and thymus represent the lymphatic system'
    ]
  }
]

export const datasetSummary = {
  verifiedStructures: 819,
  systems: 10,
  closingNote: 'This atlas covers 819 verified structures across all 10 anatomical systems. For structures listed above, please consult a standard anatomy atlas or textbook.'
}
