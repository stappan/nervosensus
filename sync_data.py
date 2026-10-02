#!/usr/bin/env python3
"""
sync_data.py — Sync Excel → js/data.js

Reads the NPO cell type Excel file (.xlsx), parses the 'forNervoSensus' sheet,
and writes js/data.js with the four constants:
    DEFAULT_FAMILIES, DEFAULT_CELL_TYPES, DEFAULT_GENES, DEFAULT_SOURCES

Usage:
    python sync_data.py                     # auto-finds .xlsx in project dir
    python sync_data.py path/to/file.xlsx   # specify a file
    python sync_data.py file.xlsx --max-row 3612   # ingest only up to sheet row 3612
"""

import json
import os
import sys
import glob
from datetime import date

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl is required.  Install with:  pip install openpyxl")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SOURCE_COLORS = [
    '#667eea',  # CSA paper
    '#f59e0b',  # big DRG paper
    '#22c55e',  # Tavares-Ferreira
    '#ef4444',  # Yu et al.
    '#8b5cf6',  # Krauter et al.
    '#06b6d4',  # Qi et al.
    '#ec4899',  # Kupari et al.
]


# Spinal regions of the dorsal root ganglion and their segment-level ganglia,
# from UBERON (UBERON_0000044 'dorsal root ganglion' -> regional DRG -> segment
# DRG; verified against OLS). Segments are listed in anatomical order. Used to
# group ilxtr:hasSomaLocatedIn segment rows by region on the cell detail page.
UBERON = 'http://purl.obolibrary.org/obo/UBERON_'
SPINAL_REGIONS_BY_SOMA = {
    UBERON + '0000044': [  # dorsal root ganglion
        ('cervical', [('C1', '0002838'), ('C2', '0002839'), ('C3', '0002840'), ('C4', '0002841'),
                      ('C5', '0002842'), ('C6', '0007711'), ('C7', '0002843'), ('C8', '0002844')]),
        ('thoracic', [('T1', '0002845'), ('T2', '0002846'), ('T3', '0002847'), ('T4', '0007712'),
                      ('T5', '0002848'), ('T6', '0002849'), ('T7', '0002850'), ('T8', '0002851'),
                      ('T9', '0002852'), ('T10', '0002853'), ('T11', '0002854'), ('T12', '0002855')]),
        ('lumbar',   [('L1', '0002857'), ('L2', '0002856'), ('L3', '0002858'), ('L4', '0003943'),
                      ('L5', '0002859'), ('L6', '1200001')]),
        ('sacral',   [('S1', '0002860'), ('S2', '0002861'), ('S3', '0002862'), ('S4', '0007713'),
                      ('S5', '0002863')]),
    ],
}
# segment IRI -> (soma IRI, region, short name, anatomical order)
SPINAL_SEGMENTS = {}
for _soma_iri, _regions in SPINAL_REGIONS_BY_SOMA.items():
    for _region, _segs in _regions:
        for _order, (_short, _num) in enumerate(_segs):
            SPINAL_SEGMENTS[UBERON + _num] = (_soma_iri, _region, _short, _order)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def safe_str(val):
    """Return trimmed string; treat None and 'none' (case-insensitive) as ''."""
    if val is None:
        return ''
    s = str(val).strip()
    if s.lower() == 'none':
        return ''
    return s


def summarize_ages(raw):
    """Split an ilxtr:observedAtAgeInYears list into the parts shown on the detail page.

    Uses only the values given: min/max of the numeric entries (written as in the
    sheet), the non-numeric entries verbatim in sheet order, and the entry count.
    """
    values = [t.strip() for t in raw.split(',') if t.strip()]
    numeric = []
    other = []
    for v in values:
        try:
            numeric.append((float(v), v))
        except ValueError:
            other.append(v)
    summary = {'values': values, 'count': len(values), 'other': other}
    if numeric:
        summary['min'] = min(numeric)[1]
        summary['max'] = max(numeric)[1]
    return summary


def find_xlsx(project_dir):
    """Find the first .xlsx file in the project directory."""
    candidates = glob.glob(os.path.join(project_dir, '*.xlsx'))
    if not candidates:
        return None
    # Prefer files with 'NPO' in the name
    for c in candidates:
        if 'NPO' in os.path.basename(c).upper():
            return c
    return candidates[0]


