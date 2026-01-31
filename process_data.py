import csv
import json
import os

# --- Configuration ---
# Specify the hierarchy layers. 
# A good logical order for the SCF is Domain -> PPTDF -> Function Grouping.
HIERARCHY_COLUMNS = [
    "PPTDF\nApplicability",
    "NIST CSF\nFunction Grouping",
    "SCF Domain",
]

def process_scf_data():
    scf_domains_path = r'c:\Users\drusi\VSCode_Projects\scf\data\scf_domains.csv'
    scf_controls_path = r'c:\Users\drusi\VSCode_Projects\scf\data\scf_controls.csv'
    
    # 1. Load Domain Metadata
    domain_metadata = {}
    if os.path.exists(scf_domains_path):
        with open(scf_domains_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row['SCF Domain'].strip()
                if name:
                    domain_metadata[name] = row['Principle Intent'].strip()

    # 2. Parse Regime Headers
    regime_list = []
    regime_catalog = {}
    
    with open(scf_controls_path, 'r', encoding='utf-8-sig') as f:
        raw_reader = csv.reader(f)
        header = next(raw_reader)
        dict_reader = csv.DictReader(f, fieldnames=header)
        
        regime_start_idx = 30
        raw_regime_headers = header[regime_start_idx:]
        
        for i, h in enumerate(raw_regime_headers):
            lines = h.split('\n')
            category = lines[0].strip() if lines else "General"
            name = " ".join([l.strip() for l in lines[1:] if l.strip()]) or category
            full_name = h.strip().replace('\n', ' ').replace('\r', '')
            
            regime_info = {"id": i, "category": category, "name": name, "full_name": full_name}
            regime_list.append(regime_info)
            if category not in regime_catalog:
                regime_catalog[category] = []
            regime_catalog[category].append(regime_info)

        # 3. Build Dynamic Hierarchy
        root_children = {}
        seen_controls = {} # scf_id -> {node_ref, path_score}

        processed_count = 0
        for row in dict_reader:
            scf_id = row['SCF #'].strip()
            if not scf_id: continue
            
            scf_name = row['SCF Control'].strip()
            # FAIL FAST: use direct key access
            desc = row['Secure Controls Framework (SCF)\nControl Description'].strip()
            weight_str = row['Relative Control Weighting'].strip()
            
            # Calculate path values - using direct key access to FAIL FAST
            path_values = []
            for col in HIERARCHY_COLUMNS:
                val = row[col].strip()
                path_values.append(val)

            if scf_id in seen_controls:
                # If we've seen this control before, update mappings
                control_node = seen_controls[scf_id]
                
                # Update mappings from current row
                for i, r_info in enumerate(regime_list):
                    # Use the raw header list to get accurate column value
                    val = row[header[regime_start_idx+i]].strip()
                    if val:
                        identifiers = [scf_id] if val.lower() == 'x' else [ident.strip() for ident in val.replace('\n', ',').replace('\r', '').split(',') if ident.strip()]
                        if i not in control_node["mappings"]:
                            control_node["mappings"][i] = []
                        existing = set(control_node["mappings"][i])
                        existing.update(identifiers)
                        control_node["mappings"][i] = list(existing)
                continue

            # Navigate/Build the tree path
            current_level = root_children
            for val in path_values:
                if val not in current_level:
                    current_level[val] = {
                        "name": val,
                        "children": {}
                    }
                current_level = current_level[val]["children"]
            
            # Add control node
            control_node = {
                "name": f"{scf_id}: {scf_name}",
                "description": desc,
                "weight": 1.0,
                "mappings": {}
            }
            try:
                control_node["weight"] = float(weight_str)
            except:
                pass

            current_level[scf_id] = control_node
            seen_controls[scf_id] = control_node
            
            # Map Initial Regimes
            for i, r_info in enumerate(regime_list):
                val = row[header[regime_start_idx+i]].strip()
                if val:
                    identifiers = [scf_id] if val.lower() == 'x' else [ident.strip() for ident in val.replace('\n', ',').replace('\r', '').split(',') if ident.strip()]
                    control_node["mappings"][i] = identifiers
            
            processed_count += 1

    # 4. Conversion helper
    def dict_to_list(node_dict):
        result = []
        for key, node in node_dict.items():
            if "children" in node:
                node["children"] = dict_to_list(node["children"])
            result.append(node)
        return result

    final_data = {
        "name": "SCF 2025.4",
        "regimeCatalog": regime_catalog,
        "regimeList": regime_list,
        "children": dict_to_list(root_children)
    }

    # 5. Output
    print(f"Processed {processed_count} unique controls.")
    with open('scf_data.js', 'w', encoding='utf-8') as f:
        f.write("const scfData = ")
        json.dump(final_data, f)
        f.write(";")
    print("Successfully generated scf_data.js")
    with open('scf_data.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f)
    print("Successfully generated scf_data.json")   

if __name__ == "__main__":
    process_scf_data()
