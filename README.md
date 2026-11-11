# NervoSensus

**An interactive visualization of somatosensory neuron cell types across species and nomenclatures**

NervoSensus is a client-side web application for exploring 179 somatosensory cell types (151 neurons + 28 non-neuronal) drawn from 7 published sources. It integrates cross-study equivalence and subtype relationships, marker gene expression, axon phenotypes, physiology, and species data into a unified interface with eight complementary views.

---

## Data

### Sources (7 publications, 179 cell types)

| Source | Cells | Color | DOI |
|--------|------:|-------|-----|
| Bhuiyan et al., 2024 | 54 | Purple | [10.1126/sciadv.adj9173](https://doi.org/10.1126/sciadv.adj9173) |
| Bhuiyan et al., 2025 | 32 (22 neurons + 10 non-neuronal) | Amber | [bioRxiv 10.1101/2025.11.05.686654](https://www.biorxiv.org/content/10.1101/2025.11.05.686654v1) |
| Yu et al., 2024 | 23 | Red | [10.1038/s41593-024-01794-1](https://doi.org/10.1038/s41593-024-01794-1) |
| Krauter et al., 2025 | 22 | Violet | [10.1038/s42003-025-08315-1](https://doi.org/10.1038/s42003-025-08315-1) |
| Boyer et al., 2026 | 19 (1 neuron + 18 non-neuronal) | Pink | [bioRxiv 10.1101/2025.09.21.677655](https://doi.org/10.1101/2025.09.21.677655) |
| Qi et al., 2024 | 17 | Cyan | [10.1016/j.cell.2024.02.006](https://doi.org/10.1016/j.cell.2024.02.006) |
| Tavares-Ferreira et al., 2022 | 12 | Green | [10.1126/scitranslmed.abj8186](https://doi.org/10.1126/scitranslmed.abj8186) |

### Non-neuronal cells

28 non-neuronal cell types (baseClass "cell" rather than "neuron"):

- **Bhuiyan et al., 2025 (10):** satellite glial cell, myelinating Schwann cell, non-myelinating Schwann cell, endothelial cell, mural cell, 3 fibroblast subtypes, adipocyte, and immune cell.
- **Boyer et al., 2026 (18):** human DRG cell types including macrophage subtypes (Mac_OLR1, Mac_MRC1, Mac_TOP2A, Mac_FLT3), Schwann cells (mySC, nmSC, nmSC_NGFR), satellite glia (SCG, SGC_DBI), fibroblasts (Endo, Epi, Peri), endothelial and mural cells, T cells, plasma/B cells, and Imoonglia.

These appear in the Tree View under a dedicated "Non-neuronal Cells" section grouped by subclass (Glial, Vascular, Stromal, Other), and are excluded from the Provisional Mapping (Lineage) View.

### Cell type families

Bhuiyan et al., 2024 defines 18 master cell type families, each with species variants across mouse, human, macaque, and guinea pig (where available). Examples include DRG Pvalb neuron (4 variants), DRG TG Trpm8 neuron (4 variants), and DRG TG Calca+Smr2 neuron (4 variants).

### Cell identifiers

Every cell type has a stable npokb CURIE identifier (e.g., `npokb:915`). All cross-cell relationships (assertedSubclassOf, mapsTo, relatedCells) are resolved by npokb ID, not by label. The one exception is `ATLAS_TO_CELL`, which maps atlas annotation strings to cell labels.

### Relationships

Cell types are linked across sources through two relationship types:

- **Asserted subtype** (`assertedSubclassOf`): A cell is declared a subtype of another (e.g., a Bhuiyan et al., 2025 cell is a subtype of a Bhuiyan et al., 2024 species variant). Rendered as a solid purple line.
- **Asserted equivalence** (`mapsTo`): A cell is declared equivalent to another across nomenclatures (e.g., a Bhuiyan et al., 2025 cell maps to a Krauter cell). Rendered as a red double line.

### Per-cell data fields

Each cell type record includes: `id` (npokb CURIE), `baseClass` ("neuron" or "cell"), preferred label, entity ID, species, biological sex, observed-at-age summary (`observedAge`: verbatim value list, numeric min/max, non-numeric entries, count), soma location(s), spinal regions and segments for DRG cells (`spinalRegions`, from UBERON segment IRIs), nerves the axon runs in (`nerves`), peripheral terminations (`sensoryTerminalLocations`), central terminations (`axonTerminalLocations`), expert reviewers (`reviewedBy`: name + ORCID), circuit role, neurotransmitter, Cre line, marker gene expression string, individual marker genes (with URIs, expression level, and determinedByMethod), axon/fiber type phenotype (with methods), physiology string (with methods), source publication DOI, source data links, alert notes, curator notes, related species variants (by ID), asserted subclass-of relationships (by ID), maps-to equivalences (by ID), and cluster visualization attributes.

---

## Views

### 📋 Card View

The default view. Displays cell types as expandable cards in a responsive grid. Each card shows the cell name, source (color-coded), entity ID, species, gene expression, and axon phenotype. Clicking a card opens a detailed modal.

**Filter bar** — Filter cards by source, species, soma location, circuit role, and text search. The filter count updates live.

**Detail modal / full page** — Compact label/value layout: "Experimental context" with a "Studied in" subheader (species, sex, observed-at-age summary with a "show all" list, soma location with every spinal region listed and its segments or "no data", then **Nerve**, **Peripheral termination**, and **Termination** when present, followed by subclass, circuit role, and Cre line) top left; proposed relationships top right; phenotype, alert notes, **Reviewed by** (expert consultants, each name linking to their ORCID in a new tab), and curator notes full width; other cells from the same source collapsed at the bottom. Shows full cell information including a base-class badge (neuron/cell), marker genes (with links to ontology URIs, expression level badges, and determinedByMethod badges), axon phenotype (with method badges), physiology (with method badges), asserted relationships (equivalences and subtypes as clickable buttons that navigate between cells by ID), source publication link, source data links, and curator/alert notes.

### 🌳 Tree View

Organizes cells hierarchically. Choose a grouping mode:

- **By location**: Groups by soma location (DRG, trigeminal), then splits each location into **Neurons** and **Non-neuronal** subgroups. Neurons are organized by cell type family; non-neuronal cells are grouped by subClassOf hierarchy.
- **By axon type**: Groups by fiber type (Aβ, Aδ, A fiber (unspecified), C fiber, Other), then families within each type. A dedicated non-neuronal section appears at the bottom.

Families are collapsible; clicking a family header expands it to show individual variants with their gene expression strings.

### 📊 Synthesis View

A tabular matrix view showing all cell types as rows against phenotypic properties as columns (sensory threshold, adaptation, axon type, species, soma location). Checkmarks indicate which properties each cell possesses.

**Features:**
- Group-by options: species × axon type (with 5 fiber categories: Aβ, Aδ, A fiber (unspecified), C fiber, Other), or species × location
- Sortable column headers
- Equivalence highlighting: toggle to highlight cells with cross-source equivalences (amber background). Click a cell row to pin it and see all its equivalence partners highlighted.

### 🔮 Cluster View

A D3 force-directed simulation that positions cell types as colored dots. A **Cell Type** dropdown chooses **Neuron** (151, the default), **Non-neuronal** (28), or **All cells** (179). With no attribute filters active, cells are colored by their source publication.

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

**Cluster table** — The **▶ Show as table** button under the plot opens an Align-style table of the current cluster groups:

- One group per combination of selected attributes, ordered from the most shared attributes ("all N shared") down to **None**. Ties are ordered by group size.
- Each group header shows the plot color, the attributes shared, the cell count, and a per-source count (e.g. "Bhuiyan 2025 (4), Yu 2024 (5)"). Click a header to collapse it; **None** starts collapsed; **Expand all / Collapse all** toggles every group.
- Columns match Align View (Cell Type, Source, Marker Genes, Aβ/Aδ/C, LTM/HTM, Temp, Proprio, RA/SA, Species) plus **Soma**. Selected genes are shown in bold within the Marker Genes list, and columns tied to the selected attributes are highlighted.
- The table follows the Cell Type dropdown and updates as selections change. With nothing selected it prompts you to pick attributes.
- **📊 Export .xlsx** downloads one sheet with the selections and date at the top, a link back to the same view, Group and Shared columns for filtering, group-colored Group cells, frozen headers, autofilter, and a **Detail page** column (last) linking each npokb ID to its cell page. Links use the address the export was made from, so exports made on localhost only work locally.

**Copy Link** saves the selected attributes, the Cell Type choice (`cellType=cell|all`), and whether the table is open (`table=1`).

### 🌳 Provisional Mapping (Lineage View)

A 4-column SVG diagram showing cross-source relationships for neuron cell types only (non-neuronal cells excluded):

| Column | Content |
|--------|---------|
| **Master Cells** | 18 abstract Bhuiyan 2024 family names (e.g., "DRG Pvalb neuron") |
| **Bhuiyan 2024 Variants** | 54 Bhuiyan et al., 2024 cells grouped under their family |
| **Bhuiyan et al., 2025** | Bhuiyan et al., 2025 neuron cells, positioned by their Bhuiyan 2024 family connection |
| **Other Sources** | Tavares-Ferreira, Yu, Krauter, and Qi cells connected to Bhuiyan 2025 cells (Boyer et al., 2026 is not yet included in this view) |

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

### 🔀 Compare View

Compares cell types across sources against a chosen anchor source. Congruence reflects only relationships the anchor paper's authors identified; nothing is inferred beyond the source literature.

### 🔗 Align View

A cross-source alignment table showing Bhuiyan et al., 2025 parent cell types with related cells from other sources expandable beneath. Each row shows checkmarks for properties reported by the source publication. **Export .xlsx** downloads a Source Review workbook (one sheet per source with a Status column for curation); **Export .docx** exports the alignment table.

### 📑 Concordance View

Rows are anchored by a selected source; columns show the local label each additional source uses for its corresponding cell type. Includes export to `.docx`.

---

## Data Pipeline

Cell type data is generated from a source XLSX spreadsheet using `sync_data.py`, which reads the NPO property rows and produces `js/data.js`. The script validates that every cell has an npokb ID, excludes "don't add" rows, classifies cells by base class (neuron vs. cell), deduplicates marker genes by base name, and captures determinedByMethod and expression level metadata. Rows are grouped by npokb ID, so later row blocks for a cell merge into it even if their Neuron ID text differs. Spinal segment rows (UBERON segment-level DRG IRIs) are kept out of `somaLocations` so the tree and cluster views are unaffected. Pass `--max-row N` to ingest only sheet rows 2–N; the row limit is recorded in `DATA_VERSION.sourceMaxRow`.

The current data comes from `forNervoSensus.xlsx` (sheet `forNervoSensus`; the script also accepts a sheet named `PNS Cells to NPO`):

```bash
python sync_data.py forNervoSensus.xlsx
```

Location and reviewer properties map to detail-page rows as follows:

| NPO property | Field | Detail page row |
|---|---|---|
| `ilxtr:hasAxonLocatedIn` | `nerves` | Nerve |
| `ilxtr:hasAxonSensorySubcellularElementIn` | `sensoryTerminalLocations` | Peripheral termination |
| `ilxtr:hasAxonTerminalIn`, `ilxtr:hasAxonPresynapticElementIn` | `axonTerminalLocations` | Termination |
| `ilxtr:expertConsultant` | `reviewedBy` (label + ORCID IRI) | Reviewed by |

NervoSensus ships with all 179 cell types embedded in `js/data.js`. It can also load external data at runtime:

- **Excel upload** (`.xlsx`): Parses structured cell type spreadsheets using the SheetJS library.
- **JSON upload**: Accepts a JSON object with `cells` and `genes` arrays matching the internal data schema.

The upload button is in the header. The data status indicator shows whether default or uploaded data is active, with a count of neuron types and non-neuronal cell types.

---

## Technical Details

### Dependencies (loaded from CDN)

- **D3.js v7.8.5** — Force simulation for cluster view, SVG rendering for lineage view
- **PapaParse v5.4.1** — CSV parsing support
- **SheetJS (xlsx) v0.18.5** — Excel file parsing for data upload
- **ExcelJS v4.4.0** — `.xlsx` exports (Source Review workbook, cluster table)
- **docx v8.5.0** — `.docx` exports (Align and Concordance views)

### Architecture

The application consists of:
- `index.html` — page structure and view containers
- `js/app.js` — all application logic (views, modals, filtering, export)
- `js/data.js` — generated data constants (`DEFAULT_CELL_TYPES`, `DEFAULT_SOURCES`, `DEFAULT_FAMILIES`, `DEFAULT_GENES`)
- `css/styles.css` — all styles
- `sync_data.py` — Python script that reads the source XLSX and generates `js/data.js`

No build step, no server, and no external API calls beyond CDN-loaded libraries. The app runs entirely client-side in any modern browser.

### Versioning

- **App version** (`APP_VERSION`): Manually maintained in `js/app.js`. Displayed in the header.
- **Data version** (`DATA_VERSION`): Auto-generated by `sync_data.py` into `js/data.js`. Includes version string, generation date, cell counts (total, neuron, non-neuronal), source count, and source filename.

Both are currently `0.1.0-beta`. The header displays them as "App v0.1.0-beta · Data v0.1.0-beta (date)".

### Browser compatibility

Requires a modern browser with ES6+ support (template literals, arrow functions, `const`/`let`, `Set`/`Map`). Tested in Chrome, Firefox, Safari, and Edge.

---

## Usage

Open `index.html` in a web browser. No installation or server required.
