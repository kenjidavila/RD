-- Actualizaciones adicionales para cumplir con especificaciones técnicas DGII

-- Agregar campos para manejo de archivos XML según estándar
ALTER TABLE comprobantes_fiscales 
ADD COLUMN IF NOT EXISTS nombre_archivo_xml VARCHAR(255),
ADD COLUMN IF NOT EXISTS encoding_validado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags_vacios_removidos BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS caracteres_escapados BOOLEAN DEFAULT FALSE;

-- Crear tabla para tracking de comunicación emisor-receptor
CREATE TABLE IF NOT EXISTS comunicacion_emisor_receptor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emisor_rnc VARCHAR(11) NOT NULL,
    receptor_rnc VARCHAR(11) NOT NULL,
    e_ncf VARCHAR(19) NOT NULL,
    tipo_comunicacion VARCHAR(50) NOT NULL CHECK (tipo_comunicacion IN ('envio_ecf', 'acuse_recibo', 'aprobacion_comercial')),
    url_destino TEXT NOT NULL,
    xml_enviado TEXT,
    respuesta_recibida TEXT,
    estado_comunicacion VARCHAR(50) DEFAULT 'pendiente',
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    intentos INTEGER DEFAULT 1,
    ultimo_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para servicios web del contribuyente
CREATE TABLE IF NOT EXISTS servicios_contribuyente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    url_autenticacion TEXT,
    url_recepcion TEXT NOT NULL,
    url_aprobacion_comercial TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ssl_habilitado BOOLEAN DEFAULT TRUE,
    puerto_red INTEGER DEFAULT 443,
    sensible_mayusculas BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para tokens de autenticación entre contribuyentes
CREATE TABLE IF NOT EXISTS tokens_contribuyentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emisor_rnc VARCHAR(11) NOT NULL,
    receptor_rnc VARCHAR(11) NOT NULL,
    token TEXT NOT NULL,
    fecha_expedicion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para validaciones de archivos XML
CREATE TABLE IF NOT EXISTS validaciones_xml (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_xml VARCHAR(10) NOT NULL,
    tamano_archivo INTEGER,
    encoding_correcto BOOLEAN DEFAULT FALSE,
    caracteres_escapados BOOLEAN DEFAULT FALSE,
    tags_vacios_removidos BOOLEAN DEFAULT FALSE,
    estructura_valida BOOLEAN DEFAULT FALSE,
    firma_valida BOOLEAN DEFAULT FALSE,
    errores_validacion JSONB,
    fecha_validacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para estatus de servicios DGII
CREATE TABLE IF NOT EXISTS estatus_servicios_dgii (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servicio VARCHAR(100) NOT NULL,
    ambiente VARCHAR(20) NOT NULL,
    estatus VARCHAR(20) NOT NULL,
    fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disponible BOOLEAN DEFAULT TRUE,
    mensaje_estado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para ventanas de mantenimiento
CREATE TABLE IF NOT EXISTS ventanas_mantenimiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ambiente VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    dias_mantenimiento DATE[] NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_comunicacion_emisor_receptor ON comunicacion_emisor_receptor(emisor_rnc, receptor_rnc);
CREATE INDEX IF NOT EXISTS idx_comunicacion_estado ON comunicacion_emisor_receptor(estado_comunicacion);
CREATE INDEX IF NOT EXISTS idx_servicios_contribuyente_empresa ON servicios_contribuyente(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tokens_contribuyentes_emisor ON tokens_contribuyentes(emisor_rnc);
CREATE INDEX IF NOT EXISTS idx_tokens_contribuyentes_receptor ON tokens_contribuyentes(receptor_rnc);
CREATE INDEX IF NOT EXISTS idx_validaciones_xml_comprobante ON validaciones_xml(comprobante_id);
CREATE INDEX IF NOT EXISTS idx_estatus_servicios_ambiente ON estatus_servicios_dgii(ambiente);

-- Función para validar formato de nombre de archivo
CREATE OR REPLACE FUNCTION validar_nombre_archivo_xml(
    nombre_archivo VARCHAR(255),
    rnc_emisor VARCHAR(11),
    rnc_comprador VARCHAR(11),
    e_ncf VARCHAR(19),
    tipo_xml VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    nombre_esperado VARCHAR(255);
BEGIN
    -- Generar nombre esperado según estándar DGII
    CASE tipo_xml
        WHEN 'ECF', 'ANECF', 'RFCE' THEN
            nombre_esperado := rnc_emisor || e_ncf || '.xml';
        WHEN 'ACECF', 'ARECF' THEN
            nombre_esperado := rnc_comprador || e_ncf || '.xml';
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN nombre_archivo = nombre_esperado;
END;
$$ LANGUAGE plpgsql;

-- Función para escapar caracteres XML
CREATE OR REPLACE FUNCTION escapar_caracteres_xml(texto TEXT)
RETURNS TEXT AS $$
BEGIN
    IF texto IS NULL THEN
        RETURN texto;
    END IF;
    
    RETURN REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(texto, '&', '&#38;'),
                    '<', '&#60;'
                ),
                '>', '&#62;'
            ),
            '"', '&#34;'
        ),
        '''', '&#39;'
    );
END;
$$ LANGUAGE plpgsql;

-- Función para codificar caracteres para URL
CREATE OR REPLACE FUNCTION codificar_para_url(texto TEXT)
RETURNS TEXT AS $$
BEGIN
    IF texto IS NULL THEN
        RETURN texto;
    END IF;
    
    -- Aplicar codificación URL básica para caracteres especiales
    RETURN REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(texto, ' ', '%20'),
                                        '!', '%21'
                                    ),
                                    '"', '%22'
                                ),
                                '#', '%23'
                            ),
                            '$', '%24'
                        ),
                        '&', '%26'
                    ),
                    '''', '%27'
                ),
                '(', '%28'
            ),
            ')', '%29'
        ),
        '*', '%2A'
    );
