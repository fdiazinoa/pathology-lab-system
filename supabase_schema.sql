-- ====================================================================================
-- Pathology-Lab-System: Schema de Producción para Supabase (PostgreSQL)
-- Arquitecto de Base de Datos: Senior DB Architect & Backend Developer
-- Fecha: 2026-04-16
-- Descripción: Migración de mock data a infraestructura relacional optimizada.
-- ====================================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS Y TIPOS PERSONALIZADOS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_status') THEN
        CREATE TYPE case_status AS ENUM ('Borrador', 'En Proceso', 'Pendiente de Revisión', 'Finalizado', 'Cancelado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_stage') THEN
        CREATE TYPE case_stage AS ENUM ('recepcion', 'macroscopia', 'procesamiento', 'microtomia', 'tincion', 'escaneo', 'microscopia', 'finalizado');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('Privado', 'Asegurado', 'Institucional');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'biological_sex') THEN
        CREATE TYPE biological_sex AS ENUM ('M', 'F', 'Intersex', 'Otro');
    END IF;
END $$;

-- 3. TABLAS

-- 3.1. PROFILES (Extensión de Auth User)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'technician' CHECK (role IN ('admin', 'pathologist', 'technician', 'viewer')),
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2. ARS (Proveedores de Seguro)
CREATE TABLE IF NOT EXISTS public.ars_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3. PATIENTS
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    birth_date DATE, -- Sustituye 'age' por dato real
    identification_number TEXT UNIQUE, -- Cédula/DNI
    sex biological_sex NOT NULL,
    city TEXT,
    region TEXT,
    medical_history TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4. CASES (Main Order Table)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL, -- Ej: C-2023-001
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- Biopsia, Citología, etc.
    organ TEXT NOT NULL,
    status case_status DEFAULT 'Borrador',
    current_stage case_stage DEFAULT 'recepcion',
    diagnosis TEXT,
    payment_method payment_type DEFAULT 'Privado',
    ars_id UUID REFERENCES public.ars_providers(id) ON DELETE SET NULL,
    total_cost DECIMAL(12, 2) DEFAULT 0.00,
    technician_time_mins INTEGER DEFAULT 0,
    pathologist_time_mins INTEGER DEFAULT 0,
    pathologist_id UUID REFERENCES public.profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb, -- Para campos variables extra
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5. CASE_TRACKING_DETAILS
-- Almacena los detalles de cada fase (macroscopia, escaneo, etc)
CREATE TABLE IF NOT EXISTS public.case_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    stage case_stage NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    performed_by UUID REFERENCES public.profiles(id),
    station_id TEXT,
    images_urls TEXT[], -- Array de rutas en Storage
    wsi_url TEXT, -- Whole Slide Image URL
    data JSONB DEFAULT '{}'::jsonb, -- Datos específicos (ej: cassetteId, program)
    notes TEXT
);

-- 3.6. GLOBAL_CASES (Feed de la comunidad)
CREATE TABLE IF NOT EXISTS public.global_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    diagnosis TEXT NOT NULL,
    organ TEXT NOT NULL,
    institution TEXT,
    country TEXT,
    description TEXT,
    image_url TEXT, -- Ruta Storage
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDICES (Optimización B-Tree)
CREATE INDEX idx_patients_full_name ON public.patients USING btree (full_name);
CREATE INDEX idx_patients_identification ON public.patients USING btree (identification_number);
CREATE INDEX idx_cases_patient_id ON public.cases USING btree (patient_id);
CREATE INDEX idx_cases_status ON public.cases USING btree (status);
CREATE INDEX idx_cases_stage ON public.cases USING btree (current_stage);
CREATE INDEX idx_cases_created_at ON public.cases USING btree (created_at DESC);
CREATE INDEX idx_case_tracking_case_id ON public.case_tracking USING btree (case_id);
CREATE INDEX idx_global_cases_diagnosis ON public.global_cases USING gin (to_tsvector('spanish', diagnosis)); -- Optimización búsqueda texto

-- 5. TRIGGERS Y FUNCIONES

-- 5.1. Handle Updated At
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_update_patients BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_update_cases BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5.2. Auditoría Genérica
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs(table_name, record_id, operation, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs(table_name, record_id, operation, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_cases AFTER UPDATE OR DELETE ON public.cases FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- 6. LÓGICA DE NEGOCIO (RPC)

-- 6.1. Calcular Resumen de Facturación por Período
CREATE OR REPLACE FUNCTION get_billing_summary(start_date DATE, end_date DATE)
RETURNS TABLE (
    total_revenue DECIMAL,
    case_count BIGINT,
    avg_cost_per_case DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(total_cost), 0) as total_revenue,
        COUNT(id) as case_count,
        COALESCE(AVG(total_cost), 0) as avg_cost_per_case
    FROM public.cases
    WHERE created_at::DATE BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2. Transicionar Etapa de Caso con Validación
CREATE OR REPLACE FUNCTION transition_case_stage(p_case_id UUID, p_new_stage case_stage)
RETURNS VOID AS $$
BEGIN
    -- Validación simple: no retroceder de 'finalizado' sin permisos
    IF EXISTS (SELECT 1 FROM public.cases WHERE id = p_case_id AND current_stage = 'finalizado') THEN
        RAISE EXCEPTION 'No se puede modificar un caso finalizado.';
    END IF;

    UPDATE public.cases
    SET current_stage = p_new_stage,
        status = CASE 
            WHEN p_new_stage = 'finalizado' THEN 'Finalizado'::case_status 
            ELSE 'En Proceso'::case_status 
        END
    WHERE id = p_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. SEGURIDAD (RLS - Row Level Security)

-- 7.1. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.2. POLÍTICAS

-- Profiles: Usuarios pueden ver todos los perfiles de staff, pero editar solo el suyo.
CREATE POLICY "Public profiles are viewable by authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Patients: Solo personal autenticado puede ver/editar pacientes.
CREATE POLICY "Staff can manage patients" ON public.patients FOR ALL USING (auth.role() = 'authenticated');

-- Cases: RLS granular por rol (ejemplo)
CREATE POLICY "Staff can view all cases" ON public.cases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Technicians and Pathologists can insert cases" ON public.cases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "System admins can delete cases" ON public.cases FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Global Cases: Lectura anónima o autenticada si is_public = true.
CREATE POLICY "Public cases are viewable by everyone" ON public.global_cases FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create and manage their own global cases" ON public.global_cases FOR ALL USING (auth.uid() = author_id);

-- Audit Logs: Solo admins.
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- ====================================================================================
-- IDENTITY & LABORATORY INFORMATION
-- ====================================================================================

CREATE TABLE IF NOT EXISTS public.lab_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for lab_info
ALTER TABLE public.lab_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.lab_info FOR SELECT USING (true);
CREATE POLICY "Lab info editable by admins" ON public.lab_info FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'administrador' OR profiles.role = 'admin'))
);

-- ====================================================================================
-- FIN DEL SCRIPT
-- ====================================================================================
