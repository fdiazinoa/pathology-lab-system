-- Pathology Lab System - Consolidated Schema (v3)
-- This script represents the current state of the database.

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role_id TEXT REFERENCES roles(id),
    status TEXT DEFAULT 'Active',
    last_login TIMESTAMP WITH TIME ZONE,
    avatar TEXT,
    auth_provider TEXT DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    sex CHAR(1),
    city TEXT,
    region TEXT,
    history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Doctors Table (Catalog)
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    license TEXT,
    email TEXT
);

-- 5. Exams Table (Catalog)
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    price_private DECIMAL(10, 2)
);

-- 6. Cases Table
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
    exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL,
    patient_name TEXT,
    type TEXT NOT NULL,
    organ TEXT,
    status TEXT DEFAULT 'Borrador',
    stage TEXT DEFAULT 'Recepción',
    clinical_data TEXT,
    macroscopy TEXT,
    microscopy TEXT,
    ihc TEXT,
    diagnosis TEXT,
    payment_type TEXT,
    ars_name TEXT,
    cost DECIMAL(10, 2),
    technician_time INTEGER DEFAULT 0,
    pathologist_time INTEGER DEFAULT 0,
    contribute_to_ai BOOLEAN DEFAULT TRUE,
    ai_classification JSONB DEFAULT NULL,
    quantitative_results JSONB DEFAULT '{}',
    quality_control JSONB DEFAULT NULL,
    interconsultation JSONB DEFAULT NULL,
    tracking JSONB DEFAULT '{}',
    microscopy_structured JSONB DEFAULT '{}',
    second_look JSONB DEFAULT '{"active": false}',
    images JSONB DEFAULT '[]',
    audit_logs JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Global Cases Table (Collaboration)
CREATE TABLE IF NOT EXISTS global_cases (
    id TEXT PRIMARY KEY,
    diagnosis TEXT,
    organ TEXT,
    institution TEXT,
    country TEXT,
    description TEXT,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    original_case_id TEXT REFERENCES cases(id) ON DELETE SET NULL
);

-- 8. Audit Logs Table (Detailed tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Deliveries Table (Logistics)
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pendiente',
    driver TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Catalogs
CREATE TABLE IF NOT EXISTS insurers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tariff TEXT
);

CREATE TABLE IF NOT EXISTS organs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'Online'
);

-- 11. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    lab_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo TEXT,
    openai_api_key TEXT,
    ai_enabled BOOLEAN DEFAULT TRUE,
    enable_lab_workflow BOOLEAN DEFAULT TRUE,
    enable_microphone BOOLEAN DEFAULT FALSE,
    require_internal_qr_scan BOOLEAN DEFAULT FALSE,
    print_images_in_report BOOLEAN DEFAULT TRUE,
    paper_size TEXT DEFAULT 'Letter',
    printer_config JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- INDICES FOR OPTIMIZATION ---

-- 1. B-Tree Indices
CREATE INDEX IF NOT EXISTS idx_cases_patient_id ON cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_doctor_id ON cases(doctor_id);
CREATE INDEX IF NOT EXISTS idx_cases_exam_id ON cases(exam_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_organ ON cases(organ);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(type);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON cases(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deliveries_case_id ON deliveries(case_id);

CREATE INDEX IF NOT EXISTS idx_global_cases_original_case_id ON global_cases(original_case_id);

-- 2. JSONB Indices
CREATE INDEX IF NOT EXISTS idx_cases_tracking_gin ON cases USING gin(tracking);
CREATE INDEX IF NOT EXISTS idx_cases_ai_classification_gin ON cases USING gin(ai_classification);
CREATE INDEX IF NOT EXISTS idx_roles_permissions_gin ON roles USING gin(permissions);

-- 3. Full-Text Search Indices
CREATE INDEX IF NOT EXISTS idx_cases_diagnosis_fts ON cases USING gin(to_tsvector('spanish', diagnosis));
CREATE INDEX IF NOT EXISTS idx_cases_clinical_data_fts ON cases USING gin(to_tsvector('spanish', clinical_data));
CREATE INDEX IF NOT EXISTS idx_cases_microscopy_fts ON cases USING gin(to_tsvector('spanish', microscopy));
CREATE INDEX IF NOT EXISTS idx_patients_history_fts ON patients USING gin(to_tsvector('spanish', history));
