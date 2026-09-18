# NervoSensus — Project Instructions

## What is NervoSensus?

NervoSensus is a client-side web application for visualizing 153 somatosensory cell types (143 neurons + 10 non-neuronal) from 6 published sources. It runs entirely client-side with no server, build step, or external APIs.

## Architecture

- **Multi-file structure**: `index.html` (markup), `js/app.js` (logic), `js/data.js` (generated data), `css/styles.css` (styles)
- **Data pipeline**: `sync_data.py` reads source XLSX and generates `js/data.js`
- **CDN dependencies**: D3.js v7.8.5 (cluster/lineage views), PapaParse v5.4.1 (CSV), SheetJS v0.18.5 (Excel upload)
- **Embedded data**: `DATA_VERSION` (auto-generated version/date/counts), `DEFAULT_CELL_TYPES` (153 cells), `DEFAULT_SOURCES` (6 sources as object keyed by DOI), `DEFAULT_FAMILIES` (18 family groupings), `DEFAULT_GENES` (95 genes)
- **No build step**: Open index.html directly in any modern browser

## Data Model

### Sources (6 publications)

| Source | Variable label | Cells | Color | DOI |
|--------|---------------|------:|-------|-----|
| Bhuiyan et al., 2024 | `Bhuiyan et al., 2024` | 54 | `#667eea` | 10.1126/sciadv.adj9173 |
| Bhuiyan et al., 2025 | `Bhuiyan et al., 2025` | 31 | `#f59e0b` | 10.1101/2025.11.05.686654 |
| Krauter et al., 2025 | `Krauter et al., 2025` | 22 | `#8b5cf6` | 10.1038/s42003-025-08315-1 |
| Qi et al., 2024 | `Qi et al., 2024` | 17 | `#06b6d4` | 10.1016/j.cell.2024.02.006 |
| Yu et al., 2024 | `Yu et al., 2024` | 16 | `#ef4444` | 10.1038/s41593-024-01794-1 |
| Tavares-Ferreira et al., 2022 | `Tavares-Ferreira et al., 2022` | 12 | `#22c55e` | 10.1126/scitranslmed.abj8186 |

### Cell type fields

Each cell in `DEFAULT_CELL_TYPES` has: `id` (npokb CURIE), `baseClass` ("neuron" or "cell"), `preferredLabel`, `entity`, `species` (mouse/human/macaque/guinea pig), `somaLocation`, `somaLocations[]`, `sourceNomenclatureLabel`, `sourceNomenclature` (DOI), `sourceColor`, `sourceData`, `color`, `circuitRole`, `neurotransmitter`, `creLine`, `geneExpressionString`, `geneBaseNames[]`, `markerGenes[]` (with URIs, `expressionLevel`, `determinedBy`), `fiberTypeString`, `fiberTypeStringAbbrev`, `fiberTypeMethods[]`, `physiologyString`, `physiologyStringAbbrev`, `physiologyMethods[]`, `relatedCells[]` (by npokb ID), `assertedSubclassOf[]` (by npokb ID), `mapsTo[]` (by npokb ID), `proposedEquivalences[]` (idx-based), `clusterAttributes{}`, `alertNotes`, `curatorNotes`, `masterLabel`.

### Families (18 groups)

`DEFAULT_FAMILIES` array: each has `name` and `children[]` (array of CSA cell preferredLabels). These group the 54 CSA species variants into abstract families like "DRG Pvalb neuron", "DRG TG Trpm8 neuron", etc.

### Relationship resolution

