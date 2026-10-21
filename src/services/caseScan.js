// Keep existing case and block QR labels usable; never accept a block from another case.
export function matchCaseScan(scan, caseData) {
    if (!caseData?.id || typeof scan !== 'string') return null;
    const scannedCode = scan.trim();
    if (!scannedCode) return null;
    if (scannedCode === caseData.id) return { scannedCode, scanType: 'case' };
    for (const specimen of caseData.specimens || []) {
        const block = specimen.blocks?.find(item => item.id === scannedCode);
        if (block) return { scannedCode, scanType: 'block', specimenId: specimen.id, blockId: block.id };
    }
    return null;
}
