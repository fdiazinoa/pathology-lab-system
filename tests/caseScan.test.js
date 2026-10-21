import test from 'node:test';
import assert from 'node:assert/strict';
import { matchCaseScan } from '../src/services/caseScan.js';
import { caseReportMetadata, caseWithReport } from '../src/services/caseReportMetadata.js';

const record = { id: 'case-a', specimens: [{ id: 'specimen-a', label: 'A', blocks: [{ id: 'block-a1', label: 'A1' }] }] };

test('existing case and block QR labels resolve within the same case after a cloud reload', () => {
    const loaded = caseWithReport({ id: record.id, metadata: JSON.parse(JSON.stringify(caseReportMetadata(record))) });
    assert.deepEqual(matchCaseScan('case-a', loaded), { scannedCode: 'case-a', scanType: 'case' });
    assert.deepEqual(matchCaseScan('block-a1\r\n', loaded), { scannedCode: 'block-a1', scanType: 'block', specimenId: 'specimen-a', blockId: 'block-a1' });
});

test('another case, its blocks, human-readable labels and cancelled scans are rejected', () => {
    for (const scan of ['case-b', 'block-b1', 'A1', 'specimen-a', '', '   ', null, undefined]) {
        assert.equal(matchCaseScan(scan, record), null);
    }
    assert.equal(matchCaseScan('block-a1', { id: 'case-b', specimens: [] }), null);
    assert.equal(matchCaseScan('case-a', undefined), null);
    assert.equal(matchCaseScan('block-a1', { specimens: record.specimens }), null);
});
