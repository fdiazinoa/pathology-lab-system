import test from 'node:test';
import assert from 'node:assert/strict';
import { appendTemplate, parseResultTemplatesCSV, templatesForExam } from '../src/services/resultTemplates.js';
import { buildLabInfoPayload, labInfoToSettings } from '../src/services/labSettings.js';

const header = 'IDseccion,IDresultado,Resultado,Descripcion';

test('CSV preserves codes, commas, quotes, multiline text and duplicate source codes', () => {
    const rows = parseResultTemplatesCSV(`\uFEFF${header}\r\nB,0010E,"Texto, con ""comillas""\r\ny salto",Detalle\r\nB,0010E,Otro,\r\nL,1:00 AM,Texto líquido,\r\n`);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].code, '0010E');
    assert.equal(rows[0].result, 'Texto, con "comillas"\r\ny salto');
    assert.notEqual(rows[0].id, rows[1].id);
    assert.equal(rows[2].code, '1:00 AM');
    assert.deepEqual(parseResultTemplatesCSV(`GrupoExamen,${header}\nBiopsias,B,01,Texto,Descripción`)[0], {
        id: 'B:1', group: 'B', code: '01', result: 'Texto', description: 'Descripción'
    });
});

test('invalid imports fail before replacing a catalog', () => {
    for (const text of ['', header, `${header}\nB,01,"sin cerrar,`, `${header}\nB,01,x`, `${header}\nX,01,Texto,`, `${header}\nB,01, ,`, `${header}\nB,01,"Texto"extra,`]) {
        assert.throws(() => parseResultTemplatesCSV(text));
    }
});

test('each exam only sees its assigned section, including separate C and L catalogs', () => {
    const catalog = parseResultTemplatesCSV(`${header}\nB,01,Biopsia,\nC,01,Citología,\nL,01,Líquido,\nCT,01,Tiroides,\nHPV,01,HPV,`);
    const mapping = { 10: 'B', 20: 'C', 30: 'L', 40: 'CT', 50: 'HPV' };
    for (const [exam, group] of Object.entries(mapping)) {
        assert.deepEqual(templatesForExam(catalog, mapping, exam).map(row => row.group), [group]);
    }
    assert.equal(templatesForExam(catalog, mapping, 20, 'citologia').length, 1);
    assert.equal(templatesForExam(catalog, mapping, 20, 'tiroides').length, 0);
    assert.deepEqual(templatesForExam(catalog, mapping, ''), []);
    assert.deepEqual(templatesForExam(catalog, mapping, 'unassigned'), []);
});

test('insertion preserves the existing result and does not alter the source template', () => {
    assert.equal(appendTemplate('Hallazgo previo', 'Plantilla'), 'Hallazgo previo\n\nPlantilla');
    assert.equal(appendTemplate('', 'Plantilla'), 'Plantilla');
});

test('catalog saves preserve lab identity, flags and exam associations across reloads', () => {
    const existing = { id: 1, name: 'Laboratorio', phone: '809', settings: { aiEnabled: false, requireStepQR: true, resultTemplateExamGroups: { 1: 'B' } } };
    const catalog = [{ id: 'B:1', group: 'B', code: '01', result: 'Texto', description: '' }];
    const payload = buildLabInfoPayload(existing, { resultTemplates: catalog });
    assert.equal(payload.name, undefined);
    const reloaded = labInfoToSettings({ ...existing, ...JSON.parse(JSON.stringify(payload)) });
    assert.equal(reloaded.labName, 'Laboratorio');
    assert.equal(reloaded.phone, '809');
    assert.equal(reloaded.aiEnabled, false);
    assert.equal(reloaded.requireStepQR, true);
    assert.deepEqual(reloaded.resultTemplateExamGroups, { 1: 'B' });
    assert.deepEqual(reloaded.resultTemplates, catalog);
    assert.deepEqual(buildLabInfoPayload(existing, { labName: 'Nuevo' }).settings, existing.settings);
    assert.equal(buildLabInfoPayload(null, { resultTemplates: catalog }).name, 'Laboratorio de Patología');
    assert.equal(buildLabInfoPayload(existing, { openaiApiKey: 'test-secret' }).settings.openaiApiKey, undefined);
});
