-- Crear tabla de configuraciones
CREATE TABLE IF NOT EXISTS configuraciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'personalizacion', 'empresa', 'certificados', 'secuencias', 'usuarios'
    configuracion JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tipo)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_configuraciones_tipo ON configuraciones(tipo);
CREATE INDEX IF NOT EXISTS idx_configuraciones_updated_at ON configuraciones(updated_at);

-- Insertar configuraciones por defecto
INSERT INTO configuraciones (tipo, configuracion) VALUES 
('personalizacion', '{
    "colores": {
        "primario": "#2D4A5C",
        "secundario": "#FF8C42",
        "acento": "#E1E9ED"
    },
    "tipografia": {
        "fuente": "Inter",
        "tamano_titulo": "24",
        "tamano_texto": "12"
    },
    "papel": {
        "formato": "A4",
        "orientacion": "portrait",
        "margenes": {
            "superior": "20",
            "inferior": "20",
            "izquierdo": "20",
            "derecho": "20"
        }
    },
    "marca_agua": {
        "habilitada": false,
        "texto": "COPIA",
        "opacidad": "0.1",
        "posicion": "centro"
    },
    "logo": {
        "mostrar": true,
        "posicion": "superior_izquierda",
        "tamano": "mediano"
    }
}')
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO configuraciones (tipo, configuracion) VALUES 
('empresa', '{
    "razon_social": "",
    "nombre_comercial": "",
    "rnc": "",
    "direccion": "",
    "telefono": "",
    "email": "",
    "sitio_web": "",
    "actividad_economica": "",
    "regimen_tributario": "ORDINARIO"
}')
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO configuraciones (tipo, configuracion) VALUES 
('secuencias', '{
    "factura": {
        "prefijo": "B01",
        "secuencia_actual": "00000001",
        "limite": "99999999"
    },
    "nota_credito": {
        "prefijo": "B04",
        "secuencia_actual": "00000001",
        "limite": "99999999"
    },
    "nota_debito": {
        "prefijo": "B05",
        "secuencia_actual": "00000001",
        "limite": "99999999"
    }
}')
ON CONFLICT (tipo) DO NOTHING;

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_configuraciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_configuraciones_updated_at ON configuraciones;
CREATE TRIGGER update_configuraciones_updated_at
    BEFORE UPDATE ON configuraciones
    FOR EACH ROW
    EXECUTE FUNCTION update_configuraciones_updated_at();
