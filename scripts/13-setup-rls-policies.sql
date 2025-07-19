-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE borradores_comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estadisticas_empresa ENABLE ROW LEVEL SECURITY;

-- Función para obtener el ID de la empresa actual del usuario autenticado
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID AS $$
BEGIN
  -- Por ahora retornamos un UUID fijo para desarrollo
  -- En producción esto debería obtener la empresa del usuario autenticado
  RETURN '00000000-0000-0000-0000-000000000001'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario pertenece a una empresa
CREATE OR REPLACE FUNCTION user_belongs_to_empresa(empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Por ahora permitimos acceso para desarrollo
  -- En producción esto debería verificar la relación usuario-empresa
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para la tabla empresas
DROP POLICY IF EXISTS "Empresas: Los usuarios pueden ver su propia empresa" ON empresas;
CREATE POLICY "Empresas: Los usuarios pueden ver su propia empresa" ON empresas
  FOR SELECT USING (id = get_current_empresa_id());

DROP POLICY IF EXISTS "Empresas: Los administradores pueden actualizar su empresa" ON empresas;
CREATE POLICY "Empresas: Los administradores pueden actualizar su empresa" ON empresas
  FOR UPDATE USING (id = get_current_empresa_id());

DROP POLICY IF EXISTS "Empresas: Permitir inserción para nuevas empresas" ON empresas;
CREATE POLICY "Empresas: Permitir inserción para nuevas empresas" ON empresas
  FOR INSERT WITH CHECK (true);

-- Políticas para la tabla usuarios
DROP POLICY IF EXISTS "Usuarios: Los usuarios pueden ver usuarios de su empresa" ON usuarios;
CREATE POLICY "Usuarios: Los usuarios pueden ver usuarios de su empresa" ON usuarios
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Usuarios: Los administradores pueden gestionar usuarios" ON usuarios;
CREATE POLICY "Usuarios: Los administradores pueden gestionar usuarios" ON usuarios
  FOR ALL USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Usuarios: Permitir inserción de nuevos usuarios" ON usuarios;
CREATE POLICY "Usuarios: Permitir inserción de nuevos usuarios" ON usuarios
  FOR INSERT WITH CHECK (true);

-- Políticas para la tabla sesiones_usuario
DROP POLICY IF EXISTS "Sesiones: Los usuarios pueden ver sus propias sesiones" ON sesiones_usuario;
CREATE POLICY "Sesiones: Los usuarios pueden ver sus propias sesiones" ON sesiones_usuario
  FOR SELECT USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE empresa_id = get_current_empresa_id()
    )
  );

DROP POLICY IF EXISTS "Sesiones: Permitir gestión de sesiones" ON sesiones_usuario;
CREATE POLICY "Sesiones: Permitir gestión de sesiones" ON sesiones_usuario
  FOR ALL USING (
    usuario_id IN (
      SELECT id FROM usuarios WHERE empresa_id = get_current_empresa_id()
    )
  );

-- Políticas para la tabla comprobantes_fiscales
DROP POLICY IF EXISTS "Comprobantes: Los usuarios pueden ver comprobantes de su empresa" ON comprobantes_fiscales;
CREATE POLICY "Comprobantes: Los usuarios pueden ver comprobantes de su empresa" ON comprobantes_fiscales
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Comprobantes: Los usuarios pueden gestionar comprobantes de su empresa" ON comprobantes_fiscales;
CREATE POLICY "Comprobantes: Los usuarios pueden gestionar comprobantes de su empresa" ON comprobantes_fiscales
  FOR ALL USING (empresa_id = get_current_empresa_id());

-- Políticas para la tabla clientes
DROP POLICY IF EXISTS "Clientes: Los usuarios pueden ver clientes de su empresa" ON clientes;
CREATE POLICY "Clientes: Los usuarios pueden ver clientes de su empresa" ON clientes
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Clientes: Los usuarios pueden gestionar clientes de su empresa" ON clientes;
CREATE POLICY "Clientes: Los usuarios pueden gestionar clientes de su empresa" ON clientes
  FOR ALL USING (empresa_id = get_current_empresa_id());

