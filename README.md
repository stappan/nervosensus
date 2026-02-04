# NervoSensus

Interactive Sensory Neuron Cell Type Explorer.

## Features

- **Card View**: Browse all 88 cell types with source-colored accent borders
- **Tree View**: Hierarchical view with toggle between Soma Location and Axon Phenotype
- **Synthesis View**: Feature matrix table with source indicators
- **Cluster View**: Force-directed visualization
  - Default view shows cells colored by literature source
  - Filter by phenotype, adaptation, axon type, species, soma location, source, and marker genes
  - **"ALL" intersection** highlighted with yellow color, larger nodes, glow effect, filled background
  - **"None" cluster** positioned in lower-right corner for easy identification
- **Related Species Variants**: Navigate between species variants (via TEMP:subClassOf)
- **Asserted Equivalence**: Click to view equivalent cell's card (via TEMP:mapsTo)

## Data Sources

- **CSA paper** (54 cells) - Blue (#667eea)
- **big DRG paper** (22 cells) - Orange (#f59e0b)  
- **Ferreira et al., 2022** (12 cells) - Green (#22c55e)

## Usage

Open `index.html` in a web browser. No server required.

## License

MIT
