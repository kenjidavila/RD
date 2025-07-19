-- Tablas para receptor electrónico y funcionalidades faltantes

-- Tabla para comprobantes recibidos como receptor electrónico
CREATE TABLE IF NOT EXISTS comprobantes_recibidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id VARCHAR(50) UNIQUE NOT NULL,
    encf VARCHAR(19) NOT NULL,
    emisor_rnc VARCHAR(11) NOT NULL,
    receptor_rnc VARCHAR(11),
    fecha_emision TIMESTAMP NOT NULL,
    monto_total DECIMAL(15,2) NOT NULL,
    xml_content TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'recibido',
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    motivo_aprobacion VARCHAR(10),
    observaciones_aprobacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para aprobaciones comerciales
CREATE TABLE IF NOT EXISTS aprobaciones_comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id VARCHAR(50) UNIQUE NOT NULL,
    encf VARCHAR(19) NOT NULL,
    emisor_rnc VARCHAR(11) NOT NULL,
    tipo_aprobacion VARCHAR(20) NOT NULL CHECK (tipo_aprobacion IN ('aprobacion', 'rechazo')),
    motivo VARCHAR(10) NOT NULL,
    fecha_aprobacion TIMESTAMP NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'procesado',
    fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para configuración de secuencias NCF
CREATE TABLE IF NOT EXISTS configuracion_secuencias_ncf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    tipo_comprobante VARCHAR(2) NOT NULL,
    secuencia_inicial VARCHAR(8) NOT NULL,
    secuencia_final VARCHAR(8) NOT NULL,
    secuencia_actual VARCHAR(8) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    activa BOOLEAN DEFAULT true,
    validado_dgii BOOLEAN DEFAULT false,
    fecha_validacion TIMESTAMP,
    mensaje_validacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, tipo_comprobante, activa) WHERE activa = true
);

-- Tabla para logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla VARCHAR(50) NOT NULL,
    operacion VARCHAR(10) NOT NULL,
    registro_id UUID NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    clave VARCHAR(100) NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) DEFAULT 'string',
    descripcion TEXT,
    categoria VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, clave)
);

-- Tabla para notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT false,
    datos_adicionales JSONB,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP
);

-- Tabla para reportes programados
CREATE TABLE IF NOT EXISTS reportes_programados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    frecuencia VARCHAR(20) NOT NULL,
    parametros JSONB,
    activo BOOLEAN DEFAULT true,
    ultimo_envio TIMESTAMP,
    proximo_envio TIMESTAMP,
    destinatarios TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_comprobantes_recibidos_encf ON comprobantes_recibidos(encf);
CREATE INDEX IF NOT EXISTS idx_comprobantes_recibidos_emisor ON comprobantes_recibidos(emisor_rnc);
CREATE INDEX IF NOT EXISTS idx_comprobantes_recibidos_fecha ON comprobantes_recibidos(fecha_recepcion);
CREATE INDEX IF NOT EXISTS idx_aprobaciones_encf ON aprobaciones_comerciales(encf);
CREATE INDEX IF NOT EXISTS idx_configuracion_empresa ON configuracion_sistema(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);

-- Triggers para auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (tabla, operacion, registro_id, datos_anteriores)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (tabla, operacion, registro_id, datos_anteriores, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (tabla, operacion, registro_id, datos_nuevos)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
DROP TRIGGER IF EXISTS audit_comprobantes_fiscales ON comprobantes_fiscales;
CREATE TRIGGER audit_comprobantes_fiscales
    AFTER INSERT OR UPDATE OR DELETE ON comprobantes_fiscales
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_comprobantes_recibidos ON comprobantes_recibidos;
CREATE TRIGGER audit_comprobantes_recibidos
    AFTER INSERT OR UPDATE OR DELETE ON comprobantes_recibidos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION limpiar_logs_antiguos()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 year';
    DELETE FROM notificaciones WHERE fecha_envio < NOW() - INTERVAL '6 months' AND leida = true;
END;
$$ LANGUAGE plpgsql;

-- Vista para estadísticas de comprobantes
CREATE OR REPLACE VIEW vista_estadisticas_comprobantes AS
SELECT 
    DATE_TRUNC('month', fecha_emision) as mes,
    tipo_comprobante,
    COUNT(*) as total_comprobantes,
    SUM(monto_total) as monto_total,
    COUNT(CASE WHEN estado_dgii = 'APROBADO' THEN 1 END) as aprobados,
    COUNT(CASE WHEN estado_dgii = 'RECHAZADO' THEN 1 END) as rechazados,
    COUNT(CASE WHEN estado_dgii = 'PENDIENTE' THEN 1 END) as pendientes
FROM comprobantes_fiscales
GROUP BY DATE_TRUNC('month', fecha_emision), tipo_comprobante
ORDER BY mes DESC, tipo_comprobante;

-- Vista para comprobantes por vencer
CREATE OR REPLACE VIEW vista_secuencias_por_vencer AS
SELECT 
    cs.*,
    e.razon_social,
    (cs.secuencia_final::INTEGER - cs.secuencia_actual::INTEGER) as restantes,
    ROUND(
        ((cs.secuencia_actual::INTEGER - cs.secuencia_inicial::INTEGER)::DECIMAL / 
         (cs.secuencia_final::INTEGER - cs.secuencia_inicial::INTEGER)::DECIMAL) * 100, 2
    ) as porcentaje_usado
FROM configuracion_secuencias_ncf cs
JOIN empresas e ON cs.empresa_id = e.id
WHERE cs.activa = true
AND (
    cs.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
    OR (cs.secuencia_final::INTEGER - cs.secuencia_actual::INTEGER) <= 100
);
