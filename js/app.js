let SOURCES = JSON.parse(JSON.stringify(DEFAULT_SOURCES));

let CELL_TYPES = JSON.parse(JSON.stringify(DEFAULT_CELL_TYPES));

// Helper to check if a cell is a master cell (CSA paper with no species)
function isMasterCell(ct) {
    if (ct.sourceNomenclatureLabel !== 'CSA paper') return false;
    const label = ct.preferredLabel.toLowerCase();
    return !label.includes('mouse') && !label.includes('human') && 
           !label.includes('macaque') && !label.includes('guinea');
}

let FAMILIES = JSON.parse(JSON.stringify(DEFAULT_FAMILIES));
let GENES = JSON.parse(JSON.stringify(DEFAULT_GENES));
let currentView = 'cards';
let treeGrouping = 'location';
const AXON_LABELS = { 'type a nerve fiber': 'A fiber', 'type ab (beta) nerve fiber': 'Aβ fiber', 'type ad (delta) nerve fiber': 'Aδ fiber', 'type c nerve fiber': 'C fiber' };

let selectedAttributes = [];
let clusterSimulation = null;
let clusterNodes = [];
let synthesisPinnedIdx = null;
let clusterCenters = {};
let nodeRadius = 14;
let enclosureTimer = null;

// Species labels used instead of icons
const ATTR_LABELS = { source_0:'CSA paper', source_1:'big DRG paper', source_2:'Tavares-Ferreira et al., 2022', source_3:'Yu et al., 2024', source_4:'Krauter et al., 2025', source_5:'Qi et al., 2024', source_6:'Kupari et al., 2021',  cold_sensitive:'Cold', heat_sensitive:'Heat', mechanosensitive_ltm:'LTM', mechanosensitive_htm:'HTM', proprioceptive:'Proprioceptive', rapidly_adapting:'RA', slowly_adapting:'SA', fiber_a_beta:'Aβ', fiber_a_delta:'Aδ', fiber_c:'C', species_mouse:'Mouse', species_human:'Human', species_macaque:'Macaque', species_guinea_pig:'Guinea Pig', soma_drg:'DRG', soma_tg:'Trigeminal' };
const ATTR_SHORT = { source_0:'CSA paper', source_1:'big DRG paper', source_2:'Tavares-Ferreira 2022', source_3:'Yu 2024', source_4:'Krauter 2025', source_5:'Qi 2024', source_6:'Kupari 2021',  cold_sensitive:'Cold', heat_sensitive:'Heat', mechanosensitive_ltm:'LTM', mechanosensitive_htm:'HTM', proprioceptive:'Proprio', rapidly_adapting:'RA', slowly_adapting:'SA', fiber_a_beta:'Aβ', fiber_a_delta:'Aδ', fiber_c:'C', species_mouse:'Mouse', species_human:'Human', species_macaque:'Macaque', species_guinea_pig:'G.Pig', soma_drg:'DRG', soma_tg:'TG' };
const SOURCE_URLS = {"source_0": "https://doi.org/10.1126/sciadv.adj9173", "source_1": "https://doi.org/10.1101/2025.11.05.686654", "source_2": "https://doi.org/10.1126/scitranslmed.abj8186", "source_3": "https://doi.org/10.1038/s41593-024-01794-1", "source_4": "https://doi.org/10.1038/s42003-025-08315-1", "source_5": "https://doi.org/10.1016/j.cell.2024.02.006", "source_6": "https://doi.org/10.1038/s41467-021-21725-z"};
const PRECISION_BASE_URL = 'https://sparc.science/apps/precision-dashboard';
const PRECISION_GENES = new Set(["ADORA2B", "ADRA2A", "ADRA2C", "AGT", "ALDH1A1", "ASIC1", "ATF3", "AVPR1A", "BMPR1B", "CACNA1I", "CACNG5", "CALB1", "CALCA", "CASQ2", "CCK", "CCKAR", "CDH9", "CHRNA3", "CHRNA7", "CPNE6", "CUX2", "DCN", "EPHA3", "ETV1", "FOXP2", "GFRA1", "GFRA2", "GFRA3", "GPR68", "GRM8", "GRXCR2", "HAPLN4", "HRH1", "IL31RA", "IL3RA", "KCNS1", "KIT", "LGI2", "MRGPRD", "MRGPRX1", "MRGPRX4", "NGEF", "NPPB", "NSG2", "NTRK2", "NTRK3", "OPRD1", "OPRK1", "OPRM1", "PCDH8", "PENK", "PIEZO2", "PNOC", "PROKR2", "PTGIR", "PTPRT", "PVALB", "REEP5", "RXFP1", "S100A16", "S100A4", "SCGN", "SCN10A", "SCN11A", "SLC18A3", "SST", "SSTR2", "STUM", "SYT17", "TAC1", "TAC3", "TH", "TRPA1", "TRPM2", "TRPM8", "TRPV1"]);
// Atlas annotation → big DRG paper cell preferredLabel (from ilxtr:atlasAnnotation in PRECISIONcelltypeNPO.xlsx,
// keyed by Column A Neuron ID, filtered to ilxtr:literatureCitation = "big DRG paper" only)
const ATLAS_TO_CELL = {
    "A-LTMR.TAC3": "DRG A-LTMR.TAC3 human neuron",
    "A-PEP.CHRNA7/SLC18A3": "DRG A-PEP.CHRNA7 SLC18A3 human neuron",
    "A-PEP.KIT": "DRG A-PEP.KIT human neuron",
    "A-PEP.NTRK3/S100A16": "DRG A-PEP.NTRK3 S100A16 human neuron",
    "A-PEP.SCGN/ADRA2C": "DRG A-PEP.SCGN ADRA2C human neuron",
    "A-PEP.TAC1/CHRNA3": "DRG C-PEP.TAC1 CHRNA3 human neuron",
    "A-Propr.EPHA3": "DRG A-Propr.EPHA3 human neuron",
    "A-Propr.HAPLN4": "DRG A-Propr.HAPLN4 human neuron",
    "A-Propr.PCDH8": "DRG A-Propr.PCDH8 human neuron",
    "ATF3": "DRG ATF human neuron",
    "Ab-LTMR.ETV1": "DRG Ab-LTMR.ETV1 human neuron",
    "Ab-LTMR.LGI2": "DRG Ab-LTMR.LGI2 human neuron",
    "Ab-LTMR.NSG2": "DRG Ab-LTMR.NSG2 human neuron",
    "Ad.LTMR.CCKAR": "DRG Ab-LTMR.CCKAR human neuron",
    "C-LTMR.CDH9": "DRG C-LTMR.CDH9 human neuron",
    "C-NP.MRGPRX1/GFRA2": "DRG C-NP.MRGPRX1 GFRA2 human neuron",
    "C-NP.MRGPRX1/MRGPRX4": "DRG C-NP.MRGPRX1 MRGPRX4 human neuron",
    "C-NP.SST": "DRG C-NP.SST human neuron",
    "C-PEP.ADORA2B": "DRG C-PEP.ADORA2B human neuron",
    "C-PEP.TAC1/CACNG5": "DRG C-PEP.TAC1 CACNG5 human neuron",
    "C-Thermo.RXFP1": "DRG C-Thermo.RXFP1 human neuron",
    "C-Thermo.TRPM8": "DRG C-Thermo.TRPM8 human neuron"
};
const ATTR_COLORS = ['#667eea', '#f5576c', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatGeneExpression(t) { return t ? t.replace(/(\w+)\^(\w+)/g, '$1<sup>$2</sup>') : ''; }
function formatFiberType(s) { return s ? s.replace(/type Ad/g,'type Aδ').replace(/type Ab/g,'type Aβ').replace(/Ad \(/g,'Aδ (').replace(/Ab \(/g,'Aβ (').replace(/\(delta\)/g,'(δ)').replace(/\(beta\)/g,'(β)') : ''; }
function getSourceLinkText(ct) { return ct.sourceNomenclatureLabel || 'View Source Publication'; }
function linkifyUrls(text) {
    if (!text) return '';
    return text.replace(/(https?:\/\/[^\s<)"',]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">$1</a>');
}
// Species displayed as text labels
function showUploadModal() { document.getElementById('uploadModal').classList.add('show'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.remove('show'); }
function handleFileSelect(e) { 
    const file = e.target.files[0]; 
    if (!file) return;
    
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (ext === 'csv') {
        // Parse CSV with PapaParse
        Papa.parse(file, {
            header: true,
            complete: function(results) {
                try {
                    const parsed = parseNPOData(results.data);
                    if (parsed.cells.length > 0) {
                        CELL_TYPES = parsed.cells;
                        GENES = parsed.genes;
                        if (parsed.families && parsed.families.length > 0) FAMILIES = parsed.families;
                        document.getElementById('dataStatus').textContent = `Loaded: ${CELL_TYPES.length} cells`;
                        document.getElementById('dataStatus').classList.add('loaded');
                        closeUploadModal();
                        renderCards();
                        if (currentView === 'tree') renderTreeView();
                        if (currentView === 'synthesis') renderSynthesisView();
                        if (currentView === 'cluster') initClusterView();
                    } else {
                        alert('No valid cell data found in file');
                    }
                } catch (err) {
                    alert('Error parsing CSV: ' + err.message);
                }
            },
            error: function(err) {
                alert('Error reading CSV: ' + err.message);
            }
        });
    } else if (ext === 'xlsx' || ext === 'xls') {
        // Parse Excel with SheetJS
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                const parsed = parseNPOData(jsonData);
                if (parsed.cells.length > 0) {
                    CELL_TYPES = parsed.cells;
                    GENES = parsed.genes;
                    if (parsed.families && parsed.families.length > 0) FAMILIES = parsed.families;
                    document.getElementById('dataStatus').textContent = `Loaded: ${CELL_TYPES.length} cells`;
                    document.getElementById('dataStatus').classList.add('loaded');
                    closeUploadModal();
                    renderCards();
                    if (currentView === 'tree') renderTreeView();
                    if (currentView === 'synthesis') renderSynthesisView();
                    if (currentView === 'cluster') initClusterView();
                } else {
                    alert('No valid cell data found in file');
                }
            } catch (err) {
                alert('Error parsing Excel: ' + err.message);
            }
        };
        reader.onerror = function() {
            alert('Error reading file');
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
    }
}

function parseNPOData(rows) {
    // Parse NPO format data
    const neurons = {};
    const SOURCE_COLORS = ['#667eea', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    const sources = {};
    
    // First pass: collect all data by neuron
    rows.forEach(row => {
        const neuronId = row['Neuron ID'];
        const npoProp = row['NPO Property'];
        const valueLabel = row['Property Value Label'];
        const valueIri = row['NPO Property Value IRI'];
        const unionNum = row['Union set number'];
        const nestNum = row['Nest intersection number'];
        
        if (!neuronId) return;
        
        if (!neurons[neuronId]) neurons[neuronId] = [];
        neurons[neuronId].push({
            npo: (npoProp || '').trim(),
            union: unionNum,
            nest: nestNum,
            value: (valueLabel && valueLabel.toLowerCase() !== 'none') ? valueLabel.trim() : '',
            iri: (valueIri && valueIri.toLowerCase() !== 'none') ? valueIri.trim() : ''
        });
    });
    
    // Build master rdfsLabel → prefLabel mapping
    const masterRdfsToPref = {};
    const masterPrefLabels = {};
    Object.entries(neurons).forEach(([nid, props]) => {
        if (!nid.toLowerCase().includes('master')) return;
        let rdfs = '', pref = '';
        props.forEach(p => {
            if (p.npo === 'rdfs:label') rdfs = p.value;
            if (p.npo === 'skos:prefLabel') pref = p.value;
        });
        if (rdfs && pref) masterRdfsToPref[rdfs] = pref;
        if (pref) masterPrefLabels[nid] = pref;
    });

    // Build subClassOf map (normalizing to prefLabel, preferring master-linked entries)
    const subclassMap = {};
    Object.entries(neurons).forEach(([nid, props]) => {
        if (nid.toLowerCase().includes('master')) return;
        const candidates = [];
        props.forEach(p => {
            if (p.npo === 'TEMP:subClassOf' && p.value) {
                const raw = p.value;
                const normalized = masterRdfsToPref[raw] || raw;
                const isMaster = masterRdfsToPref.hasOwnProperty(raw);
                candidates.push({ normalized, isMaster });
            }
        });
        if (candidates.length > 0) {
            const masterLinked = candidates.find(c => c.isMaster);
            subclassMap[nid] = masterLinked ? masterLinked.normalized : candidates[0].normalized;
        }
    });
    
    // Collect sources
    Object.entries(neurons).forEach(([nid, props]) => {
        if (nid.toLowerCase().includes('master')) return;
        props.forEach(p => {
            if (p.npo === 'ilxtr:literatureCitation' && p.iri) {
                if (!sources[p.iri]) sources[p.iri] = { label: p.value || p.iri, cells: [] };
                sources[p.iri].cells.push(nid);
            }
        });
    });
    
    const sourceColorMap = {};
    Object.entries(sources).forEach(([url, data], i) => {
        sourceColorMap[url] = {
            color: SOURCE_COLORS[i % SOURCE_COLORS.length],
            label: data.label,
            count: data.cells.length
        };
    });
    
    // Process cells
    const cellTypes = [];
    const geneMap = {};
    
    Object.entries(neurons).forEach(([nid, props]) => {
        if (nid.toLowerCase().includes('master')) return;
        
        let sourceUrl = '', sourceLabel = '';
        props.forEach(p => {
            if (p.npo === 'ilxtr:literatureCitation' && p.iri) {
                sourceUrl = p.iri;
                sourceLabel = p.value || p.iri;
            }
        });
        
        const sourceColor = sourceColorMap[sourceUrl]?.color || '#667eea';
        
        const ct = {
            entity: '', preferredLabel: '', species: 'unknown',
            circuitRole: 'sensory', neurotransmitter: '',
            somaLocation: '', somaLocations: [],
            sensoryTerminalLocations: [], axonTerminalLocations: [],
            sourceNomenclature: sourceUrl, sourceNomenclatureLabel: sourceLabel,
            sourceColor: sourceColor,
            markerGenes: [], geneExpressionString: '',
            fiberTypeString: '', fiberTypeStringAbbrev: '',
            physiologyString: '', physiologyStringAbbrev: '',
            creLine: '', color: sourceColor,
            masterLabel: subclassMap[nid] || '',
            relatedCells: [], mapsTo: [], assertedSubclassOf: [], geneBaseNames: [],
            alertNotes: [], curatorNotes: [], sourceData: [],
            clusterAttributes: {
                cold_sensitive: false, heat_sensitive: false,
                mechanosensitive_ltm: false, mechanosensitive_htm: false,
                proprioceptive: false, rapidly_adapting: false, slowly_adapting: false,
                fiber_a_beta: false, fiber_a_delta: false, fiber_c: false,
                species_mouse: false, species_human: false, species_macaque: false, species_guinea_pig: false,
                soma_drg: false, soma_tg: false
            }
        };
        
        const geneItems = [], thresholdItems = [], adaptationItems = [], functionalItems = [], axonItems = [];
        
        props.forEach(p => {
            const npo = p.npo, val = p.value, iri = p.iri;
            
            if (npo === 'rdfs:label') ct.entity = val;
            else if (npo === 'skos:prefLabel') ct.preferredLabel = val;
            else if (npo === 'ilxtr:hasInstanceInTaxon') {
                ct.species = val.toLowerCase();
                const spKey = 'species_' + val.toLowerCase().replace(/ /g, '_');
                if (ct.clusterAttributes.hasOwnProperty(spKey)) ct.clusterAttributes[spKey] = true;
            }
            else if (npo === 'ilxtr:hasCircuitRolePhenotype') ct.circuitRole = val;
            else if (npo === 'ilxtr:hasNeurotransmitterPhenotype') ct.neurotransmitter = val.trim();
            else if (npo === 'ilxtr:hasSomaLocatedIn' && val) {
                if (!ct.somaLocations.includes(val)) ct.somaLocations.push(val);
                if (val.toLowerCase().includes('dorsal root')) ct.clusterAttributes.soma_drg = true;
                if (val.toLowerCase().includes('trigeminal')) ct.clusterAttributes.soma_tg = true;
            }
            else if (npo === 'ilxtr:hasAxonSensoryTerminalLocatedIn' && val) {
                if (!ct.sensoryTerminalLocations.includes(val)) ct.sensoryTerminalLocations.push(val);
            }
            else if (npo === 'ilxtr:hasAxonTerminalLocatedIn' && val) {
                if (!ct.axonTerminalLocations.includes(val)) ct.axonTerminalLocations.push(val);
            }
            else if (npo === 'ilxtr:hasDriverExpressionConstitutivePhenotype') ct.creLine = val;
            else if (npo === 'TEMP:mapsTo' || npo === 'ilxtr:mapsTo') {
                ct.mapsTo.push({ label: val, iri: iri });
            }
            else if ((npo === 'ilxtr:hasExpressionPhenotype' || npo === 'ilxtr:hasNucleicAcidExpressionPhenotype') && val) {
                const parts = val.split(' ');
                const nm = parts[0], exp = parts[1] || '';
                geneItems.push({ union: p.union, nest: p.nest, display: exp ? nm + '^' + exp : nm });
                ct.markerGenes.push({ name: nm, uri: iri || '', expression: exp });
                const base = nm.toLowerCase();
                if (!ct.geneBaseNames.includes(base)) ct.geneBaseNames.push(base);
                if (!geneMap[base]) geneMap[base] = { display: nm, cells: [] };
                geneMap[base].cells.push(ct.preferredLabel);
            }
            else if (npo === 'ilxtr:hasAxonPhenotype' && val) {
                axonItems.push({ union: p.union, nest: p.nest, display: val });
                const vl = val.toLowerCase();
                if (vl.includes('beta') || vl.includes('(beta)')) ct.clusterAttributes.fiber_a_beta = true;
                if (vl.includes('delta') || vl.includes('(delta)')) ct.clusterAttributes.fiber_a_delta = true;
                if (vl.includes('type c')) ct.clusterAttributes.fiber_c = true;
            }
            else if ((npo === 'ilxtr:hasThresholdPhenotype' || npo === 'ilxtr:hasPredictedThresholdPhenotype') && val) {
                thresholdItems.push({ union: p.union, nest: p.nest, display: val });
                const vl = val.toLowerCase();
                if (vl.includes('ltm') || vl.includes('low-threshold')) ct.clusterAttributes.mechanosensitive_ltm = true;
                if (vl.includes('htm') || vl.includes('high-threshold')) ct.clusterAttributes.mechanosensitive_htm = true;
            }
            else if (npo === 'ilxtr:hasAdaptationPhenotype' && val) {
                adaptationItems.push({ union: p.union, nest: p.nest, display: val });
                const vl = val.toLowerCase();
                if (vl.includes('rapidly') || vl.includes('(ra)')) ct.clusterAttributes.rapidly_adapting = true;
                if (vl.includes('slowly') || vl.includes('sa1')) ct.clusterAttributes.slowly_adapting = true;
            }
            else if (npo === 'ilxtr:hasFunctionalPhenotype' && val) {
                functionalItems.push({ union: p.union, nest: p.nest, display: val });
                const vl = val.toLowerCase();
                if (vl.includes('cold')) ct.clusterAttributes.cold_sensitive = true;
                if (vl.includes('heat')) ct.clusterAttributes.heat_sensitive = true;
                if (vl.includes('proprioceptive')) ct.clusterAttributes.proprioceptive = true;
            }
            else if (npo === 'alertNote' && val) {
                ct.alertNotes.push(val);
            }
            else if (npo === 'curatorNote' && val) {
                ct.curatorNotes.push(val);
            }
            else if (npo === 'ilxtr:dataCitation' && (val || iri)) {
                ct.sourceData.push({ label: val || iri, uri: iri || '' });
            }
            else if (npo === 'TEMP:assertedSubClassOf') {
                ct.assertedSubclassOf.push({ label: val, iri: iri });
            }
        });
        
        // Build strings
        ct.geneExpressionString = geneItems.map(g => g.display).join(' + ');
        ct.fiberTypeString = axonItems.map(a => a.display).join(' + ');
        ct.fiberTypeStringAbbrev = ct.fiberTypeString;
        
        const allPhys = [...thresholdItems, ...adaptationItems, ...functionalItems];
        ct.physiologyString = allPhys.map(p => p.display).join(' + ');
        ct.physiologyStringAbbrev = ct.physiologyString;
        
        if (ct.somaLocations.length) ct.somaLocation = ct.somaLocations[0];
        
        if (ct.preferredLabel) cellTypes.push(ct);
    });
    
    // Build related cells
    const masterToChildren = {};
    cellTypes.forEach(ct => {
        if (ct.masterLabel) {
            if (!masterToChildren[ct.masterLabel]) masterToChildren[ct.masterLabel] = [];
            masterToChildren[ct.masterLabel].push({ label: ct.preferredLabel, species: ct.species });
        }
    });
    
    cellTypes.forEach(ct => {
        if (ct.masterLabel && masterToChildren[ct.masterLabel]) {
            ct.relatedCells = masterToChildren[ct.masterLabel]
                .filter(sib => sib.label !== ct.preferredLabel)
                .map(sib => ({ label: sib.label, species: sib.species }));
        }
    });
    
    // Build genes list
    const genes = Object.entries(geneMap).map(([base, data]) => ({
        id: 'gene_' + base,
        base: base,
        display: data.display,
        cells: [...new Set(data.cells)]
    }));

    // Build families from master cells
    const families = [];
    Object.entries(neurons).forEach(([nid, props]) => {
        if (!nid.toLowerCase().includes('master')) return;
        let prefLabel = '';
        props.forEach(p => { if (p.npo === 'skos:prefLabel') prefLabel = p.value; });
        if (!prefLabel) return;
        const children = (masterToChildren[prefLabel] || []).map(c => c.label);
        families.push({ id: String(families.length + 1), name: prefLabel, children });
    });

    return { cells: cellTypes, genes: genes, families: families };
}

function toggleAttrGroup(group) {
    const content = document.getElementById(`attr-group-${group}`);
    const toggle = document.getElementById(`toggle-${group}`);
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        toggle.textContent = '▼';
    } else {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        toggle.textContent = '▶';
    }
}

function initGeneButtons() {
    const container = document.getElementById('attr-group-genes');
    container.innerHTML = GENES.map(g => 
        `<button class="attr-btn" data-attr="gene_${g.base}" data-gene="${g.base}">${g.display}</button>`
    ).join('');
    container.querySelectorAll('.attr-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAttrClick(btn));
    });
}

function loadDefaultData() { CELL_TYPES=JSON.parse(JSON.stringify(DEFAULT_CELL_TYPES)); FAMILIES=JSON.parse(JSON.stringify(DEFAULT_FAMILIES)); GENES=JSON.parse(JSON.stringify(DEFAULT_GENES)); closeUploadModal(); selectedAttributes=[]; renderCards(); }
function switchView(view) { currentView=view; document.querySelectorAll('.view-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view)); document.getElementById('cardViewContainer').style.display=view==='cards'?'block':'none'; document.getElementById('treeViewContainer').style.display=view==='tree'?'block':'none'; document.getElementById('synthesisViewContainer').style.display=view==='synthesis'?'block':'none'; document.getElementById('clusterViewContainer').style.display=view==='cluster'?'block':'none'; document.getElementById('lineageViewContainer').style.display=view==='lineage'?'block':'none'; document.getElementById('compareViewContainer').style.display=view==='compare'?'block':'none'; if(view==='tree')renderTreeView(); if(view==='synthesis')renderSynthesisView(); if(view==='cluster')initClusterView(); if(view==='lineage')renderLineageView(); if(view==='compare')renderCompareView(); }


function setTreeGrouping(grouping) {
    treeGrouping = grouping;
    document.querySelectorAll('.tree-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.group === grouping);
    });
    renderTreeView();
}

function renderCards() { 
    populateFilterDropdowns();
    applyCardFilters();
}

function populateFilterDropdowns() {
    // Populate source dropdown
    const sourceSelect = document.getElementById('filterSource');
    const uniqueSources = [...new Set(CELL_TYPES.map(ct => ct.sourceNomenclatureLabel).filter(Boolean))];
    sourceSelect.innerHTML = '<option value="">All Sources</option>' + 
        uniqueSources.map(s => `<option value="${s}">${s}</option>`).join('');
    
    // Populate gene dropdown
    const geneSelect = document.getElementById('filterGene');
    geneSelect.innerHTML = '<option value="">All Genes</option>' + 
        GENES.map(g => `<option value="${g.base}">${g.display}</option>`).join('');
}

function applyCardFilters() {
    const sourceFilter = document.getElementById('filterSource').value;
    const speciesFilter = document.getElementById('filterSpecies').value;
    const axonFilter = document.getElementById('filterAxon').value;
    const locationFilter = document.getElementById('filterLocation').value;
    const geneFilter = document.getElementById('filterGene').value;
    const equivFilter = document.getElementById('filterEquiv').value;
    
    const filtered = CELL_TYPES.filter((ct, idx) => {
        if (sourceFilter && ct.sourceNomenclatureLabel !== sourceFilter) return false;
        if (speciesFilter && ct.species.toLowerCase() !== speciesFilter.toLowerCase()) return false;
        if (axonFilter && !ct.clusterAttributes[axonFilter]) return false;
        if (locationFilter && !ct.clusterAttributes[locationFilter]) return false;
        if (geneFilter && (!ct.geneBaseNames || !ct.geneBaseNames.includes(geneFilter))) return false;
        if (equivFilter === 'yes' && (!ct.mapsTo || ct.mapsTo.length === 0)) return false;
        if (equivFilter === 'no' && ct.mapsTo && ct.mapsTo.length > 0) return false;
        return true;
    });
    
    document.getElementById('cardCount').textContent = filtered.length + ' cells';
    
    const c = document.getElementById('cardsContainer');
    c.innerHTML = filtered.map((ct) => {
        const idx = CELL_TYPES.indexOf(ct);
        const axonBadge = (() => {
            if (ct.clusterAttributes.fiber_a_beta) return '<span class="card-badge axon">Aβ</span>';
            if (ct.clusterAttributes.fiber_a_delta) return '<span class="card-badge axon">Aδ</span>';
            if (ct.clusterAttributes.fiber_c) return '<span class="card-badge axon">C</span>';
            return '';
        })();
        const cardRels = getAssertedRelationships(idx);
        const hasAnyRel = cardRels.equivalences.length > 0 || cardRels.subtypeOf.length > 0 || cardRels.hasSubtypes.length > 0;
        const equivBadge = hasAnyRel ? '<span class="card-badge equiv" title="Has asserted relationships">≡</span>' : '';
        const subtypeBadge = '';
        
        return `<div class="card-compact" style="border-left-color:${ct.sourceColor||'#667eea'}" data-idx="${idx}">
            <div class="card-compact-header" onclick="toggleCardExpand(${idx})">
                <div class="card-source-dot" style="background:${ct.sourceColor||'#667eea'}" title="${ct.sourceNomenclatureLabel||''}"></div>
                <div class="card-compact-info">
                    <div class="card-compact-name">${ct.preferredLabel}</div>
                    <div class="card-compact-meta">${ct.species} • ${(ct.somaLocations||[]).join(', ') || 'Unknown location'}</div>
                </div>
                <div class="card-compact-badges">${axonBadge}${equivBadge}${subtypeBadge}</div>
                <button class="card-expand-btn" id="expand-btn-${idx}">▼</button>
            </div>
            <div class="card-compact-detail" id="card-detail-${idx}">
                <div class="card-compact-detail-inner">
                    ${ct.geneExpressionString ? `<div class="card-section"><div class="section-title">🧬 Marker Genes</div><div class="gene-display">${formatGeneExpression(ct.geneExpressionString)}</div></div>` : ''}
                    ${ct.fiberTypeString ? `<div class="card-section"><div class="section-title">🔬 Axon Phenotype</div><div class="gene-display">${formatFiberType(formatGeneExpression(ct.fiberTypeString))}</div></div>` : ''}
                    ${ct.physiologyString ? `<div class="card-section"><div class="section-title">⚡ Physiology</div><div class="gene-display">${formatGeneExpression(ct.physiologyString)}</div></div>` : ''}
                    ${ct.relatedCells && ct.relatedCells.length > 0 ? `<div class="card-section"><div class="section-title">🔗 Related Variants</div><div class="related-cells">${ct.relatedCells.map(rc => `<button class="related-cell-btn" onclick="event.stopPropagation();showModalByName('${rc.label.replace(/'/g, "\\'")}')">${rc.label}</button>`).join('')}</div></div>` : ''}
                    ${(() => {
                        const rels = getAssertedRelationships(idx);
                        if (rels.equivalences.length === 0 && rels.subtypeOf.length === 0 && rels.hasSubtypes.length === 0) return '';
                        let html = '<div class="asserted-relationships"><div class="asserted-relationships-title">🔗 Asserted Relationships</div>';
                        if (rels.equivalences.length > 0) {
                            html += '<div class="asserted-equiv-section"><div class="asserted-label">Equivalent to:</div><div class="related-cells">' + 
                                rels.equivalences.map(r => `<button class="related-cell-btn equiv-btn" onclick="event.stopPropagation();showModal(${r.idx})">${r.direction === 'to' ? '→' : '←'} ${r.label}</button>`).join('') + '</div></div>';
                        }
                        if (rels.subtypeOf.length > 0) {
                            html += '<div class="asserted-subtype-section"><div class="asserted-label">Subtype of:</div><div class="related-cells">' + 
                                rels.subtypeOf.map(r => `<button class="related-cell-btn subtype-btn" onclick="event.stopPropagation();showModal(${r.idx})">↑ ${r.label}</button>`).join('') + '</div></div>';
                        }
                        if (rels.hasSubtypes.length > 0) {
                            html += '<div class="asserted-subtype-section"><div class="asserted-label">Has subtypes:</div><div class="related-cells">' + 
                                rels.hasSubtypes.map(r => `<button class="related-cell-btn subtype-btn" onclick="event.stopPropagation();showModal(${r.idx})">↓ ${r.label}</button>`).join('') + '</div></div>';
                        }
                        return html + '</div>';
                    })()}
                    <button style="margin-top:1rem;padding:0.5rem 1rem;background:#667eea;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;" onclick="event.stopPropagation();showModal(${idx})">View Full Details</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleCardExpand(idx) {
    const detail = document.getElementById('card-detail-' + idx);
    const btn = document.getElementById('expand-btn-' + idx);
    if (detail.classList.contains('expanded')) {
        detail.classList.remove('expanded');
        btn.classList.remove('expanded');
    } else {
        detail.classList.add('expanded');
        btn.classList.add('expanded');
    }
}

function clearCardFilters() {
    document.getElementById('filterSource').value = '';
    document.getElementById('filterSpecies').value = '';
    document.getElementById('filterAxon').value = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('filterGene').value = '';
    document.getElementById('filterEquiv').value = '';
    applyCardFilters();
}

function renderTreeView() {
    const c = document.getElementById('treeView');
    let html = '';
    let gi = 0;
    
    const locationIcons = {'dorsal root ganglion': '🔵', 'trigeminal ganglion': '🟢'};
    const axonIcons = {'a fiber': '🔷', 'aβ fiber': '🔵', 'aδ fiber': '🟢', 'c fiber': '🔴', 'unknown': '❓'};
    
    function buildFamilies(cells) {
        const fm = {};
        cells.forEach(ct => {
            let fn = ct.preferredLabel;
            ['mouse','human','macaque','guinea pig','rat'].forEach(sp => {
                fn = fn.replace(new RegExp(' ' + sp + ' neuron$', 'i'), '').replace(new RegExp(' ' + sp + '$', 'i'), '');
            });
            fn = fn.trim();
            const fk = fn.toLowerCase();
            if (!fm[fk]) fm[fk] = {name: fn, children: []};
            fm[fk].children.push(ct.preferredLabel);
        });
        return Object.values(fm);
    }
    
    function renderFamilies(fams, parentGi) {
        let famHtml = '';
        fams.forEach((fam, fi) => {
            const uid = parentGi + '-' + fi;
            famHtml += '<div class="tree-item"><div class="tree-master" onclick="toggleFamily(\'' + uid + '\')"><span class="tree-toggle" id="toggle-' + uid + '">▶</span><div style="display:inline-block;vertical-align:top;"><div class="tree-master-name">' + formatGeneExpression(fam.name) + '</div><div class="tree-master-count">' + fam.children.length + ' variants</div></div></div><div class="tree-children" id="children-' + uid + '">';
            fam.children.forEach(ch => {
                const ct = CELL_TYPES.find(x => x.preferredLabel === ch);
                const safeLabel = ch.replace(/'/g, "\\'");
                famHtml += '<div class="tree-child" onclick="showModalByName(\'' + safeLabel + '\')"><div class="tree-child-name">' + ch + '</div>' + (ct ? '<div class="tree-child-species">🧬 ' + (ct.geneExpressionString ? formatGeneExpression(ct.geneExpressionString) : 'No marker genes') + '</div>' : '') + '</div>';
            });
            famHtml += '</div></div>';
        });
        return famHtml;
    }
    
    if (treeGrouping === 'location') {
        let groups = {};
        CELL_TYPES.forEach(ct => {
            (ct.somaLocations || [ct.somaLocation || 'Unknown']).forEach(loc => {
                if (!groups[loc]) groups[loc] = [];
                if (!groups[loc].find(x => x.preferredLabel === ct.preferredLabel)) groups[loc].push(ct);
            });
        });
        
        Object.entries(groups).forEach(([groupName, cells]) => {
            const fams = buildFamilies(cells);
            const icon = locationIcons[groupName.toLowerCase()] || '📍';
            html += '<div class="tree-soma-group"><div class="tree-soma-header" onclick="toggleSomaGroup(' + gi + ')"><span class="tree-soma-toggle" id="soma-toggle-' + gi + '">▶</span><span class="tree-soma-icon">' + icon + '</span><span class="tree-soma-name">' + groupName + '</span><span class="tree-soma-count">' + fams.length + ' families • ' + cells.length + ' cells</span></div><div class="tree-soma-children" id="soma-children-' + gi + '">';
            html += renderFamilies(fams, gi);
            html += '</div></div>';
            gi++;
        });
    } else {
        // Hierarchical axon grouping: A fiber (with Aβ, Aδ children), C fiber, Unknown
        const aFiberCells = { beta: [], delta: [], other: [] };
        const cFiberCells = [];
        const unknownCells = [];
        
        CELL_TYPES.forEach(ct => {
            const fts = (ct.fiberTypeString || '').toLowerCase();
            const attrs = ct.clusterAttributes || {};
            
            if (attrs.fiber_a_beta) {
                if (!aFiberCells.beta.find(x => x.preferredLabel === ct.preferredLabel)) aFiberCells.beta.push(ct);
            } else if (attrs.fiber_a_delta) {
                if (!aFiberCells.delta.find(x => x.preferredLabel === ct.preferredLabel)) aFiberCells.delta.push(ct);
            } else if (fts.includes('type a') && !fts.includes('beta') && !fts.includes('delta')) {
                if (!aFiberCells.other.find(x => x.preferredLabel === ct.preferredLabel)) aFiberCells.other.push(ct);
            } else if (attrs.fiber_c || fts.includes('type c')) {
                if (!cFiberCells.find(x => x.preferredLabel === ct.preferredLabel)) cFiberCells.push(ct);
            } else {
                if (!unknownCells.find(x => x.preferredLabel === ct.preferredLabel)) unknownCells.push(ct);
            }
        });
        
        const totalACells = aFiberCells.beta.length + aFiberCells.delta.length + aFiberCells.other.length;
        
        // A fiber group (parent)
        if (totalACells > 0) {
            html += '<div class="tree-soma-group"><div class="tree-soma-header axon" onclick="toggleSomaGroup(' + gi + ')"><span class="tree-soma-toggle" id="soma-toggle-' + gi + '">▶</span><span class="tree-soma-icon">🔷</span><span class="tree-soma-name">A fiber</span><span class="tree-soma-count">' + totalACells + ' cells</span></div><div class="tree-soma-children" id="soma-children-' + gi + '">';
            
            // Aβ fiber subgroup
            if (aFiberCells.beta.length > 0) {
                const betaFams = buildFamilies(aFiberCells.beta);
                html += '<div class="tree-subgroup"><div class="tree-subgroup-header" onclick="toggleSubgroup(\'sub-' + gi + '-beta\')"><span class="tree-soma-toggle" id="sub-toggle-' + gi + '-beta">▶</span><span class="tree-soma-icon">🔵</span><span class="tree-soma-name">Aβ fiber</span><span class="tree-soma-count">' + betaFams.length + ' families • ' + aFiberCells.beta.length + ' cells</span></div><div class="tree-subgroup-children" id="sub-children-' + gi + '-beta">';
                html += renderFamilies(betaFams, gi + 'b');
                html += '</div></div>';
            }
            
            // Aδ fiber subgroup
            if (aFiberCells.delta.length > 0) {
                const deltaFams = buildFamilies(aFiberCells.delta);
                html += '<div class="tree-subgroup"><div class="tree-subgroup-header" onclick="toggleSubgroup(\'sub-' + gi + '-delta\')"><span class="tree-soma-toggle" id="sub-toggle-' + gi + '-delta">▶</span><span class="tree-soma-icon">🟢</span><span class="tree-soma-name">Aδ fiber</span><span class="tree-soma-count">' + deltaFams.length + ' families • ' + aFiberCells.delta.length + ' cells</span></div><div class="tree-subgroup-children" id="sub-children-' + gi + '-delta">';
                html += renderFamilies(deltaFams, gi + 'd');
                html += '</div></div>';
            }
            
            // Other A fibers (not beta or delta)
            if (aFiberCells.other.length > 0) {
                const otherFams = buildFamilies(aFiberCells.other);
                html += '<div class="tree-subgroup"><div class="tree-subgroup-header" onclick="toggleSubgroup(\'sub-' + gi + '-other\')"><span class="tree-soma-toggle" id="sub-toggle-' + gi + '-other">▶</span><span class="tree-soma-icon">🔷</span><span class="tree-soma-name">A fiber (unspecified)</span><span class="tree-soma-count">' + otherFams.length + ' families • ' + aFiberCells.other.length + ' cells</span></div><div class="tree-subgroup-children" id="sub-children-' + gi + '-other">';
                html += renderFamilies(otherFams, gi + 'o');
                html += '</div></div>';
            }
            
            html += '</div></div>';
            gi++;
        }
        
        // C fiber group
        if (cFiberCells.length > 0) {
            const cFams = buildFamilies(cFiberCells);
            html += '<div class="tree-soma-group"><div class="tree-soma-header axon" onclick="toggleSomaGroup(' + gi + ')"><span class="tree-soma-toggle" id="soma-toggle-' + gi + '">▶</span><span class="tree-soma-icon">🔴</span><span class="tree-soma-name">C fiber</span><span class="tree-soma-count">' + cFams.length + ' families • ' + cFiberCells.length + ' cells</span></div><div class="tree-soma-children" id="soma-children-' + gi + '">';
            html += renderFamilies(cFams, gi);
            html += '</div></div>';
            gi++;
        }
        
        // Unknown group
        if (unknownCells.length > 0) {
            const uFams = buildFamilies(unknownCells);
            html += '<div class="tree-soma-group"><div class="tree-soma-header axon" onclick="toggleSomaGroup(' + gi + ')"><span class="tree-soma-toggle" id="soma-toggle-' + gi + '">▶</span><span class="tree-soma-icon">❓</span><span class="tree-soma-name">Unknown</span><span class="tree-soma-count">' + uFams.length + ' families • ' + unknownCells.length + ' cells</span></div><div class="tree-soma-children" id="soma-children-' + gi + '">';
            html += renderFamilies(uFams, gi);
            html += '</div></div>';
            gi++;
        }
    }
    
    c.innerHTML = html;
}
function toggleSomaGroup(i){document.getElementById(`soma-children-${i}`).classList.toggle('expanded');document.getElementById(`soma-toggle-${i}`).classList.toggle('expanded');}
function toggleFamily(id){document.getElementById(`children-${id}`).classList.toggle('expanded');document.getElementById(`toggle-${id}`).classList.toggle('expanded');}
function toggleSubgroup(id){document.getElementById(`sub-children-${id.replace('sub-','')}`).classList.toggle('expanded');document.getElementById(`sub-toggle-${id.replace('sub-','')}`).classList.toggle('expanded');}


function renderSynthesisView() {
    const table = document.getElementById('synthesisTable');
    const groupBy = document.getElementById('synthesisGroupBy')?.value || 'species-axon';
    const sortBy = document.getElementById('synthesisSortBy')?.value || 'species';
    const highlightEquiv = document.getElementById('synthesisHighlightEquiv')?.checked === true;
    const highlightSubtype = document.getElementById('synthesisHighlightSubtype')?.checked === true;
    
    // Show/hide hint and clear pin if no highlights enabled
    const hint = document.getElementById('synthesisPinHint');
    if (hint) hint.style.display = (highlightEquiv || highlightSubtype) ? 'inline' : 'none';
    if (!highlightEquiv && !highlightSubtype) synthesisPinnedIdx = null;
    
    // Build equivalence map for highlighting
    const equivMap = {};
    CELL_TYPES.filter(ct => !isMasterCell(ct)).forEach((ct, idx) => {
        if (ct.mapsTo && ct.mapsTo.length > 0) {
            ct.mapsTo.forEach(m => {
                const targetIdx = CELL_TYPES.findIndex(c => c.entity === m.label);
                if (targetIdx !== -1) {
                    equivMap[idx] = targetIdx;
                    equivMap[targetIdx] = idx;
                }
            });
        }
    });
    
    const columns = [
        { key: 'view', label: '', type: 'view' },
        { key: 'name', label: 'Cell Type', type: 'name' },
        { key: 'source', label: 'Src', type: 'source' },
        { key: 'species', label: 'Species', type: 'text' },
        { key: 'soma_drg', label: 'DRG', type: 'bool' },
        { key: 'soma_tg', label: 'TG', type: 'bool' },
        { key: 'fiber_a_beta', label: 'Aβ', type: 'bool' },
        { key: 'fiber_a_delta', label: 'Aδ', type: 'bool' },
        { key: 'fiber_c', label: 'C', type: 'bool' },
        { key: 'mechanosensitive_ltm', label: 'LTM', type: 'bool' },
        { key: 'mechanosensitive_htm', label: 'HTM', type: 'bool' },
        { key: 'cold_sensitive', label: 'Cold', type: 'bool' },
        { key: 'heat_sensitive', label: 'Heat', type: 'bool' },
        { key: 'proprioceptive', label: 'Proprio', type: 'bool' },
        { key: 'rapidly_adapting', label: 'RA', type: 'bool' },
        { key: 'slowly_adapting', label: 'SA', type: 'bool' },
    ];
    
    // Sort cells
    let sortedCells = [...CELL_TYPES].map((ct, idx) => ({...ct, origIdx: idx}));
    sortedCells.sort((a, b) => {
        if (sortBy === 'name') return a.preferredLabel.localeCompare(b.preferredLabel);
        if (sortBy === 'species') return a.species.localeCompare(b.species);
        if (sortBy === 'source') return (a.sourceNomenclatureLabel || '').localeCompare(b.sourceNomenclatureLabel || '');
        return 0;
    });
    
    // If a row is pinned, insert related cells right after the pinned cell (keep pinned in place)
    let isPinnedMode = false;
    let relatedIdxs = new Set();
    if (synthesisPinnedIdx !== null && (highlightEquiv || document.getElementById('synthesisHighlightSubtype')?.checked === true)) {
        const rels = typeof getAssertedRelationships === 'function' ? getAssertedRelationships(synthesisPinnedIdx) : {equivalences:[], subtypeOf:[], hasSubtypes:[]};
        rels.equivalences.forEach(r => relatedIdxs.add(r.idx));
        rels.subtypeOf.forEach(r => relatedIdxs.add(r.idx));
        rels.hasSubtypes.forEach(r => relatedIdxs.add(r.idx));
        
        if (relatedIdxs.size > 0) {
            isPinnedMode = true;
            // Keep pinned cell in original position, insert related cells right after it
            const pinnedIdx = sortedCells.findIndex(c => c.origIdx === synthesisPinnedIdx);
            if (pinnedIdx !== -1) {
                const relatedCells = sortedCells.filter(c => relatedIdxs.has(c.origIdx));
                const otherCells = sortedCells.filter(c => c.origIdx !== synthesisPinnedIdx && !relatedIdxs.has(c.origIdx));
                const pinnedCell = sortedCells[pinnedIdx];
                // Rebuild: cells before pinned, pinned, related, cells after (minus related)
                const beforePinned = otherCells.slice(0, pinnedIdx > relatedCells.length ? pinnedIdx - relatedCells.length : pinnedIdx);
                const afterPinned = otherCells.slice(pinnedIdx > relatedCells.length ? pinnedIdx - relatedCells.length : pinnedIdx);
                sortedCells = [...beforePinned, pinnedCell, ...relatedCells, ...afterPinned];
            }
            
            // Update status display
            const pinnedCell = sortedCells.find(c => c.origIdx === synthesisPinnedIdx);
            const statusDiv = document.getElementById('synthesisPinStatus');
            if (statusDiv && pinnedCell) {
                statusDiv.innerHTML = '📌 <strong>' + pinnedCell.preferredLabel + '</strong> + ' + relatedIdxs.size + ' related cell' + (relatedIdxs.size !== 1 ? 's' : '') + ' <span style="font-weight:normal;cursor:pointer;text-decoration:underline;" onclick="synthesisPinnedIdx=null;renderSynthesisView();">(clear)</span>';
                statusDiv.style.display = 'inline-block';
            }
        } else {
            document.getElementById('synthesisPinStatus')?.style && (document.getElementById('synthesisPinStatus').style.display = 'none');
        }
    } else {
        const statusDiv = document.getElementById('synthesisPinStatus');
        if (statusDiv) statusDiv.style.display = 'none';
    }
    
    // Group cells
    let groups = {};
    if (groupBy === 'species-axon') {
        sortedCells.forEach(ct => {
            const species = ct.species || 'Unknown';
            let axon = 'Other';
            if (ct.clusterAttributes.fiber_a_beta) axon = 'Aβ fiber';
            else if (ct.clusterAttributes.fiber_a_delta) axon = 'Aδ fiber';
            else if (ct.clusterAttributes.fiber_c) axon = 'C fiber';
            
            const groupKey = species;
            const subKey = axon;
            if (!groups[groupKey]) groups[groupKey] = {};
            if (!groups[groupKey][subKey]) groups[groupKey][subKey] = [];
            groups[groupKey][subKey].push(ct);
        });
    } else if (groupBy === 'axon-species') {
        sortedCells.forEach(ct => {
            let axon = 'Other';
            if (ct.clusterAttributes.fiber_a_beta) axon = 'Aβ fiber';
            else if (ct.clusterAttributes.fiber_a_delta) axon = 'Aδ fiber';
            else if (ct.clusterAttributes.fiber_c) axon = 'C fiber';
            
            const groupKey = axon;
            const subKey = ct.species || 'Unknown';
            if (!groups[groupKey]) groups[groupKey] = {};
            if (!groups[groupKey][subKey]) groups[groupKey][subKey] = [];
            groups[groupKey][subKey].push(ct);
        });
    } else if (groupBy === 'source') {
        sortedCells.forEach(ct => {
            const groupKey = ct.sourceNomenclatureLabel || 'Unknown';
            if (!groups[groupKey]) groups[groupKey] = { 'all': [] };
            groups[groupKey]['all'].push(ct);
        });
    } else {
        groups = { 'All Cells': { 'all': sortedCells } };
    }
    
    // Build header
    let html = '<thead><tr>';
    columns.forEach(col => {
        const cls = col.type === 'name' ? ' class="cell-name"' : '';
        html += '<th' + cls + '>' + col.label + '</th>';
    });
    html += '</tr></thead>';

    // Build grouped rows
    const groupOrder = groupBy === 'species-axon' ? ['human', 'mouse', 'macaque', 'guinea pig'] :
                      groupBy === 'axon-species' ? ['Aβ fiber', 'Aδ fiber', 'C fiber', 'Other'] :
                      Object.keys(groups).sort();

    // In pinned mode, status is shown above the table, no in-table header needed

    const subGroupOrder = groupBy === 'species-axon' ? ['Aβ fiber', 'Aδ fiber', 'C fiber', 'Other'] :
                         groupBy === 'axon-species' ? ['human', 'mouse', 'macaque', 'guinea pig'] :
                         null;

    groupOrder.forEach(groupKey => {
        if (!groups[groupKey]) return;

        const subGroups = groups[groupKey];
        const subKeys = subGroupOrder ? subGroupOrder.filter(k => subGroups[k]) : Object.keys(subGroups);

        // Each group gets its own <tbody> so sticky headers scope correctly
        html += '<tbody>';

        // Group header row (spans all columns) - skip if in pinned mode
        if (groupBy !== 'none' && !isPinnedMode) {
            html += '<tr class="synthesis-group-header"><td colspan="' + columns.length + '">' +
                (groupKey.charAt(0).toUpperCase() + groupKey.slice(1)) +
                ' (' + subKeys.reduce((sum, k) => sum + subGroups[k].length, 0) + ' cells)</td></tr>';
        }

        subKeys.forEach(subKey => {
            const cells = subGroups[subKey];

            // Subgroup header (if not single group) - skip if in pinned mode
            if (subKey !== 'all' && groupBy !== 'none' && !isPinnedMode) {
                html += '<tr class="synthesis-subgroup-header"><td colspan="' + columns.length + '">' +
                    subKey + ' (' + cells.length + ')</td></tr>';
            }

            // Cell rows
            cells.forEach(ct => {
                const rels = typeof getAssertedRelationships === 'function' ? getAssertedRelationships(ct.origIdx) : {equivalences:[], subtypeOf:[], hasSubtypes:[]};
                const hasEquiv = rels.equivalences.length > 0;
                const hasSubtype = rels.subtypeOf.length > 0 || rels.hasSubtypes.length > 0;
                const hasBoth = hasEquiv && hasSubtype;
                const highlightSubtype = document.getElementById('synthesisHighlightSubtype')?.checked === true;
                let rowClass = '';
                if (synthesisPinnedIdx === ct.origIdx) rowClass = 'pinned-row';
                else if (isPinnedMode && relatedIdxs.has(ct.origIdx)) rowClass = 'related-row';
                html += '<tr class="' + rowClass + '" data-idx="' + ct.origIdx + '" onmouseenter="highlightRelationships(' + ct.origIdx + ')" onmouseleave="clearRelationshipHighlights()">';

                columns.forEach(col => {
                    if (col.type === 'view') {
                        html += '<td class="view-cell" onclick="showModal(' + ct.origIdx + ')" title="View details"><span class="view-icon">👁</span></td>';
                    } else if (col.type === 'name') {
                        let indicators = '';
                        if (hasEquiv) indicators += '<span class="equiv-indicator" title="Has asserted equivalence - click to group" style="background:#f59e0b;"></span>';
                        if (hasSubtype) indicators += '<span class="equiv-indicator" title="Has subtype relationship - click to group" style="background:#8b5cf6;margin-left:' + (hasEquiv ? '2px' : '0') + ';"></span>';
                        html += '<td class="cell-name" onclick="togglePinnedRow(' + ct.origIdx + ')">' + indicators + ct.preferredLabel + '</td>';
                    } else if (col.type === 'source') {
                        html += '<td><div style="width:12px;height:12px;border-radius:50%;background:' + (ct.sourceColor||'#667eea') + ';margin:auto;" title="' + (ct.sourceNomenclatureLabel||'') + '"></div></td>';
                    } else if (col.type === 'text') {
                        html += '<td>' + (ct[col.key] || '—') + '</td>';
                    } else if (col.type === 'bool') {
                        const val = ct.clusterAttributes && ct.clusterAttributes[col.key];
                        html += '<td>' + (val ? '<span class="check-mark">✓</span>' : '<span class="dash-mark">—</span>') + '</td>';
                    }
                });
                html += '</tr>';
            });
        });

        html += '</tbody>';
    });
    table.innerHTML = html;
    
    // Add/remove has-pinned class based on pin state
    if (synthesisPinnedIdx !== null) {
        table.classList.add('has-pinned');
    } else {
        table.classList.remove('has-pinned');
    }
}

function highlightRelationships(idx) {
    const rels = getAssertedRelationships(idx);
    
    // Highlight the source row
    const sourceRow = document.querySelector('.synthesis-table tr[data-idx="' + idx + '"]');
    if (sourceRow) sourceRow.classList.add('hover-source');
    
    // Highlight equivalences in yellow
    rels.equivalences.forEach(r => {
        const targetRow = document.querySelector('.synthesis-table tr[data-idx="' + r.idx + '"]');
        if (targetRow) targetRow.classList.add('equiv-highlight');
    });
    
    // Highlight subtypes in purple
    rels.subtypeOf.forEach(r => {
        const targetRow = document.querySelector('.synthesis-table tr[data-idx="' + r.idx + '"]');
        if (targetRow) targetRow.classList.add('subtype-highlight');
    });
    rels.hasSubtypes.forEach(r => {
        const targetRow = document.querySelector('.synthesis-table tr[data-idx="' + r.idx + '"]');
        if (targetRow) targetRow.classList.add('subtype-highlight');
    });
}

function clearRelationshipHighlights() {
    document.querySelectorAll('.synthesis-table tr.equiv-highlight, .synthesis-table tr.subtype-highlight, .synthesis-table tr.hover-source').forEach(row => {
        row.classList.remove('equiv-highlight', 'subtype-highlight', 'hover-source');
    });
}

function togglePinnedRow(idx) {
    const highlightEquiv = document.getElementById('synthesisHighlightEquiv')?.checked === true;
    const highlightSubtype = document.getElementById('synthesisHighlightSubtype')?.checked === true;
    
    if (!highlightEquiv && !highlightSubtype) {
        // No highlight mode - just show modal
        showModal(idx);
        return;
    }
    
    // Check if this cell has any relationships
    const rels = typeof getAssertedRelationships === 'function' ? getAssertedRelationships(idx) : {equivalences:[], subtypeOf:[], hasSubtypes:[]};
    const hasRelationships = rels.equivalences.length > 0 || rels.subtypeOf.length > 0 || rels.hasSubtypes.length > 0;
    
    if (!hasRelationships) {
        // No relationships - just show modal
        showModal(idx);
        return;
    }
    
    // Toggle pinned state
    if (synthesisPinnedIdx === idx) {
        // Unpin - restore normal order
        synthesisPinnedIdx = null;
        renderSynthesisView();
    } else {
        // Pin this row and reorder with animation
        synthesisPinnedIdx = idx;
        renderSynthesisView();
        
        // Add animation classes and scroll to pinned row after render
        setTimeout(() => {
            const pinnedRow = document.querySelector('.synthesis-table tr.pinned-row');
            if (pinnedRow) {
                pinnedRow.classList.add('animating-up');
                
                // Row stays in place, no need to scroll
            }
            
            // Animate related rows
            const relatedIdxs = new Set();
            rels.equivalences.forEach(r => relatedIdxs.add(r.idx));
            rels.subtypeOf.forEach(r => relatedIdxs.add(r.idx));
            rels.hasSubtypes.forEach(r => relatedIdxs.add(r.idx));
            
            relatedIdxs.forEach(relIdx => {
                const row = document.querySelector('.synthesis-table tr[data-idx="' + relIdx + '"]');
                if (row) row.classList.add('animating-in');
            });
            
            // Remove animation classes after animation completes
            setTimeout(() => {
                document.querySelectorAll('.synthesis-table tr.animating-up, .synthesis-table tr.animating-in').forEach(r => {
                    r.classList.remove('animating-up', 'animating-in');
                });
            }, 450);
        }, 10);
    }
}

// Legacy functions
function highlightEquivPair(idx) { highlightRelationships(idx); }
function clearEquivHighlight() { clearRelationshipHighlights(); }

function initClusterView() { const svg=d3.select('#clusterSvg'); const container=document.querySelector('.cluster-viz-area'); if(!container||container.clientWidth===0){setTimeout(initClusterView,50);return;} const width=container.clientWidth,height=container.clientHeight; nodeRadius=Math.max(8,Math.min(14,Math.min(width,height)/60)); svg.attr('width',width).attr('height',height); svg.selectAll('*').remove(); svg.append('g').attr('class','enclosures'); svg.append('g').attr('class','nodes'); svg.append('g').attr('class','labels'); clusterNodes=CELL_TYPES.map((ct,i)=>({...ct,id:i,x:width/2+(Math.random()-0.5)*width*0.6,y:height/2+(Math.random()-0.5)*height*0.6,radius:nodeRadius})); clusterSimulation=d3.forceSimulation(clusterNodes).force('charge',d3.forceManyBody().strength(-30)).force('center',d3.forceCenter(width/2,height/2)).force('collision',d3.forceCollide().radius(d=>d.radius+1).strength(0.8)).on('tick',clusterTicked).on('end',drawClusterEnclosures); initGeneButtons(); updateClusterVisualization(); }

function clearAllFilters() { selectedAttributes=[]; document.querySelectorAll('.attr-btn.active').forEach(btn=>btn.classList.remove('active')); updateSelectedDisplay(); updateClusterLegend(); updateClusterStats(); updateClusterVisualization(); }
function updateSelectedDisplay() { const display=document.getElementById('selectedAttrsDisplay'); if(selectedAttributes.length===0){display.textContent='No attributes selected';}else{const labels=selectedAttributes.map(a=>{if(a.startsWith('gene_')){const gene=GENES.find(g=>g.id===a);return gene?gene.display:a;}return ATTR_LABELS[a]||a;});display.textContent=`Selected (${labels.length}): ${labels.join(', ')}`;} }
function handleAttrClick(btn) { if(!clusterSimulation||!clusterNodes.length){initClusterView();setTimeout(()=>handleAttrClick(btn),100);return;} const attr=btn.dataset.attr; const idx=selectedAttributes.indexOf(attr); if(idx>=0){selectedAttributes.splice(idx,1);btn.classList.remove('active');}else{selectedAttributes.push(attr);btn.classList.add('active');} updateSelectedDisplay(); updateClusterLegend(); updateClusterStats(); updateClusterVisualization(); }
function cellMatchesAttr(ct,attr) { 
    if(attr.startsWith('gene_')){
        const base=attr.replace('gene_','');
        const matches = ct.geneBaseNames&&ct.geneBaseNames.includes(base);
        return matches;
    } 
    if(attr.startsWith('source_')){
        const sourceUrl = SOURCE_URLS[attr];
        return ct.sourceNomenclature === sourceUrl;
    }
    return ct.clusterAttributes&&ct.clusterAttributes[attr]; 
}
function getClusterKey(ct) { if(selectedAttributes.length===0)return'all'; return selectedAttributes.map(a=>cellMatchesAttr(ct,a)?'1':'0').join(''); }
function getClusterLabel(key) { if(key==='all')return'All Cells'; const parts=[]; for(let i=0;i<key.length;i++){if(key[i]==='1'){const attr=selectedAttributes[i];if(attr.startsWith('gene_')){const gene=GENES.find(g=>g.id===attr);parts.push(gene?gene.display:attr);}else{parts.push(ATTR_SHORT[attr]||attr);}}} return parts.length===0?'None':parts.join('+'); }
function getNodeColor(ct) { if(selectedAttributes.length===0)return ct.sourceColor||ct.color||'#667eea'; const matches=selectedAttributes.map(a=>cellMatchesAttr(ct,a)); const mc=matches.filter(Boolean).length; if(mc===0)return'#555'; if(mc===selectedAttributes.length&&selectedAttributes.length>=2)return'#FFD700'; const mi=matches.map((m,i)=>m?i:-1).filter(i=>i>=0); if(mi.length===1)return ATTR_COLORS[mi[0]%ATTR_COLORS.length]; return'#c4b5fd'; }
function getClusterColor(key) { if(key==='all')return'#667eea'; const mc=key.split('').filter(c=>c==='1').length; if(mc===0)return'#555'; if(mc===selectedAttributes.length&&selectedAttributes.length>=2)return'#FFD700'; const mi=[]; for(let i=0;i<key.length;i++){if(key[i]==='1')mi.push(i);} if(mi.length===1)return ATTR_COLORS[mi[0]%ATTR_COLORS.length]; return'#c4b5fd'; }
function calculateClusterCenters(w,h) { 
    clusterCenters={}; 
    if(selectedAttributes.length===0){clusterCenters['all']={x:w/2,y:h/2};return;} 
    const keys=new Set(); 
    clusterNodes.forEach(n=>keys.add(getClusterKey(n))); 
    const keyArray=Array.from(keys).sort();
    
    // Identify the "None" key (all zeros) and "All" key (all ones)
    const noneKey = '0'.repeat(selectedAttributes.length);
    const allKey = '1'.repeat(selectedAttributes.length);
    
    // Filter out None and All for regular positioning, then add them at fixed positions
    const regularKeys = keyArray.filter(k => k !== noneKey && k !== allKey);
    const hasNone = keyArray.includes(noneKey);
    const hasAll = keyArray.includes(allKey);
    
    // Count nodes per cluster to allocate space proportionally
    const clusterSizes = {};
    clusterNodes.forEach(n => {
        const k = getClusterKey(n);
        clusterSizes[k] = (clusterSizes[k] || 0) + 1;
    });
    
    const totalClusters = regularKeys.length + (hasNone ? 1 : 0) + (hasAll ? 1 : 0);
    
    // Use proper margins to keep content within viewport
    const mx = w * 0.1, my = h * 0.12;
    const uw = w - mx * 2, uh = h - my * 2;
    
    // Reserve corners for None and All
    const noneCornerSize = hasNone ? 0.18 : 0;
    const allTopSize = hasAll ? 0.22 : 0;
    
    // Position None in lower-right corner (isolated)
    if(hasNone) {
        clusterCenters[noneKey] = {x: w - mx - uw * 0.15, y: h - my - uh * 0.15};
    }
    
    // Position All in top-center (prominent position)
    if(hasAll) {
        clusterCenters[allKey] = {x: w / 2, y: my + uh * 0.18};
    }
    
    // Calculate grid for remaining clusters with better distribution
    const effectiveHeight = uh * (1 - allTopSize - noneCornerSize);
    const startY = my + uh * (allTopSize + 0.03);
    
    if(regularKeys.length <= 2){
        // Side by side
        regularKeys.forEach((k,i)=>{
            clusterCenters[k] = {x: mx + uw * (0.3 + i * 0.4), y: startY + effectiveHeight * 0.4};
        });
    } else if(regularKeys.length <= 4){
        // 2x2 grid with good spacing
        const positions = [
            {x: mx + uw * 0.25, y: startY + effectiveHeight * 0.3},
            {x: mx + uw * 0.7, y: startY + effectiveHeight * 0.25},
            {x: mx + uw * 0.2, y: startY + effectiveHeight * 0.7},
            {x: mx + uw * 0.65, y: startY + effectiveHeight * 0.75}
        ];
        regularKeys.forEach((k,i)=>{clusterCenters[k]=positions[i];});
    } else if(regularKeys.length <= 6){
        // 2x3 grid
        const cols = 3, rows = 2;
        regularKeys.forEach((k,i)=>{
            const col = i % cols, row = Math.floor(i / cols);
            clusterCenters[k] = {
                x: mx + uw * (0.18 + col * 0.32),
                y: startY + effectiveHeight * (0.25 + row * 0.45)
            };
        });
    } else if(regularKeys.length <= 9){
        // 3x3 grid
        const cols = 3;
        regularKeys.forEach((k,i)=>{
            const col = i % cols, row = Math.floor(i / cols);
            clusterCenters[k] = {
                x: mx + uw * (0.18 + col * 0.32),
                y: startY + effectiveHeight * (0.15 + row * 0.35)
            };
        }); }else{
        // For many clusters, use circle layout with better radius
        const radius = Math.min(uw, uh) * 0.32;
        const centerY = startY + effectiveHeight * 0.45;
        regularKeys.forEach((k,i)=>{
            const angle = (2 * Math.PI * i / regularKeys.length) - Math.PI/2;
            clusterCenters[k] = {
                x: w/2 + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle) * 0.85
            };
        }); } }
function updateClusterVisualization() { const svg=d3.select('#clusterSvg'); const container=document.querySelector('.cluster-viz-area'); const width=container.clientWidth,height=container.clientHeight; nodeRadius=Math.max(8,Math.min(14,Math.min(width,height)/60)); clusterNodes.forEach(n=>n.radius=nodeRadius); calculateClusterCenters(width,height); if(enclosureTimer){clearTimeout(enclosureTimer);enclosureTimer=null;} if(selectedAttributes.length>0){clusterSimulation.force('radial',null).force('x',d3.forceX(d=>clusterCenters[getClusterKey(d)]?.x||width/2).strength(0.85)).force('y',d3.forceY(d=>clusterCenters[getClusterKey(d)]?.y||height/2).strength(0.85)).force('charge',d3.forceManyBody().strength(-15)).force('collision',d3.forceCollide().radius(d=>d.radius+1).strength(0.9));}else{clusterSimulation.force('radial',null).force('x',d3.forceX(width/2).strength(0.3)).force('y',d3.forceY(height/2).strength(0.3)).force('charge',d3.forceManyBody().strength(-15)).force('collision',d3.forceCollide().radius(d=>d.radius+2).strength(0.8));} clusterSimulation.alpha(0.8).restart(); const ns=svg.select('.nodes').selectAll('.cluster-node').data(clusterNodes,d=>d.id); const ne=ns.enter().append('circle').attr('class','cluster-node').attr('r',d=>d.radius).call(d3.drag().on('start',dragStarted).on('drag',dragged).on('end',dragEnded)).on('mouseover',showClusterTooltip).on('mousemove',moveClusterTooltip).on('mouseout',hideClusterTooltip).on('click',(e,d)=>showModal(d.id)); ns.merge(ne).transition().duration(300)
        .attr('r', d => {
            if(selectedAttributes.length >= 2) {
                const mc = selectedAttributes.map(a => cellMatchesAttr(d, a)).filter(Boolean).length;
                return mc === selectedAttributes.length ? d.radius * 1.5 : d.radius;
            }
            return d.radius;
        })
        .attr('fill',d=>getNodeColor(d)).attr('stroke',d=>d.sourceColor||'#667eea').attr('stroke-width', 2.5);
    
    // Add/remove all-match class for glow effect
    svg.select('.nodes').selectAll('.cluster-node').classed('all-match', d => {
        if(selectedAttributes.length >= 2) {
            const mc = selectedAttributes.map(a => cellMatchesAttr(d, a)).filter(Boolean).length;
            return mc === selectedAttributes.length;
        }
        return false;
    });
    
    scheduleEnclosureRedraw(); }
function scheduleEnclosureRedraw() { if(enclosureTimer)clearTimeout(enclosureTimer); enclosureTimer=setTimeout(()=>{drawClusterEnclosures();enclosureTimer=setTimeout(()=>{drawClusterEnclosures();enclosureTimer=setTimeout(drawClusterEnclosures,800);},600);},400); }
function drawClusterEnclosures() { const svg=d3.select('#clusterSvg'); svg.select('.enclosures').selectAll('*').remove(); svg.select('.labels').selectAll('*').remove(); if(selectedAttributes.length===0)return; const clusters={}; clusterNodes.forEach(n=>{const k=getClusterKey(n);if(!clusters[k])clusters[k]=[];clusters[k].push(n);}); Object.entries(clusters).forEach(([key,nodes])=>{if(nodes.length===0)return; const pad=nodeRadius*1.2; const minX=d3.min(nodes,d=>d.x)-pad,maxX=d3.max(nodes,d=>d.x)+pad; const minY=d3.min(nodes,d=>d.y)-pad,maxY=d3.max(nodes,d=>d.y)+pad; const cx=(minX+maxX)/2,cy=(minY+maxY)/2; const rx=Math.max((maxX-minX)/2,nodeRadius*2.5); const ry=Math.max((maxY-minY)/2,nodeRadius*2.5); const color=getClusterColor(key),label=getClusterLabel(key); const isAllCluster = selectedAttributes.length >= 2 && key.split('').filter(c=>c==='1').length === selectedAttributes.length;
        svg.select('.enclosures').append('ellipse')
            .attr('class', 'cluster-enclosure' + (isAllCluster ? ' all-enclosure' : ''))
            .attr('cx',cx).attr('cy',cy)
            .attr('rx',rx+2).attr('ry',ry+2)
            .attr('stroke',color)
            .attr('fill', isAllCluster ? 'rgba(255, 215, 0, 0.15)' : 'none'); const lt=`${label} (${nodes.length})`,ly=Math.max(18, minY-6),tw=lt.length*5.5+12; svg.select('.labels').append('rect').attr('class','cluster-label-bg').attr('x',cx-tw/2).attr('y',ly-10).attr('width',tw).attr('height',16); svg.select('.labels').append('text').attr('class','cluster-label').attr('x',cx).attr('y',ly+2).attr('fill',color).text(lt);}); }
function clusterTicked() { 
    const container = document.querySelector('.cluster-viz-area');
    const w = container.clientWidth, h = container.clientHeight;
    const padding = nodeRadius + 5;
    
    // Clamp nodes to stay within viewport bounds
    clusterNodes.forEach(d => {
        d.x = Math.max(padding, Math.min(w - padding, d.x));
        d.y = Math.max(padding + 20, Math.min(h - padding, d.y)); // +20 for label space at top
    });
    
    d3.select('#clusterSvg').select('.nodes').selectAll('.cluster-node')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y); 
}
function dragStarted(e,d) { if(!e.active)clusterSimulation.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y; }
function dragged(e,d) { d.fx=e.x;d.fy=e.y; }
function dragEnded(e,d) { if(!e.active)clusterSimulation.alphaTarget(0);d.fx=null;d.fy=null;scheduleEnclosureRedraw(); }
function showClusterTooltip(e,d) { const tt=document.getElementById('clusterTooltip'); tt.innerHTML=`<div class="cluster-tooltip-title">${d.preferredLabel}</div><div class="cluster-tooltip-row"><strong>Species:</strong> ${d.species}</div><div class="cluster-tooltip-row"><strong>Location:</strong> ${(d.somaLocations||[d.somaLocation]).join(', ')}</div>${d.physiologyStringAbbrev?`<div class="cluster-tooltip-row"><strong>Physiology:</strong> ${d.physiologyStringAbbrev}</div>`:''}${d.fiberTypeStringAbbrev?`<div class="cluster-tooltip-row"><strong>Axon:</strong> ${formatFiberType(d.fiberTypeStringAbbrev)}</div>`:''}`; tt.classList.add('visible'); }
function moveClusterTooltip(e) { const tt=document.getElementById('clusterTooltip'); const r=document.querySelector('.cluster-viz-area').getBoundingClientRect(); tt.style.left=(e.clientX-r.left+15)+'px'; tt.style.top=(e.clientY-r.top+15)+'px'; }
function hideClusterTooltip() { document.getElementById('clusterTooltip').classList.remove('visible'); }
function updateClusterLegend() { const lg=document.getElementById('clusterLegendInline'); if(selectedAttributes.length===0){const srcCounts={};CELL_TYPES.forEach(ct=>{const lbl=ct.sourceNomenclatureLabel||'Unknown';if(!srcCounts[lbl])srcCounts[lbl]={count:0,color:ct.sourceColor||'#667eea'};srcCounts[lbl].count++;});let h='';Object.entries(srcCounts).forEach(([lbl,info])=>{h+='<div class="legend-item-inline"><div class="legend-dot" style="background:'+info.color+';"></div><span>'+lbl+' ('+info.count+')</span></div>';});lg.innerHTML=h;return;} let html=''; selectedAttributes.forEach((a,i)=>{let label;if(a.startsWith('gene_')){const gene=GENES.find(g=>g.id===a);label=gene?gene.display:a;}else{label=ATTR_SHORT[a]||a;}html+=`<div class="legend-item-inline"><div class="legend-dot" style="background:${ATTR_COLORS[i%ATTR_COLORS.length]};"></div><span>${label}</span></div>`;}); if(selectedAttributes.length>=2){html+='<div class="legend-item-inline"><div class="legend-dot" style="background:#FFD700;border:2px solid #FFA500;box-shadow:0 0 4px #FFD700;"></div><span>All (intersection)</span></div>';} html+='<div class="legend-item-inline"><div class="legend-dot" style="background:#555;"></div><span>None</span></div>'; lg.innerHTML=html; }
function updateClusterStats() { 
    const st=document.getElementById('clusterStatsInline'); 
    let html=`<div class="stat-item"><span class="stat-label">Total:</span><span class="stat-value">${CELL_TYPES.length}</span></div>`; 
    if(selectedAttributes.length>0){
        selectedAttributes.slice(0,4).forEach((a,i)=>{
            const matchingCells = CELL_TYPES.filter(ct=>cellMatchesAttr(ct,a));
            const c=matchingCells.length;
            
            if(a.startsWith('gene_')) {
                
            }
            let label;
            if(a.startsWith('gene_')){const gene=GENES.find(g=>g.id===a);label=gene?gene.display:a;}else{label=ATTR_SHORT[a]||a;}
            html+=`<div class="stat-item"><span class="stat-label">${label}:</span><span class="stat-value" style="color:${ATTR_COLORS[i%ATTR_COLORS.length]};">${c}</span></div>`;
        });
        if(selectedAttributes.length>=2){
            const ic=CELL_TYPES.filter(ct=>selectedAttributes.every(a=>cellMatchesAttr(ct,a))).length;
            
            html+=`<div class="stat-item"><span class="stat-label">All:</span><span class="stat-value" style="color:#FFD700;text-shadow:0 0 4px #FFA500;">${ic}</span></div>`;
        }
    } 
    st.innerHTML=html; 
}


// Build reciprocal relationships for both mapsTo and assertedSubclassOf
function toggleProposedRelationships() {
    showProposedRelationships = document.getElementById('showProposedRels')?.checked || false;
    if (currentView === 'lineage') renderLineageView();
    if (currentView === 'synthesis') renderSynthesisView();
}

function getProposedRelationships(cellIdx) {
    const result = { equivalences: [], subtypes: [] };
    if (!showProposedRelationships) return result;
    
    PROPOSED_RELATIONSHIPS.equivalences.forEach(eq => {
        if (eq.idx1 === cellIdx) {
            result.equivalences.push({ idx: eq.idx2, label: eq.label2, confidence: eq.confidence, sharedGenes: eq.sharedGenes });
        } else if (eq.idx2 === cellIdx) {
            result.equivalences.push({ idx: eq.idx1, label: eq.label1, confidence: eq.confidence, sharedGenes: eq.sharedGenes });
        }
    });
    
    return result;
}

function getAssertedRelationships(cellIdx) {
    const ct = CELL_TYPES[cellIdx];
    const result = { equivalences: [], subtypeOf: [], hasSubtypes: [] };
    
    // Get direct mapsTo (equivalences)
    if (ct.mapsTo && ct.mapsTo.length > 0) {
        ct.mapsTo.forEach(m => {
            if (!m.label) return;
            const targetIdx = CELL_TYPES.findIndex(c => c.entity === m.label);
            if (targetIdx !== -1) {
                result.equivalences.push({ label: CELL_TYPES[targetIdx].preferredLabel, idx: targetIdx, direction: 'to' });
            }
        });
    }
    
    // Find cells that map TO this cell (reverse equivalences)
    CELL_TYPES.forEach((other, otherIdx) => {
        if (otherIdx === cellIdx) return;
        if (other.mapsTo && other.mapsTo.length > 0) {
            other.mapsTo.forEach(m => {
                if (m.label === ct.entity) {
                    if (!result.equivalences.find(r => r.idx === otherIdx)) {
                        result.equivalences.push({ label: other.preferredLabel, idx: otherIdx, direction: 'from' });
                    }
                }
            });
        }
    });
    
    // Get direct assertedSubclassOf (this cell is a subtype of...)
    if (ct.assertedSubclassOf && ct.assertedSubclassOf.length > 0) {
        ct.assertedSubclassOf.forEach(s => {
            if (!s.label) return;
            const targetIdx = CELL_TYPES.findIndex(c => c.entity === s.label);
            if (targetIdx !== -1) {
                result.subtypeOf.push({ label: CELL_TYPES[targetIdx].preferredLabel, idx: targetIdx });
            }
        });
    }
    
    // Find cells that are subtypes OF this cell (reverse)
    CELL_TYPES.forEach((other, otherIdx) => {
        if (otherIdx === cellIdx) return;
        if (other.assertedSubclassOf && other.assertedSubclassOf.length > 0) {
            other.assertedSubclassOf.forEach(s => {
                if (s.label === ct.entity) {
                    result.hasSubtypes.push({ label: other.preferredLabel, idx: otherIdx });
                }
            });
        }
    });
    
    return result;
}

// Legacy function for compatibility
function getReciprocalMapsTo(cellIdx) {
    return getAssertedRelationships(cellIdx).equivalences;
}


function renderLineageView() {
    const svg = d3.select('#lineageSvg');
    svg.selectAll('*').remove();
    
    const sourceColors = {
        'CSA paper': '#667eea',
        'big DRG paper': '#f59e0b',
        'Tavares-Ferreira et al., 2022': '#22c55e',
        'Yu et al., 2024': '#ef4444',
        'Krauter et al., 2025': '#8b5cf6',
        'Qi et al., 2024': '#06b6d4',
        'Kupari et al., 2021': '#ec4899'
    };
    
    const LINE_COLORS = {
        masterVariant: '#667eea',
        subtype: '#8b5cf6',
        equiv: '#ef4444'
    };
    
    // --- Helpers ---
    // TODO: When unique identifiers (e.g., URIs or NPO IDs) are created for each cell,
    // replace labelToIdx / csaLabelToIdx with a mapping keyed by the unique ID instead
    // of preferredLabel. This will eliminate collisions where different cells share the
    // same preferredLabel (e.g., "DRG Rxfp1 mouse neuron" exists in both CSA and Krauter).
    // The csaLabelToIdx workaround below is a temporary fix for that collision.
    const labelToIdx = {};
    const entityToIdx = {};
    const csaLabelToIdx = {};
    CELL_TYPES.forEach((ct, idx) => {
        labelToIdx[ct.preferredLabel] = idx;
        if (ct.entity) entityToIdx[ct.entity] = idx;
        if (ct.sourceNomenclatureLabel === 'CSA paper') csaLabelToIdx[ct.preferredLabel] = idx;
    });
    function resolveLabel(lbl) {
        if (labelToIdx[lbl] !== undefined) return labelToIdx[lbl];
        if (entityToIdx[lbl] !== undefined) return entityToIdx[lbl];
        return null;
    }
    
    function getResolvedConnections(ct) {
        const conns = [];
        if (ct.assertedSubclassOf) {
            ct.assertedSubclassOf.forEach(s => {
                if (!s.label || s.label === 'added' || s.label.startsWith('-->')) return;
                const ti = resolveLabel(s.label);
                if (ti !== null) conns.push({ targetIdx: ti, type: 'subtype' });
            });
        }
        if (ct.mapsTo) {
            ct.mapsTo.forEach(m => {
                if (!m.label || m.label === 'added' || m.label.startsWith('-->')) return;
                const ti = resolveLabel(m.label);
                if (ti !== null && !conns.find(c => c.targetIdx === ti))
                    conns.push({ targetIdx: ti, type: 'equiv' });
            });
        }
        return conns;
    }
    
    function lineStyle(type) {
        if (type === 'subtype') return { color: LINE_COLORS.subtype, dashed: false, double: false };
        if (type === 'equiv') return { color: LINE_COLORS.equiv, dashed: false, double: true };
        return { color: LINE_COLORS.subtype, dashed: false, double: false };
    }
    
    // --- Categorise ---
    const masterFamilies = FAMILIES.map(fam => ({
        name: fam.name, children: fam.children || []
    }));
    masterFamilies.sort((a, b) => a.name.localeCompare(b.name));
    
    const csaByFamily = {};
    const csaToFamily = {};
    masterFamilies.forEach(fam => {
        csaByFamily[fam.name] = [];
        fam.children.forEach(childLabel => {
            // Prefer CSA-specific lookup so non-CSA cells with the same preferredLabel don't clobber
            const idx = csaLabelToIdx[childLabel] !== undefined ? csaLabelToIdx[childLabel] : labelToIdx[childLabel];
            if (idx !== undefined) {
                csaByFamily[fam.name].push({ idx, ct: CELL_TYPES[idx] });
                csaToFamily[idx] = fam.name;
            }
        });
    });
    
    const col3Sources = new Set(['Tavares-Ferreira et al., 2022', 'Yu et al., 2024',
        'Krauter et al., 2025', 'Qi et al., 2024', 'Kupari et al., 2021']);
    
    // Build bigDRG → family mapping
    const bigDrgFamily = {};
    const bigDrgCsaConns = {};
    const bigDrgCol3Conns = {};
    CELL_TYPES.forEach((ct, idx) => {
        if (ct.sourceNomenclatureLabel !== 'big DRG paper') return;
        const conns = getResolvedConnections(ct);
        const csaConns = conns.filter(c => CELL_TYPES[c.targetIdx].sourceNomenclatureLabel === 'CSA paper');
        const c3Conns = conns.filter(c => col3Sources.has(CELL_TYPES[c.targetIdx].sourceNomenclatureLabel));
        bigDrgCsaConns[idx] = csaConns;
        bigDrgCol3Conns[idx] = c3Conns;
        // Each bigDRG maps to exactly 1 family
        for (const c of csaConns) {
            const fam = csaToFamily[c.targetIdx];
            if (fam) { bigDrgFamily[idx] = fam; break; }
        }
    });
    
    // Build col3 → bigDRG connections
    const col3ToBigDrg = {};
    const col3ToCol3 = {};
    CELL_TYPES.forEach((ct, idx) => {
        if (!col3Sources.has(ct.sourceNomenclatureLabel)) return;
        const conns = getResolvedConnections(ct);
        col3ToBigDrg[idx] = conns.filter(c =>
            CELL_TYPES[c.targetIdx].sourceNomenclatureLabel === 'big DRG paper');
        col3ToCol3[idx] = conns.filter(c =>
            col3Sources.has(CELL_TYPES[c.targetIdx].sourceNomenclatureLabel) && c.targetIdx !== idx);
    });
    
    // Also: bigDRG→col3 reversed into col3→bigDRG
    CELL_TYPES.forEach((ct, idx) => {
        if (ct.sourceNomenclatureLabel !== 'big DRG paper') return;
        (bigDrgCol3Conns[idx] || []).forEach(c => {
            if (!col3ToBigDrg[c.targetIdx]) col3ToBigDrg[c.targetIdx] = [];
            if (!col3ToBigDrg[c.targetIdx].find(x => x.targetIdx === idx))
                col3ToBigDrg[c.targetIdx].push({ targetIdx: idx, type: c.type, reversed: true });
        });
    });

    // Build reverse col3↔col3 map: for each col3 cell, which OTHER col3 cells reference it?
    // This captures cases where cell A's mapsTo/assertedSubclassOf points to cell B,
    // but B has no outgoing reference back to A (e.g., Kupari cells referenced by Yu cells).
    const col3FromCol3 = {};
    CELL_TYPES.forEach((ct, idx) => {
        if (!col3Sources.has(ct.sourceNomenclatureLabel)) return;
        (col3ToCol3[idx] || []).forEach(conn => {
            if (!col3FromCol3[conn.targetIdx]) col3FromCol3[conn.targetIdx] = [];
            if (!col3FromCol3[conn.targetIdx].find(c => c.targetIdx === idx))
                col3FromCol3[conn.targetIdx].push({ targetIdx: idx, type: conn.type, reversed: true });
        });
    });
    
    // --- Layout constants ---
    const nodeHeight = 20;
    const verticalGap = 3;
    const nodeStep = nodeHeight + verticalGap;
    const colGap = 20;
    const headerHeight = 50;
    const groupGap = 14;
    const col0X = 12;
    const col0Width = 220;
    const col1Width = 250;
    const col2Width = 260;
    const col3Width = 250;
    const col1X = col0X + col0Width + colGap;
    const col2X = col1X + col1Width + colGap;
    const col3X = col2X + col2Width + colGap;
    
    const positions = {};
    const masterPositions = {};
    const connections = [];
    let currentY = headerHeight + 10;
    
    // ============================================================
    // PER-FAMILY LAYOUT with barycenter ordering
    // ============================================================
    masterFamilies.forEach(fam => {
        const variants = csaByFamily[fam.name] || [];
        if (variants.length === 0) return;
        const variantIdxSet = new Set(variants.map(v => v.idx));
        
        // --- Collect bigDRG in this family ---
        const groupBigDrg = [];
        CELL_TYPES.forEach((ct, idx) => {
            if (ct.sourceNomenclatureLabel !== 'big DRG paper') return;
            if (bigDrgFamily[idx] !== fam.name) return;
            groupBigDrg.push({ idx, ct, csaConns: bigDrgCsaConns[idx] || [] });
        });
        
        // --- Collect col3 cells that connect to bigDRG in this family ---
        const bigDrgIdxSet = new Set(groupBigDrg.map(bd => bd.idx));
        const groupCol3 = [];
        const col3Seen = new Set();
        
        CELL_TYPES.forEach((ct, idx) => {
            if (!col3Sources.has(ct.sourceNomenclatureLabel)) return;
            const connsToBd = (col3ToBigDrg[idx] || []).filter(c => bigDrgIdxSet.has(c.targetIdx));
            if (connsToBd.length > 0 && !col3Seen.has(idx)) {
                col3Seen.add(idx);
                groupCol3.push({ idx, ct, bdConns: connsToBd });
            }
        });

        // --- BFS expand: include col3 cells transitively connected via col3↔col3 ---
        // This picks up cells that don't directly connect to bigDRG but ARE referenced
        // by (or reference) col3 cells already in this group (e.g., Kupari macaque cells
        // referenced by Yu et al. cells that are placed via bigDRG connections).
        let expandMore = true;
        while (expandMore) {
            expandMore = false;
            CELL_TYPES.forEach((ct, idx) => {
                if (!col3Sources.has(ct.sourceNomenclatureLabel)) return;
                if (col3Seen.has(idx)) return;
                // Forward: this cell's outgoing col3 connections include a group member
                const fwd = (col3ToCol3[idx] || []).some(c => col3Seen.has(c.targetIdx));
                // Reverse: a group member's outgoing col3 connections include this cell
                const rev = (col3FromCol3[idx] || []).some(c => col3Seen.has(c.targetIdx));
                if (fwd || rev) {
                    col3Seen.add(idx);
                    groupCol3.push({ idx, ct, bdConns: [] });
                    expandMore = true;
                }
            });
        }

        // --- BARYCENTER ORDERING ---
        // Step 1: Order CSA variants - keep them in their natural order
        // Step 2: Order bigDRG by average position of their CSA targets
        function baryOrder(items, targetKey, refPositions, colItems) {
            // Assign temporary positions to reference column
            const refMap = {};
            colItems.forEach((item, i) => { refMap[item.idx] = i; });
            
            items.forEach(item => {
                const targets = item[targetKey] || [];
                if (targets.length === 0) { item._bary = 999; return; }
                let sum = 0, count = 0;
                targets.forEach(c => {
                    if (refMap[c.targetIdx] !== undefined) {
                        sum += refMap[c.targetIdx];
                        count++;
                    }
                });
                item._bary = count > 0 ? sum / count : 999;
            });
            items.sort((a, b) => a._bary - b._bary || a.ct.preferredLabel.localeCompare(b.ct.preferredLabel));
        }
        
        // Order bigDRG by barycenter of CSA targets
        baryOrder(groupBigDrg, 'csaConns', {}, variants);
        
        // Order col3 by barycenter of bigDRG targets
        baryOrder(groupCol3, 'bdConns', {}, groupBigDrg);

        // Refine: position BFS-expanded cells (no bigDRG connections, _bary=999)
        // near their col3 connection targets so they appear adjacent in the column.
        const expandedCells = groupCol3.filter(gc => gc.bdConns.length === 0);
        if (expandedCells.length > 0) {
            // Build index map of current ordering
            const posMap = {};
            groupCol3.forEach((gc, i) => { posMap[gc.idx] = i; });

            expandedCells.forEach(ec => {
                // Find connected peers already in this group (forward + reverse)
                const peers = [];
                (col3ToCol3[ec.idx] || []).forEach(c => {
                    if (posMap[c.targetIdx] !== undefined) peers.push(posMap[c.targetIdx]);
                });
                (col3FromCol3[ec.idx] || []).forEach(c => {
                    if (posMap[c.targetIdx] !== undefined) peers.push(posMap[c.targetIdx]);
                });
                if (peers.length > 0) {
                    // Place just after the average position of connected peers
                    const avg = peers.reduce((a, b) => a + b, 0) / peers.length;
                    ec._bary = avg + 0.5; // +0.5 to sort just after the peer
                }
            });
            groupCol3.sort((a, b) => a._bary - b._bary || a.ct.preferredLabel.localeCompare(b.ct.preferredLabel));
        }

        // --- Place nodes ---
        const groupRows = Math.max(1, variants.length, groupBigDrg.length, groupCol3.length);
        const groupStartY = currentY;
        
        // Master
        const masterCenterY = groupStartY + (groupRows * nodeStep - verticalGap) / 2 - nodeHeight / 2;
        masterPositions[fam.name] = { x: col0X, y: masterCenterY, width: col0Width };
        
        // Vertically center each column within the group height
        const col1Offset = (groupRows - variants.length) * nodeStep / 2;
        const col2Offset = (groupRows - groupBigDrg.length) * nodeStep / 2;
        const col3Offset = (groupRows - groupCol3.length) * nodeStep / 2;

        // CSA variants
        variants.forEach((v, i) => {
            positions[v.idx] = { x: col1X, y: groupStartY + col1Offset + i * nodeStep, width: col1Width };
        });

        // bigDRG
        groupBigDrg.forEach((bd, i) => {
            positions[bd.idx] = { x: col2X, y: groupStartY + col2Offset + i * nodeStep, width: col2Width };
        });

        // col3 — allow duplicates: use composite key "idx_familyName"
        groupCol3.forEach((c3, i) => {
            const key = c3.idx + '_' + fam.name;
            positions[key] = { x: col3X, y: groupStartY + col3Offset + i * nodeStep, width: col3Width, realIdx: c3.idx };
        });
        
        // --- Connections ---
        // CSA → master
        variants.forEach(v => {
            const vp = positions[v.idx];
            connections.push({
                from: { x: col1X, y: vp.y + nodeHeight / 2 },
                to: { x: col0X + col0Width, y: masterCenterY + nodeHeight / 2 },
                type: 'masterVariant', color: LINE_COLORS.masterVariant, dashed: false, opacity: 0.4
            });
        });
        
        // bigDRG → CSA
        groupBigDrg.forEach(bd => {
            const bp = positions[bd.idx];
            bd.csaConns.forEach((conn, ci) => {
                const vp = positions[conn.targetIdx];
                if (!vp) return;
                const st = lineStyle(conn.type);
                const offy = bd.csaConns.length > 1 ? (ci - (bd.csaConns.length - 1) / 2) * 3 : 0;
                connections.push({
                    from: { x: col2X, y: bp.y + nodeHeight / 2 + offy },
                    to: { x: col1X + col1Width, y: vp.y + nodeHeight / 2 },
                    ...st, opacity: 0.6
                });
            });
        });
        
        // col3 → bigDRG
        groupCol3.forEach((c3, i) => {
            const key = c3.idx + '_' + fam.name;
            const cp = positions[key];
            c3.bdConns.forEach((conn, ci) => {
                const bp = positions[conn.targetIdx];
                if (!bp) return;
                const st = lineStyle(conn.type);
                const offy = c3.bdConns.length > 1 ? (ci - (c3.bdConns.length - 1) / 2) * 3 : 0;
                if (conn.reversed) {
                    connections.push({
                        from: { x: col2X + col2Width, y: bp.y + nodeHeight / 2 },
                        to: { x: col3X, y: cp.y + nodeHeight / 2 + offy },
                        ...st, opacity: 0.6
                    });
                } else {
                    connections.push({
                        from: { x: col3X, y: cp.y + nodeHeight / 2 + offy },
                        to: { x: col2X + col2Width, y: bp.y + nodeHeight / 2 },
                        ...st, opacity: 0.6
                    });
                }
            });
        });
        
        // col3 ↔ col3 WITHIN this group
        groupCol3.forEach(c3a => {
            const keyA = c3a.idx + '_' + fam.name;
            const posA = positions[keyA];
            (col3ToCol3[c3a.idx] || []).forEach(conn => {
                // Only draw if target is also in this group
                const keyB = conn.targetIdx + '_' + fam.name;
                const posB = positions[keyB];
                if (!posB) return;
                const st = lineStyle(conn.type);
                const dist = Math.abs(posA.y - posB.y);
                const bulge = Math.min(35, dist * 0.25 + 12);
                connections.push({
                    from: { x: col3X + col3Width, y: posA.y + nodeHeight / 2 },
                    to: { x: col3X + col3Width, y: posB.y + nodeHeight / 2 },
                    ...st, curved: true, bulge, opacity: 0.5
                });
            });
        });
        
        currentY += groupRows * nodeStep + groupGap;
    });
    
    // --- Unplaced bigDRG (no CSA family link, e.g., cells 67, 71) ---
    const placedBigDrg = new Set(Object.keys(positions).filter(k => !k.includes('_')).map(Number)
        .filter(idx => CELL_TYPES[idx]?.sourceNomenclatureLabel === 'big DRG paper'));
    const unplacedBigDrg = [];
    CELL_TYPES.forEach((ct, idx) => {
        if (ct.sourceNomenclatureLabel === 'big DRG paper' && !placedBigDrg.has(idx))
            unplacedBigDrg.push({ idx, ct });
    });
    
    if (unplacedBigDrg.length > 0) {
        currentY += 16;
        connections.push({ _label: true, x: col2X, y: currentY - 6, 
            text: 'No direct CSA link (' + unplacedBigDrg.length + ')' });
        currentY += 4;
        
        // Treat each unplaced bigDRG as its own sub-group
        unplacedBigDrg.forEach((bd, bdGroupIdx) => {
            const subGroupStartY = currentY;
            
            // Collect col3 that connect to THIS specific bigDRG cell
            const subCol3 = [];
            CELL_TYPES.forEach((ct, idx) => {
                if (!col3Sources.has(ct.sourceNomenclatureLabel)) return;
                const conns = (col3ToBigDrg[idx] || []).filter(c => c.targetIdx === bd.idx);
                if (conns.length > 0) subCol3.push({ idx, ct, bdConns: conns });
            });
            
            // Barycenter sort col3 by source name then label
            subCol3.sort((a, b) => {
                const srcCmp = a.ct.sourceNomenclatureLabel.localeCompare(b.ct.sourceNomenclatureLabel);
                if (srcCmp !== 0) return srcCmp;
                return a.ct.preferredLabel.localeCompare(b.ct.preferredLabel);
            });
            
            const subRows = Math.max(1, subCol3.length);
            
            // Place bigDRG cell centered vertically in its sub-group
            const bdCenterY = subGroupStartY + (subRows * nodeStep - verticalGap) / 2 - nodeHeight / 2;
            positions[bd.idx] = { x: col2X, y: bdCenterY, width: col2Width, unconnected: true };
            
            // Place col3 cells
            subCol3.forEach((c3, i) => {
                const key = c3.idx + '_unplaced_' + bd.idx;
                const c3Y = subGroupStartY + i * nodeStep;
                positions[key] = { x: col3X, y: c3Y, width: col3Width, realIdx: c3.idx, unconnected: true };
                c3.bdConns.forEach(conn => {
                    const bp = positions[bd.idx];
                    const cp = positions[key];
                    const st = lineStyle(conn.type);
                    if (conn.reversed) {
                        connections.push({
                            from: { x: col2X + col2Width, y: bp.y + nodeHeight / 2 },
                            to: { x: col3X, y: cp.y + nodeHeight / 2 },
                            ...st, opacity: 0.5
                        });
                    } else {
                        connections.push({
                            from: { x: col3X, y: cp.y + nodeHeight / 2 },
                            to: { x: col2X + col2Width, y: bp.y + nodeHeight / 2 },
                            ...st, opacity: 0.5
                        });
                    }
                });
            });
            
            // Also draw bigDRG → col3 outgoing connections
            (bigDrgCol3Conns[bd.idx] || []).forEach(conn => {
                // Find if target is placed in this sub-group
                const targetKey = conn.targetIdx + '_unplaced_' + bd.idx;
                const tp = positions[targetKey];
                if (!tp) return;
                const bp = positions[bd.idx];
                const st = lineStyle(conn.type);
                connections.push({
                    from: { x: col2X + col2Width, y: bp.y + nodeHeight / 2 },
                    to: { x: col3X, y: tp.y + nodeHeight / 2 },
                    ...st, opacity: 0.5
                });
            });
            
            currentY += subRows * nodeStep + groupGap;
        });
    }
    
    // --- Cross-group col3↔col3 connections ---
    // Find all col3 positions (may have composite keys)
    const col3PosByIdx = {};
    Object.entries(positions).forEach(([key, pos]) => {
        const realIdx = pos.realIdx !== undefined ? pos.realIdx : parseInt(key);
        if (isNaN(realIdx)) return;
        const ct = CELL_TYPES[realIdx];
        if (!ct || !col3Sources.has(ct.sourceNomenclatureLabel)) return;
        if (!col3PosByIdx[realIdx]) col3PosByIdx[realIdx] = [];
        col3PosByIdx[realIdx].push(pos);
    });
    
    CELL_TYPES.forEach((ct, idx) => {
        if (!col3Sources.has(ct.sourceNomenclatureLabel)) return;
        (col3ToCol3[idx] || []).forEach(conn => {
            const fromPositions = col3PosByIdx[idx] || [];
            const toPositions = col3PosByIdx[conn.targetIdx] || [];
            if (fromPositions.length === 0 || toPositions.length === 0) return;
            
            // Find the closest pair
            let bestDist = Infinity, bestFrom = null, bestTo = null;
            fromPositions.forEach(fp => {
                toPositions.forEach(tp => {
                    const dist = Math.abs(fp.y - tp.y);
                    if (dist < bestDist) { bestDist = dist; bestFrom = fp; bestTo = tp; }
                });
            });
            if (!bestFrom || !bestTo || bestFrom === bestTo) return;
            // Skip if already drawn as within-group
            if (bestDist < groupGap * 2) return;
            
            const st = lineStyle(conn.type);
            const bulge = Math.min(50, bestDist * 0.15 + 18);
            connections.push({
                from: { x: col3X + col3Width, y: bestFrom.y + nodeHeight / 2 },
                to: { x: col3X + col3Width, y: bestTo.y + nodeHeight / 2 },
                ...st, curved: true, bulge, opacity: 0.3
            });
        });
    });
    
    // --- Unplaced cells (not mapped to any family group) ---
    const placedIdxSet = new Set();
    Object.entries(positions).forEach(([key, pos]) => {
        const realIdx = pos.realIdx !== undefined ? pos.realIdx : parseInt(key);
        if (!isNaN(realIdx)) placedIdxSet.add(realIdx);
    });
    const unmappedCells = [];
    CELL_TYPES.forEach((ct, idx) => {
        if (!placedIdxSet.has(idx)) unmappedCells.push({ idx, ct });
    });
    if (unmappedCells.length > 0) {
        currentY += 20;
        connections.push({ _label: true, x: col1X, y: currentY - 6,
            text: 'Unmapped cells (' + unmappedCells.length + ')' });
        currentY += 8;
        // Group by source for readability
        const bySource = {};
        unmappedCells.forEach(item => {
            const src = item.ct.sourceNomenclatureLabel || 'Unknown';
            if (!bySource[src]) bySource[src] = [];
            bySource[src].push(item);
        });
        Object.entries(bySource).sort((a, b) => a[0].localeCompare(b[0])).forEach(([src, items]) => {
            items.sort((a, b) => a.ct.preferredLabel.localeCompare(b.ct.preferredLabel));
            items.forEach(item => {
                positions[item.idx] = { x: col1X, y: currentY, width: col1Width + col2Width + colGap, unconnected: true };
                currentY += nodeStep;
            });
            currentY += verticalGap;
        });
    }

    // --- Render SVG ---
    const svgWidth = col3X + col3Width + 60;
    const svgHeight = currentY + 20;
    svg.attr('width', svgWidth).attr('height', svgHeight);
    
    // Column headers
    const columns = [
        { x: col0X, width: col0Width, title: 'Master Cells', color: '#667eea' },
        { x: col1X, width: col1Width, title: 'CSA Species Variants', color: '#667eea' },
        { x: col2X, width: col2Width, title: 'Bhuiyan et al., 2025', color: '#f59e0b' },
        { x: col3X, width: col3Width, title: 'Other Sources', color: '#6b7280' }
    ];
    columns.forEach(col => {
        svg.append('text')
            .attr('x', col.x + col.width / 2).attr('y', 25)
            .attr('text-anchor', 'middle').attr('font-weight', '600')
            .attr('font-size', '12px').attr('fill', col.color)
            .text(col.title);
        svg.append('line')
            .attr('x1', col.x).attr('y1', 38)
            .attr('x2', col.x + col.width).attr('y2', 38)
            .attr('stroke', col.color).attr('stroke-width', 2).attr('opacity', 0.3);
    });
    
    // Draw family group backgrounds using tracked ranges
    const groupRanges = [];
    let trackY = headerHeight + 10;
    masterFamilies.forEach(fam => {
        const variants = csaByFamily[fam.name] || [];
        if (variants.length === 0) return;
        // Find max Y of any position in this group
        let maxY = trackY;
        Object.entries(positions).forEach(([key, pos]) => {
            if (pos.y >= trackY - 2 && pos.y < trackY + 500) {
                const realIdx = pos.realIdx !== undefined ? pos.realIdx : parseInt(key);
                if (isNaN(realIdx)) return;
                const ct = CELL_TYPES[realIdx];
                if (!ct) return;
                // Check if this cell belongs to this family
                const inFamily = csaToFamily[realIdx] === fam.name || 
                    bigDrgFamily[realIdx] === fam.name ||
                    (typeof key === 'string' && key.includes('_' + fam.name));
                if (inFamily) maxY = Math.max(maxY, pos.y + nodeHeight);
            }
        });
        groupRanges.push({ startY: trackY, endY: maxY, name: fam.name });
        trackY = maxY + verticalGap + groupGap;
    });
    
    groupRanges.forEach((gr, i) => {
        if (i % 2 === 0) {
            svg.append('rect')
                .attr('x', 0).attr('y', gr.startY - 4)
                .attr('width', svgWidth)
                .attr('height', gr.endY - gr.startY + 8)
                .attr('fill', '#f8fafc').attr('rx', 3);
        }
    });
    
    // Draw connections
    const linkGroup = svg.append('g').attr('class', 'links');
    connections.forEach(conn => {
        if (conn._label) {
            svg.append('text').attr('x', conn.x).attr('y', conn.y)
                .attr('font-size', '10px').attr('font-style', 'italic').attr('fill', '#9ca3af')
                .text(conn.text);
            return;
        }
        const opacity = conn.opacity || 0.6;
        if (conn.curved) {
            const bulge = conn.bulge || 20;
            if (conn.double) {
                // Double line: two parallel curves offset by 2px
                const dx = 0, dy = 2;
                linkGroup.append('path')
                    .attr('d', `M${conn.from.x},${conn.from.y - dy} C${conn.from.x + bulge},${conn.from.y - dy} ${conn.to.x + bulge},${conn.to.y - dy} ${conn.to.x},${conn.to.y - dy}`)
                    .attr('fill', 'none').attr('stroke', conn.color).attr('stroke-width', 1.5).attr('opacity', opacity);
                linkGroup.append('path')
                    .attr('d', `M${conn.from.x},${conn.from.y + dy} C${conn.from.x + bulge},${conn.from.y + dy} ${conn.to.x + bulge},${conn.to.y + dy} ${conn.to.x},${conn.to.y + dy}`)
                    .attr('fill', 'none').attr('stroke', conn.color).attr('stroke-width', 1.5).attr('opacity', opacity);
            } else {
                const p = linkGroup.append('path')
                    .attr('d', `M${conn.from.x},${conn.from.y} C${conn.from.x + bulge},${conn.from.y} ${conn.to.x + bulge},${conn.to.y} ${conn.to.x},${conn.to.y}`)
                    .attr('fill', 'none').attr('stroke', conn.color).attr('stroke-width', 1.5).attr('opacity', opacity);
                if (conn.dashed) p.attr('stroke-dasharray', '4,3');
            }
        } else {
            if (conn.double) {
                // Double line: two parallel lines offset perpendicular to the line direction
                const dx = conn.to.x - conn.from.x;
                const dy = conn.to.y - conn.from.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len * 1.5;
                const ny = dx / len * 1.5;
                linkGroup.append('line')
                    .attr('x1', conn.from.x + nx).attr('y1', conn.from.y + ny)
                    .attr('x2', conn.to.x + nx).attr('y2', conn.to.y + ny)
                    .attr('stroke', conn.color).attr('stroke-width', 1.5).attr('opacity', opacity);
                linkGroup.append('line')
                    .attr('x1', conn.from.x - nx).attr('y1', conn.from.y - ny)
                    .attr('x2', conn.to.x - nx).attr('y2', conn.to.y - ny)
                    .attr('stroke', conn.color).attr('stroke-width', 1.5).attr('opacity', opacity);
            } else {
                const p = linkGroup.append('line')
                    .attr('x1', conn.from.x).attr('y1', conn.from.y)
                    .attr('x2', conn.to.x).attr('y2', conn.to.y)
                    .attr('stroke', conn.color).attr('stroke-width', 1.5).attr('opacity', opacity);
                if (conn.dashed) p.attr('stroke-dasharray', '5,3');
            }
        }
    });
    
    // Draw master nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    Object.entries(masterPositions).forEach(([famName, pos]) => {
        const g = nodeGroup.append('g')
            .attr('transform', `translate(${pos.x}, ${pos.y})`).style('cursor', 'default');
        g.append('rect')
            .attr('width', pos.width).attr('height', nodeHeight).attr('rx', 4)
            .attr('fill', '#eef2ff').attr('stroke', '#667eea').attr('stroke-width', 2);
        const maxCh = Math.floor(pos.width / 7) - 1;
        let label = famName;
        if (label.length > maxCh) label = label.substring(0, maxCh - 1) + '\u2026';
        g.append('text')
            .attr('x', 6).attr('y', nodeHeight / 2 + 4)
            .attr('font-size', '10px').attr('font-weight', '600').attr('fill', '#3730a3')
            .text(label);
        g.append('title').text(famName);
    });
    
    // Draw cell nodes
    Object.entries(positions).forEach(([key, pos]) => {
        const idx = pos.realIdx !== undefined ? pos.realIdx : parseInt(key);
        if (isNaN(idx)) return;
        const ct = CELL_TYPES[idx];
        if (!ct) return;
        
        const color = sourceColors[ct.sourceNomenclatureLabel] || '#6b7280';
        const g = nodeGroup.append('g')
            .attr('transform', `translate(${pos.x}, ${pos.y})`)
            .style('cursor', 'pointer')
            .on('click', () => showModal(idx));
        
        g.append('rect')
            .attr('width', pos.width).attr('height', nodeHeight).attr('rx', 4)
            .attr('fill', pos.unconnected ? '#f9fafb' : 'white')
            .attr('stroke', color).attr('stroke-width', 1.5);
        
        // Source color bar
        g.append('rect')
            .attr('x', 0).attr('y', 0).attr('width', 4).attr('height', nodeHeight)
            .attr('rx', 2).attr('fill', color);
        
        const maxCh = Math.floor(pos.width / 6) - 2;
        let label = ct.preferredLabel;
        if (label.length > maxCh) label = label.substring(0, maxCh - 1) + '\u2026';
        g.append('text')
            .attr('x', 10).attr('y', nodeHeight / 2 + 3.5)
            .attr('font-size', '9.5px').attr('fill', '#374151')
            .text(label);
        g.append('title').text(ct.preferredLabel + ' (' + ct.sourceNomenclatureLabel + ')');
    });
}





function showModal(idx) {
    const ct=CELL_TYPES[idx];
    document.getElementById('modalTitle').textContent=ct.preferredLabel;
    let relatedHtml='';
    if(ct.relatedCells&&ct.relatedCells.length>0){relatedHtml=`<div class="detail-section"><h3>🔗 Related Species Variants</h3><div class="related-cells">${ct.relatedCells.map(rc=>`<button class="related-cell-btn" onclick="showModalByName('${rc.label.replace(/'/g,"\\'")}')">${rc.label}</button>`).join('')}</div></div>`;}
    let assertedHtml='';
    const relationships = getAssertedRelationships(idx);
    const hasAnyRelationship = relationships.equivalences.length > 0 || relationships.subtypeOf.length > 0 || relationships.hasSubtypes.length > 0;
    
    if(hasAnyRelationship){
        let innerHtml = '';
        
        // Equivalences
        if(relationships.equivalences.length > 0) {
            const equivLinks = relationships.equivalences.map(r => {
                const arrow = r.direction === 'to' ? '→' : '←';
                const title = r.direction === 'to' ? 'Equivalent to' : 'Equivalent from';
                return `<button class="related-cell-btn equiv-btn" onclick="showModal(${r.idx})" title="${title}">${arrow} ${r.label}</button>`;
            }).join(' ');
            innerHtml += `<div class="asserted-equiv-section"><div class="asserted-label">Equivalent to:</div><div class="related-cells">${equivLinks}</div></div>`;
        }
        
        // Subtype of
        if(relationships.subtypeOf.length > 0) {
            const subtypeLinks = relationships.subtypeOf.map(r => 
                `<button class="related-cell-btn subtype-btn" onclick="showModal(${r.idx})">↑ ${r.label}</button>`
            ).join(' ');
            innerHtml += `<div class="asserted-subtype-section"><div class="asserted-label">Subtype of:</div><div class="related-cells">${subtypeLinks}</div></div>`;
        }
        
        // Has subtypes
        if(relationships.hasSubtypes.length > 0) {
            const hasSubLinks = relationships.hasSubtypes.map(r => 
                `<button class="related-cell-btn subtype-btn" onclick="showModal(${r.idx})">↓ ${r.label}</button>`
            ).join(' ');
            innerHtml += `<div class="asserted-subtype-section"><div class="asserted-label">Has subtypes:</div><div class="related-cells">${hasSubLinks}</div></div>`;
        }
        
        assertedHtml=`<div class="asserted-relationships"><div class="asserted-relationships-title">🔗 Asserted Relationships</div>${innerHtml}</div>`;
    }
    let mapsToHtml = assertedHtml;
    const sourceLinkHtml=ct.sourceNomenclature?`<div class="detail-section"><h3>📚 Source Publication</h3><a href="${ct.sourceNomenclature}" target="_blank" class="source-link">${getSourceLinkText(ct)} ↗</a></div>`:'';
    const sourceDataHtml = ct.sourceData && ct.sourceData.length > 0 ? `<div class="detail-section"><h3>📊 Source Data</h3>${ct.sourceData.map(sd => `<a href="${sd.uri}" target="_blank" class="source-link">${sd.label} ↗</a>`).join('<br>')}</div>` : '';
    // PRECISION Atlas — Gene Distribution links for marker genes present in the PRECISION dataset
    let precisionHtml = '';
    if (ct.sourceNomenclatureLabel === 'big DRG paper' && ct.markerGenes && ct.markerGenes.length > 0) {
        const seenGenes = new Set();
        const precisionMarkers = [];
        for (const g of ct.markerGenes) {
            if (!g.name) continue;
            const canonical = g.name.toUpperCase();
            if (PRECISION_GENES.has(canonical) && !seenGenes.has(canonical)) {
                seenGenes.add(canonical);
                precisionMarkers.push(canonical);
            }
        }
        if (precisionMarkers.length > 0) {
            const buttons = precisionMarkers.map(gene => {
                const url = `${PRECISION_BASE_URL}?dashboard=genedistribution&gene=${encodeURIComponent(gene)}&metadataColumn=${encodeURIComponent('Atlas_annotation')}`;
                return `<a href="${url}" target="_blank" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.35rem 0.75rem;background:#f8f4ff;border:1px solid #c4b5fd;border-radius:6px;text-decoration:none;color:#5b21b6;font-size:0.85em;font-weight:500;transition:background 0.15s;" onmouseover="this.style.background='#ede9fe'" onmouseout="this.style.background='#f8f4ff'"><span style="font-family:monospace;">${gene}</span><span style="color:#7c3aed;font-size:0.9em;">↗</span></a>`;
            });
            precisionHtml = `<div class="detail-section"><h3>🧬 PRECISION Atlas — Gene Expression Distribution</h3><p style="font-size:0.82em;color:#64748b;margin:0 0 0.6rem;">View gene expression by cell type.</p><div style="display:flex;flex-wrap:wrap;gap:0.4rem;">${buttons.join('')}</div></div>`;
        }
    }
    const notesHtml = (ct.alertNotes && ct.alertNotes.length > 0) || (ct.curatorNotes && ct.curatorNotes.length > 0) ? `<div class="detail-section"><h3>📝 Notes</h3><div style="padding:0.5rem 0.75rem;background:#fef9c3;border:1px solid #eab308;border-radius:6px;font-size:0.9rem;line-height:1.5;">${ct.alertNotes && ct.alertNotes.length > 0 ? `<div style="margin-bottom:${ct.curatorNotes && ct.curatorNotes.length > 0 ? '1rem' : '0'};"><strong style="color:#b45309;">⚠️ Alert Notes:</strong>${ct.alertNotes.map(n => `<p style="margin:0.5rem 0 0.5rem 1rem;">${linkifyUrls(n)}</p>`).join('')}</div>` : ''}${ct.curatorNotes && ct.curatorNotes.length > 0 ? `<div><strong style="color:#1e40af;">📋 Curator Notes:</strong>${ct.curatorNotes.map(n => `<p style="margin:0.5rem 0 0.5rem 1rem;">${linkifyUrls(n)}</p>`).join('')}</div>` : ''}</div></div>` : '';
    document.getElementById('modalBody').innerHTML=`<div class="detail-section"><p><strong>Entity:</strong> ${ct.entity}</p><p><strong>Species:</strong> ${ct.species}</p><p><strong>Soma Location:</strong> ${(ct.somaLocations||[ct.somaLocation]).join(', ')}</p>${ct.sensoryTerminalLocations&&ct.sensoryTerminalLocations.length?`<p><strong>Sensory Terminal Location:</strong> ${ct.sensoryTerminalLocations.join(', ')}</p>`:''}${ct.axonTerminalLocations&&ct.axonTerminalLocations.length?`<p><strong>Axon Terminal Location:</strong> ${ct.axonTerminalLocations.join(', ')}</p>`:''}<p><strong>Circuit Role:</strong> ${ct.circuitRole}${ct.neurotransmitter ? ', ' + ct.neurotransmitter : ''}</p>${ct.creLine?`<p><strong>Cre Line:</strong> ${ct.creLine}</p>`:''}</div>${mapsToHtml}${relatedHtml}${precisionHtml}${ct.markerGenes&&ct.markerGenes.length?`<div class="detail-section"><h3>🧬 Marker Genes</h3><div class="gene-grid">${ct.markerGenes.map(g=>`<a href="${g.uri}" target="_blank" class="gene-link">${g.name}${g.expression?`<sup>${g.expression}</sup>`:''} ↗</a>`).join('')}</div></div>`:''}${ct.fiberTypeString?`<div class="detail-section"><h3>🔬 Axon Phenotype</h3><div style="padding:0.5rem 0.75rem;background:#f7fafc;border-radius:6px;font-size:0.9rem;font-weight:600;color:#2d3748;line-height:1.5;border:1px solid #e2e8f0;">${formatFiberType(formatGeneExpression(ct.fiberTypeString))}</div></div>`:''}${ct.physiologyString?`<div class="detail-section"><h3>⚡ Physiology</h3><div style="padding:0.5rem 0.75rem;background:#f0fdf4;border-radius:6px;font-size:0.9rem;font-weight:600;color:#2d3748;line-height:1.5;border:1px solid #bbf7d0;">${formatGeneExpression(ct.physiologyString)}</div></div>`:''}${sourceLinkHtml}${sourceDataHtml}${notesHtml}`;
    document.getElementById('modal').classList.add('show');
}
function showModalByName(name) { const idx=CELL_TYPES.findIndex(ct=>ct.preferredLabel===name); if(idx!==-1)showModal(idx); }
function closeModal() { document.getElementById('modal').classList.remove('show'); }

// ===== Permalink Utilities =====
function showPermalinkToast() {
    const toast = document.getElementById('permalinkToast');
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => { toast.style.display = 'none'; toast.style.opacity = '1'; }, 300); }, 2000);
}

