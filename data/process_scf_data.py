import pandas as pd
import os

# 1. Load Raw SCF
df = pd.read_csv('scf_controls_2026_1.csv')

# 2. Derive Base ID (e.g., GOV-01 from GOV-01.1)
df['Base ID'] = df['SCF #'].str.split('.').str[0]

# 3. Create Aligned TAGS logic
# We'll treat Tiers as "SCRM TAGS" since they apply to most controls
tier_cols = [c for c in df.columns if 'TIER' in c]
def get_tier_tags(row):
    tags = []
    for col in tier_cols:
        if str(row[col]).lower() == 'x':
            # Clean "SCRM Focus\n\nTIER 1\nSTRATEGIC" -> "TIER 1 (STRATEGIC)"
            clean_name = col.replace('\n', ' ').replace('  ', ' ')
            tags.append(clean_name)
    return '\n'.join(tags)

df['SCRM TAGS'] = df.apply(get_tier_tags, axis=1)

# 4. Identify Mapping Columns (Frameworks, Risks, Threats)
# These follow the pattern where the cell contains IDs or 'x'
# For SCF, the Mapping columns ALREADY have the IDs in the cells
# except for some which have 'x'. 

# We will keep all the framework and risk/threat columns as individual mapping columns.
# This mimics the CRI "wide" structure.

# Select core columns for the new "clean" version
core_cols = [
    'SCF Domain', 
    'Base ID', 
    'SCF Control', 
    'SCF #', 
    'Secure Controls Framework (SCF)\nControl Description',
    'SCRM TAGS'
]

# Identify all mapping columns (everything after the core metadata)
# For SCF 2026.1, mappings start roughly after 'Relative Control Weighting'
# We'll just grab everything that isn't already a core_col or a Tier col
mapping_cols = [c for c in df.columns if c not in core_cols and c not in tier_cols]

# Build final output
final_df = df[core_cols + mapping_cols].copy()

# Rename for consistency
final_df.columns = [c.replace('\n', ' ').replace('  ', ' ') for c in final_df.columns]

final_df.to_csv('scf_controls_consolidated.csv', index=False)
print(f"Created scf_controls_consolidated.csv with {len(final_df)} controls.")
