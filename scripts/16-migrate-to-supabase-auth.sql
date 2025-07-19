-- Migración completa a Supabase Auth
-- Este script migra el sistema de autenticación personalizado a Supabase Auth

-- 1. Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Modificar tabla empresas para usar user_id de Supabase Auth
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_empresas_user_id ON empresas(user_id);

-- 4. Modificar tabla usuarios para referenciar auth.users
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Crear índice para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);

-- 6. Habilitar Row Level Security (RLS) en todas las tablas principales
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para empresas
DROP POLICY IF EXISTS "Usuarios acceden solo a su empresa" ON empresas;
CREATE POLICY "Usuarios acceden solo a su empresa" ON empresas
  FOR ALL USING (user_id = auth.uid());

-- 8. Crear políticas RLS para usuarios
DROP POLICY IF EXISTS "Usuarios acceden solo a sus datos" ON usuarios;
CREATE POLICY "Usuarios acceden solo a sus datos" ON usuarios
  FOR ALL USING (auth_user_id = auth.uid());

-- 9. Crear función para obtener empresa_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
DECLARE
  empresa_id UUID;
BEGIN
  SELECT e.id INTO empresa_id
  FROM empresas e
  WHERE e.user_id = auth.uid();
  
  RETURN empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear políticas RLS para clientes
DROP POLICY IF EXISTS "Usuarios acceden solo a clientes de su empresa" ON clientes;
CREATE POLICY "Usuarios acceden solo a clientes de su empresa" ON clientes
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- 11. Crear políticas RLS para items
DROP POLICY IF EXISTS "Usuarios acceden solo a items de su empresa" ON items;
CREATE POLICY "Usuarios acceden solo a items de su empresa" ON items
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- 12. Crear políticas RLS para comprobantes
DROP POLICY IF EXISTS "Usuarios acceden solo a comprobantes de su empresa" ON comprobantes;
CREATE POLICY "Usuarios acceden solo a comprobantes de su empresa" ON comprobantes
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- 13. Crear políticas RLS para borradores
DROP POLICY IF EXISTS "Usuarios acceden solo a borradores de su empresa" ON borradores;
CREATE POLICY "Usuarios acceden solo a borradores de su empresa" ON borradores
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- 14. Crear políticas RLS para configuraciones
DROP POLICY IF EXISTS "Usuarios acceden solo a configuraciones de su empresa" ON configuraciones;
CREATE POLICY "Usuarios acceden solo a configuraciones de su empresa" ON configuraciones
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- 15. Crear trigger para auto-asignar empresa_id en inserts
CREATE OR REPLACE FUNCTION set_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.empresa_id = get_user_empresa_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Aplicar trigger a tablas que necesitan empresa_id automático
DROP TRIGGER IF EXISTS trigger_set_empresa_id_clientes ON clientes;
CREATE TRIGGER trigger_set_empresa_id_clientes
  BEFORE INSERT ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id();

DROP TRIGGER IF EXISTS trigger_set_empresa_id_items ON items;
CREATE TRIGGER trigger_set_empresa_id_items
  BEFORE INSERT ON items
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id();

DROP TRIGGER IF EXISTS trigger_set_empresa_id_comprobantes ON comprobantes;
CREATE TRIGGER trigger_set_empresa_id_comprobantes
  BEFORE INSERT ON comprobantes
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id();

DROP TRIGGER IF EXISTS trigger_set_empresa_id_borradores ON borradores;
CREATE TRIGGER trigger_set_empresa_id_borradores
  BEFORE INSERT ON borradores
  FOR EACH ROW EXECUTE FUNCTION set_empresa_id();

-- 17. Limpiar tablas de autenticación personalizada (opcional)
-- NOTA: Descomenta estas líneas solo después de migrar todos los usuarios
-- DROP TABLE IF EXISTS sesiones CASCADE;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS password_hash;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS session_token;

-- 18. Crear vista para datos de usuario completos
CREATE OR REPLACE VIEW vista_usuario_completo AS
SELECT 
  u.id as usuario_id,
  u.auth_user_id,
  u.nombre,
  u.apellido,
  u.email,
  u.rol,
  e.id as empresa_id,
  e.rnc as empresa_rnc,
  e.razon_social as empresa_razon_social,
  e.nombre_comercial as empresa_nombre_comercial,
  e.email as empresa_email
FROM usuarios u
JOIN empresas e ON u.empresa_id = e.id
WHERE u.auth_user_id = auth.uid();

-- 19. Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_empresa_id() TO authenticated;

-- 20. Comentarios para documentación
COMMENT ON FUNCTION get_user_empresa_id() IS 'Obtiene el ID de empresa del usuario autenticado actual';
COMMENT ON VIEW vista_usuario_completo IS 'Vista que combina datos de usuario y empresa para el usuario autenticado';

-- Fin del script de migración
