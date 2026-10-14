import test from 'node:test';
import assert from 'node:assert/strict';
import { structureTemplate, templateMatchesOrgan, applyStructuredTemplate, clearAppliedTemplate } from '../src/services/structuredResultTemplates.js';
import { caseReportMetadata, caseWithReport } from '../src/services/caseReportMetadata.js';

const template = (group, result) => structureTemplate({ id: 'test', code: '01', group, result, description: '' });

test('biopsy explicit sections populate their own fields and preserve numbers and negation', () => {
    const t = template('B', 'Muestra: Mucosa vesical de 2x1 cm.   Técnica........ Hematoxilina Eosina.   LOS CORTES MICROSCOPICOS MUESTRAN; No hay invasión muscular.   DX: Cistitis crónica vesical.   Comentario: Control clínico.');
    assert.match(t.sections.macroscopy, /2x1 cm/);
    assert.equal(t.sections.technique, 'Hematoxilina Eosina.');
    assert.equal(t.sections.microscopy, 'No hay invasión muscular.');
    assert.equal(t.sections.diagnosis, 'Cistitis crónica vesical.');
    assert.equal(t.sections.comments, 'Control clínico.');
    assert.equal(t.result.includes('   '), true);
});

test('cytology separates category, inflammation, organisms, maturation and follow-up', () => {
    for (const group of ['C', 'L']) {
        const t = template(group, 'CÉLULAS EN LÍMITES NORMALES   Inflamatorio Leve.   Candida Albicans   Gardnerella Vaginalis   Endocervicales   Superficiales 10%   Intermedias 90%   5-Comentarios: Control en seis meses.');
        assert.equal(t.sections.category, 'CÉLULAS EN LÍMITES NORMALES');
        assert.equal(t.sections.diagnosis, t.sections.category);
        assert.match(t.sections.organisms, /Candida Albicans\nGardnerella Vaginalis/);
        assert.equal(t.sections.inflammation, 'Inflamatorio Leve.');
        assert.match(t.sections.hormonalAssessment, /10%/);
        assert.equal(t.sections.comments, 'Control en seis meses.');
        assert.equal(templateMatchesOrgan(t, 'EXOCERVIX - ENDOCERVIX'), true);
        assert.equal(templateMatchesOrgan(t, 'PIEL'), false);
    }
});

test('double spaces inside a cytology phrase do not split it into unrelated fields', () => {
    const t = template('L', 'Células en LIMITES NORMALES.    Inflamatorio  Moderado.    Metaplasia  Escamosa.    Células Endocervicales.');
    assert.equal(t.sections.inflammation, 'Inflamatorio Moderado.');
    assert.equal(t.sections.microscopy, 'Metaplasia Escamosa.\nCélulas Endocervicales.');
    assert.equal(t.result.includes('Metaplasia  Escamosa.'), true);
});

test('HPV keeps method, genotype, interpretation, result and comments separate', () => {
    const t = template('HPV', '1- Técnica: Prueba cervical.   2- Genotipado: Alto riesgo 16, 18.   3- Interpretación: No detectado.   4- Resultados: NEGATIVO.   5- Comentario: Control.');
    assert.equal(t.sections.technique, 'Prueba cervical.');
    assert.equal(t.sections.genotype, 'Alto riesgo 16, 18.');
    assert.equal(t.sections.interpretation, 'No detectado.');
    assert.equal(t.sections.diagnosis, 'NEGATIVO.');
    assert.equal(t.sections.comments, 'Control.');
});

test('organ matching rejects unknown anatomy, other organs, mixed specimens, sides and subsites', () => {
    assert.equal(templateMatchesOrgan(template('B', 'PÓLIPO LARÍNGEO.'), 'LARINGE'), true);
    assert.equal(templateMatchesOrgan(template('B', 'PÓLIPO LARÍNGEO.'), 'ANTRO GÁSTRICO'), false);
    assert.equal(templateMatchesOrgan(template('B', 'Fibroma.'), 'PIEL'), false);
    assert.equal(templateMatchesOrgan(template('B', 'ESÓFAGO: lesión.   ANTRO GÁSTRICO: lesión.'), 'ESÓFAGO'), false);
    assert.equal(templateMatchesOrgan(template('B', 'MAMA DERECHA: lesión.'), 'MAMA IZQUIERDA'), false);
    assert.equal(templateMatchesOrgan(template('B', 'MAMA DERECHA: lesión.'), 'MAMA'), false);
    assert.equal(templateMatchesOrgan(template('B', 'ANTRO GÁSTRICO: lesión.'), 'FONDO GÁSTRICO'), false);
    assert.equal(templateMatchesOrgan(template('B', 'ANTRO GÁSTRICO: lesión.'), 'ANTRO GÁSTRICO'), true);
    assert.equal(templateMatchesOrgan(template('B', 'PIEL: lesión.   Comentario: Revisar tiroides.'), 'PIEL'), true);
    assert.equal(templateMatchesOrgan(template('B', 'PIEL: lesión.'), ''), false);
});

test('applying a template fills fields, clears previous template fields and preserves unrelated data', () => {
    const t = template('B', 'Muestra: Piel de 2 cm.   DX: PIEL: lesión.   Comentario: Seguimiento.');
    const original = { organ: 'PIEL', clinicalData: 'Antecedentes', microscopy: 'Texto manual', resultDetails: { adequacy: 'Evaluación manual' } };
    const form = applyStructuredTemplate(original, t, 'PIEL', 'B');
    assert.equal(form.macroscopy, 'Piel de 2 cm.');
    assert.equal(form.diagnosis, 'PIEL: lesión.');
    assert.equal(form.microscopy, 'Texto manual');
    assert.equal(form.resultDetails.comments, 'Seguimiento.');
    assert.equal(form.resultDetails.adequacy, 'Evaluación manual');
    assert.equal(original.diagnosis, undefined);
    const next = applyStructuredTemplate(form, template('B', 'PIEL: Otro resultado.'), 'PIEL', 'B');
    assert.equal(next.macroscopy, '');
    assert.equal(next.resultDetails.comments, undefined);
    const cleared = clearAppliedTemplate(next);
    assert.equal(cleared.diagnosis, '');
    assert.equal(cleared.microscopy, 'Texto manual');
    assert.equal(cleared.clinicalData, 'Antecedentes');
    assert.throws(() => applyStructuredTemplate(original, t, 'PRÓSTATA', 'B'));
    assert.throws(() => applyStructuredTemplate(original, t, 'PIEL', 'C'));
});

test('structured fields survive cloud metadata round-trip without changing other metadata', () => {
    const record = { examId: 'exam', diagnosis: 'Texto', resultDetails: { comments: 'Seguimiento', genotype: '16' }, metadata: { tracking: { stage: 'draft' } } };
    const metadata = JSON.parse(JSON.stringify(caseReportMetadata(record)));
    const loaded = caseWithReport({ id: 'case', patient_id: 'patient', metadata });
    assert.deepEqual(loaded.resultDetails, record.resultDetails);
    assert.deepEqual(metadata.tracking, record.metadata.tracking);
    assert.equal(loaded.diagnosis, 'Texto');
    assert.equal(loaded.examId, 'exam');
    assert.equal(loaded.patientId, 'patient');
    const partialUpdate = caseReportMetadata({ microscopy: 'Actualizada' }, metadata);
    assert.deepEqual(partialUpdate.report.resultDetails, record.resultDetails);
    assert.equal(partialUpdate.report.diagnosis, 'Texto');
    assert.equal(partialUpdate.report.microscopy, 'Actualizada');
    assert.deepEqual(partialUpdate.tracking, record.metadata.tracking);
});
