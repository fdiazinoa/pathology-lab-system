-- Migration 002: Performance Optimization
-- Description: Adds B-Tree, GIN, and FTS indices for high-frequency queries.

-- 1. B-Tree Indices
CREATE INDEX IF NOT EXISTS idx_cases_patient_id ON cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Full-Text Search (Spanish)
CREATE INDEX IF NOT EXISTS idx_cases_diagnosis_fts ON cases USING gin(to_tsvector('spanish', diagnosis));
