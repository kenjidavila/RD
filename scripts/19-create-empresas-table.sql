-- Script para crear la tabla de empresas utilizada por la API /api/perfil-empresa
-- Crea la tabla solo si no existe para facilitar la instalación

CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnc VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    provincia VARCHAR(100),
    municipio VARCHAR(100),
    sector VARCHAR(100),
    codigo_postal VARCHAR(10),
    tipo_contribuyente VARCHAR(50) DEFAULT 'Persona Jurídica',
    regimen_tributario VARCHAR(50) DEFAULT 'Ordinario',
    actividad_economica VARCHAR(255),
    logo_url TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    configuracion JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_empresas_owner_id ON empresas(owner_id);
