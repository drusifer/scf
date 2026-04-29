import pandas as pd
import os
import re
import sys

# Get input directory from argument or default
mapping_dir = sys.argv[1] if len(sys.argv) > 1 else 'build/csv_output'
print(f"Using input directory: {mapping_dir}")

# 1. Initialize CRI base
cri_structure = pd.read_csv(os.path.join(mapping_dir, 'profile_cri_profile_v2_1_structure.csv'), skiprows=1)

# Clean up NIST CSF v2 Mapping column early
if 'NIST CSF v2\nMapping' in cri_structure.columns:
    def clean_csf_v2(val):
        if pd.isna(val): return None
        val = str(val).split('\n')[0].strip() # Take first line
        val = val.split('(')[0].strip() # Remove (CRI Modified) etc
        return val if val else None
    cri_structure['NIST CSF V2'] = cri_structure['NIST CSF v2\nMapping'].apply(clean_csf_v2)

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
if 'NIST CSF V2' in final_df.columns:
    base_cols.append('NIST CSF V2')
    # Add an empty TAGS column for consistency with other frameworks
    final_df['NIST CSF V2 TAGS'] = ''
    base_cols.append('NIST CSF V2 TAGS')

final_df = final_df[base_cols]

lookup_diag = final_df.set_index('CRI Profile v2.1 Diagnostic Statement')['Profile Id'].to_dict()
lookup_outline = final_df.set_index('Outline Id')['Profile Id'].to_dict()

# 2. Add CRI Native Subject Tags
try:
    tag_data = pd.read_csv(os.path.join(mapping_dir, 'profile_diagnostic_statements_by_tag.csv'), skiprows=2)
    tag_data.columns = ['Tag', 'Statement', 'Subcategory', 'Profile Id', 'Outline Id']
    tag_data['Tag'] = tag_data['Tag'].str.strip()
    tag_data['Profile Id'] = tag_data['Profile Id'].str.strip()
    cri_tags = tag_data.groupby('Profile Id')['Tag'].apply(lambda x: '\n'.join(sorted(list(set(x))))).reset_index()
    cri_tags.columns = ['Profile Id', 'CRI SUBJECT TAGS']
    final_df = pd.merge(final_df, cri_tags, on='Profile Id', how='left')
except Exception as e:
    print(f"Warning: Could not process subject tags: {e}")

# 3. Process mapping files
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
    if re.search(r'\bFSC\b', header): return f"Functional Coverage Strength: {val}"
    if re.search(r'\bAS\b', header): return f"Alignment Strength: {val}"
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
    
    # Improved target ID column detection
    id_col = None
    # Priority 1: Specific known columns
    for c in df_m.columns:
        if c in ['Profile Id', 'Seq']: continue
        if c.endswith(' Id') and 'Profile' not in c:
            id_col = c; break
            
    if not id_col:
        # Priority 2: Generic keywords
        for c in df_m.columns:
            c_str = str(c)
            if c_str in ['Profile Id', 'Seq']: continue
            # For NIST CSF v2, we want 'CSF / Profile Id' but 'Profile Id' is also there
            if c_str == 'CSF / Profile Id':
                id_col = c; break
            if any(x in c_str for x in ['Id', 'No.', 'Stmt', 'Statement']) and (c_str == 'Profile Id' or 'Profile' not in c_str):
                # Wait, we want to AVOID the last 'Profile Id' column which is the CRI one.
                # Usually the target ID is on the left.
                id_col = c; break

    if not id_col:
        id_col = df_m.columns[0]
        
    print(f"  Framework: {framework_key}, Target ID column: {id_col}")
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
        
        if framework_key in final_df.columns:
            # Merge and combine
            final_df = pd.merge(final_df, mapping_agg, on='Profile Id', how='left', suffixes=('', '_new'))
            # Combine IDs
            def combine_vals(row, col):
                old = str(row[col]) if pd.notna(row[col]) else ""
                new = str(row[f"{col}_new"]) if pd.notna(row[f"{col}_new"]) else ""
                if not old: return new
                if not new: return old
                # Combine unique lines
                combined = sorted(list(set(old.split('\n') + new.split('\n'))))
                return '\n'.join(combined)
            
            final_df[framework_key] = final_df.apply(lambda r: combine_vals(r, framework_key), axis=1)
            final_df[f"{framework_key} TAGS"] = final_df.apply(lambda r: combine_vals(r, f"{framework_key} TAGS"), axis=1)
            # Drop new cols
            final_df = final_df.drop(columns=[f"{framework_key}_new", f"{framework_key} TAGS_new"])
        else:
            final_df = pd.merge(final_df, mapping_agg, on='Profile Id', how='left')

# Final drop of entirely empty columns
final_df = final_df.dropna(axis=1, how='all')
final_df.to_csv('cri_controls_framework_mapping_catalog.csv', index=False)
print(f"Done! Created catalog with CRI Tiers and Subject Tags.")
