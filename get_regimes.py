import json
try:
    with open('scf_data.js', 'r', encoding='utf-8') as f:
        content = f.read()
        # More robust extraction of JSON from JS variable
        json_str = content[content.find('{'):content.rfind('}')+1]
        data = json.loads(json_str)
        
    regimes = set()
    print(f"Root name: {data.get('name')}")
    domains = data.get('children', [])
    print(f"Domains found: {len(domains)}")
    
    for domain in domains:
        pptdfs = domain.get('children', [])
        for pptdf in pptdfs:
            controls = pptdf.get('children', [])
            for control in controls:
                regs = control.get('children', [])
                for r in regs:
                    regimes.add(r['name'])
    
    if regimes:
        print("Included Compliance Regimes:")
        for r in sorted(list(regimes)):
            print(f"- {r}")
    else:
        print("No regimes found.")
        
except Exception as e:
    print(f"Error: {e}")
