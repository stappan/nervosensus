# NervoSensus

**An interactive visualization of somatosensory neuron cell types across species and nomenclatures**

NervoSensus is a self-contained, single-file HTML application for exploring 145 somatosensory neuron cell types drawn from 7 published sources. It integrates cross-study equivalence and subtype relationships, marker gene expression, axon phenotypes, physiology, and species data into a unified interface with five complementary views.

---

## Data

### Sources (7 publications, 145 cell types)

| Source | Cells | Color | DOI |
|--------|------:|-------|-----|
| CSA paper (Bhuiyan et al.) | 54 | Purple | [10.1126/sciadv.adj9173](https://doi.org/10.1126/sciadv.adj9173) |
| Big DRG paper (Bhuiyan et al., 2025) | 22 | Amber | [10.1101/2025.11.05.686654](https://doi.org/10.1101/2025.11.05.686654) |
| Krauter et al., 2025 | 22 | Violet | [10.1038/s42003-025-08315-1](https://doi.org/10.1038/s42003-025-08315-1) |
| Qi et al., 2024 | 17 | Cyan | [10.1016/j.cell.2024.02.006](https://doi.org/10.1016/j.cell.2024.02.006) |
| Yu et al., 2024 | 16 | Red | [10.1038/s41593-024-01794-1](https://doi.org/10.1038/s41593-024-01794-1) |
| Tavares-Ferreira et al., 2022 | 12 | Green | [10.1126/scitranslmed.abj8186](https://doi.org/10.1126/scitranslmed.abj8186) |
| Kupari et al., 2021 | 9 | Pink | [10.1038/s41467-021-21725-z](https://doi.org/10.1038/s41467-021-21725-z) |

### Cell type families

The CSA paper defines 18 master cell type families, each with species variants across mouse, human, macaque, and guinea pig (where available). Examples include DRG Pvalb neuron (4 variants), DRG TG Trpm8 neuron (4 variants), and DRG TG Calca+Smr2 neuron (4 variants).

### Species coverage

- **Human**: 63 cell types
- **Mouse**: 57 cell types
- **Macaque**: 15 cell types
- **Guinea pig**: 10 cell types

### Soma locations

All 145 cells are localized to the dorsal root ganglion (DRG); 47 are also found in the trigeminal ganglion.

### Relationships

Cell types are linked across sources through two relationship types:

- **Asserted subtype** (`assertedSubclassOf`): A cell is declared a subtype of another (e.g., a big DRG paper cell is a subtype of a CSA species variant). Rendered as a solid purple line.
- **Asserted equivalence** (`mapsTo`): A cell is declared equivalent to another across nomenclatures (e.g., a big DRG paper cell maps to a Krauter cell). Rendered as a red double line.

### Per-cell data fields

Each cell type record includes: preferred label, entity ID, species, soma location(s), circuit role, neurotransmitter, Cre line, marker gene expression string, individual marker gene URIs, axon/fiber type phenotype, physiology string, source publication DOI, source data links, alert notes, curator notes, related species variants, asserted subclass-of relationships, maps-to equivalences, and cluster visualization attributes.

---

## Views

### 📋 Card View

The default view. Displays cell types as expandable cards in a responsive grid. Each card shows the cell name, source (color-coded), entity ID, species, gene expression, and axon phenotype. Clicking a card opens a detailed modal.

**Filter bar** — Filter cards by source, species, soma location, circuit role, and text search. The filter count updates live.

**Detail modal** — Shows full cell information including marker genes (with links to ontology URIs), axon phenotype, physiology, asserted relationships (equivalences and subtypes as clickable buttons that navigate between cells), source publication link, source data links, and curator/alert notes.

### 🌳 Tree View

Organizes cells hierarchically. Choose a grouping mode:

- **By location**: Groups by soma location (DRG, trigeminal), then by cell type family, then individual species variants.
- **By axon type**: Groups by fiber type (Aβ, Aδ, C fiber, unknown), then families within each type.

Families are collapsible; clicking a family header expands it to show individual variants with their gene expression strings.

### 📊 Synthesis View

A tabular matrix view showing all cell types as rows against phenotypic properties as columns (sensory threshold, adaptation, axon type, species, soma location). Checkmarks indicate which properties each cell possesses.

**Features:**
- Group-by options: species × axon type, or species × location
- Sortable column headers
- Equivalence highlighting: toggle to highlight cells with cross-source equivalences (amber background). Click a cell row to pin it and see all its equivalence partners highlighted.

### 🔮 Cluster View

A D3 force-directed simulation that positions all 145 cells as colored dots. With no filters active, cells are colored by their source publication. 

**Attribute filters** — Select one or more attributes from six categories to recolor cells:
- **Threshold phenotype**: Cold, Heat, LTM, HTM, Proprioceptive
- **Adaptation phenotype**: RA, SA
- **Axon phenotype**: Aβ, Aδ, C
- **Species**: Mouse, Human, Macaque, Guinea Pig
- **Soma location**: DRG, Trigeminal
- **Source**: Each of the 7 publications
- **Marker genes**: Individual genes (expandable list)

When one attribute is selected, matching cells are highlighted and the rest are dimmed. When two or more are selected, each attribute gets a distinct color and cells matching all attributes (intersection) glow gold. The legend and statistics panel update dynamically.

Clicking any cell dot opens its detail modal.

### 🌳 Lineage View

A 4-column SVG diagram showing cross-source relationships:

| Column | Content |
|--------|---------|
| **Master Cells** | 18 abstract CSA family names (e.g., "DRG Pvalb neuron") |
| **CSA Species Variants** | 54 CSA paper cells grouped under their family |
| **Bhuiyan et al., 2025** | 22 big DRG paper cells, positioned by their CSA family connection |
| **Other Sources** | Tavares-Ferreira, Yu, Krauter, Qi, and Kupari cells connected to big DRG cells |

**Layout optimization:**
- Cells in columns 3 and 4 are ordered using barycenter heuristics to minimize line crossings — each cell is positioned at the average Y-coordinate of its connection targets.
- Cells that connect to big DRG cells in multiple family groups are duplicated into each relevant group to avoid long-distance crossing lines.
- Cross-group connections between column 4 cells are rendered as curved arcs on the right edge at lower opacity.
- Alternating row bands distinguish family groups.
- Big DRG cells with no direct CSA link (e.g., DRG C-PEP.TAC1 CHRNA3, DRG C-NP.MRGPRX1 MRGPRX4) appear in separate sub-groups at the bottom, each with its own set of related column 4 cells and vertical spacing between sub-groups.

**Line types:**
- Solid purple: asserted subtype
- Red double line: asserted equivalence (mapsTo)
- Solid blue (column 1→0): family membership

**Interactivity:** Click any cell node to open its detail modal. Hover for a tooltip showing full name and source.

---

## Data Loading

NervoSensus ships with all 145 cell types embedded directly in the HTML. It can also load external data:

- **Excel upload** (`.xlsx`): Parses structured cell type spreadsheets using the SheetJS library. Expected columns map to cell type fields (preferred label, entity, species, gene expression, etc.).
- **JSON upload**: Accepts a JSON object with `cells` and `genes` arrays matching the internal data schema.

The upload button is in the header. The data status indicator shows whether embedded or uploaded data is active.

---

## Technical Details

### Dependencies (loaded from CDN)

- **D3.js v7.8.5** — Force simulation for cluster view, SVG rendering for lineage view
- **PapaParse v5.4.1** — CSV parsing support
- **SheetJS (xlsx) v0.18.5** — Excel file parsing for data upload

### Architecture

The entire application is a single `index.html` file (~425 KB) with no build step, no server, and no external API calls. All data is embedded as JavaScript constants (`DEFAULT_CELL_TYPES`, `DEFAULT_SOURCES`, `DEFAULT_FAMILIES`). CSS and JavaScript are inline. The app runs entirely client-side in any modern browser.

### Browser compatibility

Requires a modern browser with ES6+ support (template literals, arrow functions, `const`/`let`, `Set`/`Map`). Tested in Chrome, Firefox, Safari, and Edge.

---

## Usage

Open `index.html` in a web browser. No installation or server required.
