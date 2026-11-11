// Shared predicate map: NPO predicate ("NPO Property" column) -> NervoSensus field.
//
// This is the single place that ties source predicates to app fields. It is read by
// js/app.js (spreadsheet upload in the browser) and by sync_data.py (ingest that
// writes js/data.js). If the source renames a predicate, change the key here; if a
// predicate should feed an existing field, add a line here.
//
// Predicates NOT listed here are still kept: every ingested row is stored on its cell
// under `properties`, and the detail view lists unmapped ones under
// "Additional properties", labeled by the row's Relation Type.
//
// Keep the objects between the BEGIN/END markers valid JSON (double quotes, no
// trailing commas, no comments) so the Python ingest can parse them.
const PREDICATE_MAP = /*BEGIN_PREDICATE_MAP*/{
  "rdfs:label":                                     {"field": "entity"},
  "skos:prefLabel":                                 {"field": "preferredLabel"},
  "ilxtr:origLocalLabel":                           {"field": "localLabel"},
  "ilxtr:neurondmBaseClass":                        {"field": "baseClass"},
  "ilxtr:hasInstanceInTaxon":                       {"field": "species"},
  "ilxtr:hasCircuitRolePhenotype":                  {"field": "circuitRole"},
  "ilxtr:hasNeurotransmitterPhenotype":             {"field": "neurotransmitter"},
  "ilxtr:hasSomaLocatedIn":                         {"field": "somaLocations"},
  "ilxtr:hasAxonLocatedIn":                         {"field": "nerves"},
  "ilxtr:hasAxonSensorySubcellularElementIn":       {"field": "sensoryTerminalLocations"},
  "ilxtr:hasAxonTerminalIn":                        {"field": "axonTerminalLocations"},
  "ilxtr:hasAxonPresynapticElementIn":              {"field": "axonTerminalLocations"},
  "ilxtr:hasDriverExpressionConstitutivePhenotype": {"field": "creLine"},
  "ilxtr:hasExpressionPhenotype":                   {"field": "markerGenes"},
  "ilxtr:hasNucleicAcidExpressionPhenotype":        {"field": "markerGenes"},
  "ilxtr:hasAxonPhenotype":                         {"field": "axonPhenotype"},
  "ilxtr:hasThresholdPhenotype":                    {"field": "thresholdPhenotype"},
  "ilxtr:hasAdaptationPhenotype":                   {"field": "adaptationPhenotype"},
  "ilxtr:hasFunctionalPhenotype":                   {"field": "functionalPhenotype"},
  "ilxtr:hasBiologicalSex":                         {"field": "biologicalSex"},
  "ilxtr:observedAtAgeInYears":                     {"field": "observedAge"},
  "ilxtr:literatureCitation":                       {"field": "sourceNomenclature"},
  "ilxtr:dataCitation":                             {"field": "sourceData"},
  "ilxtr:expertConsultant":                         {"field": "reviewedBy"},
  "ilxtr:alertNote":                                {"field": "alertNotes"},
  "ilxtr:curatorNote":                              {"field": "curatorNotes"},
  "ilxtr:subClassOf":                               {"field": "subClassOf"},
  "TEMP:subClassOf":                                {"field": "assertedSubclassOf"},
  "TEMP:assertedSubClassOf":                        {"field": "assertedSubclassOf"},
  "TEMP:mapsTo":                                    {"field": "mapsTo"}
}/*END_PREDICATE_MAP*/;

// Value IRI ("NPO Property Value IRI" column) -> cluster-view attribute it turns on.
// Any ingested row carrying one of these IRIs sets that attribute on its cell.
const ATTRIBUTE_BY_IRI = /*BEGIN_ATTRIBUTE_BY_IRI*/{
  "http://uri.interlex.org/base/ilx_0796512": "fiber_a_beta",
  "http://uri.interlex.org/base/ilx_0796514": "fiber_a_delta",
  "http://uri.interlex.org/base/ilx_0796516": "fiber_c"
}/*END_ATTRIBUTE_BY_IRI*/;

// Field for a predicate, or null when the predicate has no mapping.
function predicateField(predicate) {
    const entry = PREDICATE_MAP[predicate];
    return entry ? entry.field : null;
}
