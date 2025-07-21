-- Ajustar políticas RLS de empresas para requerir propietario
BEGIN;

-- Reforzar política de inserción
DROP POLICY IF EXISTS "Usuarios pueden insertar su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden insertar su propia empresa" ON empresas
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Reforzar política de actualización
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden actualizar su propia empresa" ON empresas
  FOR UPDATE USING (auth.uid() = owner_id);

COMMIT;
