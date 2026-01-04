-- Migration 003: Clinical Fields and Collaboration
-- Description: Adds detailed clinical fields to cases, collaboration tables, and advanced JSONB indices.

-- 1. Update Cases with Clinical Fields
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS doctor_id TEXT,
ADD COLUMN IF NOT EXISTS exam_id TEXT,
ADD COLUMN IF NOT EXISTS clinical_data TEXT,
ADD COLUMN IF NOT EXISTS macroscopy TEXT,
ADD COLUMN IF NOT EXISTS microscopy TEXT,
ADD COLUMN IF NOT EXISTS ihc TEXT,
ADD COLUMN IF NOT EXISTS contribute_to_ai BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_classification JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quantitative_results JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS quality_control JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interconsultation JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tracking JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS microscopy_structured JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS second_look JSONB DEFAULT '{"active": false}',
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS audit_logs JSONB DEFAULT '[]';

-- 2. Collaboration Tables
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

-- 3. Advanced Indices
CREATE INDEX IF NOT EXISTS idx_cases_tracking_gin ON cases USING gin(tracking);
CREATE INDEX IF NOT EXISTS idx_cases_ai_classification_gin ON cases USING gin(ai_classification);
CREATE INDEX IF NOT EXISTS idx_cases_clinical_data_fts ON cases USING gin(to_tsvector('spanish', clinical_data));
CREATE INDEX IF NOT EXISTS idx_cases_microscopy_fts ON cases USING gin(to_tsvector('spanish', microscopy));
