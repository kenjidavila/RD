-- Crear tabla para gestionar borradores de comprobantes
CREATE TABLE IF NOT EXISTS borradores_comprobantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Datos básicos del borrador
    nombre_borrador VARCHAR(255) NOT NULL,
    descripcion TEXT,
    
    -- Datos del comprobante (JSON para flexibilidad)
    datos_comprobante JSONB NOT NULL,
    
    -- Metadatos
    tipo_comprobante VARCHAR(10) NOT NULL,
    monto_total DECIMAL(15,2) DEFAULT 0,
    cantidad_items INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para búsqueda
    CONSTRAINT borradores_tipo_comprobante_check CHECK (tipo_comprobante IN ('31', '32', '33', '34', '41', '43', '44', '45', '46', '47'))
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_borradores_empresa_id ON borradores_comprobantes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_borradores_usuario_id ON borradores_comprobantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_borradores_tipo_comprobante ON borradores_comprobantes(tipo_comprobante);
CREATE INDEX IF NOT EXISTS idx_borradores_created_at ON borradores_comprobantes(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_borradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_borradores_updated_at
    BEFORE UPDATE ON borradores_comprobantes
    FOR EACH ROW
    EXECUTE FUNCTION update_borradores_updated_at();

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO borradores_comprobantes (
    empresa_id, 
    usuario_id, 
    nombre_borrador, 
    descripcion, 
    datos_comprobante, 
    tipo_comprobante, 
    monto_total, 
    cantidad_items
) VALUES (
    (SELECT id FROM empresas LIMIT 1),
    (SELECT id FROM usuarios LIMIT 1),
    'Factura Cliente ABC - Borrador',
    'Borrador de factura para cliente ABC Corp',
    '{"tipoComprobante": "31", "fechaEmision": "2024-01-15", "items": [{"descripcion": "Producto ejemplo", "cantidad": 1, "precio": 1000}]}',
    '31',
    1180.00,
    1
) ON CONFLICT DO NOTHING;
