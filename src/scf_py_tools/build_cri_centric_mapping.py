import pandas as pd
import os
import re

# 1. Initialize CRI base
cri_structure = pd.read_csv('csv_output/profile_cri_profile_v2_1_structure.csv', skiprows=1)
final_df = cri_structure[cri_structure['Level'] == 'DS'].copy()

split_cols = final_df['CRI Profile Function / \nCategory / Subcategory'].str.split('/', expand=True)
final_df['Function'] = split_cols[0].str.strip()
final_df['Category'] = split_cols[1].str.strip()
final_df['Subcategory'] = split_cols[2].str.strip()

# Add CRI Tiers as tags
def get_tier_tags(row):
    tiers = []
    if str(row['Tier-1']).strip().lower() == 'yes': tiers.append('Tier: 1')
    if str(row['Tier-2']).strip().lower() == 'yes': tiers.append('Tier: 2')
    if str(row['Tier-3']).strip().lower() == 'yes': tiers.append('Tier: 3')
    if str(row['Tier-4']).strip().lower() == 'yes': tiers.append('Tier: 4')
    return '\n'.join(tiers)

final_df['CRI TIER TAGS'] = final_df.apply(get_tier_tags, axis=1)

final_df['Weighting'] = 10.0
base_cols = ['Profile Id', 'Outline Id', 'Function', 'Category', 'Subcategory', 'Weighting', 'CRI TIER TAGS', 'CRI Profile v2.1 Diagnostic Statement']
final_df = final_df[base_cols]

lookup_diag = final_df.set_index('CRI Profile v2.1 Diagnostic Statement')['Profile Id'].to_dict()
lookup_outline = final_df.set_index('Outline Id')['Profile Id'].to_dict()

# 2. Add CRI Native Subject Tags
try:
    tag_data = pd.read_csv('csv_output/profile_diagnostic_statements_by_tag.csv', skiprows=2)
    tag_data.columns = ['Tag', 'Statement', 'Subcategory', 'Profile Id', 'Outline Id']
    tag_data['Tag'] = tag_data['Tag'].str.strip()
    tag_data['Profile Id'] = tag_data['Profile Id'].str.strip()
    cri_tags = tag_data.groupby('Profile Id')['Tag'].apply(lambda x: '\n'.join(sorted(list(set(x))))).reset_index()
    cri_tags.columns = ['Profile Id', 'CRI SUBJECT TAGS']
    final_df = pd.merge(final_df, cri_tags, on='Profile Id', how='left')
except Exception as e:
    print(f"Warning: Could not process subject tags: {e}")

# 3. Process mapping files
mapping_dir = 'csv_output'
mapping_files = [f for f in os.listdir(mapping_dir) if f.startswith('mapping_') and f.endswith('.csv')]

def clean_framework_id(val):
    val = str(val).strip()
    if val.lower() in ['nan', 'none', '']: return None
    if ':' in val:
        parts = val.split(':')
        if len(parts[0]) < 30: return parts[0].strip()
    return val

def normalize_tag_value(header, val):
    val = str(val).strip()
    if val.lower() in ['nan', 'none', '']: return None
    h_lower = header.lower()
    if 'relationship' in h_lower:
        v = val.replace(' of', '').replace(' with', '').strip().title()
        if 'Superset' in v: v = 'Superset'
        if 'Subset' in v: v = 'Subset'
        if 'Intersect' in v: v = 'Intersects'
        return f"Relationship: {v}"
    if 'rationale' in h_lower: return f"Rationale: {val.title()}"
    if 'type' in h_lower: return f"Type: {val.title()}"
    if 'level' in h_lower: return f"Level: {val.title()}"
    if re.search(r'\bFSC\b', header): return f"FSC: {val}"
    if re.search(r'\bAS\b', header): return f"AS: {val}"
    if len(val) > 60: val = val[:57] + "..."
    return f"{header}: {val}"

for f in mapping_files:
    if any(x in f.lower() for x in ['listvalues', 'catalog', 'reverse']): continue
    framework_key = f.replace('mapping_', '').replace('.csv', '').replace('_', ' ').upper()
    df_m = pd.read_csv(os.path.join(mapping_dir, f))
    header_idx = -1
    for i, row in df_m.iterrows():
        if 'Profile Id' in [str(v).strip() for v in row.values]:
            header_idx = i; break
    if header_idx == -1: continue
    df_m.columns = [str(c).strip() for c in df_m.iloc[header_idx]]
    df_m = df_m.iloc[header_idx+1:].copy()
    id_col = df_m.columns[0]
    for c in df_m.columns:
        if any(x in str(c) for x in ['Id', 'No.', 'Stmt', 'Statement']) and 'Profile' not in str(c):
            id_col = c; break
    tag_cols = []
    for c in df_m.columns:
        c_str = str(c)
        if any(x in c_str for x in ['Profile', 'Statement', 'Objective', 'Guidance', 'Procedure', 'Section']): continue
        if any(x in c_str.lower() for x in ['relationship', 'rationale', 'type', 'level']) or re.search(r'\b(AS|FSC)\b', c_str):
            tag_cols.append(c)

    if 'Profile Id' in df_m.columns:
        df_m['Profile Id'] = df_m['Profile Id'].astype(str).str.strip()
        df_m[id_col] = df_m[id_col].apply(clean_framework_id)
        def get_row_tags(row):
            t_list = []
            for col in tag_cols:
                t_val = normalize_tag_value(col, row[col])
                if t_val: t_list.append(t_val)
            return '; '.join(t_list)
        df_m['row_tags'] = df_m.apply(get_row_tags, axis=1)
        m_data = df_m[['Profile Id', id_col, 'row_tags']].dropna(subset=[id_col]).copy()
        m_data = m_data.drop_duplicates()
        def aggregate_mappings(group):
            group = group.sort_values(by=id_col)
            ids = '\n'.join(group[id_col].astype(str))
            tags_list = [str(t) if str(t).strip('; ') else '' for t in group['row_tags']]
            tags = '\n'.join(tags_list)
            return pd.Series({framework_key: ids, f"{framework_key} TAGS": tags})
        mapping_agg = m_data.groupby('Profile Id').apply(aggregate_mappings, include_groups=False).reset_index()
        final_df = pd.merge(final_df, mapping_agg, on='Profile Id', how='left')

# Final drop of entirely empty columns
final_df = final_df.dropna(axis=1, how='all')
final_df.to_csv('cri_controls_framework_mapping_catalog.csv', index=False)
print(f"Done! Created catalog with CRI Tiers and Subject Tags.")
