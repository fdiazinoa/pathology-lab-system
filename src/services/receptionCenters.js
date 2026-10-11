// Initial origin-center directory for Greater Santo Domingo.
// Sources: https://cedimat.com/index.php/contacts/
// https://www.clinicaabreu.com.do/sucursales-imagenes-diagnosticas
// https://portalpacientes.hgps.org.do/
// https://clinicacorazonesunidos.com.do/contacto
// https://sns.gob.do/equipamiento/entrega-de-equipos-a-hospitales-ha-incrementado-hasta-30-veces-su-produccion-de-servicios/
// https://hospitalneyarias.gob.do/
export const SANTO_DOMINGO_CENTERS = [
    { id: 'sd-cedimat', name: 'CEDIMAT' },
    { id: 'sd-abreu', name: 'Clínica Abreu' },
    { id: 'sd-corazones-unidos', name: 'Clínica Corazones Unidos' },
    { id: 'sd-plaza-salud', name: 'Hospital General de la Plaza de la Salud' },
    { id: 'sd-gautier', name: 'Hospital Salvador B. Gautier' },
    { id: 'sd-moscoso-puello', name: 'Hospital Dr. Francisco E. Moscoso Puello' },
    { id: 'sd-robert-reid', name: 'Hospital Infantil Dr. Robert Reid Cabral' },
    { id: 'sd-ney-arias', name: 'Hospital Traumatológico Dr. Ney Arias Lora' },
    { id: 'sd-dario-contreras', name: 'Hospital Traumatológico Dr. Darío Contreras' },
    { id: 'sd-marcelino-velez', name: 'Hospital Dr. Marcelino Vélez Santana' }
];

const centerKey = (name) => String(name ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

export const getReceptionCenters = (configuredCenters = []) => {
    const centers = new Map();
    for (const center of configuredCenters) {
        if (center.id && center.name) centers.set(centerKey(center.name), center);
    }
    for (const center of SANTO_DOMINGO_CENTERS) {
        if (!centers.has(centerKey(center.name))) centers.set(centerKey(center.name), center);
    }
    return [...centers.values()].filter(center => center.is_active !== false)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
};
