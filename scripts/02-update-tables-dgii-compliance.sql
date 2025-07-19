-- Actualizar tablas para cumplir con especificaciones DGII

-- Agregar campos faltantes a la tabla de comprobantes fiscales
ALTER TABLE comprobantes_fiscales 
ADD COLUMN IF NOT EXISTS xml_original TEXT,
ADD COLUMN IF NOT EXISTS xml_firmado TEXT,
ADD COLUMN IF NOT EXISTS fecha_firma TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hash_firma VARCHAR(64),
ADD COLUMN IF NOT EXISTS track_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_vencimiento_encf DATE,
ADD COLUMN IF NOT EXISTS tipo_contingencia VARCHAR(20),
ADD COLUMN IF NOT EXISTS ncf_contingencia VARCHAR(19),
ADD COLUMN IF NOT EXISTS es_contingencia BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS url_qr TEXT,
ADD COLUMN IF NOT EXISTS semilla_valor VARCHAR(255),
ADD COLUMN IF NOT EXISTS semilla_fecha TIMESTAMP WITH TIME ZONE;

-- Crear tabla para manejo de contingencias
CREATE TABLE IF NOT EXISTS contingencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_contingencia VARCHAR(20) NOT NULL CHECK (tipo_contingencia IN ('total', 'partial', 'connection')),
    motivo TEXT NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_fin TIMESTAMP WITH TIME ZONE,
    unidades_afectadas TEXT[], -- Array de unidades afectadas para contingencia parcial
    activa BOOLEAN DEFAULT TRUE,
    notificada_dgii BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para NCFs de contingencia
CREATE TABLE IF NOT EXISTS ncf_contingencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    contingencia_id UUID REFERENCES contingencias(id) ON DELETE CASCADE,
    ncf_serie_b VARCHAR(19) NOT NULL,
    e_ncf_reemplazo VARCHAR(19),
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reemplazado BOOLEAN DEFAULT FALSE,
    xml_original TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para tracking de envíos a DGII
CREATE TABLE IF NOT EXISTS envios_dgii (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    track_id VARCHAR(100) NOT NULL,
    estado_envio VARCHAR(50) DEFAULT 'enviado',
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    respuesta_dgii JSONB,
    intentos INTEGER DEFAULT 1,
    ultimo_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para certificados digitales con más detalles
ALTER TABLE certificados_digitales 
ADD COLUMN IF NOT EXISTS issuer VARCHAR(255),
ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(64),
ADD COLUMN IF NOT EXISTS key_usage TEXT[],
ADD COLUMN IF NOT EXISTS extended_key_usage TEXT[];

-- Crear tabla para auditoría de operaciones
CREATE TABLE IF NOT EXISTS auditoria_operaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    operacion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_comprobantes_track_id ON comprobantes_fiscales(track_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_fecha_firma ON comprobantes_fiscales(fecha_firma);
CREATE INDEX IF NOT EXISTS idx_contingencias_activa ON contingencias(activa);
CREATE INDEX IF NOT EXISTS idx_contingencias_empresa ON contingencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_envios_dgii_track_id ON envios_dgii(track_id);
CREATE INDEX IF NOT EXISTS idx_envios_dgii_estado ON envios_dgii(estado_envio);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria_operaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_operaciones(created_at);

-- Crear función para generar e-NCF
CREATE OR REPLACE FUNCTION generar_encf(tipo_comprobante VARCHAR(2), empresa_id UUID)
RETURNS VARCHAR(13) AS $$
DECLARE
    secuencia_actual INTEGER;
    nuevo_encf VARCHAR(13);
BEGIN
    -- Obtener y actualizar la secuencia actual
    UPDATE secuencias_ncf 
    SET secuencia_actual = secuencia_actual + 1
    WHERE empresa_id = generar_encf.empresa_id 
      AND tipo_comprobante = generar_encf.tipo_comprobante 
      AND activa = TRUE
    RETURNING secuencia_actual INTO secuencia_actual;
    
    IF secuencia_actual IS NULL THEN
        RAISE EXCEPTION 'No hay secuencias activas para el tipo de comprobante %', tipo_comprobante;
    END IF;
    
    -- Generar e-NCF con formato E + tipo + secuencia de 10 dígitos
    nuevo_encf := 'E' || tipo_comprobante || LPAD(secuencia_actual::TEXT, 10, '0');
    
    RETURN nuevo_encf;
END;
$$ LANGUAGE plpgsql;

-- Crear función para validar cuadratura según reglas DGII
CREATE OR REPLACE FUNCTION validar_cuadratura_ecf(comprobante_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_calculado DECIMAL(15,2);
    total_declarado DECIMAL(15,2);
    diferencia DECIMAL(15,2);
    num_lineas INTEGER;
    tolerancia_global DECIMAL(15,2);
BEGIN
    -- Obtener número de líneas de detalle
    SELECT COUNT(*) INTO num_lineas
    FROM detalles_comprobantes 
    WHERE comprobante_id = validar_cuadratura_ecf.comprobante_id;
    
    -- Calcular total desde detalles
    SELECT SUM(valor_total) INTO total_calculado
    FROM detalles_comprobantes 
    WHERE comprobante_id = validar_cuadratura_ecf.comprobante_id;
    
    -- Obtener total declarado
    SELECT monto_total INTO total_declarado
    FROM comprobantes_fiscales 
    WHERE id = validar_cuadratura_ecf.comprobante_id;
    
    -- Calcular diferencia
    diferencia := ABS(total_calculado - total_declarado);
    
    -- Tolerancia global = número de líneas
    tolerancia_global := num_lineas;
    
    -- Validar si está dentro de la tolerancia
    RETURN diferencia <= tolerancia_global;
END;
$$ LANGUAGE plpgsql;
