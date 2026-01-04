-- Migration 001: Initial Schema
-- Description: Basic tables for roles, users, patients, cases, and settings.

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

-- 4. Cases Table (Baseline)
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
    patient_name TEXT,
    type TEXT NOT NULL,
    organ TEXT,
    status TEXT DEFAULT 'Borrador',
    stage TEXT DEFAULT 'Recepción',
    diagnosis TEXT,
    payment_type TEXT,
    ars_name TEXT,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Settings Table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