- `assertedSubclassOf`, `mapsTo`, and `relatedCells` store npokb CURIEs and resolve to cell indices via an `ID_INDEX` lookup (id → array index)
- Label-based resolution has been removed — all relationships are ID-only
- **Exception**: `ATLAS_TO_CELL` mapping uses `preferredLabel` (the PRECISION dashboard doesn't know npokb IDs)
- Labels "added" and "-->" prefixed labels are skipped as sentinel values
- Each Bhuiyan 2025 neuron cell maps to exactly 1 Bhuiyan 2024 family (never multiple)
- No non-Bhuiyan source connects directly to Bhuiyan 2024 — they connect through Bhuiyan 2025

### Relationship topology

```
Master Families (18) ← Bhuiyan 2024 Variants (54) ← Bhuiyan 2025 neurons ← Other Sources (67)
                                                                              ├── Krauter (22)
                                                                              ├── Qi (17)
                                                                              ├── Yu (16)
                                                                              └── Tavares-Ferreira (12)
```

## Views (7)

### 1. Card View (`cards`)
- Responsive grid of expandable cards, color-coded by source
- Filter bar: source, species, soma location, circuit role, text search
- Click opens detail modal with full data, gene links, relationship buttons
- Detail modal includes base-class badge, determinedByMethod badges, expression level badges

### 2. Tree View (`tree`)
- Hierarchical grouping: by location or by axon type
- **By location**: Soma Location → Cell Type (Neuron / Non-neuronal) → Families or subClassOf groups → Cells
- **By axon type**: Fiber type (Aβ, Aδ, A fiber, C fiber, Other) → Families → Cells, plus non-neuronal section at bottom
- Collapsible family→variant nesting

### 3. Synthesis View (`synthesis`)
- Matrix: rows = cells, columns = phenotypic attributes (threshold, adaptation, axon, species, soma)
- Group-by options, sortable columns, equivalence pin-highlighting

### 4. Cluster View (`cluster`)
- D3 force-directed simulation with Cell Type filter dropdown (neuron / non-neuronal)
- 6 attribute filter categories (threshold, adaptation, axon, species, soma, source, marker genes)
- Multi-attribute intersection highlighting (gold glow)
- Dynamic legend and statistics

### 5. Provisional Mapping / Lineage View (`lineage`)
- 4-column SVG: Master Cells → Bhuiyan 2024 Variants → Bhuiyan 2025 → Other Sources
- Neuron cells only (non-neuronal excluded)
- Barycenter ordering minimizes line crossings
- Shared cells duplicated into each relevant family group
- Line types: solid purple = asserted subtype, red double line = asserted equivalence, solid blue = family membership
- Unlinked Bhuiyan 2025 cells in separate sub-groups at bottom

### 6. Concordance View (`concordance`)
- Cross-source alignment table with Bhuiyan 2025 parent rows and expandable related cells
- Property checkmarks by source
- Export to `.xlsx` and `.docx`

### 7. Align View (`align`)
- Side-by-side cross-source cell type comparison
- Export to `.docx`

## Key functions

- `renderCardView()` — card grid with filtering
- `renderTreeView()` — hierarchical tree with non-neuronal section
- `renderSynthesisView()` — matrix table
- `renderClusterView()` / `updateClusterVisualization()` — force simulation (neurons only)
- `renderLineageView()` — 4-column SVG with barycenter layout (neurons only)
- `showModal(idx)` — detail modal for any cell
- `openCellById(id)` — navigate to cell by npokb CURIE (used by relationship buttons)
- `switchView(viewName)` — view switching
- `updateDataStatus()` — header status showing neuron + non-neuronal counts
- `updateVersionInfo()` — displays app and data version in header
- `getAxonGroup(ct)` — shared fiber type classification (Aβ / Aδ / A fiber / C fiber / Other)
- `onClusterBaseClassChange()` — handles Cell Type filter toggle in cluster view

## Working with the codebase

When editing, keep in mind:
- `js/data.js` is generated by `sync_data.py` — do not edit it manually (except the npokb:1094 label fix "DRG SGC" → "DRG satellite glial human cell" which must be re-applied after each regeneration)
- Source color mappings exist in multiple places: `sourceColors` objects in renderLineageView and renderClusterView, `SOURCE_URLS` lookup, `ATTR_LABELS`/`ATTR_SHORT` for cluster view, the cluster legend HTML, and lineage legend HTML
- When adding a new source, ALL of these locations must be updated
- Source XLSX: `forNervoSensus.xlsx` (in main repo directory)
- To regenerate data: `python sync_data.py` (requires openpyxl)

## Versioning

- **`APP_VERSION`** in `js/app.js` — manually maintained, currently `0.1.0-beta`
- **`DATA_VERSION`** in `js/data.js` — auto-generated by `sync_data.py` with version, date, cell counts, source count, source filename
- **`DATA_VERSION`** constant in `sync_data.py` — controls the version string written to data.js
- Both versions display in the header via `updateVersionInfo()`

## Style conventions

- Gradient accents: `linear-gradient(135deg, #667eea, #764ba2)` (primary purple)
- Font: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Card border-left colors match source colors
- Rounded corners: 8-12px on cards/containers, 4-6px on buttons/badges
