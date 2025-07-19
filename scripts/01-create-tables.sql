-- Crear tablas para el sistema de facturación electrónica

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rnc VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    provincia VARCHAR(100),
    municipio VARCHAR(100),
    logo_url TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    rnc_cedula VARCHAR(11) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'firmante', 'aprobador_comercial', 'solicitante')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de certificados digitales
CREATE TABLE IF NOT EXISTS certificados_digitales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    archivo_certificado TEXT NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de secuencias NCF
CREATE TABLE IF NOT EXISTS secuencias_ncf (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_comprobante VARCHAR(10) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    secuencia_actual INTEGER DEFAULT 0,
    secuencia_limite INTEGER NOT NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comprobantes fiscales electrónicos
CREATE TABLE IF NOT EXISTS comprobantes_fiscales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    e_ncf VARCHAR(19) UNIQUE NOT NULL,
    tipo_comprobante VARCHAR(10) NOT NULL,
    tipo_ingreso VARCHAR(10) NOT NULL,
    fecha_emision DATE NOT NULL,
    
    -- Datos del comprador
    rnc_comprador VARCHAR(11),
    id_extranjero VARCHAR(50),
    razon_social_comprador VARCHAR(255),
    telefono_comprador VARCHAR(20),
    email_comprador VARCHAR(255),
    direccion_comprador TEXT,
    provincia_comprador VARCHAR(100),
    municipio_comprador VARCHAR(100),
    
    -- Información de referencia (para notas de crédito/débito)
    ncf_modificado VARCHAR(19),
    fecha_ncf_modificado DATE,
    codigo_modificacion INTEGER,
    indicador_nota_credito INTEGER,
    
    -- Totales
    monto_gravado_18 DECIMAL(15,2) DEFAULT 0,
    monto_gravado_16 DECIMAL(15,2) DEFAULT 0,
    monto_gravado_0 DECIMAL(15,2) DEFAULT 0,
    itbis_18 DECIMAL(15,2) DEFAULT 0,
    itbis_16 DECIMAL(15,2) DEFAULT 0,
    itbis_0 DECIMAL(15,2) DEFAULT 0,
    subtotal_gravado DECIMAL(15,2) DEFAULT 0,
    subtotal_itbis DECIMAL(15,2) DEFAULT 0,
    subtotal_exento DECIMAL(15,2) DEFAULT 0,
    total_itbis_retenido DECIMAL(15,2) DEFAULT 0,
    total_isr_retenido DECIMAL(15,2) DEFAULT 0,
    monto_total DECIMAL(15,2) NOT NULL,
    
    -- Estado y validación
    estado_dgii VARCHAR(50) DEFAULT 'en_proceso',
    codigo_seguridad VARCHAR(6),
    track_id VARCHAR(100),
    xml_firmado TEXT,
    mensaje_validacion TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de comprobantes
CREATE TABLE IF NOT EXISTS detalles_comprobantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    numero_linea INTEGER NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_item VARCHAR(10) NOT NULL CHECK (tipo_item IN ('bien', 'servicio')),
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(15,2) NOT NULL,
    tasa_itbis VARCHAR(10) NOT NULL,
    descuento DECIMAL(15,2) DEFAULT 0,
    itbis_retenido DECIMAL(15,2) DEFAULT 0,
    isr_retenido DECIMAL(15,2) DEFAULT 0,
    valor_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa ON comprobantes_fiscales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_fecha ON comprobantes_fiscales(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_comprobantes_estado ON comprobantes_fiscales(estado_dgii);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_detalles_comprobante ON detalles_comprobantes(comprobante_id);
