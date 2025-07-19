-- Tabla de empresas (vinculada a Supabase Auth)
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rnc VARCHAR(11) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    provincia VARCHAR(100),
    municipio VARCHAR(100),
    sector VARCHAR(100),
    logo_url TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuraciones por empresa
CREATE TABLE configuraciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    configuracion JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, tipo)
);

-- Tabla de secuencias NCF por empresa
CREATE TABLE secuencias_ncf (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_comprobante tipo_comprobante NOT NULL,
    secuencia_inicial BIGINT NOT NULL,
    secuencia_final BIGINT NOT NULL,
    secuencia_actual BIGINT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, tipo_comprobante)
);

-- Tabla de clientes por empresa
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_cliente tipo_cliente NOT NULL,
    rnc_cedula VARCHAR(20) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    provincia VARCHAR(100),
    municipio VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'DO',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, rnc_cedula)
);

-- Tabla de items por empresa
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    descripcion_corta VARCHAR(100),
    tipo_item tipo_item NOT NULL DEFAULT 'bien',
    categoria VARCHAR(100),
    precio_unitario DECIMAL(12,2) DEFAULT 0,
    tasa_itbis tasa_itbis DEFAULT '18',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

-- Tabla de comprobantes fiscales
CREATE TABLE comprobantes_fiscales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    e_ncf VARCHAR(19) NOT NULL UNIQUE,
    tipo_comprobante tipo_comprobante NOT NULL,
    fecha_emision DATE NOT NULL,
    rnc_comprador VARCHAR(20),
    razon_social_comprador VARCHAR(255),
    telefono_comprador VARCHAR(20),
    email_comprador VARCHAR(255),
    direccion_comprador TEXT,
    provincia_comprador VARCHAR(100),
    municipio_comprador VARCHAR(100),
    pais_comprador VARCHAR(100) DEFAULT 'DO',
    monto_gravado_18 DECIMAL(12,2) DEFAULT 0,
    monto_gravado_16 DECIMAL(12,2) DEFAULT 0,
    monto_gravado_0 DECIMAL(12,2) DEFAULT 0,
    itbis_18 DECIMAL(12,2) DEFAULT 0,
    itbis_16 DECIMAL(12,2) DEFAULT 0,
    itbis_0 DECIMAL(12,2) DEFAULT 0,
    subtotal_gravado DECIMAL(12,2) DEFAULT 0,
    subtotal_itbis DECIMAL(12,2) DEFAULT 0,
    subtotal_exento DECIMAL(12,2) DEFAULT 0,
    total_itbis_retenido DECIMAL(12,2) DEFAULT 0,
    total_isr_retenido DECIMAL(12,2) DEFAULT 0,
    monto_total DECIMAL(12,2) NOT NULL,
    estado_dgii estado_comprobante DEFAULT 'emitido',
    codigo_seguridad VARCHAR(12) NOT NULL,
    track_id VARCHAR(50) NOT NULL UNIQUE,
    fecha_firma TIMESTAMP WITH TIME ZONE,
    qr_code_url TEXT,
    xml_firmado TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de comprobantes
CREATE TABLE detalles_comprobantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID NOT NULL REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    numero_linea INTEGER NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    tipo_item tipo_item NOT NULL DEFAULT 'bien',
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    tasa_itbis tasa_itbis DEFAULT '18',
    descuento DECIMAL(12,2) DEFAULT 0,
    itbis_retenido DECIMAL(12,2) DEFAULT 0,
    isr_retenido DECIMAL(12,2) DEFAULT 0,
    valor_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de borradores
CREATE TABLE borradores_comprobantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_borrador VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_comprobante tipo_comprobante NOT NULL,
    datos_comprobante JSONB NOT NULL DEFAULT '{}',
    monto_total DECIMAL(12,2) DEFAULT 0,
    cantidad_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de almacenamiento de PDFs
CREATE TABLE pdf_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    track_id VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(track_id)
);

-- Índices para optimización
CREATE INDEX idx_empresas_user_id ON empresas(user_id);
CREATE INDEX idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX idx_items_empresa_id ON items(empresa_id);
CREATE INDEX idx_comprobantes_empresa_id ON comprobantes_fiscales(empresa_id);
CREATE INDEX idx_comprobantes_fecha ON comprobantes_fiscales(fecha_emision);
CREATE INDEX idx_comprobantes_estado ON comprobantes_fiscales(estado_dgii);
CREATE INDEX idx_detalles_comprobante_id ON detalles_comprobantes(comprobante_id);
CREATE INDEX idx_borradores_empresa_id ON borradores_comprobantes(empresa_id);
CREATE INDEX idx_pdf_storage_empresa_id ON pdf_storage(empresa_id);
CREATE INDEX idx_pdf_storage_track_id ON pdf_storage(track_id);
