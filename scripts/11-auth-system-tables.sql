-- Script para crear las tablas del sistema de autenticación
-- Facturación Electrónica RD - Sistema de Autenticación

-- Eliminar tablas existentes si existen (en orden correcto para evitar errores de FK)
DROP TABLE IF EXISTS logs_sistema CASCADE;
DROP TABLE IF EXISTS bloqueos_seguridad CASCADE;
DROP TABLE IF EXISTS intentos_login CASCADE;
DROP TABLE IF EXISTS sesiones_usuario CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS limpiar_sesiones_expiradas();
DROP FUNCTION IF EXISTS limpiar_bloqueos_expirados();
DROP FUNCTION IF EXISTS registrar_intento_login(text, boolean, text, text, text);
DROP FUNCTION IF EXISTS verificar_bloqueo_seguridad(text, text);

-- Tabla principal de empresas
CREATE TABLE empresas (
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
    activa BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    configuracion JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT empresas_rnc_length CHECK (LENGTH(rnc) >= 9),
    CONSTRAINT empresas_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT empresas_tipo_contribuyente_valid CHECK (tipo_contribuyente IN ('Persona Física', 'Persona Jurídica')),
    CONSTRAINT empresas_regimen_tributario_valid CHECK (regimen_tributario IN ('Ordinario', 'RST', 'PST'))
);

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rnc_cedula VARCHAR(11) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(50) DEFAULT 'solicitante',
    activo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    intentos_login INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    preferencias JSONB DEFAULT '{}'::jsonb,
    
    -- Constraints
    CONSTRAINT usuarios_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT usuarios_rol_valid CHECK (rol IN ('administrador', 'firmante', 'aprobador_comercial', 'solicitante')),
    CONSTRAINT usuarios_intentos_login_positive CHECK (intentos_login >= 0),
    CONSTRAINT usuarios_rnc_cedula_length CHECK (LENGTH(rnc_cedula) >= 8)
);

-- Tabla de sesiones de usuario
CREATE TABLE sesiones_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_uso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT sesiones_expires_at_future CHECK (expires_at > CURRENT_TIMESTAMP)
);

-- Tabla de intentos de login
CREATE TABLE intentos_login (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    exitoso BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    razon_fallo VARCHAR(255),
    fecha_intento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de bloqueos de seguridad
CREATE TABLE bloqueos_seguridad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(20) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    razon VARCHAR(255) NOT NULL,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT bloqueos_tipo_valid CHECK (tipo IN ('ip', 'email', 'usuario')),
    CONSTRAINT bloqueos_bloqueado_hasta_future CHECK (bloqueado_hasta > CURRENT_TIMESTAMP),
    
    -- Índice único para evitar duplicados
    UNIQUE(tipo, valor, activo)
);

-- Tabla de logs del sistema
CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT logs_accion_not_empty CHECK (LENGTH(accion) > 0)
);

-- Índices para optimizar consultas
CREATE INDEX idx_empresas_rnc ON empresas(rnc);
CREATE INDEX idx_empresas_email ON empresas(email);
CREATE INDEX idx_empresas_activa ON empresas(activa);

CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_bloqueado_hasta ON usuarios(bloqueado_hasta);

CREATE INDEX idx_sesiones_usuario_id ON sesiones_usuario(usuario_id);
CREATE INDEX idx_sesiones_token_hash ON sesiones_usuario(token_hash);
CREATE INDEX idx_sesiones_expires_at ON sesiones_usuario(expires_at);
CREATE INDEX idx_sesiones_activa ON sesiones_usuario(activa);

CREATE INDEX idx_intentos_email ON intentos_login(email);
CREATE INDEX idx_intentos_exitoso ON intentos_login(exitoso);
CREATE INDEX idx_intentos_fecha ON intentos_login(fecha_intento);
CREATE INDEX idx_intentos_ip ON intentos_login(ip_address);

CREATE INDEX idx_bloqueos_tipo_valor ON bloqueos_seguridad(tipo, valor);
CREATE INDEX idx_bloqueos_activo ON bloqueos_seguridad(activo);
CREATE INDEX idx_bloqueos_bloqueado_hasta ON bloqueos_seguridad(bloqueado_hasta);

CREATE INDEX idx_logs_usuario_id ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_accion ON logs_sistema(accion);
CREATE INDEX idx_logs_tabla_afectada ON logs_sistema(tabla_afectada);
CREATE INDEX idx_logs_fecha_accion ON logs_sistema(fecha_accion);

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION limpiar_sesiones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    sesiones_eliminadas INTEGER;
BEGIN
    DELETE FROM sesiones_usuario 
    WHERE expires_at < CURRENT_TIMESTAMP OR activa = false;
    
    GET DIAGNOSTICS sesiones_eliminadas = ROW_COUNT;
    
    RETURN sesiones_eliminadas;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar bloqueos expirados
CREATE OR REPLACE FUNCTION limpiar_bloqueos_expirados()
RETURNS INTEGER AS $$
DECLARE
    bloqueos_eliminados INTEGER;
