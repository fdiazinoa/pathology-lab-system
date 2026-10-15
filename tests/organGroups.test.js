import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyOrgan, ORGAN_GROUPS } from '../scripts/classify-organ-groups.mjs';

test('groups use the requested six categories independently of procedure', () => {
    assert.equal(ORGAN_GROUPS.length, 6);
    for (const name of ['CÉRVIX', 'ENDOMETRIO', 'EXOCERVIX - ENDOCERVIX', 'GLANDULA DE BARTOLINO']) assert.equal(classifyOrgan(name).anatomical_group, 'Ginecológicas');
    for (const name of ['ESTOMAGO', 'YEYUNO', 'ANTRO GÁSTRICO', 'MUCOSA ANTRAL', 'VESÍCULA BILIAR']) assert.equal(classifyOrgan(name).anatomical_group, 'Gastrointestinal');
});
test('anatomical lookalikes do not cross specialties', () => {
    for (const name of ['TUNICA VAGINAL DERECHA E IZQUIERDA', 'CAPA VAGINALIS', 'RIÑÓN', 'PROSTATA', 'REGION TUNICA VAGINAL']) assert.equal(classifyOrgan(name).anatomical_group, 'Urogenital');
    assert.equal(classifyOrgan('TABIQUE VAGINAL').anatomical_group, 'Ginecológicas');
    assert.equal(classifyOrgan('SENO MAXILAR').anatomical_group, 'Patología Quirúrgica');
    assert.equal(classifyOrgan('MAMA IZQUIERDA').anatomical_group, 'Glándulas Mamarias');
    assert.equal(classifyOrgan('MUSCULO RECTO ANTERIOR').anatomical_group, 'Piel y Partes Blandas');
    assert.equal(classifyOrgan('COLUMNA LUMBAR').anatomical_group, 'Patología Quirúrgica');
    assert.equal(classifyOrgan('REGION APENDICE PRE-AURICULAR').anatomical_group, 'Patología Quirúrgica');
});
test('ambiguous and mixed source labels remain reviewable without invented anatomy', () => {
    for (const name of ['LABIO ANTERIOR', 'NODULO', 'FONDO', 'REGION VESICO-VAGINAL', 'INTROITO VAGINAL Y PERIURETRAL', 'REGION ANO-GENITAL', 'HIPOGASTRIO', 'EPIGASTRIO', '']) {
        const actual = classifyOrgan(name);
        assert.equal(actual.anatomical_group, 'Patología Quirúrgica', name);
        assert.equal(actual.classification_review_required, true, name);
    }
});
