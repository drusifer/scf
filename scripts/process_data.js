import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const csv = require('csv-parser');

const INPUT_FILE = path.join(process.cwd(), 'data/Secure Controls Foundation - SCF 2025.4.csv');
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/scf_controls.json');

const METADATA_COLS = new Set([
    '#',
    'SCF Domain',
    'SCF Identifier',
    'SCF Control',
    'SCF Control Question',
    'Relative Control Weighting',
    'Principles People, Process, Technology, Data & Facilities (PPTDF)',
    'SCF #',
    'Secure Controls Framework (SCF) Control Description',
    'Conformity Validation Cadence',
    'Combined Security & Privacy Control Description'
]);

const controls = [];
const allRegimeColumns = [];

console.log('Reading CSV file...');

fs.createReadStream(INPUT_FILE)
    .pipe(csv())
    .on('headers', (headers) => {
        console.log('--- CSV HEADERS PROCESSING ---');

        headers.forEach(h => {
            const normalized = h.trim().replace(/\s+/g, ' '); // Replace all whitespace/newlines with space
            if (!METADATA_COLS.has(normalized) && normalized.length > 0 && normalized !== 'Errata' && !normalized.startsWith('Errata')) {
                allRegimeColumns.push(h);
            }
        });

        console.log(`Identified ${allRegimeColumns.length} compliance regimes.`);
    })
    .on('data', (row) => {
        const mappings = [];

        // Extract mappings from all identified columns
        allRegimeColumns.forEach(regimeCol => {
            const val = row[regimeCol];
            if (val && val.trim().length > 0) {
                mappings.push({
                    regime: regimeCol.replace(/\n/g, ' ').trim(), // Clean regime name for UI
                    value: val.trim()
                });
            }
        });

        // Create Control Object
        if (row['SCF Control'] && row['SCF Domain']) {
            controls.push({
                id: row['SCF Control'],
                domain: row['SCF Domain'],
                description: row['SCF Control Question'],
                weight: parseInt(row['Relative Control Weighting'] || 1, 10),
                pptdf: row['Principles People, Process, Technology, Data & Facilities (PPTDF)'],
                mappings: mappings
            });
        }
    })
    .on('end', () => {
        console.log(`Processed ${controls.length} controls.`);

        // Stats
        const controlsWithMappings = controls.filter(c => c.mappings.length > 0).length;
        console.log(`Controls with at least one mapping: ${controlsWithMappings}`);

        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(controls, null, 2));
        console.log(`Wrote JSON to ${OUTPUT_FILE}`);
    });
