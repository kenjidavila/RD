-- Crear tablas para gestión de clientes e items

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    rnc_cedula VARCHAR(11) UNIQUE NOT NULL,
    id_extranjero VARCHAR(50),
    tipo_documento VARCHAR(10) NOT NULL CHECK (tipo_documento IN ('RNC', 'CEDULA', 'PASAPORTE')),
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    provincia VARCHAR(100),
    municipio VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'República Dominicana',
    
    -- Información adicional
    tipo_cliente VARCHAR(50) DEFAULT 'regular' CHECK (tipo_cliente IN ('regular', 'vip', 'corporativo', 'gobierno')),
    limite_credito DECIMAL(15,2) DEFAULT 0,
    dias_credito INTEGER DEFAULT 0,
    descuento_general DECIMAL(5,2) DEFAULT 0,
    
    -- Configuración fiscal
    exento_itbis BOOLEAN DEFAULT FALSE,
    retencion_itbis BOOLEAN DEFAULT FALSE,
    retencion_isr BOOLEAN DEFAULT FALSE,
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id)
);

-- Tabla de items/productos/servicios
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(100),
    descripcion TEXT NOT NULL,
    descripcion_corta VARCHAR(255),
    
    -- Clasificación
    tipo_item VARCHAR(10) NOT NULL CHECK (tipo_item IN ('bien', 'servicio')),
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    
    -- Unidades y medidas
    unidad_medida VARCHAR(20) DEFAULT 'UND',
    peso DECIMAL(10,3),
    volumen DECIMAL(10,3),
    
    -- Precios
    precio_compra DECIMAL(15,4) DEFAULT 0,
    precio_venta DECIMAL(15,4) NOT NULL,
    precio_venta_2 DECIMAL(15,4),
    precio_venta_3 DECIMAL(15,4),
    precio_minimo DECIMAL(15,4),
    
    -- Impuestos
    tasa_itbis VARCHAR(10) NOT NULL DEFAULT '18',
    exento_itbis BOOLEAN DEFAULT FALSE,
    codigo_impuesto_adicional VARCHAR(10),
    tasa_impuesto_adicional DECIMAL(5,2) DEFAULT 0,
    
    -- ISC (Impuesto Selectivo al Consumo)
    aplica_isc BOOLEAN DEFAULT FALSE,
    grados_alcohol DECIMAL(5,2),
    cantidad_referencia DECIMAL(10,3),
    subcantidad DECIMAL(10,3),
    precio_unitario_referencia DECIMAL(15,4),
    
    -- Inventario
    maneja_inventario BOOLEAN DEFAULT FALSE,
    stock_actual DECIMAL(10,3) DEFAULT 0,
    stock_minimo DECIMAL(10,3) DEFAULT 0,
    stock_maximo DECIMAL(10,3) DEFAULT 0,
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    es_favorito BOOLEAN DEFAULT FALSE,
    notas TEXT,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    
    -- Constraint único por empresa
    UNIQUE(empresa_id, codigo)
);

-- Tabla de categorías de items
CREATE TABLE IF NOT EXISTS categorias_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_padre_id UUID REFERENCES categorias_items(id),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, nombre)
);

-- Tabla de historial de precios
CREATE TABLE IF NOT EXISTS historial_precios_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    precio_anterior DECIMAL(15,4),
    precio_nuevo DECIMAL(15,4),
    tipo_precio VARCHAR(20) NOT NULL,
    motivo VARCHAR(255),
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES usuarios(id)
);

-- Tabla de contactos adicionales de clientes
CREATE TABLE IF NOT EXISTS contactos_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    es_principal BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de direcciones adicionales de clientes
CREATE TABLE IF NOT EXISTS direcciones_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo_direccion VARCHAR(50) NOT NULL CHECK (tipo_direccion IN ('facturacion', 'entrega', 'correspondencia')),
    direccion TEXT NOT NULL,
    provincia VARCHAR(100),
    municipio VARCHAR(100),
    codigo_postal VARCHAR(20),
    pais VARCHAR(100) DEFAULT 'República Dominicana',
    es_principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_rnc ON clientes(rnc_cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes(tipo_cliente);

CREATE INDEX IF NOT EXISTS idx_items_empresa ON items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_items_codigo ON items(codigo);
CREATE INDEX IF NOT EXISTS idx_items_activo ON items(activo);
CREATE INDEX IF NOT EXISTS idx_items_categoria ON items(categoria);
CREATE INDEX IF NOT EXISTS idx_items_tipo ON items(tipo_item);

CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias_items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contactos_cliente ON contactos_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_direcciones_cliente ON direcciones_clientes(cliente_id);

-- Función para generar código automático de item
CREATE OR REPLACE FUNCTION generar_codigo_item(empresa_id UUID, prefijo VARCHAR(10) DEFAULT 'ITM')
RETURNS VARCHAR(50) AS $$
DECLARE
    siguiente_numero INTEGER;
    codigo_generado VARCHAR(50);
BEGIN
    -- Obtener el siguiente número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM LENGTH(prefijo) + 1) AS INTEGER)), 0) + 1
    INTO siguiente_numero
    FROM items 
    WHERE items.empresa_id = generar_codigo_item.empresa_id 
    AND codigo ~ ('^' || prefijo || '[0-9]+$');
    
    -- Generar código con formato: PREFIJO + número de 6 dígitos
    codigo_generado := prefijo || LPAD(siguiente_numero::TEXT, 6, '0');
    
    RETURN codigo_generado;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar stock de item
CREATE OR REPLACE FUNCTION actualizar_stock_item(
    item_id UUID,
    cantidad DECIMAL(10,3),
    tipo_movimiento VARCHAR(20) -- 'entrada', 'salida', 'ajuste'
)
RETURNS BOOLEAN AS $$
DECLARE
    stock_actual_item DECIMAL(10,3);
    nuevo_stock DECIMAL(10,3);
BEGIN
    -- Obtener stock actual
    SELECT stock_actual INTO stock_actual_item
    FROM items 
    WHERE id = item_id AND maneja_inventario = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Calcular nuevo stock
    CASE tipo_movimiento
        WHEN 'entrada', 'ajuste' THEN
            nuevo_stock := stock_actual_item + cantidad;
        WHEN 'salida' THEN
            nuevo_stock := stock_actual_item - cantidad;
        ELSE
            RETURN FALSE;
    END CASE;
    
    -- Validar que no sea negativo (excepto para ajustes)
    IF nuevo_stock < 0 AND tipo_movimiento != 'ajuste' THEN
        RETURN FALSE;
    END IF;
    
    -- Actualizar stock
    UPDATE items 
    SET stock_actual = nuevo_stock,
        updated_at = NOW()
    WHERE id = item_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías por defecto
INSERT INTO categorias_items (empresa_id, nombre, descripcion) 
SELECT e.id, 'General', 'Categoría general para items sin clasificar específica'
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_items c 
    WHERE c.empresa_id = e.id AND c.nombre = 'General'
);

INSERT INTO categorias_items (empresa_id, nombre, descripcion) 
SELECT e.id, 'Productos', 'Bienes físicos y tangibles'
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_items c 
    WHERE c.empresa_id = e.id AND c.nombre = 'Productos'
);

INSERT INTO categorias_items (empresa_id, nombre, descripcion) 
SELECT e.id, 'Servicios', 'Servicios profesionales y técnicos'
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_items c 
    WHERE c.empresa_id = e.id AND c.nombre = 'Servicios'
);