BEGIN
    UPDATE bloqueos_seguridad 
    SET activo = false 
    WHERE bloqueado_hasta < CURRENT_TIMESTAMP AND activo = true;
    
    GET DIAGNOSTICS bloqueos_eliminados = ROW_COUNT;
    
    RETURN bloqueos_eliminados;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar intentos de login
CREATE OR REPLACE FUNCTION registrar_intento_login(
    p_email TEXT,
    p_exitoso BOOLEAN,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_razon_fallo TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    intento_id UUID;
BEGIN
    INSERT INTO intentos_login (
        email,
        exitoso,
        ip_address,
        user_agent,
        razon_fallo
    ) VALUES (
        p_email,
        p_exitoso,
        p_ip_address::INET,
        p_user_agent,
        p_razon_fallo
    ) RETURNING id INTO intento_id;
    
    RETURN intento_id;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar bloqueos de seguridad
CREATE OR REPLACE FUNCTION verificar_bloqueo_seguridad(
    p_tipo TEXT,
    p_valor TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    bloqueo_activo BOOLEAN := false;
BEGIN
    -- Limpiar bloqueos expirados primero
    PERFORM limpiar_bloqueos_expirados();
    
    -- Verificar si existe un bloqueo activo
    SELECT EXISTS(
        SELECT 1 FROM bloqueos_seguridad 
        WHERE tipo = p_tipo 
        AND valor = p_valor 
        AND activo = true 
        AND bloqueado_hasta > CURRENT_TIMESTAMP
    ) INTO bloqueo_activo;
    
    RETURN bloqueo_activo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_actualizacion en empresas
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_empresas_fecha_actualizacion
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trigger_usuarios_fecha_actualizacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Trigger para actualizar fecha_ultimo_uso en sesiones
CREATE OR REPLACE FUNCTION actualizar_fecha_ultimo_uso()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_ultimo_uso = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sesiones_fecha_ultimo_uso
    BEFORE UPDATE ON sesiones_usuario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_ultimo_uso();

-- Insertar configuración inicial
INSERT INTO empresas (
    rnc,
    razon_social,
    nombre_comercial,
    email,
    telefono,
    direccion,
    provincia,
    municipio,
    tipo_contribuyente,
    regimen_tributario,
    actividad_economica
) VALUES (
    '101234567',
    'EMPRESA DEMO FACTURACION ELECTRONICA SRL',
    'Demo Facturación',
    'admin@demo.com',
    '809-555-0123',
    'Av. Principal #123, Sector Los Jardines',
    'Distrito Nacional',
    'Santo Domingo de Guzmán',
    'Persona Jurídica',
    'Ordinario',
    'Desarrollo de software y servicios informáticos'
) ON CONFLICT (rnc) DO NOTHING;

-- Insertar usuario administrador demo
INSERT INTO usuarios (
    empresa_id,
    nombre,
    apellido,
    email,
    password_hash,
    rnc_cedula,
    telefono,
    rol,
    activo,
    email_verificado
) VALUES (
    (SELECT id FROM empresas WHERE rnc = '101234567'),
    'Administrador',
    'Sistema',
    'admin@demo.com',
    '$2b$10$rQZ8kHp0rQZ8kHp0rQZ8kOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', -- password: admin123
    '00112345678',
    '809-555-0123',
    'administrador',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE empresas IS 'Tabla principal que almacena la información de las empresas registradas en el sistema';
COMMENT ON TABLE usuarios IS 'Tabla que almacena los usuarios del sistema asociados a cada empresa';
COMMENT ON TABLE sesiones_usuario IS 'Tabla que maneja las sesiones activas de los usuarios';
COMMENT ON TABLE intentos_login IS 'Tabla que registra todos los intentos de login para auditoría y seguridad';
COMMENT ON TABLE bloqueos_seguridad IS 'Tabla que maneja los bloqueos temporales por seguridad';
COMMENT ON TABLE logs_sistema IS 'Tabla que registra todas las acciones importantes del sistema para auditoría';

COMMENT ON FUNCTION limpiar_sesiones_expiradas() IS 'Función que elimina las sesiones expiradas del sistema';
COMMENT ON FUNCTION limpiar_bloqueos_expirados() IS 'Función que desactiva los bloqueos de seguridad expirados';
COMMENT ON FUNCTION registrar_intento_login(TEXT, BOOLEAN, TEXT, TEXT, TEXT) IS 'Función que registra un intento de login en el sistema';
COMMENT ON FUNCTION verificar_bloqueo_seguridad(TEXT, TEXT) IS 'Función que verifica si existe un bloqueo de seguridad activo';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Sistema de autenticación creado exitosamente';
    RAISE NOTICE 'Tablas creadas: empresas, usuarios, sesiones_usuario, intentos_login, bloqueos_seguridad, logs_sistema';
    RAISE NOTICE 'Funciones creadas: limpiar_sesiones_expiradas, limpiar_bloqueos_expirados, registrar_intento_login, verificar_bloqueo_seguridad';
    RAISE NOTICE 'Usuario demo creado: admin@demo.com / admin123';
END $$;
