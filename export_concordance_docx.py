"""
Export the NervoSensus Cross-Source Concordance table to a Word document.

Usage:
    python export_concordance_docx.py                          # Big DRG anchor, all other sources
    python export_concordance_docx.py --anchor "CSA paper"     # CSA anchor, all other sources
    python export_concordance_docx.py --anchor "big DRG paper" --sources "CSA paper" "Yu et al., 2024"
"""
import json, re, argparse
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml, OxmlElement

# ── Load cell data ───────────────────────────────────────────────────
with open('js/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'const\s+DEFAULT_CELL_TYPES\s*=\s*', content)
start = m.end()
depth = 0
for i in range(start, len(content)):
    if content[i] == '[': depth += 1
    elif content[i] == ']': depth -= 1
    if depth == 0: break
cells = json.loads(content[start:i+1])

id_index = {c['id']: i for i, c in enumerate(cells) if c.get('id')}

# ── Discover available sources ───────────────────────────────────────
all_sources = []
seen = set()
for c in cells:
    s = c.get('sourceNomenclatureLabel', '')
    if s and s not in seen:
        seen.add(s)
        all_sources.append(s)

SOURCE_SHORT = {
    'big DRG paper': 'Big DRG',
    'CSA paper': 'CSA',
    'Krauter et al., 2025': 'Krauter 2025',
    'Qi et al., 2024': 'Qi 2024',
    'Yu et al., 2024': 'Yu 2024',
    'Tavares-Ferreira et al., 2022': 'Tavares-F. 2022',
    'Kupari et al., 2021': 'Kupari 2021',
}

SOURCE_COLORS = {
    'CSA paper': 'FF667eea',
    'big DRG paper': 'FFf59e0b',
    'Krauter et al., 2025': 'FF8b5cf6',
    'Qi et al., 2024': 'FF06b6d4',
    'Yu et al., 2024': 'FFef4444',
    'Tavares-Ferreira et al., 2022': 'FF22c55e',
    'Kupari et al., 2021': 'FFec4899',
}

# ── Parse arguments ──────────────────────────────────────────────────
parser = argparse.ArgumentParser(description='Export concordance table to Word')
parser.add_argument('--anchor', default='big DRG paper', help='Anchor source name')
parser.add_argument('--sources', nargs='*', default=None, help='Compare sources (default: all other sources)')
args = parser.parse_args()

anchor_source = args.anchor
if args.sources:
    compare_sources = [s for s in args.sources if s != anchor_source and s in seen]
else:
    compare_sources = [s for s in all_sources if s != anchor_source]

display_sources = [anchor_source] + compare_sources

# ── Relationship discovery ───────────────────────────────────────────
def get_relationships(cell_idx):
    ct = cells[cell_idx]
    related = []
    for m in (ct.get('mapsTo') or []):
        if not m.get('label') and not m.get('id'): continue
        tid = id_index.get(m.get('id'), -1) if m.get('id') else next((i for i, c in enumerate(cells) if c.get('entity') == m.get('label')), -1)
        if tid != -1 and tid not in related: related.append(tid)
    for oi, other in enumerate(cells):
        if oi == cell_idx: continue
        for m in (other.get('mapsTo') or []):
            matches = (m.get('id') and ct.get('id') and m['id'] == ct['id']) or (m.get('label') == ct.get('entity'))
            if matches and oi not in related: related.append(oi)
    for s in (ct.get('assertedSubclassOf') or []):
        if not s.get('label') and not s.get('id'): continue
        tid = id_index.get(s.get('id'), -1) if s.get('id') else next((i for i, c in enumerate(cells) if c.get('entity') == s.get('label')), -1)
        if tid != -1 and tid not in related: related.append(tid)
    for oi, other in enumerate(cells):
        if oi == cell_idx: continue
        for s in (other.get('assertedSubclassOf') or []):
            matches = (s.get('id') and ct.get('id') and s['id'] == ct['id']) or (s.get('label') == ct.get('entity'))
            if matches and oi not in related: related.append(oi)
    return related

# ── Build concordance rows ───────────────────────────────────────────
anchor_cells = [(i, c) for i, c in enumerate(cells) if c.get('sourceNomenclatureLabel') == anchor_source]

rows = []
for parent_idx, parent_ct in anchor_cells:
    rel_idxs = get_relationships(parent_idx)
    by_source = {s: [] for s in display_sources}
    by_source[anchor_source].append((parent_idx, parent_ct.get('localLabel') or parent_ct.get('preferredLabel', '')))
    for ri in rel_idxs:
        if ri == parent_idx: continue
        rc = cells[ri]
        src = rc.get('sourceNomenclatureLabel', '')
        if src in by_source and not any(e[0] == ri for e in by_source[src]):
            by_source[src].append((ri, rc.get('localLabel') or rc.get('preferredLabel', '')))
    label = parent_ct.get('localLabel') or parent_ct.get('preferredLabel', '')
    rows.append((label, by_source))

rows.sort(key=lambda x: x[0])

# ── Create Word document ─────────────────────────────────────────────
doc = Document()

section = doc.sections[0]
section.orientation = 1
section.page_width = Cm(29.7)
section.page_height = Cm(21.0)
section.top_margin = Cm(1.5)
section.bottom_margin = Cm(1.5)
section.left_margin = Cm(1.5)
section.right_margin = Cm(1.5)

# Title
title_para = doc.add_paragraph()
run = title_para.add_run('NervoSensus — Cross-Source Concordance')
run.font.size = Pt(16)
run.font.bold = True
run.font.color.rgb = RGBColor(0x2d, 0x37, 0x48)

# Subtitle
sub_para = doc.add_paragraph()
anchor_short = SOURCE_SHORT.get(anchor_source, anchor_source)
run = sub_para.add_run(f'Anchor: {anchor_source} ({len(anchor_cells)} cell types). ')
run.font.size = Pt(9)
run.font.color.rgb = RGBColor(0x71, 0x80, 0x96)
run2 = sub_para.add_run(f'Columns show the local label (ilxtr:localLabel) each source uses for its corresponding cell type.')
run2.font.size = Pt(9)
run2.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

# ── Helper functions ─────────────────────────────────────────────────
def shade_cell(cell, color_hex):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_text(cell, text, bold=False, font_size=8, color=None, align_center=False):
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if align_center else WD_ALIGN_PARAGRAPH.LEFT
    run = p.add_run(str(text))
    run.font.size = Pt(font_size)
    run.font.name = 'Arial'
    if bold: run.font.bold = True
    if color: run.font.color.rgb = color
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)

