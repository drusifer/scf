import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const csv = require('csv-parser');

const CSV_FILE = path.join(process.cwd(), 'data/Secure Controls Foundation - SCF 2025.4.csv');
const results = [];

fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('headers', (headers) => {
        console.log('Headers found:', headers.length);
        console.log(JSON.stringify(headers, null, 2));
        process.exit(0);
    });
