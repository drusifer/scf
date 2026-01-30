import { DataProcessor } from '../src/data-processor.js';

describe('DataProcessor', () => {
    let processor;

    beforeEach(() => {
        processor = new DataProcessor();
    });

    it('should correctly identify regimes from fields', () => {
        const fields = [
            'SCF Domain',
            'SCF #',
            'Relative Control Weighting',
            'NIST 800-53 R5',
            'ISO 27001'
        ];
        processor.identifyRegimes(fields);
        expect(processor.regimes).to.include('NIST 800-53 R5');
        expect(processor.regimes).to.include('ISO 27001');
        expect(processor.regimes).to.not.include('SCF Domain');
    });

    it('should create an empty hierarchy if no data provided', () => {
        processor.rawControls = [];
        processor.buildHierarchy();
        expect(processor.hierarchy.name).to.equal('SCF 2025.4');
        expect(processor.hierarchy.children).to.be.empty;
    });

    it('should build a nested hierarchy correctly', () => {
        processor.rawControls = [{
            'SCF Domain': 'Asset Management',
            'PPTDF': 'Technology',
            'SCF #': 'AST-01',
            'SCF Control': 'Asset Inventory',
            'Relative Control Weighting': '10',
            'Secure Controls Framework (SCF)\nControl Description': 'D1'
        }];
        processor.regimes = [];
        processor.buildHierarchy();

        const domain = processor.hierarchy.children[0];
        expect(domain.name).to.equal('Asset Management');

        const pptdf = domain.children[0];
        expect(pptdf.name).to.equal('Technology');

        const control = pptdf.children[0];
        expect(control.name).to.equal('AST-01');
        expect(control.weighting).to.equal(10);
    });
});
