export const FRAMEWORK_CONFIGS = {
    scf: {
        key: "scf",
        name: "SCF 2026.1",
        description: "Secure Controls Framework — comprehensive security and privacy controls",
        regime_label: "Compliance Regimes",
        files: {
            controls: "data/scf_controls_2026_1.csv",
            domains: "data/scf_domains_2026_1.csv"
        },
        schema: {
            controls: {
                domain_col: "SCF Domain",
                category_col: "Base ID",
                subcategory_col: "SCF Control",
                weight_col: "Relative Control Weighting",
                control_id_col: "SCF #",
                description_col: "Secure Controls Framework (SCF) Control Description",
                tag_cols: [],
                mapping_tag_suffix: null,
                regime_start_col: 30
            },
            domains: {
                name_col: "SCF Domain",
                id_col: "SCF Identifier",
                intent_col: "Principle Intent"
            }
        },
        hierarchy_cols: [
            { id: "PPTDF_Applicability", raw: "PPTDF\nApplicability", name: "PPTDF Applicability" },
            { id: "NIST_CSF_Function_Grouping", raw: "NIST CSF\nFunction Grouping", name: "NIST CSF Function Grouping" },
            { id: "SCF_Domain", raw: "SCF Domain", name: "SCF Domain" },
            { id: "Conformity_Validation_Cadence", raw: "Conformity Validation Cadence", name: "Conformity Validation Cadence" }
        ],
        hierarchy_aliases: {
            PPTDF_Applicability: "pptd",
            NIST_CSF_Function_Grouping: "nist",
            SCF_Domain: "domain",
            Conformity_Validation_Cadence: "cadent"
        },
        default_hierarchy: ["PPTDF_Applicability", "NIST_CSF_Function_Grouping", "SCF_Domain"],
        default_regimes: [],
        show_hierarchy_customizer: true
    },
    cri: {
        key: "cri",
        name: "CRI Profile v2.1",
        description: "CISA Cyber Resilience Review Profile — incident response-focused controls",
        regime_label: "Mapped Frameworks",
        files: {
            controls: "data/cri_controls_framework_mapping_catalog.csv",
            domains: "data/cri_domains.csv"
        },
        schema: {
            controls: {
                domain_col: "Function",
                category_col: "Category",
                subcategory_col: "Subcategory",
                weight_col: "Weighting",
                control_id_col: "Profile Id",
                description_col: "CRI Profile v2.1 Diagnostic Statement",
                tag_cols: ["CRI SUBJECT TAGS", "CRI TIER TAGS"],
                mapping_tag_suffix: " TAGS",
                regime_start_col: null
            },
            domains: {
                name_col: "Function",
                id_col: "Profile Id",
                intent_col: "Diagnostic Statement"
            }
        },
        hierarchy_cols: [
            { id: "Function", raw: "Function", name: "Function" },
            { id: "Category", raw: "Category", name: "Category" },
            { id: "Subcategory", raw: "Subcategory", name: "Subcategory" }
        ],
        hierarchy_aliases: {},
        default_hierarchy: ["Function", "Category"],
        default_regimes: [],
        show_hierarchy_customizer: false
    }
};
