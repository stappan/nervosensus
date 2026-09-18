# NervoSensus

**An interactive visualization of somatosensory neuron cell types across species and nomenclatures**

NervoSensus is a client-side web application for exploring 153 somatosensory cell types (143 neurons + 10 non-neuronal) drawn from 6 published sources. It integrates cross-study equivalence and subtype relationships, marker gene expression, axon phenotypes, physiology, and species data into a unified interface with seven complementary views.

---

## Data

### Sources (6 publications, 153 cell types)

| Source | Cells | Color | DOI |
|--------|------:|-------|-----|
| Bhuiyan et al., 2024 | 54 | Purple | [10.1126/sciadv.adj9173](https://doi.org/10.1126/sciadv.adj9173) |
| Bhuiyan et al., 2025 | 31 | Amber | [10.1101/2025.11.05.686654](https://doi.org/10.1101/2025.11.05.686654) |
| Krauter et al., 2025 | 22 | Violet | [10.1038/s42003-025-08315-1](https://doi.org/10.1038/s42003-025-08315-1) |
| Qi et al., 2024 | 17 | Cyan | [10.1016/j.cell.2024.02.006](https://doi.org/10.1016/j.cell.2024.02.006) |
| Yu et al., 2024 | 16 | Red | [10.1038/s41593-024-01794-1](https://doi.org/10.1038/s41593-024-01794-1) |
| Tavares-Ferreira et al., 2022 | 12 | Green | [10.1126/scitranslmed.abj8186](https://doi.org/10.1126/scitranslmed.abj8186) |

### Non-neuronal cells

10 non-neuronal cell types (baseClass "cell" rather than "neuron") from Bhuiyan et al., 2025: satellite glial cell, myelinating Schwann cell, non-myelinating Schwann cell, endothelial cell, mural cell, 3 fibroblast subtypes, adipocyte, and immune cell. These appear in the Tree View under a dedicated "Non-neuronal Cells" section grouped by subclass (Glial, Vascular, Stromal, Other), and are excluded from the Lineage View.

### Cell type families

Bhuiyan et al., 2024 defines 18 master cell type families, each with species variants across mouse, human, macaque, and guinea pig (where available). Examples include DRG Pvalb neuron (4 variants), DRG TG Trpm8 neuron (4 variants), and DRG TG Calca+Smr2 neuron (4 variants).

### Cell identifiers

Every cell type has a stable npokb CURIE identifier (e.g., `npokb:915`). All cross-cell relationships (assertedSubclassOf, mapsTo, relatedCells) are resolved by npokb ID, not by label. The one exception is `ATLAS_TO_CELL`, which maps atlas annotation strings to cell labels.

### Relationships

Cell types are linked across sources through two relationship types:

- **Asserted subtype** (`assertedSubclassOf`): A cell is declared a subtype of another (e.g., a big DRG paper cell is a subtype of a CSA species variant). Rendered as a solid purple line.
- **Asserted equivalence** (`mapsTo`): A cell is declared equivalent to another across nomenclatures (e.g., a big DRG paper cell maps to a Krauter cell). Rendered as a red double line.

### Per-cell data fields

Each cell type record includes: `id` (npokb CURIE), `baseClass` ("neuron" or "cell"), preferred label, entity ID, species, soma location(s), circuit role, neurotransmitter, Cre line, marker gene expression string, individual marker genes (with URIs, expression level, and determinedByMethod), axon/fiber type phenotype (with methods), physiology string (with methods), source publication DOI, source data links, alert notes, curator notes, related species variants (by ID), asserted subclass-of relationships (by ID), maps-to equivalences (by ID), and cluster visualization attributes.

---

## Views

### 📋 Card View

The default view. Displays cell types as expandable cards in a responsive grid. Each card shows the cell name, source (color-coded), entity ID, species, gene expression, and axon phenotype. Clicking a card opens a detailed modal.

**Filter bar** — Filter cards by source, species, soma location, circuit role, and text search. The filter count updates live.

**Detail modal** — Shows full cell information including a base-class badge (neuron/cell), marker genes (with links to ontology URIs, expression level badges, and determinedByMethod badges), axon phenotype (with method badges), physiology (with method badges), asserted relationships (equivalences and subtypes as clickable buttons that navigate between cells by ID), source publication link, source data links, and curator/alert notes.

### 🌳 Tree View

Organizes cells hierarchically. Choose a grouping mode:

- **By location**: Groups by soma location (DRG, trigeminal), then by cell type family, then individual species variants.
- **By axon type**: Groups by fiber type (Aβ, Aδ, C fiber, unknown), then families within each type.

Families are collapsible; clicking a family header expands it to show individual variants with their gene expression strings.

A dedicated **Non-neuronal Cells** section groups the 10 non-neuronal cell types by subclass (Glial, Vascular, Stromal, Other).

### 📊 Synthesis View

A tabular matrix view showing all cell types as rows against phenotypic properties as columns (sensory threshold, adaptation, axon type, species, soma location). Checkmarks indicate which properties each cell possesses.

**Features:**
- Group-by options: species × axon type, or species × location
- Sortable column headers
- Equivalence highlighting: toggle to highlight cells with cross-source equivalences (amber background). Click a cell row to pin it and see all its equivalence partners highlighted.

### 🔮 Cluster View

A D3 force-directed simulation that positions neuron cell types as colored dots (non-neuronal cells are excluded). With no filters active, cells are colored by their source publication. 

**Attribute filters** — Select one or more attributes from six categories to recolor cells:
- **Threshold phenotype**: Cold, Heat, LTM, HTM, Proprioceptive
- **Adaptation phenotype**: RA, SA
- **Axon phenotype**: Aβ, Aδ, C
- **Species**: Mouse, Human, Macaque, Guinea Pig
- **Soma location**: DRG, Trigeminal
- **Source**: Each of the 6 publications
- **Marker genes**: Individual genes (expandable list)

When one attribute is selected, matching cells are highlighted and the rest are dimmed. When two or more are selected, each attribute gets a distinct color and cells matching all attributes (intersection) glow gold. The legend and statistics panel update dynamically.

Clicking any cell dot opens its detail modal.

### 🌳 Provisional Mapping (Lineage View)

A 4-column SVG diagram showing cross-source relationships for neuron cell types only (non-neuronal cells excluded):

| Column | Content |
|--------|---------|
| **Master Cells** | 18 abstract Bhuiyan 2024 family names (e.g., "DRG Pvalb neuron") |
| **Bhuiyan 2024 Variants** | 54 Bhuiyan et al., 2024 cells grouped under their family |
| **Bhuiyan et al., 2025** | Bhuiyan et al., 2025 neuron cells, positioned by their Bhuiyan 2024 family connection |
| **Other Sources** | Tavares-Ferreira, Yu, Krauter, and Qi cells connected to Bhuiyan 2025 cells |

**Layout optimization:**
- Cells in columns 3 and 4 are ordered using barycenter heuristics to minimize line crossings — each cell is positioned at the average Y-coordinate of its connection targets.
- Cells that connect to Bhuiyan 2025 cells in multiple family groups are duplicated into each relevant group to avoid long-distance crossing lines.
- Cross-group connections between column 4 cells are rendered as curved arcs on the right edge at lower opacity.
- Alternating row bands distinguish family groups.
- Bhuiyan 2025 cells with no direct Bhuiyan 2024 link appear in separate sub-groups at the bottom, each with its own set of related column 4 cells and vertical spacing between sub-groups.

**Line types:**
- Solid purple: asserted subtype
- Red double line: asserted equivalence (mapsTo)
- Solid blue (column 1→0): family membership

**Interactivity:** Click any cell node to open its detail modal. Hover for a tooltip showing full name and source.

### 📑 Concordance View

A cross-source alignment table showing Bhuiyan et al., 2025 parent cell types with related cells from other sources expandable beneath. Each row shows checkmarks for properties reported by the source publication. Includes export to `.xlsx` and `.docx`.

### 🔗 Align View

A side-by-side comparison view for examining cross-source cell type alignments. Includes export to `.docx`.

---

## Data Pipeline

Cell type data is generated from a source XLSX spreadsheet using `sync_data.py`, which reads the NPO property rows and produces `js/data.js`. The script validates that every cell has an npokb ID, excludes "don't add" rows, classifies cells by base class (neuron vs. cell), deduplicates marker genes by base name, and captures determinedByMethod and expression level metadata.

NervoSensus ships with all 153 cell types embedded in `js/data.js`. It can also load external data at runtime:

- **Excel upload** (`.xlsx`): Parses structured cell type spreadsheets using the SheetJS library.
- **JSON upload**: Accepts a JSON object with `cells` and `genes` arrays matching the internal data schema.

The upload button is in the header. The data status indicator shows whether default or uploaded data is active, with a count of neuron types and non-neuronal cell types.

---

## Technical Details

### Dependencies (loaded from CDN)

- **D3.js v7.8.5** — Force simulation for cluster view, SVG rendering for lineage view
- **PapaParse v5.4.1** — CSV parsing support
- **SheetJS (xlsx) v0.18.5** — Excel file parsing for data upload

### Architecture

The application consists of:
- `index.html` — page structure and view containers
- `js/app.js` — all application logic (views, modals, filtering, export)
- `js/data.js` — generated data constants (`DEFAULT_CELL_TYPES`, `DEFAULT_SOURCES`, `DEFAULT_FAMILIES`, `DEFAULT_GENES`)
- `css/styles.css` — all styles
- `sync_data.py` — Python script that reads the source XLSX and generates `js/data.js`

No build step, no server, and no external API calls beyond CDN-loaded libraries. The app runs entirely client-side in any modern browser.

### Browser compatibility

Requires a modern browser with ES6+ support (template literals, arrow functions, `const`/`let`, `Set`/`Map`). Tested in Chrome, Firefox, Safari, and Edge.

---

## Usage

Open `index.html` in a web browser. No installation or server required.
