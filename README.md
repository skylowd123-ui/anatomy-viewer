# ANATOMICA — Interactive 3D Human Atlas

A responsive browser-based anatomy viewer built with React, TypeScript, Three.js, and react-three-fiber. The starter contains lightweight placeholder GLB models for a skull, left femur, heart, and right lung so interaction can be tested before production anatomy files arrive.

## Run locally

```bash
npm install
npm start
```

Open the URL printed by Vite (normally `http://localhost:5173`). `npm install` automatically copies the local Draco decoder into `public/draco` and generates the four placeholder `.glb` files.

Production check:

```bash
npm run build
npm run preview
```

## Included interactions

- Orbit, pinch/scroll zoom, and right-drag/two-finger pan
- Lazy loading by anatomical system
- Per-system visibility and opacity
- Mesh-level raycast selection and visual highlighting
- Optional 3D leader-line labels and answer panel (“Show names on click”)
- Search, matching highlight, and animated camera focus
- Isolate, focus, reset view, and clear selection
- Streaming progress indicator
- Desktop side panel and touch-friendly mobile bottom sheet
- Navigation panel with Systems, About, and Contact sections (About/Contact are code-split and load only when opened)
- Light/dark theme toggle in the top bar — follows the system preference on first visit, persists the user's choice, and keeps the 3D viewport dark in both themes so structure colors never lose their tuned contrast
- Local Draco decoder support (no runtime CDN dependency)
- Code-split 3D scene; the application shell loads first

## Folder layout

```text
src/
  data/anatomy-manifest.json  # Data-driven structure registry
  scene/AnatomyScene.tsx      # Loader, raycasting, materials, labels, camera
  App.tsx                     # Shell, state, search, navigation panel
  About.tsx                   # About section (lazy-loaded, in-panel)
  Contact.tsx                 # Contact section (lazy-loaded, in-panel)
  styles.css                  # Responsive visual system
public/
  models/<system>/*.glb       # Anatomy assets (generated after install for demo)
  draco/                      # Generated after install
scripts/prepare-assets.mjs    # Demo GLB + decoder setup
```

## Add a structure

1. Put the model under the relevant system folder, for example:

   ```text
   public/models/skeletal/right_femur.glb
   ```

2. Add one object to `src/data/anatomy-manifest.json`:

   ```json
   {
     "id": "right-femur",
     "displayName": "Right Femur",
     "system": "skeletal",
     "filePath": "/models/skeletal/right_femur.glb",
     "defaultColor": "#e4dac0",
     "defaultOpacity": 1
   }
   ```

No render-code change is needed. Layer counts, search, loading, selection, labels, opacity, focus, and isolate behavior all derive from this manifest.

### Manifest rules

- `id`: unique, stable, URL-safe identifier.
- `displayName`: learner-facing anatomical name and search text.
- `system`: one of `skeletal`, `muscular`, `circulatory`, `respiratory`, `digestive`, `nervous`, `urinary`, `reproductive`, `lymphatic`, or `endocrine`.
- `filePath`: root-relative URL under `public`.
- `defaultColor`: CSS hex color applied to all meshes in that structure.
- `defaultOpacity`: initial multiplier from `0` to `1`; the layer slider is multiplied by this value.

## Model preparation guidance

- Export GLB where possible (one binary request per structure).
- Keep all structures in one shared coordinate system and scale. The starter uses meters-like units, with feet around `y=0`, head around `y=3`, and the body centered on the world origin.
- Bake transforms before export and use meaningful mesh names.
- Models may contain multiple meshes. Selection is initiated by an actual mesh raycast and bubbles to its manifest structure.
- Use Draco mesh compression for the full dataset. The loader is already configured to `/draco/`.
- Keep one anatomical structure per manifest entry/file when independent selection and isolation are required.
- Consider meshopt/texture compression and LODs for very large production datasets. Draco decoding alone does not reduce GPU memory after decode.

## Extending systems

The ten requested systems are declared in `src/types.ts` and styled in `systemMeta` inside `src/App.tsx`. To add an entirely new parent system:

1. Add its key to `SYSTEMS` in `src/types.ts`.
2. Add its label/color to `systemMeta` in `src/App.tsx`.
3. Add manifest records using that system key.

Layer controls are rendered from `SYSTEMS`; no scene changes are needed.

## Extending labels

Labels are rendered in `StructureModel` in `src/scene/AnatomyScene.tsx`. The current anchor is computed from each loaded GLB's bounding-box center. For curated label anchors, add an optional field such as `labelPosition: [x, y, z]` to the `Structure` type and manifest, then prefer it over the computed `labelPoint`. The HTML tag and leader line can be restyled with `.anatomy-label` in `src/styles.css`.

## Extending search

Search currently matches `displayName` and `system`, highlights all results, reveals the first result's layer, and focuses the camera. To add synonyms:

1. Add an optional `aliases: string[]` field to `Structure`.
2. Add aliases to manifest records.
3. Include `item.aliases?.some(...)` in the `matches` and first-result predicates in `App.tsx`.

For thousands of structures, replace the simple filter with a prebuilt Fuse.js index while keeping the same `matches` ID array passed to the scene.

## Replacing the placeholders

The postinstall script regenerates the four demo files. During production integration, either:

- replace those exact files after install, or
- remove the four `exportGLB(...)` calls from `scripts/prepare-assets.mjs` and commit/copy your real model directory through your own asset pipeline.

The real models should use the same body coordinate frame so layers align correctly.
