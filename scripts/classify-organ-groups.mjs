import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ORGAN_GROUPS } from '../src/services/organGroups.js';
export { ORGAN_GROUPS };
const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
export function classifyOrgan(name) {
    const n = normalized(name);
    const result = (index, reason, review = false) => ({ anatomical_group: ORGAN_GROUPS[index], classification_review_required: review, reason });
    // Mixed compartments and generic labels do not establish a single anatomical specialty.
    if (/VESICO[- ](?:VAGINAL|UTERINO|COLON|CUTANEA)|RECTO[- ](?:VAGINAL|UTERINO)|HIDATIDE DE MORGAGNI|INTROITO VAGINAL Y PERIURETRAL|ANO-GENITAL/.test(n)) return result(5, 'Localización compartida; requiere revisión', true);
    // The tunica vaginalis belongs to the testis, not to the female genital tract.
    if (/TUNICA VAGINAL|CAPA VAGINALIS|TESTIC|EPIDIDIM|ESPERMATIC|ESCROT|PENOESCROT|DEFERENT|CRIPTORQUID|HIDROCELE|VARICOCELE|SEMINAL|PREPUC|BALANO|\bGLANDE\b|\bPENE\b|PENEAN|PENIAN|URETR|URETER|URINARI|\bRENAL\b|\bRINON\b|VESICAL|\bVEJIGA\b|VESICO PROSTAT|\bPERIVESICAL\b|PROSTATA/.test(n)) return result(2, 'Anatomía urinaria o genital masculina explícita');
    if (/CERVIX|ENDOCERV|EXOCERV|ENDOCE|ENDOMETR|UTER|OVARI|OVARI[COA]|ANEXO|ANEXIAL|TUBARIC|TROMPA|FIMBRIA|VULV|VAGIN|CLITORIS|BARTOLINO|BARTOLIN|HIMEN|PLACENTA|AMNIOTIC|EMBARAZO ECTOPICO|^ECTOPICO$|EPISIOTOMIA|MONTE DE VENUS|LABIOS? (MAYOR|MENOR)|CANAL CERVICAL|^INTROITO$|^ORQUILLA$|MUNON CERVICAL/.test(n)) return result(0, 'Anatomía ginecológica explícita');
    if (/\bMAMA\b|MAMARI|MAMARIA|MAMARIAS|PEZON|AREOLA|TETILLA|^SENO IZQUIERDO/.test(n)) return result(3, 'Mama, pezón o areola explícitos');
    if (/MUSCULO|MUSCULAR|FASCIA|TENDON|TENDINOS/.test(n)) return result(4, 'Músculo, fascia o tendón explícitos');
    if (/ESOFAG|ESTOMAGO|\bGASTR|GASTRO|DUODEN|YEYUN|MUCOSA ANTRAL|PILOR|\bANTRO PILORO|\bILEO\b|ILEON|ILEOC|ILEOR|COLON|COLECTOM|COLOSTOM|CIEGO|SIGMOID|\bRECTO\b|RECTAL|\bANO\b|\bANAL\b|INTESTIN|APENDICE VERMIFORME|APENDICE EPIPLOICA|REGION APENDICULAR|AMPOLLA DE VATER|HIGADO|HEPATIC|BILIAR|PANCREA|EPIPL|OMENTO|MESENTER|MESO DEL CIEGO|^CARDIAS$|^SUBCARDIAL$|^CURVATURA (MAYOR|MENOR)$|^INCISURA( ANGULAR)?$|INCISURA ANGULARIS|^PAPILA MENOR$|ULCERA PEPTICA|^BULBO-DUODENAL$|ANGULO ESPLENICO|BOCA ANASTOMOTICA/.test(n) && !/PREAURICULAR|TESTICULAR|COLUMNA/.test(n)) return result(1, 'Tracto digestivo o anexos digestivos explícitos');
    if (/PIEL|CUTANE|EPIDERM|SUB[- ]?EPIDERM|UNGUEAL|\bUNA\b|CUERO CABELLUDO|EPICRANEO|TEJIDO BLANDO|MUSCULO|FASCIA|TENDON|TENDINOS|LIPOMA|CICATRIZ|PILONIDAL|QUISTE DE ESPALDA|AREA BIGOTE|CEJA|SUPERCILIAR|SUPRACILIAR|SUB[- ]CILIAR|ENTRECEJO/.test(n)) return result(4, 'Piel, anexos cutáneos o partes blandas explícitos');
    if (/ADENOID|AMIGDAL|TONSILA|GARGANTA|CAVUM|SUPRAGLOT|PIRIFORME|NASAL|NASO|ETMOID|ESFENOID|CORNET|CONCHA BULLOSA|EPIGLOT|ARITENOID|LARING|FARING|TRAQUE|BRONQUI|BRONCO|PULMON|PLEUR|MEDIASTIN|CUERDA.*VOCAL|CARINA|TIMO|TIROID|TIROGLOS|PAROTID|GLANDULA.*MAXILAR|SUPRARRENAL|BAZO|GANGLI|ADENOPATIA|LINFO|LINFADEN|HUESO|OSE[AO]|FEMUR|FEMORAL|HUMER|TIBI|PERONE|RADIO DERECHO|CUBITO|CALCANEO|ACETABULO|METATARS|MANDIBUL|MAXILAR|DENT|MOLAR|CORDAL|INCISIV|ODONTO|ALVEOLAR|ENCIA|GINGIV|CRANEO|COLUMNA|CRESTA ILIACA|COCCIG|HIOIDES|CADERA|CODO|MALEOLO|DIAFRAGMA|CEREBR|CEREBELO|EXTRADURAL|INTERVERTEBR|VERTEBR|APOFISIS|COSTAL|ESTERNON|ARTERIA|\bVENA|SANGUINEO|VALVULA AORTICA|VENTRICULO|PERICARD|NERVIO|LENGUA|LINGUAL|ORAL|BUCAL|YUGAL|PALADAR|PALATOGLOS|UVULA|AUDITIV|OIDO|OREJA|AURICUL|HELIX|PARPADO|PALPEBR|BOCA|MUCOSA LABIAL|PALATINO|RANULA|SEPTAL|ORBIT|CONJUNTIV|CORNUEL|^OJO|\bRODILLA\b|MESETA|ASTRALAGO|SACO HERNIARIO|HERNIA DISCAL|LIGAMENTO AMARILLO/.test(n)) return result(5, 'Otras especialidades quirúrgicas con anatomía explícita');
    return result(5, 'Nombre genérico o localización sin tejido/especialidad identificable', true);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const source = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    const rows = source.map(organ => ({ ...organ, ...classifyOrgan(organ.name) }));
    writeFileSync(process.argv[3], JSON.stringify(rows, null, 2) + '\n');
    console.log(JSON.stringify(Object.fromEntries(ORGAN_GROUPS.map(group => [group, rows.filter(row => row.anatomical_group === group).length]))));
    console.log(`Revisión: ${rows.filter(row => row.classification_review_required).length}`);
}
