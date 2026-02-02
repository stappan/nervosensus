# Sensory Neuron Cell Type Explorer

An interactive web application for exploring DRG & Trigeminal ganglion sensory neuron cell types.

## Features

- **Card View**: Browse all cell types in a card-based layout with key information
- **Tree View**: Hierarchical view organized by soma location and cell family
- **Cluster View**: Interactive force-directed visualization to explore cell types by attributes (threshold phenotype, adaptation, axon type, species, soma location)

## Data

The default dataset contains 54 cell types across 18 families, including:
- 4 species: mouse, human, macaque, guinea pig
- 2 soma locations: dorsal root ganglion (DRG), trigeminal ganglion (TG)
- Various phenotypes: heat-sensitive, cold-sensitive, proprioceptive, mechanosensitive (LTM/HTM)

## Usage

Simply open `index.html` in a web browser. No server required.

You can also upload your own NPO-formatted data using the "Load Data" button.

## Data Format

The application accepts NPO Template format (CSV or Excel) with these columns:
- `Neuron ID`
- `NPO Property`
- `Union set number`
- `nest intersection number` (for nested AND relationships)
- `Property Value Label`
- `NPO Property Value IRI`

## Live Demo

[View on GitHub Pages](https://YOUR_USERNAME.github.io/sensory-neuron-explorer/)

## License

MIT
