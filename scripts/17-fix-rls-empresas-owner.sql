-- Script para corregir el problema RLS con empresas
-- Agregar columna owner_id y ajustar políticas

BEGIN;

-- 1. Agregar columna owner_id a la tabla empresas si no existe
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_empresas_owner_id ON empresas(owner_id);

-- 3. Eliminar políticas problemáticas existentes
DROP POLICY IF EXISTS "Empresas: Los usuarios pueden ver su propia empresa" ON empresas;
DROP POLICY IF EXISTS "Empresas: Los administradores pueden actualizar su empresa" ON empresas;
DROP POLICY IF EXISTS "Empresas: Permitir inserción para nuevas empresas" ON empresas;
DROP POLICY IF EXISTS "Usuarios pueden ver su empresa" ON empresas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su empresa" ON empresas;
DROP POLICY IF EXISTS "Usuarios pueden insertar empresas" ON empresas;
DROP POLICY IF EXISTS "Propietarios pueden ver su empresa" ON empresas;
DROP POLICY IF EXISTS "Propietarios pueden actualizar su empresa" ON empresas;
DROP POLICY IF EXISTS "Propietarios pueden insertar empresas" ON empresas;

-- 4. Crear políticas RLS simples y directas usando owner_id
CREATE POLICY "Permitir creacion empresa por propietario" ON empresas 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Ver empresas propias" ON empresas 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Actualizar empresas propias" ON empresas 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Eliminar empresas propias" ON empresas 
  FOR DELETE USING (auth.uid() = owner_id);

-- 5. Actualizar función get_user_empresa_id para usar owner_id
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
DECLARE
  empresa_uuid UUID;
BEGIN
  SELECT id INTO empresa_uuid
  FROM empresas
  WHERE owner_id = auth.uid()
  LIMIT 1;
  
  RETURN empresa_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función de compatibilidad
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN get_user_empresa_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Actualizar políticas de otras tablas para usar la nueva función
-- Clientes
DROP POLICY IF EXISTS "Clientes: Los usuarios pueden ver clientes de su empresa" ON clientes;
DROP POLICY IF EXISTS "Clientes: Los usuarios pueden gestionar clientes de su empresa" ON clientes;
DROP POLICY IF EXISTS "Usuarios acceden solo a clientes de su empresa" ON clientes;

CREATE POLICY "Usuarios acceden solo a clientes de su empresa" ON clientes
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Items
DROP POLICY IF EXISTS "Items: Los usuarios pueden ver items de su empresa" ON items;
DROP POLICY IF EXISTS "Items: Los usuarios pueden gestionar items de su empresa" ON items;
DROP POLICY IF EXISTS "Usuarios acceden solo a items de su empresa" ON items;

CREATE POLICY "Usuarios acceden solo a items de su empresa" ON items
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Comprobantes
DROP POLICY IF EXISTS "Comprobantes: Los usuarios pueden ver comprobantes de su empresa" ON comprobantes_fiscales;
DROP POLICY IF EXISTS "Comprobantes: Los usuarios pueden gestionar comprobantes de su empresa" ON comprobantes_fiscales;
DROP POLICY IF EXISTS "Usuarios acceden solo a comprobantes de su empresa" ON comprobantes_fiscales;

CREATE POLICY "Usuarios acceden solo a comprobantes de su empresa" ON comprobantes_fiscales
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Configuraciones (si existe la tabla)
DROP POLICY IF EXISTS "Configuraciones: Los usuarios pueden ver configuraciones de su empresa" ON configuraciones;
DROP POLICY IF EXISTS "Configuraciones: Los usuarios pueden gestionar configuraciones de su empresa" ON configuraciones;
DROP POLICY IF EXISTS "Usuarios acceden solo a configuraciones de su empresa" ON configuraciones;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuraciones') THEN
    EXECUTE 'CREATE POLICY "Usuarios acceden solo a configuraciones de su empresa" ON configuraciones FOR ALL USING (empresa_id = get_user_empresa_id())';
  END IF;
END
$$;

-- Borradores (si existe la tabla)
DROP POLICY IF EXISTS "Borradores: Los usuarios pueden ver borradores de su empresa" ON borradores_comprobantes;
DROP POLICY IF EXISTS "Borradores: Los usuarios pueden gestionar borradores de su empresa" ON borradores_comprobantes;
DROP POLICY IF EXISTS "Usuarios acceden solo a borradores de su empresa" ON borradores_comprobantes;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'borradores_comprobantes') THEN
    EXECUTE 'CREATE POLICY "Usuarios acceden solo a borradores de su empresa" ON borradores_comprobantes FOR ALL USING (empresa_id = get_user_empresa_id())';
  END IF;
END
$$;

-- 8. Crear vista para datos completos del usuario
CREATE OR REPLACE VIEW vista_usuario_completo AS
SELECT 
  u.id,
  u.empresa_id,
  u.auth_user_id,
  u.nombre,
  u.apellido,
  u.email,
  u.rnc_cedula,
  u.telefono,
  u.rol,
  u.activo,
  u.email_verificado,
  u.fecha_creacion,
  u.ultimo_acceso,
  e.id as empresa_id_full,
  e.rnc as empresa_rnc,
  e.razon_social as empresa_razon_social,
  e.nombre_comercial as empresa_nombre_comercial,
  e.email as empresa_email,
  e.telefono as empresa_telefono,
  e.direccion as empresa_direccion,
  e.provincia as empresa_provincia,
  e.municipio as empresa_municipio,
  e.sector as empresa_sector,
  e.activa as empresa_activa
FROM usuarios u
JOIN empresas e ON u.empresa_id = e.id
WHERE u.auth_user_id = auth.uid();

-- 9. Actualizar trigger para auto-asignar empresa_id
CREATE OR REPLACE FUNCTION auto_assign_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-asignar empresa_id basado en el usuario autenticado
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := get_user_empresa_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a tablas relevantes
DROP TRIGGER IF EXISTS trigger_auto_assign_empresa_clientes ON clientes;
CREATE TRIGGER trigger_auto_assign_empresa_clientes
  BEFORE INSERT ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_empresa_id();

DROP TRIGGER IF EXISTS trigger_auto_assign_empresa_items ON items;
CREATE TRIGGER trigger_auto_assign_empresa_items
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_empresa_id();

-- Solo aplicar a comprobantes_fiscales si existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'comprobantes_fiscales') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_auto_assign_empresa_comprobantes ON comprobantes_fiscales';
    EXECUTE 'CREATE TRIGGER trigger_auto_assign_empresa_comprobantes BEFORE INSERT ON comprobantes_fiscales FOR EACH ROW EXECUTE FUNCTION auto_assign_empresa_id()';
  END IF;
END
$$;

-- 10. Comentarios de documentación
COMMENT ON COLUMN empresas.owner_id IS 'ID del usuario propietario de la empresa (auth.users.id)';
COMMENT ON POLICY "Permitir creacion empresa por propietario" ON empresas IS 'Permite crear empresas solo si el usuario autenticado es el propietario';
COMMENT ON FUNCTION get_user_empresa_id() IS 'Obtiene el ID de empresa del usuario autenticado usando owner_id';

COMMIT;