END;
$$ LANGUAGE plpgsql;

-- Función para generar URL de código QR
CREATE OR REPLACE FUNCTION generar_url_qr(
    rnc_emisor VARCHAR(11),
    rnc_comprador VARCHAR(11),
    e_ncf VARCHAR(19),
    fecha_emision DATE,
    monto_total DECIMAL(15,2),
    fecha_firma TIMESTAMP WITH TIME ZONE,
    codigo_seguridad VARCHAR(6),
    es_rfce BOOLEAN DEFAULT FALSE
)
RETURNS TEXT AS $$
DECLARE
    base_url TEXT;
    parametros TEXT;
    fecha_emision_formato TEXT;
    fecha_firma_formato TEXT;
BEGIN
    -- Formatear fechas
    fecha_emision_formato := TO_CHAR(fecha_emision, 'DD-MM-YYYY');
    fecha_firma_formato := TO_CHAR(fecha_firma, 'DD-MM-YYYY HH24:MI:SS');
    
    IF es_rfce THEN
        -- URL para Facturas de Consumo < 250k
        base_url := 'https://fc.dgii.gov.do/eCF/ConsultaTimbreFC';
        parametros := 'RncEmisor=' || rnc_emisor ||
                     '&ENCF=' || e_ncf ||
                     '&MontoTotal=' || monto_total::TEXT ||
                     '&CodigoSeguridad=' || codificar_para_url(codigo_seguridad);
    ELSE
        -- URL para e-CF normales
        base_url := 'https://ecf.dgii.gov.do/ecf/ConsultaTimbre';
        parametros := 'RncEmisor=' || rnc_emisor ||
                     '&RncComprador=' || COALESCE(rnc_comprador, '') ||
                     '&ENCF=' || e_ncf ||
                     '&FechaEmision=' || REPLACE(fecha_emision_formato, '-', '') ||
                     '&MontoTotal=' || monto_total::TEXT ||
                     '&FechaFirma=' || codificar_para_url(fecha_firma_formato) ||
                     '&CodigoSeguridad=' || codificar_para_url(codigo_seguridad);
    END IF;
    
    RETURN base_url || '?' || parametros;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar nombre de archivo al insertar comprobante
CREATE OR REPLACE FUNCTION trigger_validar_nombre_archivo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nombre_archivo_xml IS NOT NULL THEN
        IF NOT validar_nombre_archivo_xml(
            NEW.nombre_archivo_xml,
            (SELECT rnc FROM empresas WHERE id = NEW.empresa_id),
            NEW.rnc_comprador,
            NEW.e_ncf,
            'ECF'
        ) THEN
            RAISE EXCEPTION 'Nombre de archivo XML no cumple con el estándar DGII: %', NEW.nombre_archivo_xml;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validar_nombre_archivo_trigger
    BEFORE INSERT OR UPDATE ON comprobantes_fiscales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_nombre_archivo();