# ── Build table ──────────────────────────────────────────────────────
num_cols = 1 + len(display_sources)  # row number + sources
table = doc.add_table(rows=1, cols=num_cols)
table.style = 'Table Grid'
table.alignment = WD_TABLE_ALIGNMENT.CENTER

# Header row — repeat on each page
header_row = table.rows[0]
trPr = header_row._tr.get_or_add_trPr()
trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")} />'))

# Row number header
set_cell_text(header_row.cells[0], '#', bold=True, font_size=7, color=RGBColor(0xa0, 0xae, 0xc0), align_center=True)
shade_cell(header_row.cells[0], 'f8fafc')

# Source column headers with colored bottom border
for ci, src in enumerate(display_sources):
    cell = header_row.cells[ci + 1]
    short = SOURCE_SHORT.get(src, src)
    set_cell_text(cell, short, bold=True, font_size=8, color=RGBColor(0x2d, 0x37, 0x48), align_center=True)
    # Source color stripe via cell shading on a subtle tint
    hex_color = SOURCE_COLORS.get(src, 'FF667eea')[2:]  # strip FF prefix
    shade_cell(cell, hex_color)
    # Override text to white for readability on colored backgrounds
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

# Column widths — distribute evenly across available space
avail = 26.7  # cm (29.7 - 3.0 margins)
num_width = Cm(1.2)
src_width = Cm((avail - 1.2) / len(display_sources))
for row in table.rows:
    row.cells[0].width = num_width
    for ci in range(len(display_sources)):
        row.cells[ci + 1].width = src_width

# Data rows
for row_idx, (label, by_source) in enumerate(rows):
    row = table.add_row()
    # Row number
    set_cell_text(row.cells[0], str(row_idx + 1), font_size=7, color=RGBColor(0xa0, 0xae, 0xc0), align_center=True)

    for ci, src in enumerate(display_sources):
        cell = row.cells[ci + 1]
        entries = by_source.get(src, [])
        if not entries:
            shade_cell(cell, 'fafbfc')
        else:
            is_anchor = (src == anchor_source)
            text = '\n'.join(e[1] for e in entries)
            set_cell_text(cell, text, bold=is_anchor, font_size=8, color=RGBColor(0x1a, 0x20, 0x2c) if is_anchor else RGBColor(0x2d, 0x37, 0x48))

# ── Feedback link ────────────────────────────────────────────────────
doc.add_paragraph()
feedback_para = doc.add_paragraph()
run = feedback_para.add_run('Submit feedback at: ')
run.font.size = Pt(9)
run.font.color.rgb = RGBColor(0x71, 0x80, 0x96)

hyperlink = OxmlElement('w:hyperlink')
hyperlink.set(qn('w:history'), '1')
r_id = doc.part.relate_to('https://stappan.github.io/nervosensus/nervosensus-feedback.html?view=Concordance', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
hyperlink.set(qn('r:id'), r_id)
new_run = OxmlElement('w:r')
rPr = OxmlElement('w:rPr')
for tag, attrs in [('w:rStyle', {'w:val': 'Hyperlink'}), ('w:sz', {'w:val': '18'}), ('w:color', {'w:val': '667eea'}), ('w:u', {'w:val': 'single'})]:
    el = OxmlElement(tag)
    for k, v in attrs.items(): el.set(qn(k), v)
    rPr.append(el)
new_run.append(rPr)
new_run.text = 'nervosensus-feedback.html'
hyperlink.append(new_run)
feedback_para._p.append(hyperlink)

# ── Save ─────────────────────────────────────────────────────────────
out_path = 'NervoSensus_Concordance.docx'
doc.save(out_path)
total_entries = sum(sum(len(v) for v in bs.values()) for _, bs in rows)
print(f'Saved {out_path}')
print(f'  Anchor: {anchor_source} ({len(anchor_cells)} cells)')
print(f'  Compare sources: {", ".join(compare_sources)}')
print(f'  {total_entries} total entries')
