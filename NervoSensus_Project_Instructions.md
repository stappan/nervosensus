# NervoSensus — Project Instructions

## What is NervoSensus?

NervoSensus is a single-file HTML application (~425 KB) for visualizing 145 somatosensory neuron cell types from 7 published sources. It runs entirely client-side with no server, build step, or external APIs. All data is embedded as JavaScript constants.

## Architecture

- **Single file**: `index.html` contains all HTML, CSS, and JavaScript inline
- **CDN dependencies**: D3.js v7.8.5 (cluster/lineage views), PapaParse v5.4.1 (CSV), SheetJS v0.18.5 (Excel upload)
- **Embedded data**: `DEFAULT_CELL_TYPES` (145 cells), `DEFAULT_SOURCES` (7 sources as object keyed by DOI), `DEFAULT_FAMILIES` (18 family groupings)
- **No build step**: Open index.html directly in any modern browser

## Data Model

### Sources (7 publications)

| Source | Variable label | Cells | Color | DOI |
|--------|---------------|------:|-------|-----|
| CSA paper (Bhuiyan et al.) | `CSA paper` | 54 | `#667eea` | 10.1126/sciadv.adj9173 |
| Big DRG paper (Bhuiyan et al., 2025) | `big DRG paper` | 22 | `#f59e0b` | 10.1101/2025.11.05.686654 |
| Krauter et al., 2025 | `Krauter et al., 2025` | 22 | `#8b5cf6` | 10.1038/s42003-025-08315-1 |
| Qi et al., 2024 | `Qi et al., 2024` | 17 | `#06b6d4` | 10.1016/j.cell.2024.02.006 |
| Yu et al., 2024 | `Yu et al., 2024` | 16 | `#ef4444` | 10.1038/s41593-024-01794-1 |
| Tavares-Ferreira et al., 2022 | `Tavares-Ferreira et al., 2022` | 12 | `#22c55e` | 10.1126/scitranslmed.abj8186 |
| Kupari et al., 2021 | `Kupari et al., 2021` | 9 | `#ec4899` | 10.1038/s41467-021-21725-z |

### Cell type fields

Each cell in `DEFAULT_CELL_TYPES` has: `preferredLabel`, `entity`, `species` (mouse/human/macaque/guinea pig), `somaLocation`, `somaLocations[]`, `sourceNomenclatureLabel`, `sourceNomenclature` (DOI), `sourceColor`, `sourceData`, `color`, `circuitRole`, `neurotransmitter`, `creLine`, `geneExpressionString`, `geneBaseNames[]`, `markerGenes[]` (with URIs), `fiberTypeString`, `fiberTypeStringAbbrev`, `physiologyString`, `physiologyStringAbbrev`, `relatedCells[]`, `assertedSubclassOf[]` (label-based), `mapsTo[]` (label-based), `proposedEquivalences[]` (idx-based, currently unused in lineage), `clusterAttributes{}`, `alertNotes`, `curatorNotes`, `masterLabel`.

### Families (18 groups)

`DEFAULT_FAMILIES` array: each has `name` and `children[]` (array of CSA cell preferredLabels). These group the 54 CSA species variants into abstract families like "DRG Pvalb neuron", "DRG TG Trpm8 neuron", etc.

### Relationship resolution

- `assertedSubclassOf` and `mapsTo` use string labels that resolve to cell indices via `preferredLabel` or `entity` field matching
- Labels "added" and "-->" prefixed labels are skipped as sentinel values
- CSA cells have entity fields with "(Bhuiyan2024)" suffix used for resolution
- Each big DRG paper cell maps to exactly 1 CSA family (never multiple)
- No non-CSA, non-big-DRG source connects directly to CSA — they connect through big DRG paper

### Relationship topology

```
Master Families (18) ← CSA Variants (54) ← big DRG paper (22) ← Other Sources (76)
                                                                   ├── Krauter (22)
                                                                   ├── Qi (17)
                                                                   ├── Yu (16)
                                                                   ├── Tavares-Ferreira (12)
                                                                   └── Kupari (9)
```

Cross-source connections: 20 big DRG→CSA, 65 big DRG→other sources, 14 other→big DRG, 31 inter-other-source connections. 2 big DRG cells (indices 67, 71) have no direct CSA link.

## Views (5)

### 1. Card View (`cards`)
- Responsive grid of expandable cards, color-coded by source
- Filter bar: source, species, soma location, circuit role, text search
- Click opens detail modal with full data, gene links, relationship buttons

### 2. Tree View (`tree`)
- Hierarchical grouping: by location or by axon type
- Collapsible family→variant nesting

### 3. Synthesis View (`synthesis`)
- Matrix: rows = cells, columns = phenotypic attributes (threshold, adaptation, axon, species, soma)
- Group-by options, sortable columns, equivalence pin-highlighting

### 4. Cluster View (`cluster`)
- D3 force-directed simulation, 145 colored dots
- 7 attribute filter categories (threshold, adaptation, axon, species, soma, source, marker genes)
- Multi-attribute intersection highlighting (gold glow)
- Dynamic legend and statistics

### 5. Lineage View (`lineage`)
- 4-column SVG: Master Cells → CSA Variants → big DRG paper → Other Sources
- Barycenter ordering minimizes line crossings
- Shared cells duplicated into each relevant family group
- Line types: solid purple = asserted subtype, red double line = asserted equivalence, solid blue = family membership
- Unlinked big DRG cells in separate sub-groups at bottom

## Key functions

- `renderCardView()` — card grid with filtering
- `renderTreeView()` — hierarchical tree
- `renderSynthesisView()` — matrix table
- `renderClusterView()` / `updateClusterVisualization()` — force simulation
- `renderLineageView()` — 4-column SVG with barycenter layout
- `showModal(idx)` — detail modal for any cell
- `showModalByName(label)` — navigate to cell by label (used by relationship buttons)
- `switchView(viewName)` — view switching

## Working with the file

When editing, keep in mind:
- The file is ~425 KB with ~2300 lines; most bulk is embedded JSON data
- The embedded data constants start around line 530-540
- Source color mappings exist in multiple places: `sourceColors` objects in renderLineageView and renderClusterView, `SOURCE_URLS` lookup, `ATTR_LABELS`/`ATTR_SHORT` for cluster view, the cluster legend HTML, and lineage legend HTML
- When adding a new source, ALL of these locations must be updated
- The data was originally parsed from `PRECISION_cell_type_NPO20Feb.xlsx`

## Style conventions

- Gradient accents: `linear-gradient(135deg, #667eea, #764ba2)` (primary purple)
- Font: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- Card border-left colors match source colors
- Rounded corners: 8-12px on cards/containers, 4-6px on buttons/badges
