-- Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view own company data" ON empresas;
DROP POLICY IF EXISTS "Users can update own company data" ON empresas;
DROP POLICY IF EXISTS "Users can insert own company data" ON empresas;
DROP POLICY IF EXISTS "Users can view own users" ON usuarios;
DROP POLICY IF EXISTS "Users can manage own users" ON usuarios;
DROP POLICY IF EXISTS "Users can insert own users" ON usuarios;
DROP POLICY IF EXISTS "Users can update own users" ON usuarios;

-- Habilitar RLS en todas las tablas principales
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;

-- Crear función helper para obtener empresa_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT empresa_id 
    FROM usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para tabla empresas
CREATE POLICY "Usuarios pueden ver su propia empresa" ON empresas
  FOR SELECT USING (id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden actualizar su propia empresa" ON empresas
  FOR UPDATE USING (id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden insertar su propia empresa" ON empresas
  FOR INSERT WITH CHECK (true); -- Permitir inserción inicial

-- Políticas para tabla usuarios
CREATE POLICY "Usuarios pueden ver usuarios de su empresa" ON usuarios
  FOR SELECT USING (empresa_id = get_user_empresa_id() OR id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar usuarios de su empresa" ON usuarios
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden insertar usuarios en su empresa" ON usuarios
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() OR auth.uid() IS NULL);

-- Políticas para tabla clientes
CREATE POLICY "Usuarios pueden ver clientes de su empresa" ON clientes
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden gestionar clientes de su empresa" ON clientes
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para tabla items
CREATE POLICY "Usuarios pueden ver items de su empresa" ON items
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden gestionar items de su empresa" ON items
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para tabla comprobantes
CREATE POLICY "Usuarios pueden ver comprobantes de su empresa" ON comprobantes
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden gestionar comprobantes de su empresa" ON comprobantes
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para tabla borradores
CREATE POLICY "Usuarios pueden ver borradores de su empresa" ON borradores
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden gestionar borradores de su empresa" ON borradores
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Políticas para tabla configuraciones
CREATE POLICY "Usuarios pueden ver configuraciones de su empresa" ON configuraciones
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuarios pueden gestionar configuraciones de su empresa" ON configuraciones
  FOR ALL USING (empresa_id = get_user_empresa_id());

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_items_empresa_id ON items(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa_id ON comprobantes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_borradores_empresa_id ON borradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_configuraciones_empresa_id ON configuraciones(empresa_id);

-- Asegurar que la tabla usuarios tenga la estructura correcta
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas;
CREATE TRIGGER update_empresas_updated_at 
    BEFORE UPDATE ON empresas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Conceder permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verificar que las tablas existen y tienen las columnas correctas
DO $$
BEGIN
    -- Verificar tabla empresas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas') THEN
        RAISE EXCEPTION 'Tabla empresas no existe';
    END IF;
    
    -- Verificar tabla usuarios
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        RAISE EXCEPTION 'Tabla usuarios no existe';
    END IF;
    
    -- Verificar que la columna empresa_id existe en usuarios
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'empresa_id') THEN
        RAISE EXCEPTION 'Columna empresa_id no existe en tabla usuarios';
    END IF;
    
    RAISE NOTICE 'Verificación de tablas completada exitosamente';
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS configuradas correctamente para el sistema de facturación electrónica';
END $$;
