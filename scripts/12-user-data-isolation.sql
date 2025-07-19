-- Script para aislamiento completo de datos por usuario/empresa
-- Ejecutar después de los scripts anteriores

-- Habilitar Row Level Security en todas las tablas principales
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para tabla empresas
CREATE POLICY "Empresas: Solo ver su propia empresa" ON empresas
  FOR ALL USING (
    id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla usuarios
CREATE POLICY "Usuarios: Solo ver usuarios de su empresa" ON usuarios
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla comprobantes_fiscales
CREATE POLICY "Comprobantes: Solo ver de su empresa" ON comprobantes_fiscales
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla clientes
CREATE POLICY "Clientes: Solo ver de su empresa" ON clientes
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla items
CREATE POLICY "Items: Solo ver de su empresa" ON items
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla borradores
CREATE POLICY "Borradores: Solo ver de su empresa" ON borradores
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla configuraciones
CREATE POLICY "Configuraciones: Solo ver de su empresa" ON configuraciones
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios 
      WHERE id = auth.uid()::text::bigint
    )
  );

-- Políticas para tabla sesiones_usuario
CREATE POLICY "Sesiones: Solo ver sus propias sesiones" ON sesiones_usuario
  FOR ALL USING (
    usuario_id = auth.uid()::text::bigint
  );

-- Función para obtener el ID de empresa del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_empresa_id()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT empresa_id 
    FROM usuarios 
    WHERE id = auth.uid()::text::bigint
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario pertenece a una empresa
CREATE OR REPLACE FUNCTION user_belongs_to_empresa(empresa_id_param BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM usuarios 
    WHERE id = auth.uid()::text::bigint 
    AND empresa_id = empresa_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para asegurar que los nuevos registros se asocien a la empresa correcta
CREATE OR REPLACE FUNCTION ensure_empresa_association()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se especifica empresa_id, usar la del usuario actual
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := get_current_user_empresa_id();
  END IF;
  
  -- Verificar que el usuario pertenece a la empresa
  IF NOT user_belongs_to_empresa(NEW.empresa_id) THEN
    RAISE EXCEPTION 'No tienes permisos para crear registros en esta empresa';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas principales
CREATE TRIGGER ensure_empresa_association_comprobantes
  BEFORE INSERT ON comprobantes_fiscales
  FOR EACH ROW EXECUTE FUNCTION ensure_empresa_association();

CREATE TRIGGER ensure_empresa_association_clientes
  BEFORE INSERT ON clientes
  FOR EACH ROW EXECUTE FUNCTION ensure_empresa_association();

CREATE TRIGGER ensure_empresa_association_items
  BEFORE INSERT ON items
  FOR EACH ROW EXECUTE FUNCTION ensure_empresa_association();

CREATE TRIGGER ensure_empresa_association_borradores
  BEFORE INSERT ON borradores
  FOR EACH ROW EXECUTE FUNCTION ensure_empresa_association();

-- Índices para optimizar las consultas con RLS
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa_id ON comprobantes_fiscales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_items_empresa_id ON items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_borradores_empresa_id ON borradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario_id ON sesiones_usuario(usuario_id);

-- Función para limpiar datos de prueba (solo en desarrollo)
CREATE OR REPLACE FUNCTION clean_test_data()
RETURNS VOID AS $$
BEGIN
  -- Solo ejecutar en desarrollo
  IF current_setting('app.environment', true) = 'development' THEN
    DELETE FROM sesiones_usuario;
    DELETE FROM logs_sistema;
    DELETE FROM borradores;
    DELETE FROM comprobantes_fiscales;
    DELETE FROM items;
    DELETE FROM clientes;
    DELETE FROM configuraciones;
    DELETE FROM usuarios WHERE email LIKE '%test%' OR email LIKE '%ejemplo%';
    DELETE FROM empresas WHERE rnc LIKE '000%' OR razon_social LIKE '%Test%';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON POLICY "Empresas: Solo ver su propia empresa" ON empresas IS 
'Los usuarios solo pueden ver y modificar datos de su propia empresa';

COMMENT ON POLICY "Usuarios: Solo ver usuarios de su empresa" ON usuarios IS 
'Los usuarios solo pueden ver otros usuarios de su misma empresa';

COMMENT ON FUNCTION get_current_user_empresa_id() IS 
'Obtiene el ID de empresa del usuario autenticado actualmente';

COMMENT ON FUNCTION user_belongs_to_empresa(BIGINT) IS 
'Verifica si el usuario actual pertenece a la empresa especificada';

-- Insertar configuración por defecto para el sistema
INSERT INTO configuraciones (empresa_id, clave, valor, descripcion, tipo, categoria)
VALUES 
  (1, 'max_sesiones_usuario', '5', 'Máximo número de sesiones simultáneas por usuario', 'number', 'seguridad'),
  (1, 'tiempo_expiracion_sesion', '86400', 'Tiempo de expiración de sesión en segundos (24 horas)', 'number', 'seguridad'),
  (1, 'intentos_login_max', '5', 'Máximo número de intentos de login antes del bloqueo', 'number', 'seguridad'),
  (1, 'tiempo_bloqueo_login', '900', 'Tiempo de bloqueo en segundos (15 minutos)', 'number', 'seguridad')
ON CONFLICT (empresa_id, clave) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Script de aislamiento de datos ejecutado correctamente';
  RAISE NOTICE 'Row Level Security habilitado en todas las tablas';
  RAISE NOTICE 'Políticas de seguridad creadas';
  RAISE NOTICE 'Triggers de validación aplicados';
  RAISE NOTICE 'Índices de optimización creados';
END $$;