CANONICAL_HEADERS = {
    'neuron id': 'Neuron ID',
    'npo property': 'NPO Property',
    'property value label': 'Property Value Label',
    'npo property value iri': 'NPO Property Value IRI',
    'union set number': 'Union set number',
    'nest intersection number': 'Nest intersection number',
    'npokb id': 'npokb ID',
    'proposed action': 'Proposed action',
    'modifier': 'Modifier',
    'determinedbymethod': 'determinedByMethod',
}


def read_excel(path, max_row=None):
    """Read the data sheet and return rows as list of dicts.

    max_row is a 1-based sheet row number (header = row 1); rows after it are ignored.
    """
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)

    # Find the sheet (case-insensitive match, try multiple known names)
    sheet_name = None
    known_names = ['pnscellstonpo', 'fornervosensus']
    for name in wb.sheetnames:
        if name.lower().replace(' ', '') in known_names:
            sheet_name = name
            break

    if sheet_name is None:
        print(f"ERROR: No recognized sheet found. Available: {wb.sheetnames}")
        sys.exit(1)

    ws = wb[sheet_name]
    rows = []
    headers = None
    for i, row in enumerate(ws.iter_rows(values_only=True, max_row=max_row)):
        if i == 0:
            raw = [str(h).strip() if h else '' for h in row]
            headers = [CANONICAL_HEADERS.get(h.lower(), h) for h in raw]
            continue
        if all(c is None for c in row):
            continue
        rows.append(dict(zip(headers, row)))
    wb.close()
    return rows


# ---------------------------------------------------------------------------
# Main parsing logic — mirrors parseNPOData() in js/app.js lines 116-367
# ---------------------------------------------------------------------------