function copyPermalink(paramsObj) {
    const url = new URL(window.location.href.split('?')[0]);
    for (const [k, v] of Object.entries(paramsObj)) {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
    navigator.clipboard.writeText(url.toString()).then(() => showPermalinkToast());
}

function copyCardLink() {
    const p = { view: 'cards' };
    const source = document.getElementById('filterSource').value;
    const species = document.getElementById('filterSpecies').value;
    const axon = document.getElementById('filterAxon').value;
    const location = document.getElementById('filterLocation').value;
    const gene = document.getElementById('filterGene').value;
    const equiv = document.getElementById('filterEquiv').value;
    if (source) p.source = source;
    if (species) p.species = species;
    if (axon) p.axon = axon;
    if (location) p.location = location;
    if (gene) p.gene = gene;
    if (equiv) p.equiv = equiv;
    copyPermalink(p);
}

function copyTreeLink() {
    copyPermalink({ view: 'tree', grouping: treeGrouping });
}

function copySynthesisLink() {
    const p = { view: 'synthesis' };
    p.groupBy = document.getElementById('synthesisGroupBy').value;
    p.sortBy = document.getElementById('synthesisSortBy').value;
    if (document.getElementById('synthesisHighlightEquiv').checked) p.highlightEquiv = 'true';
    if (document.getElementById('synthesisHighlightSubtype').checked) p.highlightSubtype = 'true';
    copyPermalink(p);
}

function copyClusterLink() {
    const p = { view: 'cluster' };
    if (selectedAttributes.length) p.attrs = selectedAttributes.join('|');
    copyPermalink(p);
}

function copyLineageLink() {
    copyPermalink({ view: 'lineage' });
}

// ===== Compare View =====
let compareInitialized = false;
let compareSelectedRow = null;

function getDisplayLabel(ct) {
    return ct.localLabel || ct.preferredLabel;
}

function getUniqueSources() {
    return [...new Set(CELL_TYPES.map(ct => ct.sourceNomenclatureLabel).filter(Boolean))];
}

function getSourceColor(sourceLabel) {
    const ct = CELL_TYPES.find(c => c.sourceNomenclatureLabel === sourceLabel);
    return ct ? ct.sourceColor : '#718096';
}

function buildCompareData(anchorSource, compareSources) {
    const rows = [];
    CELL_TYPES.forEach((ct, idx) => {
        if (ct.sourceNomenclatureLabel !== anchorSource) return;
        const rels = getAssertedRelationships(idx);
        const columns = {};
        for (const cs of compareSources) {
            columns[cs] = {
                equivalences: rels.equivalences.filter(r => CELL_TYPES[r.idx].sourceNomenclatureLabel === cs),
                subtypeOf: rels.subtypeOf.filter(r => CELL_TYPES[r.idx].sourceNomenclatureLabel === cs),
                hasSubtypes: rels.hasSubtypes.filter(r => CELL_TYPES[r.idx].sourceNomenclatureLabel === cs)
            };
        }
        rows.push({ anchorCell: ct, anchorIdx: idx, columns });
    });
    return rows;
}

function renderCompareTable(tableRows, compareSources) {
    const wrapper = document.getElementById('compareTableWrapper');
    if (!compareSources.length) {
        wrapper.innerHTML = '<div class="compare-no-results">Select a comparison source to begin.</div>';
        return;
    }
    if (!tableRows.length) {
        wrapper.innerHTML = '<div class="compare-no-results">No cell types found for the selected anchor source.</div>';
        return;
    }

    const anchorSource = tableRows[0].anchorCell.sourceNomenclatureLabel;
    const anchorColor = getSourceColor(anchorSource);

    let html = '<table class="compare-table"><thead><tr>';
    html += '<th style="background:#718096;width:2rem;"></th>';
    html += `<th style="background:${anchorColor};">${anchorSource}</th>`;
    for (const cs of compareSources) {
        html += `<th style="background:${getSourceColor(cs)};">${cs}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const row of tableRows) {
        const isSelected = compareSelectedRow === row.anchorIdx;
        html += `<tr class="${isSelected ? 'compare-row-selected' : ''}" data-anchor-idx="${row.anchorIdx}">`;
        html += `<td class="compare-expand-btn" onclick="toggleCompareDetail(${row.anchorIdx})">${isSelected ? '▼' : '▶'}</td>`;
        html += `<td><span class="compare-cell-link" onclick="showModal(${row.anchorIdx})">${getDisplayLabel(row.anchorCell)}</span></td>`;

        for (const cs of compareSources) {
            const col = row.columns[cs];
            const parts = [];

            // Deduplicate by idx across relationship types
            const seenIdx = new Set();

            for (const eq of col.equivalences) {
                if (seenIdx.has(eq.idx)) continue;
                seenIdx.add(eq.idx);
                parts.push(`<span class="compare-rel compare-rel-equiv">≡ <span class="compare-cell-link" onclick="showModal(${eq.idx})">${getDisplayLabel(CELL_TYPES[eq.idx])}</span></span>`);
            }
            for (const st of col.subtypeOf) {
                if (seenIdx.has(st.idx)) continue;
                seenIdx.add(st.idx);
                parts.push(`<span class="compare-rel compare-rel-parent">↑ <span class="compare-cell-link" onclick="showModal(${st.idx})">${getDisplayLabel(CELL_TYPES[st.idx])}</span></span>`);
            }
            if (col.hasSubtypes.length > 0) {
                const children = col.hasSubtypes.filter(h => !seenIdx.has(h.idx));
                if (children.length > 0) {
                    const childLinks = children.map(h => {
                        seenIdx.add(h.idx);
                        return `<span class="compare-cell-link" onclick="showModal(${h.idx})">${getDisplayLabel(CELL_TYPES[h.idx])}</span>`;
                    }).join(', ');
                    parts.push(`<span class="compare-rel compare-rel-children">↓ ${childLinks}</span>`);
                }
            }

            html += `<td>${parts.length ? parts.join('') : '<span class="compare-empty">—</span>'}</td>`;
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    wrapper.innerHTML = html;
}

function toggleCompareDetail(anchorIdx) {
    if (compareSelectedRow === anchorIdx) {
        compareSelectedRow = null;
        document.getElementById('compareDetailWrapper').innerHTML = '';
        // Un-highlight row
        document.querySelectorAll('.compare-table tr').forEach(tr => tr.classList.remove('compare-row-selected'));
        document.querySelectorAll('.compare-expand-btn').forEach(btn => btn.textContent = '▶');
    } else {
        compareSelectedRow = anchorIdx;
        // Update row highlighting
        document.querySelectorAll('.compare-table tr').forEach(tr => {
            const idx = parseInt(tr.dataset.anchorIdx);
            tr.classList.toggle('compare-row-selected', idx === anchorIdx);
        });
        document.querySelectorAll('.compare-expand-btn').forEach(btn => {
            const tr = btn.closest('tr');
            btn.textContent = parseInt(tr?.dataset?.anchorIdx) === anchorIdx ? '▼' : '▶';
        });
        renderCompareDetail(anchorIdx);
    }
}

function renderCompareDetail(anchorIdx) {
    const wrapper = document.getElementById('compareDetailWrapper');
    const anchorCt = CELL_TYPES[anchorIdx];
    const rels = getAssertedRelationships(anchorIdx);

    // Collect all related cells (including anchor)
    const allCells = [{ ct: anchorCt, idx: anchorIdx }];
    const seenIdx = new Set([anchorIdx]);
    for (const eq of rels.equivalences) {
        if (!seenIdx.has(eq.idx)) { allCells.push({ ct: CELL_TYPES[eq.idx], idx: eq.idx }); seenIdx.add(eq.idx); }
    }
    for (const st of rels.subtypeOf) {
        if (!seenIdx.has(st.idx)) { allCells.push({ ct: CELL_TYPES[st.idx], idx: st.idx }); seenIdx.add(st.idx); }
    }
    for (const hs of rels.hasSubtypes) {
        if (!seenIdx.has(hs.idx)) { allCells.push({ ct: CELL_TYPES[hs.idx], idx: hs.idx }); seenIdx.add(hs.idx); }
    }

    // Phenotype rows
    const phenotypeRows = [
        { label: 'Species', key: 'species', getValue: ct => ct.species || '—' },
        { label: 'Soma Location', key: 'soma', getValue: ct => (ct.somaLocations && ct.somaLocations.length) ? ct.somaLocations.join(', ') : (ct.somaLocation || '—') },
        { label: 'Functional Phenotype', key: 'physiology', getValue: ct => ct.physiologyString || '—' },
        { label: 'Axon Phenotype', key: 'axon', getValue: ct => ct.fiberTypeString || '—' },
        { label: 'Threshold Phenotype', key: 'threshold', getValue: ct => {
            if (!ct.clusterAttributes) return '—';
            const flags = [];
            if (ct.clusterAttributes.cold_sensitive) flags.push('cold sensitive');
            if (ct.clusterAttributes.heat_sensitive) flags.push('heat sensitive');
            if (ct.clusterAttributes.mechanosensitive_ltm) flags.push('LTM');
            if (ct.clusterAttributes.mechanosensitive_htm) flags.push('HTM');
            if (ct.clusterAttributes.proprioceptive) flags.push('proprioceptive');
            return flags.length ? flags.join(', ') : '—';
        }},
        { label: 'Adaptation Phenotype', key: 'adaptation', getValue: ct => {
            if (!ct.clusterAttributes) return '—';
            const flags = [];
            if (ct.clusterAttributes.rapidly_adapting) flags.push('rapidly adapting');
            if (ct.clusterAttributes.slowly_adapting) flags.push('slowly adapting');
            return flags.length ? flags.join(', ') : '—';
        }},
        { label: 'Marker Genes', key: 'genes', getValue: ct => {
            if (!ct.markerGenes || !ct.markerGenes.length) return '—';
            return ct.markerGenes.map(g => g.name).join(', ');
        }}
    ];

    // Compute values and shared genes
    const allGenes = new Map(); // gene -> count of cells that have it
    for (const { ct } of allCells) {
        if (ct.markerGenes) {
            const seen = new Set();
            for (const g of ct.markerGenes) {
                const key = g.name.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    allGenes.set(key, (allGenes.get(key) || 0) + 1);
                }
            }
        }
    }
    const sharedGenes = new Set([...allGenes.entries()].filter(([, count]) => count > 1).map(([name]) => name));

    // Build table
    let html = `<div class="compare-detail-header"><h3>Phenotype Comparison: ${getDisplayLabel(anchorCt)}</h3><button class="compare-detail-close" onclick="toggleCompareDetail(${anchorIdx})">✕</button></div>`;
    html += '<table class="compare-detail-table"><thead><tr><th style="background:#4a5568;">Phenotype</th>';
    for (const { ct } of allCells) {
        const color = getSourceColor(ct.sourceNomenclatureLabel);
        html += `<th style="background:${color};"><span class="compare-cell-link" onclick="showModal(${allCells.find(c => c.ct === ct).idx})" style="color:white;text-decoration:underline dotted rgba(255,255,255,0.5);">${getDisplayLabel(ct)}</span><br><span style="font-weight:400;font-size:0.7rem;opacity:0.8;">${ct.sourceNomenclatureLabel}</span></th>`;
    }
    html += '</tr></thead><tbody>';

    for (const pRow of phenotypeRows) {
        const values = allCells.map(({ ct }) => pRow.getValue(ct));
        const allSame = values.every(v => v === values[0]);
        html += '<tr>';
        html += `<td>${pRow.label}</td>`;

        for (let i = 0; i < allCells.length; i++) {
            const val = values[i];
            let cellClass = '';
            if (allCells.length > 1) {
                cellClass = allSame ? 'compare-match' : 'compare-diff';
            }

            if (pRow.key === 'genes' && val !== '—') {
                // Highlight shared genes
                const genes = allCells[i].ct.markerGenes.map(g => {
                    const isShared = sharedGenes.has(g.name.toLowerCase());
                    return `<span class="${isShared ? 'compare-gene-shared' : ''}">${g.name}</span>`;
                }).join(', ');
                html += `<td class="${cellClass}">${genes}</td>`;
            } else {
                html += `<td class="${cellClass}">${val}</td>`;
            }
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    wrapper.innerHTML = html;
}

function getCompareSelections() {
    const anchor = document.getElementById('compareAnchorSelect').value;
    const selects = document.querySelectorAll('#compareSelectors select');
    const compareSources = [...selects].map(s => s.value).filter(Boolean);
    return { anchor, compareSources };
}

function updateCompareTable() {
    const { anchor, compareSources } = getCompareSelections();
    if (!anchor) return;
    compareSelectedRow = null;
    document.getElementById('compareDetailWrapper').innerHTML = '';
    const tableRows = buildCompareData(anchor, compareSources);
    renderCompareTable(tableRows, compareSources);
}

function addCompareSource(preselect) {
    const container = document.getElementById('compareSelectors');
    const anchor = document.getElementById('compareAnchorSelect').value;
    const existingSelects = container.querySelectorAll('select');
    const usedSources = new Set([anchor, ...[...existingSelects].map(s => s.value).filter(Boolean)]);
    const available = getUniqueSources().filter(s => !usedSources.has(s));
    if (!available.length) return;

    const wrapper = document.createElement('span');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '0.2rem';

    const select = document.createElement('select');
    select.innerHTML = '<option value="">Select source...</option>' + available.map(s => `<option value="${s}"${preselect === s ? ' selected' : ''}>${s}</option>`).join('');
    select.addEventListener('change', updateCompareTable);
    select.style.cssText = 'padding:0.4rem 0.75rem;border-radius:6px;border:1px solid #cbd5e0;font-size:0.85rem;background:white;';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'compare-remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => { wrapper.remove(); updateCompareTable(); };

    wrapper.appendChild(select);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);

    if (preselect) updateCompareTable();
}

function copyCompareLink() {
    const { anchor, compareSources } = getCompareSelections();
    const p = { view: 'compare' };
    if (anchor) p.anchor = anchor;
    if (compareSources.length) p.compare = compareSources.join('|');
    copyPermalink(p);
}

function renderCompareView(anchorPreset, comparePreset) {
    const anchorSelect = document.getElementById('compareAnchorSelect');
    const sources = getUniqueSources();

    if (!compareInitialized) {
        // Populate anchor dropdown
        anchorSelect.innerHTML = sources.map(s => `<option value="${s}">${s}</option>`).join('');
        if (anchorPreset && sources.includes(anchorPreset)) {
            anchorSelect.value = anchorPreset;
        }
        anchorSelect.addEventListener('change', () => {
            // Clear compare selectors and rebuild
            document.getElementById('compareSelectors').innerHTML = '';
            document.getElementById('compareDetailWrapper').innerHTML = '';
            compareSelectedRow = null;
            updateCompareTable();
        });

        // Add Source button
        document.getElementById('compareAddSourceBtn').addEventListener('click', () => addCompareSource());

        // Copy Link button
        document.getElementById('compareCopyLinkBtn').addEventListener('click', copyCompareLink);

        compareInitialized = true;
    }

    // If presets provided (from URL params), set them up
    if (anchorPreset && sources.includes(anchorPreset)) {
        anchorSelect.value = anchorPreset;
    }

    if (comparePreset && comparePreset.length) {
        document.getElementById('compareSelectors').innerHTML = '';
        for (const cs of comparePreset) {
            if (sources.includes(cs) && cs !== anchorSelect.value) {
                addCompareSource(cs);
            }
        }
    }

    updateCompareTable();
}

document.addEventListener('DOMContentLoaded', () => {
    renderCards();
    initGeneButtons();
    document.querySelectorAll('.view-btn').forEach(btn=>{btn.addEventListener('click',()=>switchView(btn.dataset.view));});
    document.getElementById('modal').addEventListener('click',(e)=>{if(e.target.id==='modal')closeModal();});
    document.getElementById('uploadModal').addEventListener('click',(e)=>{if(e.target.id==='uploadModal')closeUploadModal();});
    document.querySelectorAll('.cluster-controls .attr-btn').forEach(btn=>{btn.addEventListener('click',()=>handleAttrClick(btn));});

    // Deep-link support: parse URL parameters to set view and filters
    // Example: ?view=cards&source=big+DRG+paper&species=mouse&axon=fiber_c&location=soma_drg&gene=Trpv1&equiv=yes&cell=CLTM1
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
        const view = params.get('view');
        const source = params.get('source');
        const species = params.get('species');
        const axon = params.get('axon');
        const location = params.get('location');
        const gene = params.get('gene');
        const equiv = params.get('equiv');
        const cell = params.get('cell');
        const atlasAnnotation = params.get('atlasannotation');

        // Switch view if specified (default to cards)
        if (view && ['cards','tree','synthesis','cluster','lineage','compare'].includes(view)) {
            if (view === 'compare') {
                const anchor = params.get('anchor');
                const compareParam = params.get('compare');
                const compareSources = compareParam ? compareParam.split('|').map(s => s.trim()) : [];
                switchView('compare');
                renderCompareView(anchor, compareSources);
            } else {
                switchView(view);
            }

            // Restore view-specific state from URL params
            if (view === 'tree') {
                const grouping = params.get('grouping');
                if (grouping && (grouping === 'location' || grouping === 'axon')) {
                    setTreeGrouping(grouping);
                }
            }
            if (view === 'synthesis') {
                const groupBy = params.get('groupBy');
                const sortBy = params.get('sortBy');
                const highlightEquiv = params.get('highlightEquiv');
                const highlightSubtype = params.get('highlightSubtype');
                let needsRender = false;
                if (groupBy) { document.getElementById('synthesisGroupBy').value = groupBy; needsRender = true; }
                if (sortBy) { document.getElementById('synthesisSortBy').value = sortBy; needsRender = true; }
                if (highlightEquiv === 'true') { document.getElementById('synthesisHighlightEquiv').checked = true; needsRender = true; }
                if (highlightSubtype === 'true') { document.getElementById('synthesisHighlightSubtype').checked = true; needsRender = true; }
                if (needsRender) renderSynthesisView();
            }
            if (view === 'cluster') {
                const attrsParam = params.get('attrs');
                if (attrsParam) {
                    const attrs = attrsParam.split('|');
                    // Wait briefly for cluster to initialize, then click matching attr buttons
                    setTimeout(() => {
                        attrs.forEach(attr => {
                            const btn = document.querySelector(`.attr-btn[data-attr="${attr}"]`);
                            if (btn) btn.click();
                        });
                    }, 100);
                }
            }
        }

        // Apply card-view filters by setting dropdown values
        let filtersApplied = false;
        if (source) {
            const el = document.getElementById('filterSource');
            const opt = [...el.options].find(o => o.value.toLowerCase() === source.toLowerCase());
            if (opt) { el.value = opt.value; filtersApplied = true; }
        }
        if (species) {
            const el = document.getElementById('filterSpecies');
            const opt = [...el.options].find(o => o.value.toLowerCase() === species.toLowerCase());
            if (opt) { el.value = opt.value; filtersApplied = true; }
        }
        if (axon) {
            const el = document.getElementById('filterAxon');
            const opt = [...el.options].find(o => o.value === axon);
            if (opt) { el.value = opt.value; filtersApplied = true; }
        }
        if (location) {
            const el = document.getElementById('filterLocation');
            const opt = [...el.options].find(o => o.value === location);
            if (opt) { el.value = opt.value; filtersApplied = true; }
        }
        if (gene) {
            const el = document.getElementById('filterGene');
            const opt = [...el.options].find(o => o.value.toLowerCase() === gene.toLowerCase());
            if (opt) { el.value = opt.value; filtersApplied = true; }
        }
        if (equiv) {
            const el = document.getElementById('filterEquiv');
            if (equiv === 'yes' || equiv === 'no') { el.value = equiv; filtersApplied = true; }
        }

        if (filtersApplied) {
            applyCardFilters();
        }

        // Open a specific cell modal by preferred label or atlas annotation
        if (cell) {
            showModalByName(cell);
        } else if (atlasAnnotation) {
            const cellName = ATLAS_TO_CELL[atlasAnnotation];
            if (cellName) {
                showModalByName(cellName);
            }
        }
    }
});
