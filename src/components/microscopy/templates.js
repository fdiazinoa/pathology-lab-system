export const MICROSCOPY_TEMPLATES = {
    // --- PIEL ---
    'Piel - Carcinoma Basocelular': {
        architecture: 'Fragmento de piel con nidos de células basaloides que infiltran la dermis.',
        pattern: 'Nidos sólidos con empalizada periférica y retracción del estroma (clefting).',
        cytology: 'Núcleos hipercromáticos, escaso citoplasma, figuras mitóticas frecuentes.',
        stroma: 'Estroma fibromixoide.',
        mitosis: 'Presentes.',
        necrosis: 'Células apoptóticas individuales (cuerpos apoptóticos).',
        infiltration: 'Infiltra dermis reticular.',
        differential: 'Tricoblastoma, Carcinoma de células escamosas basalioide.',
        ihq: 'Ber-EP4 (+), EMA (-).'
    },
    'Piel - Carcinoma Escamoso': {
        architecture: 'Proliferación de queratinocitos atípicos que invaden la dermis.',
        pattern: 'Nidos y cordones irregulares con formación de perlas córneas.',
        cytology: 'Pleomorfismo nuclear, nucléolos prominentes, disqueratosis.',
        stroma: 'Desmoplásico con infiltrado inflamatorio crónico.',
        mitosis: 'Frecuentes y atípicas.',
        necrosis: 'Focal tipo comedo.',
        infiltration: 'Invasión profunda.',
        differential: 'Queratoacantoma, Verruga vulgar.',
        ihq: 'CK5/6 (+), p63 (+), p40 (+).'
    },
    'Piel - Melanoma': {
        architecture: 'Lesión melanocítica asimétrica y mal delimitada.',
        pattern: 'Crecimiento pagetoide en epidermis y nidos confluentes en dermis.',
        cytology: 'Melanocitos atípicos, nucléolos prominentes (tipo "ojo de cereza"), pigmento melánico.',
        stroma: 'Linfocitos peritumorales (TILs).',
        mitosis: 'Presentes (se debe reportar índice mitótico /mm2).',
        necrosis: 'Puede estar presente.',
        infiltration: 'Nivel de Clark IV, Breslow (medir en mm).',
        differential: 'Nevus de Spitz, Nevus displásico.',
        ihq: 'S100 (+), HMB-45 (+), Melan-A (+), SOX10 (+).'
    },

    // --- GASTROINTESTINAL ---
    'Estómago - Adenocarcinoma': {
        architecture: 'Mucosa gástrica infiltrada por neoplasia glandular.',
        pattern: 'Glándulas irregulares, fusionadas o células en anillo de sello.',
        cytology: 'Atipia nuclear marcada, pérdida de polaridad.',
        stroma: 'Desmoplasia intensa.',
        mitosis: 'Frecuentes.',
        necrosis: 'Sucia intraluminal.',
        infiltration: 'Invade muscular propia.',
        differential: 'Linfoma gástrico, Tumor neuroendocrino.',
        ihq: 'CK7 (+), CK20 (+/-), CDX2 (+).'
    },
    'Estómago - Gastritis H. Pylori': {
        architecture: 'Mucosa gástrica con arquitectura conservada.',
        pattern: 'Infiltrado inflamatorio en lámina propia.',
        cytology: 'Metaplasia intestinal focal.',
        stroma: 'Linfocitos, células plasmáticas y neutrófilos intraepiteliales.',
        mitosis: 'Ausentes.',
        necrosis: 'Ausente.',
        infiltration: 'No aplica.',
        differential: 'Gastritis química, Gastritis autoinmune.',
        ihq: 'Giemsa o IHQ para H. pylori (+).'
    },
    'Colon - Adenocarcinoma': {
        architecture: 'Fragmentos de mucosa colónica con neoplasia.',
        pattern: 'Glándulas irregulares, cribiformes, con luz sucia.',
        cytology: 'Núcleos alargados, pseudoestratificados, pérdida de polaridad.',
        stroma: 'Inflamatorio crónico.',
        mitosis: 'Frecuentes.',
        necrosis: 'Necrosis sucia intraluminal.',
        infiltration: 'Invade submucosa.',
        differential: 'Adenoma con displasia de alto grado.',
        ihq: 'CK20 (+), CK7 (-), CDX2 (+).'
    },

    // --- GENITOURINARIO ---
    'Próstata - Adenocarcinoma': {
        architecture: 'Cilindros prostáticos con proliferación acinar atípica.',
        pattern: 'Glándulas pequeñas, infiltrantes, fusionadas (Gleason 4).',
        cytology: 'Núcleos agrandados, nucléolos prominentes.',
        stroma: 'Ausencia de células basales.',
        mitosis: 'Ocasionales.',
        necrosis: 'Ausente.',
        infiltration: 'Infiltración perineural presente.',
        differential: 'Adenosis, Atrofia.',
        ihq: 'CK903 (negativo), p63 (negativo), AMACR (positivo).'
    },
    'Riñón - Carcinoma Células Claras': {
        architecture: 'Masa renal sólida y quística.',
        pattern: 'Nidos sólidos y túbulos rodeados por red vascular prominente ("patrón en gallinero").',
        cytology: 'Citoplasma claro rico en lípidos/glucógeno, membrana celular bien definida.',
        stroma: 'Vascularizado.',
        mitosis: 'Variables según grado ISUP.',
        necrosis: 'Frecuente.',
        infiltration: 'Puede invadir grasa del seno renal.',
        differential: 'Carcinoma papilar, Oncocitoma.',
        ihq: 'PAX8 (+), CD10 (+), RCC (+), CK7 (-).'
    },
    'Vejiga - Carcinoma Urotelial': {
        architecture: 'Lesión papilar exofítica.',
        pattern: 'Papilas con tallos fibrovasculares revestidas por urotelio engrosado.',
        cytology: 'Pérdida de polaridad, pleomorfismo nuclear, mitosis suprabasales.',
        stroma: 'Invasión del tallo vascular (si es invasivo).',
        mitosis: 'Frecuentes.',
        necrosis: 'Puede estar presente.',
        infiltration: 'Evaluar invasión a lámina propia o muscular propia.',
        differential: 'Papiloma urotelial, Cistitis polipoide.',
        ihq: 'GATA3 (+), p63 (+), CK7 (+), CK20 (+).'
    },

    // --- GINECOLÓGICO ---
    'Mama - Carcinoma Ductal Invasivo': {
        architecture: 'Tejido mamario con proliferación epitelial maligna.',
        pattern: 'Nidos sólidos, cordones y túbulos formados.',
        cytology: 'Pleomorfismo nuclear moderado a severo.',
        stroma: 'Desmoplasia moderada.',
        mitosis: 'Variables (Grado Nottingham).',
        necrosis: 'Focal.',
        infiltration: 'Invasión linfovascular no identificada.',
        differential: 'Carcinoma lobulillar, Hiperplasia ductal atípica.',
        ihq: 'ER, PR, HER2, Ki-67.'
    },
    'Cérvix - Carcinoma Escamoso': {
        architecture: 'Fragmentos de cérvix con neoplasia invasiva.',
        pattern: 'Nidos irregulares de células escamosas que rompen la membrana basal.',
        cytology: 'Núcleos grandes, hipercromáticos, citoplasma eosinófilo.',
        stroma: 'Reacción desmoplásica e inflamatoria.',
        mitosis: 'Frecuentes.',
        necrosis: 'Frecuente.',
        infiltration: 'Invade estroma cervical.',
        differential: 'HSIL con extensión glandular, Atrofia.',
        ihq: 'p16 (difuso en bloque +), Ki-67 (alto).'
    },
    'Endometrio - Adenocarcinoma Endometroide': {
        architecture: 'Proliferación glandular compleja "espalda con espalda".',
        pattern: 'Glándulas cribiformes o confluentes sin estroma intermedio.',
        cytology: 'Núcleos redondeados, estratificados, nucléolos visibles.',
        stroma: 'Escaso o ausente entre glándulas.',
        mitosis: 'Frecuentes.',
        necrosis: 'Focal.',
        infiltration: 'Invade miometrio.',
        differential: 'Hiperplasia compleja atípica.',
        ihq: 'Vimentina (+), ER (+), PR (+), PTEN (pérdida).'
    },

    // --- CABEZA Y CUELLO / ENDOCRINO ---
    'Tiroides - Carcinoma Papilar': {
        architecture: 'Nódulo encapsulado/infiltrante.',
        pattern: 'Papilas complejas con tallos fibrovasculares.',
        cytology: 'Núcleos con vidrio esmerilado, hendiduras, pseudoinclusiones.',
        stroma: 'Cuerpos de Psamoma presentes.',
        mitosis: 'Raras.',
        necrosis: 'Ausente.',
        infiltration: 'Invasión capsular focal.',
        differential: 'Adenoma folicular, NIFTP.',
        ihq: 'TTF-1 (+), Tiroglobulina (+), HBME-1 (+).'
    },

    // --- PULMÓN ---
    'Pulmón - Adenocarcinoma': {
        architecture: 'Nódulo pulmonar periférico.',
        pattern: 'Lepidico, acinar, papilar, micropapilar o sólido.',
        cytology: 'Células con mucina intracitoplasmática, núcleos atípicos.',
        stroma: 'Fibrosis central.',
        mitosis: 'Presentes.',
        necrosis: 'Focal.',
        infiltration: 'Invade pleura visceral.',
        differential: 'Mesotelioma, Metástasis.',
        ihq: 'TTF-1 (+), Napsina A (+), CK7 (+).'
    },

    // --- HEMATOLINFOIDE ---
    'Ganglio - Linfoma Difuso Células Grandes B': {
        architecture: 'Borramiento difuso de la arquitectura ganglionar.',
        pattern: 'Sábanas de células grandes.',
        cytology: 'Células grandes (2x linfocito normal), nucléolos prominentes, citoplasma basófilo.',
        stroma: 'Escaso.',
        mitosis: 'Muy frecuentes, cuerpos apoptóticos.',
        necrosis: 'Geográfica.',
        infiltration: 'Extensión extracapsular.',
        differential: 'Carcinoma metastásico, Melanoma.',
        ihq: 'CD20 (+), CD3 (-), Ki-67 (>40%), BCL6 (+).'
    }
};