def parse_npo_data(rows):
    """
    Replicate the JavaScript parseNPOData() function.
    Returns (families, cell_types, genes, sources).
    """
    # ------------------------------------------------------------------
    # First pass: collect all data by neuron
    # ------------------------------------------------------------------
    neurons = {}  # neuron_id -> list of property dicts
    neuron_npokb = {}  # neuron_id -> npokb:Id CURIE
    neuron_base_class = {}  # neuron_id -> "neuron" or "cell"
    npokb_first_nid = {}  # npokb:Id -> first Neuron ID seen for it
    skipped_dont_add = 0
    errors = []

    for row_num, row in enumerate(rows, start=2):
        neuron_id = safe_str(row.get('Neuron ID'))
        npo_prop = safe_str(row.get('NPO Property'))
        value_label = row.get('Property Value Label')
        value_iri = row.get('NPO Property Value IRI')
        union_num = row.get('Union set number') or row.get('')
        nest_num = row.get('Nest intersection number')
        npokb_id = safe_str(row.get('npokb ID'))
        proposed_action = safe_str(row.get('Proposed action'))
        modifier = safe_str(row.get('Modifier'))
        determined_by = safe_str(row.get('determinedByMethod'))

        if not neuron_id:
            continue

        # Validate Proposed action: only blank or "don't add"
        if proposed_action and proposed_action.lower() != "don't add":
            errors.append(f"Row {row_num}: unexpected Proposed action '{proposed_action}' (Neuron ID: {neuron_id})")

        if proposed_action.lower() == "don't add":
            skipped_dont_add += 1
            continue

        # Validate npokb ID presence
        if not npokb_id:
            errors.append(f"Row {row_num}: missing npokb ID (Neuron ID: {neuron_id})")

        val = safe_str(value_label)
        iri = safe_str(value_iri)

        # Group rows by npokb ID: later row blocks for a cell may use a different
        # Neuron ID text, so they merge into the first block seen for that ID.
        if npokb_id:
            neuron_id = npokb_first_nid.setdefault(npokb_id, neuron_id)

        if npokb_id and neuron_id:
            neuron_npokb[neuron_id] = npokb_id

        if neuron_id not in neurons:
            neurons[neuron_id] = []

        # Detect baseClass from NPO Property rows
        if npo_prop == 'ilxtr:neurondmBaseClass' and val:
            neuron_base_class[neuron_id] = val.lower()

        neurons[neuron_id].append({
            'npo': npo_prop,
            'union': union_num,
            'nest': nest_num,
            'value': val,
            'iri': iri,
            'modifier': modifier,
            'determinedBy': determined_by,
        })

    if errors:
        print(f"\nERROR: {len(errors)} data integrity issue(s) — ingest halted:")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)

    print(f"  Rows skipped (don't add): {skipped_dont_add}")

    # ------------------------------------------------------------------
    # Build entity (rdfs:label) → npokb:Id mapping
    # ------------------------------------------------------------------
    entity_to_npokb = {}
    for nid, props in neurons.items():
        npokb_id = neuron_npokb.get(nid, '')
        for p in props:
            if p['npo'] == 'rdfs:label' and p['value'] and npokb_id:
                entity_to_npokb[p['value']] = npokb_id

    # ------------------------------------------------------------------
    # Build master cell npokb:Id set and prefLabel mapping
    # ------------------------------------------------------------------
    master_npokb_ids = set()
    master_npokb_to_pref = {}  # npokb:Id -> prefLabel

    for nid, props in neurons.items():
        if 'master' not in nid.lower():
            continue
        npokb_id = neuron_npokb.get(nid, '')
        if npokb_id:
            master_npokb_ids.add(npokb_id)
        pref = ''
        for p in props:
            if p['npo'] == 'skos:prefLabel':
                pref = p['value']
        if pref and npokb_id:
            master_npokb_to_pref[npokb_id] = pref

    # ------------------------------------------------------------------
    # Collect sources
    # ------------------------------------------------------------------
    sources = {}  # url -> { label, cells[] }

    for nid, props in neurons.items():
        if 'master' in nid.lower():
            continue
        for p in props:
            if p['npo'] == 'ilxtr:literatureCitation' and p['iri']:
                if p['iri'] not in sources:
                    sources[p['iri']] = {'label': p['value'] or p['iri'], 'cells': []}
                if nid not in sources[p['iri']]['cells']:
                    sources[p['iri']]['cells'].append(nid)

    source_color_map = {}
    for i, (url, data) in enumerate(sources.items()):
        source_color_map[url] = {
            'color': SOURCE_COLORS[i % len(SOURCE_COLORS)],
            'label': data['label'],
            'count': len(data['cells']),
        }

    # ------------------------------------------------------------------
    # Process cells
    # ------------------------------------------------------------------
    cell_types = []
    gene_map = {}  # base_name -> { display, cells[] }
    warnings = []

    for nid, props in neurons.items():
        if 'master' in nid.lower():
            continue

        # Find source for this cell
        source_url = ''
        source_label = ''
        for p in props:
            if p['npo'] == 'ilxtr:literatureCitation' and p['iri']:
                source_url = p['iri']
                source_label = p['value'] or p['iri']

        sc = source_color_map.get(source_url, {})
        source_color = sc.get('color', '#667eea')

        base_class = neuron_base_class.get(nid, 'neuron')

        ct = {
            'id': neuron_npokb.get(nid, ''),
            'entity': '',
            'preferredLabel': '',
            'baseClass': base_class,
            'species': 'unknown',
            'circuitRole': '',
            'neurotransmitter': '',
            'somaLocation': '',
            'somaLocations': [],
            'sensoryTerminalLocations': [],
            'axonTerminalLocations': [],
            'sourceNomenclature': source_url,
            'sourceNomenclatureLabel': source_label,
            'sourceColor': source_color,
            'markerGenes': [],
            'geneExpressionString': '',
            'fiberTypeString': '',
            'fiberTypeStringAbbrev': '',
            'physiologyString': '',
            'physiologyStringAbbrev': '',
            'thresholdString': '',
            'adaptationString': '',
            'functionalString': '',
            'creLine': '',
            'color': source_color,
            'masterLabel': '',
            'relatedCells': [],
            'mapsTo': [],
            'assertedSubclassOf': [],
            'geneBaseNames': [],
            'alertNotes': [],
            'curatorNotes': [],
            'sourceData': [],
            'localLabel': '',
            'subClassOf': [],
            'biologicalSex': [],
            'clusterAttributes': {
                'cold_sensitive': False,
                'heat_sensitive': False,
                'mechanosensitive_ltm': False,
                'mechanosensitive_htm': False,
                'proprioceptive': False,
                'rapidly_adapting': False,
                'slowly_adapting': False,
                'fiber_a_beta': False,
                'fiber_a_delta': False,
                'fiber_c': False,
                'species_mouse': False,
                'species_human': False,
                'species_macaque': False,
                'species_guinea_pig': False,
                'soma_drg': False,
                'soma_tg': False,
            },
        }

        gene_items = []
        threshold_items = []
        adaptation_items = []
        functional_items = []
        axon_items = []
        soma_iris = []
        soma_label_by_iri = {}
        segment_rows = []
        species_seen = []

        for p in props:
            npo = p['npo']
            val = p['value']
            iri = p['iri']

            if npo == 'rdfs:label':
                ct['entity'] = val

            elif npo == 'skos:prefLabel':
                ct['preferredLabel'] = val

            elif npo == 'ilxtr:localLabel':
                ct['localLabel'] = val

            elif npo == 'ilxtr:hasInstanceInTaxon':
                if val.lower() not in species_seen:
                    species_seen.append(val.lower())
                ct['species'] = val.lower()
                sp_key = 'species_' + val.lower().replace(' ', '_')
                if sp_key in ct['clusterAttributes']:
                    ct['clusterAttributes'][sp_key] = True

            elif npo == 'ilxtr:hasCircuitRolePhenotype':
                ct['circuitRole'] = val

            elif npo == 'ilxtr:hasNeurotransmitterPhenotype':
                ct['neurotransmitter'] = val.strip()

            elif npo == 'ilxtr:hasSomaLocatedIn' and iri in SPINAL_SEGMENTS:
                # Segment-level ganglion: kept out of somaLocations so tree/cluster
                # grouping is unchanged; shown under its region on the detail page.
                segment_rows.append(iri)

            elif npo == 'ilxtr:hasSomaLocatedIn' and val:
                if iri and iri not in soma_iris:
                    soma_iris.append(iri)
                    soma_label_by_iri[iri] = val
                if val not in ct['somaLocations']:
                    ct['somaLocations'].append(val)
                if 'dorsal root' in val.lower():
                    ct['clusterAttributes']['soma_drg'] = True
                if 'trigeminal' in val.lower():
                    ct['clusterAttributes']['soma_tg'] = True

            elif npo == 'ilxtr:hasAxonSensoryTerminalLocatedIn' and val:
                if val not in ct['sensoryTerminalLocations']:
                    ct['sensoryTerminalLocations'].append(val)

            elif npo == 'ilxtr:hasAxonTerminalLocatedIn' and val:
                if val not in ct['axonTerminalLocations']:
                    ct['axonTerminalLocations'].append(val)

            elif npo == 'ilxtr:hasDriverExpressionConstitutivePhenotype':
                ct['creLine'] = val

            elif npo in ('TEMP:mapsTo', 'ilxtr:mapsTo'):
                target_id = iri if iri.startswith('npokb:') else entity_to_npokb.get(val, '')
                ct['mapsTo'].append({'label': val, 'iri': iri, 'id': target_id})

            elif npo in ('ilxtr:hasExpressionPhenotype',
                         'ilxtr:hasNucleicAcidExpressionPhenotype') and val:
                parts = val.split(' ', 1)
                nm = parts[0]
                exp = parts[1] if len(parts) > 1 else ''
                display = nm + '^' + exp if exp else nm
                gene_items.append({'union': p['union'], 'nest': p['nest'], 'display': display})
                gene_entry = {'name': nm, 'uri': iri or '', 'expression': exp}
                if p['determinedBy']:
                    gene_entry['determinedBy'] = p['determinedBy']
                if npo == 'ilxtr:hasNucleicAcidExpressionPhenotype' and p['modifier']:
                    gene_entry['expressionLevel'] = p['modifier']
                ct['markerGenes'].append(gene_entry)
                base = nm.lower()
                if base not in ct['geneBaseNames']:
                    ct['geneBaseNames'].append(base)
                if base not in gene_map:
                    gene_map[base] = {'display': nm, 'cells': []}
                gene_map[base]['cells'].append(ct['preferredLabel'])

            elif npo == 'ilxtr:hasAxonPhenotype' and val:
                item = {'union': p['union'], 'nest': p['nest'], 'display': val}
                if p['determinedBy']:
                    item['determinedBy'] = p['determinedBy']
                axon_items.append(item)
                vl = val.lower()
                if 'beta' in vl or '(beta)' in vl or 'β' in vl:
                    ct['clusterAttributes']['fiber_a_beta'] = True
                if 'delta' in vl or '(delta)' in vl or 'δ' in vl:
                    ct['clusterAttributes']['fiber_a_delta'] = True
                if 'type c' in vl:
                    ct['clusterAttributes']['fiber_c'] = True

            elif npo in ('ilxtr:hasThresholdPhenotype',
                         'ilxtr:hasPredictedThresholdPhenotype') and val:
                item = {'union': p['union'], 'nest': p['nest'], 'display': val}
                if p['determinedBy']:
                    item['determinedBy'] = p['determinedBy']
                threshold_items.append(item)
                vl = val.lower()
                if 'ltm' in vl or 'low-threshold' in vl:
                    ct['clusterAttributes']['mechanosensitive_ltm'] = True
                if 'htm' in vl or 'high-threshold' in vl:
                    ct['clusterAttributes']['mechanosensitive_htm'] = True

            elif npo == 'ilxtr:hasAdaptationPhenotype' and val:
                item = {'union': p['union'], 'nest': p['nest'], 'display': val}
                if p['determinedBy']:
                    item['determinedBy'] = p['determinedBy']
                adaptation_items.append(item)
                vl = val.lower()
                if 'rapidly' in vl or '(ra)' in vl:
                    ct['clusterAttributes']['rapidly_adapting'] = True
                if 'slowly' in vl or 'sa1' in vl:
                    ct['clusterAttributes']['slowly_adapting'] = True

            elif npo == 'ilxtr:hasFunctionalPhenotype' and val:
                item = {'union': p['union'], 'nest': p['nest'], 'display': val}
                if p['determinedBy']:
                    item['determinedBy'] = p['determinedBy']
                functional_items.append(item)
                vl = val.lower()
                if 'cold' in vl:
                    ct['clusterAttributes']['cold_sensitive'] = True
                if 'heat' in vl:
                    ct['clusterAttributes']['heat_sensitive'] = True
                if 'proprioceptive' in vl:
                    ct['clusterAttributes']['proprioceptive'] = True

            elif npo in ('ilxtr:alertNote', 'alertNote') and val:
                ct['alertNotes'].append(val)

            elif npo in ('ilxtr:curatorNote', 'curatorNote') and val:
                ct['curatorNotes'].append(val)

            elif npo == 'ilxtr:hasBiologicalSex' and val:
                if val not in ct['biologicalSex']:
                    ct['biologicalSex'].append(val)

            elif npo == 'ilxtr:observedAtAgeInYears' and val:
                if 'observedAge' in ct:
                    warnings.append(f"{ct['id']}: more than one ilxtr:observedAtAgeInYears row; using the first")
                else:
                    ct['observedAge'] = summarize_ages(val)

            elif npo == 'ilxtr:dataCitation' and (val or iri):
                ct['sourceData'].append({'label': val or iri, 'uri': iri or ''})

            elif npo in ('TEMP:subClassOf', 'TEMP:assertedSubClassOf'):
                target_id = iri if iri.startswith('npokb:') else entity_to_npokb.get(val, '')
                ct['assertedSubclassOf'].append({'label': val, 'iri': iri, 'id': target_id})

            elif npo == 'ilxtr:subClassOf' and val:
                if val not in ct['subClassOf']:
                    ct['subClassOf'].append(val)

        # Build derived strings
        # dict.fromkeys drops repeats (same gene listed in more than one row block)
        ct['geneExpressionString'] = ' + '.join(dict.fromkeys(g['display'] for g in gene_items))
        ct['fiberTypeString'] = ' + '.join(a['display'] for a in axon_items)
        ct['fiberTypeStringAbbrev'] = ct['fiberTypeString']

        # Collect determinedByMethod badges for axon phenotype
        axon_methods = list(dict.fromkeys(a['determinedBy'] for a in axon_items if a.get('determinedBy')))
        if axon_methods:
            ct['fiberTypeMethods'] = axon_methods

        ct['thresholdString'] = ', '.join(p['display'] for p in threshold_items)
        ct['adaptationString'] = ', '.join(p['display'] for p in adaptation_items)
        ct['functionalString'] = ', '.join(p['display'] for p in functional_items)
        all_phys = threshold_items + adaptation_items + functional_items
        ct['physiologyString'] = ' + '.join(p['display'] for p in all_phys)
        ct['physiologyStringAbbrev'] = ct['physiologyString']

        # Collect determinedByMethod badges for physiology
        phys_methods = list(dict.fromkeys(p['determinedBy'] for p in all_phys if p.get('determinedBy')))
        if phys_methods:
            ct['physiologyMethods'] = phys_methods

        if ct['somaLocations']:
            ct['somaLocation'] = ct['somaLocations'][0]

        # Spinal regions: every region of the soma location is listed (empty ones
        # included) so a missing region reads as "no data", not as forgotten.
        for soma_iri in soma_iris:
            if soma_iri in SPINAL_REGIONS_BY_SOMA:
                found = {}
                for seg_iri in dict.fromkeys(segment_rows):
                    seg_soma, region, short, order = SPINAL_SEGMENTS[seg_iri]
                    if seg_soma == soma_iri:
                        found.setdefault(region, []).append((order, short))
                ct['spinalRegions'] = [
                    {'region': region, 'segments': [short for _, short in sorted(found.get(region, []))]}
                    for region, _ in SPINAL_REGIONS_BY_SOMA[soma_iri]
                ]
                ct['spinalRegionsOf'] = soma_label_by_iri[soma_iri]
                break
        if segment_rows and 'spinalRegions' not in ct:
            warnings.append(f"{ct['id']}: has spinal segment rows but no matching soma location")

        if len(species_seen) > 1 and (ct['biologicalSex'] or 'observedAge' in ct):
            warnings.append(f"{ct['id']}: biological sex / age given for a cell with "
                            f"{len(species_seen)} species ({', '.join(species_seen)}); "
                            "these can't be attributed to one species")

        # Deduplicate markerGenes by base name (protein + RNA rows for same gene)
        seen_genes = {}
        deduped_genes = []
        for g in ct['markerGenes']:
            base = g['name'].lower()
            if base in seen_genes:
                existing = seen_genes[base]
                if g.get('expressionLevel') and not existing.get('expressionLevel'):
                    existing['expressionLevel'] = g['expressionLevel']
                if g.get('determinedBy') and not existing.get('determinedBy'):
                    existing['determinedBy'] = g['determinedBy']
            else:
                seen_genes[base] = g
                deduped_genes.append(g)
        ct['markerGenes'] = deduped_genes

        # Only include cells that have a preferredLabel
        if ct['preferredLabel']:
            cell_types.append(ct)

    # ------------------------------------------------------------------
    # Derive masterLabel and relatedCells from assertedSubclassOf triples
    # ------------------------------------------------------------------
    master_to_children = {}
    for ct in cell_types:
        for rel in ct['assertedSubclassOf']:
            if rel['id'] in master_npokb_ids:
                ct['masterLabel'] = master_npokb_to_pref.get(rel['id'], rel['label'])
                if ct['masterLabel'] not in master_to_children:
                    master_to_children[ct['masterLabel']] = []
                master_to_children[ct['masterLabel']].append({
                    'id': ct['id'],
                    'label': ct['preferredLabel'],
                    'species': ct['species'],
                })
                break

    for ct in cell_types:
        ml = ct['masterLabel']
        if ml and ml in master_to_children:
            ct['relatedCells'] = [
                {'id': sib['id'], 'label': sib['label'], 'species': sib['species']}
                for sib in master_to_children[ml]
                if sib['label'] != ct['preferredLabel']
            ]

    # ------------------------------------------------------------------
    # Build genes list
    # ------------------------------------------------------------------
    genes = []
    for base, data in gene_map.items():
        genes.append({
            'id': 'gene_' + base,
            'base': base,
            'display': data['display'],
            'cells': list(dict.fromkeys(data['cells'])),  # deduplicate, preserve order
        })

    # ------------------------------------------------------------------
    # Build families from master cells (preserving order from Excel)
    # ------------------------------------------------------------------
    # Build preferredLabel → npokb:Id mapping for child lookups
    pref_to_npokb = {}
    for ct in cell_types:
        if ct['preferredLabel'] and ct['id']:
            pref_to_npokb[ct['preferredLabel']] = ct['id']

    families = []
    for nid, props in neurons.items():
        if 'master' not in nid.lower():
            continue
        pref_label = ''
        for p in props:
            if p['npo'] == 'skos:prefLabel':
                pref_label = p['value']
        if not pref_label:
            continue
        children = [{'id': c['id'], 'label': c['label']} for c in master_to_children.get(pref_label, [])]
        families.append({
            'id': neuron_npokb.get(nid, ''),
            'name': pref_label,
            'children': children,
        })

    if warnings:
        print(f"\n  WARNING: {len(warnings)} subject/location issue(s):")
        for w in warnings:
            print(f"    - {w}")

    return families, cell_types, genes, source_color_map


