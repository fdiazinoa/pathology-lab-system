export const MOCK_PATIENTS = [
    {
        id: 'P-1001',
        name: 'Maria Gonzalez',
        age: 45,
        sex: 'F',
        city: 'Santo Domingo',
        region: 'Distrito Nacional',
        history: 'Antecedentes de nódulo tiroideo (2022). Hipertensión controlada.',
        createdAt: '2023-11-10'
    },
    {
        id: 'P-1002',
        name: 'Marcos Perez',
        age: 62,
        sex: 'M',
        city: 'Santiago de los Caballeros',
        region: 'Cibao Norte',
        history: 'Fumador (20 paq/año). Tos crónica.',
        createdAt: '2023-11-15'
    },
    {
        id: 'P-1003',
        name: 'Ana Rodriguez',
        age: 34,
        sex: 'F',
        city: 'La Romana',
        region: 'Yuma',
        history: 'Sin antecedentes patológicos relevantes.',
        createdAt: '2023-11-20'
    },
    {
        id: 'P-1004',
        name: 'Carlos Sanchez',
        age: 55,
        sex: 'M',
        city: 'Santo Domingo',
        region: 'Distrito Nacional',
        history: 'Diabetes Tipo 2.',
        createdAt: '2023-11-25'
    },
    {
        id: 'P-1005',
        name: 'Marcos Perez',
        age: 29,
        sex: 'F',
        city: 'Punta Cana',
        region: 'Yuma',
        history: 'Asma bronquial.',
        createdAt: '2023-11-28'
    }
];

export const MOCK_CASES = [
    {
        id: 'C-2023-001',
        patientId: 'P-1001',
        patientName: 'Maria Gonzalez',
        type: 'Biopsia',
        organ: 'Tiroides',
        status: 'Finalizado',
        stage: 'Finalizado',
        diagnosis: 'Carcinoma Papilar de Tiroides',
        paymentType: 'Asegurado',
        arsName: 'ARS Humano',
        cost: 4500,
        technicianTime: 45, // minutes
        pathologistTime: 20, // minutes
        createdAt: '2023-11-12',
        updatedAt: '2023-11-14',
        tracking: {
            macroscopy: {
                completed: true,
                timestamp: '2023-11-12T10:30:00',
                images: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Adrenocortical_carcinoma_--_intermed_mag.jpg/640px-Adrenocortical_carcinoma_--_intermed_mag.jpg'],
                station: 'Macro-Station-01',
                technician: 'Téc. María López'
            },
            processing: {
                completed: true,
                timestamp: '2023-11-12T14:00:00',
                cassetteId: 'CAS-2023-001-A',
                program: 'Rutina Nocturna (12h)',
                alerts: []
            },
            microtomy: {
                completed: true,
                timestamp: '2023-11-13T08:00:00',
                slides: ['SL-001-A1', 'SL-001-A2'],
                technician: 'Téc. Juan Soto'
            },
            scanning: {
                completed: true,
                timestamp: '2023-11-13T09:30:00',
                wsiUrl: 'simulated-wsi-url',
                scanner: 'Aperio GT 450'
            }
        }
    },
    {
        id: 'C-2023-002',
        patientId: 'P-1002',
        patientName: 'Juan Perez',
        type: 'Citología',
        organ: 'Pulmón (Lavado Broncoalveolar)',
        status: 'Borrador',
        stage: 'Microscopía',
        diagnosis: '',
        paymentType: 'Privado',
        cost: 2500,
        technicianTime: 30,
        pathologistTime: 0, // Not yet analyzed
        createdAt: '2023-11-22',
        updatedAt: '2023-11-22'
    },
    {
        id: 'C-2025-003',
        patientId: 'P-1003',
        patientName: 'Ana Rodriguez',
        type: 'Biopsia',
        organ: 'Piel',
        status: 'Finalizado',
        stage: 'Finalizado',
        diagnosis: 'Melanoma in situ',
        paymentType: 'Asegurado',
        arsName: 'ARS Palic',
        cost: 3800,
        technicianTime: 40,
        pathologistTime: 25,
        createdAt: '2025-12-04T00:30:47.066Z',
        updatedAt: '2025-12-04T00:30:47.066Z'
    }
];

export const MOCK_GLOBAL_CASES = [
    {
        id: 'GL-8821',
        diagnosis: 'Sarcoma de Ewing Extraóseo',
        organ: 'Tejido Blando',
        institution: 'Hospital Charité (Berlín)',
        country: 'Alemania',
        description: 'Presentación atípica en paciente de 45 años. Confirmación molecular EWSR1.',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Ewing_sarcoma_--_intermed_mag.jpg/640px-Ewing_sarcoma_--_intermed_mag.jpg',
        likes: 24,
        comments: 5,
        date: '2023-11-28'
    },
    {
        id: 'GL-9932',
        diagnosis: 'Carcinoma Adrenocortical Oncocítico',
        organ: 'Glándula Suprarrenal',
        institution: 'Mayo Clinic (USA)',
        country: 'Estados Unidos',
        description: 'Tumor de 15cm. Weiss score indeterminado. Se busca consenso sobre potencial maligno.',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Adrenocortical_carcinoma_--_intermed_mag.jpg/640px-Adrenocortical_carcinoma_--_intermed_mag.jpg',
        likes: 12,
        comments: 8,
        date: '2023-11-29'
    },
    {
        id: 'GL-1102',
        diagnosis: 'Glioblastoma de Células Gigantes',
        organ: 'Cerebro',
        institution: 'Instituto Nacional de Neurología (México)',
        country: 'México',
        description: 'Variante rara. Células multinucleadas bizarras. IDH wild-type.',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Glioblastoma_--_very_high_mag.jpg/640px-Glioblastoma_--_very_high_mag.jpg',
        likes: 45,
        comments: 12,
        date: '2023-11-30'
    }
];
