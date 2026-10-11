export const DEFAULT_EXAMS = [
    { id: '1', code: '88305', name: 'Biopsia Nivel IV', pricePrivate: 2500 },
    { id: '2', code: '88307', name: 'Biopsia Nivel V', pricePrivate: 4500 },
    { id: '3', code: '88112', name: 'Citología Líquida', pricePrivate: 1200 },
    { id: '4', code: '88342', name: 'Inmunohistoquímica', pricePrivate: 3000 },
    { id: '5', code: 'GEN', name: 'Biopsia', pricePrivate: 3500 }
];

export const readLocalExams = (key) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : DEFAULT_EXAMS.map(exam => ({ ...exam }));
};

export const saveLocalExam = (key, exam, updating = false) => {
    if (!Number.isFinite(exam.pricePrivate) || exam.pricePrivate < 0 ||
        (exam.priceInsurance != null && (!Number.isFinite(exam.priceInsurance) || exam.priceInsurance < 0))) {
        throw new Error('Los precios deben ser números válidos mayores o iguales a cero.');
    }
    const exams = readLocalExams(key);
    const savedExam = { ...exam, id: updating ? exam.id : crypto.randomUUID() };
    if (updating && !exams.some(item => item.id === exam.id)) throw new Error('Examen no encontrado.');
    localStorage.setItem(key, JSON.stringify(updating
        ? exams.map(item => item.id === exam.id ? savedExam : item)
        : [...exams, savedExam]));
    return savedExam;
};

export const deleteLocalExam = (key, id) => {
    localStorage.setItem(key, JSON.stringify(readLocalExams(key).filter(exam => exam.id !== id)));
    return true;
};