-- Políticas para la tabla items
DROP POLICY IF EXISTS "Items: Los usuarios pueden ver items de su empresa" ON items;
CREATE POLICY "Items: Los usuarios pueden ver items de su empresa" ON items
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Items: Los usuarios pueden gestionar items de su empresa" ON items;
CREATE POLICY "Items: Los usuarios pueden gestionar items de su empresa" ON items
  FOR ALL USING (empresa_id = get_current_empresa_id());

-- Políticas para la tabla configuraciones
DROP POLICY IF EXISTS "Configuraciones: Los usuarios pueden ver configuraciones de su empresa" ON configuraciones;
CREATE POLICY "Configuraciones: Los usuarios pueden ver configuraciones de su empresa" ON configuraciones
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Configuraciones: Los usuarios pueden gestionar configuraciones de su empresa" ON configuraciones;
CREATE POLICY "Configuraciones: Los usuarios pueden gestionar configuraciones de su empresa" ON configuraciones
  FOR ALL USING (empresa_id = get_current_empresa_id());

-- Políticas para la tabla borradores_comprobantes
DROP POLICY IF EXISTS "Borradores: Los usuarios pueden ver borradores de su empresa" ON borradores_comprobantes;
CREATE POLICY "Borradores: Los usuarios pueden ver borradores de su empresa" ON borradores_comprobantes
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Borradores: Los usuarios pueden gestionar borradores de su empresa" ON borradores_comprobantes;
CREATE POLICY "Borradores: Los usuarios pueden gestionar borradores de su empresa" ON borradores_comprobantes
  FOR ALL USING (empresa_id = get_current_empresa_id());

-- Políticas para la tabla actividad_usuarios
DROP POLICY IF EXISTS "Actividad: Los usuarios pueden ver actividad de su empresa" ON actividad_usuarios;
CREATE POLICY "Actividad: Los usuarios pueden ver actividad de su empresa" ON actividad_usuarios
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Actividad: Permitir inserción de actividad" ON actividad_usuarios;
CREATE POLICY "Actividad: Permitir inserción de actividad" ON actividad_usuarios
  FOR INSERT WITH CHECK (empresa_id = get_current_empresa_id());

-- Políticas para la tabla estadisticas_empresa
DROP POLICY IF EXISTS "Estadísticas: Los usuarios pueden ver estadísticas de su empresa" ON estadisticas_empresa;
CREATE POLICY "Estadísticas: Los usuarios pueden ver estadísticas de su empresa" ON estadisticas_empresa
  FOR SELECT USING (empresa_id = get_current_empresa_id());

DROP POLICY IF EXISTS "Estadísticas: Permitir actualización de estadísticas" ON estadisticas_empresa;
CREATE POLICY "Estadísticas: Permitir actualización de estadísticas" ON estadisticas_empresa
  FOR ALL USING (empresa_id = get_current_empresa_id());

-- Crear empresa por defecto para desarrollo
INSERT INTO empresas (
  id,
  rnc,
  razon_social,
  nombre_comercial,
  email,
  telefono,
  direccion,
  provincia,
  municipio,
  activa
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '131234567',
  'Empresa Demo',
  'Demo Corp',
  'admin@demo.com',
  '809-555-0123',
  'Calle Principal #123',
  'Distrito Nacional',
  'Santo Domingo',
  true
) ON CONFLICT (id) DO NOTHING;

-- Crear usuario administrador por defecto
INSERT INTO usuarios (
  id,
  empresa_id,
  nombre,
  apellido,
  email,
  password_hash,
  rnc_cedula,
  rol,
  activo,
  email_verificado
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Administrador',
  'Sistema',
  'admin@demo.com',
  '$2b$10$dummy.hash.for.development.only',
  '00112345678',
  'administrador',
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Crear configuración inicial
INSERT INTO configuraciones (
  empresa_id,
  tipo,
  configuracion
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'empresa',
  '{
    "logo_url": "",
    "color_primario": "#3b82f6",
    "color_secundario": "#1e40af",
    "mostrar_logo": true,
    "pie_pagina": "Gracias por su preferencia",
    "terminos_condiciones": "Términos y condiciones estándar"
  }'::jsonb
) ON CONFLICT (empresa_id, tipo) DO NOTHING;

COMMIT;
