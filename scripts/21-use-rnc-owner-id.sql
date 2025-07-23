-- Use RNC instead of user ID for owner_id policies

-- Function to get the RNC associated with the authenticated user
CREATE OR REPLACE FUNCTION get_user_rnc()
RETURNS VARCHAR(11) AS $$
  SELECT rnc_cedula FROM usuarios WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies on empresas using owner_id as RNC
DROP POLICY IF EXISTS "Usuarios pueden insertar su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden insertar su propia empresa" ON empresas
  FOR INSERT WITH CHECK (owner_id = get_user_rnc());

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden actualizar su propia empresa" ON empresas
  FOR UPDATE USING (owner_id = get_user_rnc());
