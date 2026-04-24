import pandas as pd

# 1. Load CRI Structure
df = pd.read_csv('csv_output/profile_cri_profile_v2_1_structure.csv', skiprows=1)

# 2. Filter for Level 'F' (Functions)
cri_domains = df[df['Level'] == 'F'].copy()

# 3. Map to CRI Terminology structure
# We'll use Function and Diagnostic Statement as requested
rows = []
for i, (_, row) in enumerate(cri_domains.iterrows(), 1):
    rows.append({
        '#': i,
        'Function': row['CRI Profile Function / \nCategory / Subcategory'].strip(),
        'Profile Id': row['Profile Id'].strip(),
        'Diagnostic Statement': row['CRI Profile v2.1 Diagnostic Statement'].strip()
    })

output_df = pd.DataFrame(rows)
output_df.to_csv('cri_domains.csv', index=False)
print("Created cri_domains.csv using CRI terminology.")