# ---------------------------------------------------------------------------
# Write js/data.js
# ---------------------------------------------------------------------------

DATA_VERSION = '0.1.0-beta'

def write_data_js(out_path, families, cell_types, genes, source_color_map, source_file, max_row=None):
    """Write the data constants and version info to js/data.js."""

    neuron_count = sum(1 for ct in cell_types if (ct.get('baseClass') or 'neuron') == 'neuron')
    non_neuron_count = len(cell_types) - neuron_count

    version_info = {
        'version': DATA_VERSION,
        'date': date.today().isoformat(),
        'cellCount': len(cell_types),
        'neuronCount': neuron_count,
        'nonNeuronCount': non_neuron_count,
        'sourceCount': len(source_color_map),
        'sourceFile': os.path.basename(source_file),
    }
    if max_row:
        version_info['sourceMaxRow'] = max_row

    families_json = json.dumps(families, ensure_ascii=False, separators=(',', ':'))
    cells_json = json.dumps(cell_types, ensure_ascii=False, separators=(',', ':'))
    genes_json = json.dumps(genes, ensure_ascii=False, separators=(',', ':'))
    sources_json = json.dumps(source_color_map, ensure_ascii=False, separators=(',', ':'))
    version_json = json.dumps(version_info, ensure_ascii=False, separators=(',', ':'))

    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(f'const DATA_VERSION = {version_json};\n')
        f.write(f'const DEFAULT_FAMILIES = {families_json};\n')
        f.write(f'const DEFAULT_CELL_TYPES = {cells_json};\n')
        f.write(f'const DEFAULT_GENES = {genes_json};\n')
        f.write('\n\n')
        f.write(f'const DEFAULT_SOURCES = {sources_json};\n')

    print(f"Wrote {out_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))

    args = sys.argv[1:]
    max_row = None
    if '--max-row' in args:
        i = args.index('--max-row')
        try:
            max_row = int(args[i + 1])
        except (IndexError, ValueError):
            print("ERROR: --max-row needs a row number, e.g.  --max-row 3612")
            sys.exit(1)
        del args[i:i + 2]

    # Determine Excel file path
    if args:
        xlsx_path = args[0]
    else:
        xlsx_path = find_xlsx(project_dir)

    if not xlsx_path or not os.path.isfile(xlsx_path):
        print("ERROR: No .xlsx file found. Provide a path:  python sync_data.py path/to/file.xlsx")
        sys.exit(1)

    print(f"Reading: {os.path.basename(xlsx_path)}"
          + (f" (rows 2-{max_row})" if max_row else ""))

    # Read and parse
    rows = read_excel(xlsx_path, max_row)
    print(f"  Rows read: {len(rows)}")

    families, cell_types, genes, source_color_map = parse_npo_data(rows)

    # Summary
    neuron_count = sum(1 for ct in cell_types if ct.get('baseClass', 'neuron') == 'neuron')
    non_neuron_count = sum(1 for ct in cell_types if ct.get('baseClass', 'neuron') != 'neuron')
    print(f"\n--- Summary ---")
    print(f"  Families:    {len(families)}")
    print(f"  Cell types:  {len(cell_types)} ({neuron_count} neurons + {non_neuron_count} non-neuronal)")
    print(f"  Genes:       {len(genes)}")
    print(f"  Sources:     {len(source_color_map)}")
    for url, sc in source_color_map.items():
        print(f"    {sc['label']}: {sc['count']} cells  ({sc['color']})")

    # Warnings
    cells_without_master = [ct['preferredLabel'] for ct in cell_types if not ct['masterLabel']]
    if cells_without_master:
        print(f"\n  WARNING: {len(cells_without_master)} cells have no masterLabel (no family):")
        for lbl in cells_without_master:
            print(f"    - {lbl}")

    cells_without_source = [ct['preferredLabel'] for ct in cell_types if not ct['sourceNomenclature']]
    if cells_without_source:
        print(f"\n  WARNING: {len(cells_without_source)} cells have no source citation:")
        for lbl in cells_without_source:
            print(f"    - {lbl}")

    # Write output
    out_path = os.path.join(project_dir, 'js', 'data.js')
    write_data_js(out_path, families, cell_types, genes, source_color_map, xlsx_path, max_row)

    print(f"\nDone! {len(families)} families, {len(cell_types)} cells, "
          f"{len(genes)} genes, {len(source_color_map)} sources.")


if __name__ == '__main__':
    main()
