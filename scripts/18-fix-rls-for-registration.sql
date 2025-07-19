-- Políticas RLS corregidas para permitir registro inicial
-- Este script permite que los usuarios se registren sin estar autenticados

-- 1. Función para verificar si existe empresa con RNC
CREATE OR REPLACE FUNCTION check_empresa_rnc_exists(rnc_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM empresas WHERE rnc = rnc_param
  );
END;
$$;

-- 2. Función para crear empresa con owner_id (bypassa RLS)
CREATE OR REPLACE FUNCTION create_empresa_with_owner(
  rnc_param text,
  razon_social_param text,
  nombre_comercial_param text DEFAULT NULL,
  email_param text,
  telefono_param text DEFAULT NULL,
  direccion_param text DEFAULT NULL,
  provincia_param text DEFAULT NULL,
  municipio_param text DEFAULT NULL,
  sector_param text DEFAULT NULL,
  owner_id_param uuid
)
RETURNS TABLE(
  id integer,
  rnc text,
  razon_social text,
  nombre_comercial text,
  email text,
  owner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nueva_empresa_id integer;
BEGIN
  INSERT INTO empresas (
    rnc,
    razon_social,
    nombre_comercial,
    email,
    telefono,
    direccion,
    provincia,
    municipio,
    sector,
    owner_id,
    activa,
    fecha_registro,
    fecha_actualizacion
  ) VALUES (
    rnc_param,
    razon_social_param,
    nombre_comercial_param,
    email_param,
    telefono_param,
    direccion_param,
    provincia_param,
    municipio_param,
    sector_param,
    owner_id_param,
    true,
    NOW(),
    NOW()
  )
  RETURNING empresas.id INTO nueva_empresa_id;

  RETURN QUERY
  SELECT 
    empresas.id,
    empresas.rnc,
    empresas.razon_social,
    empresas.nombre_comercial,
    empresas.email,
    empresas.owner_id
  FROM empresas
  WHERE empresas.id = nueva_empresa_id;
END;
$$;

-- 3. Función para crear usuario con empresa (bypassa RLS)
CREATE OR REPLACE FUNCTION create_usuario_with_empresa(
  empresa_id_param integer,
  auth_user_id_param uuid,
  nombre_param text,
  apellido_param text,
  email_param text,
  rnc_cedula_param text,
  telefono_param text DEFAULT NULL
)
RETURNS TABLE(
  id integer,
  empresa_id integer,
  auth_user_id uuid,
  nombre text,
  apellido text,
  email text,
  rol text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nuevo_usuario_id integer;
BEGIN
  INSERT INTO usuarios (
    empresa_id,
    auth_user_id,
    nombre,
    apellido,
    email,
    password_hash,
    rnc_cedula,
    telefono,
    rol,
    activo,
    email_verificado,
    fecha_creacion,
    fecha_actualizacion
  ) VALUES (
    empresa_id_param,
    auth_user_id_param,
    nombre_param,
    apellido_param,
    email_param,
    'supabase_auth',
    rnc_cedula_param,
    telefono_param,
    'administrador',
    true,
    false,
    NOW(),
    NOW()
  )
  RETURNING usuarios.id INTO nuevo_usuario_id;

  RETURN QUERY
  SELECT 
    usuarios.id,
    usuarios.empresa_id,
    usuarios.auth_user_id,
    usuarios.nombre,
    usuarios.apellido,
    usuarios.email,
    usuarios.rol
  FROM usuarios
  WHERE usuarios.id = nuevo_usuario_id;
END;
$$;

-- 4. Políticas RLS más permisivas para registro inicial
-- Permitir inserción en empresas durante registro
DROP POLICY IF EXISTS "Usuarios pueden insertar su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden insertar su propia empresa" ON empresas
  FOR INSERT
  WITH CHECK (true); -- Permitir inserción inicial

-- Permitir inserción en usuarios durante registro  
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios datos" ON usuarios;
CREATE POLICY "Usuarios pueden insertar sus propios datos" ON usuarios
  FOR INSERT
  WITH CHECK (true); -- Permitir inserción inicial

-- Mantener políticas de lectura y actualización seguras
DROP POLICY IF EXISTS "Usuarios pueden ver su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden ver su propia empresa" ON empresas
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.auth_user_id = auth.uid() 
      AND usuarios.empresa_id = empresas.id
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia empresa" ON empresas;
CREATE POLICY "Usuarios pueden actualizar su propia empresa" ON empresas
  FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.auth_user_id = auth.uid() 
      AND usuarios.empresa_id = empresas.id
      AND usuarios.rol = 'administrador'
    )
  );

-- Políticas para usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver datos de su empresa" ON usuarios;
CREATE POLICY "Usuarios pueden ver datos de su empresa" ON usuarios
  FOR SELECT
  USING (
    auth_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM usuarios u2
      WHERE u2.auth_user_id = auth.uid()
      AND u2.empresa_id = usuarios.empresa_id
      AND u2.rol = 'administrador'
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios datos" ON usuarios;
CREATE POLICY "Usuarios pueden actualizar sus propios datos" ON usuarios
  FOR UPDATE
  USING (auth_user_id = auth.uid());

-- 5. Función para registro completo (empresa + usuario)
CREATE OR REPLACE FUNCTION registrar_empresa_completa(
  -- Datos empresa
  empresa_rnc text,
  empresa_razon_social text,
  empresa_email text,
  -- Datos usuario
  usuario_nombre text,
  usuario_apellido text,
  usuario_email text,
  usuario_rnc_cedula text,
  usuario_telefono text DEFAULT NULL,
  auth_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  empresa_creada record;
  usuario_creado record;
  resultado json;
BEGIN
  -- Verificar que no existe empresa con el mismo RNC
  IF check_empresa_rnc_exists(empresa_rnc) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ya existe una empresa registrada con este RNC'
    );
  END IF;

  -- Crear empresa
  SELECT * INTO empresa_creada
  FROM create_empresa_with_owner(
    empresa_rnc,
    empresa_razon_social,
    NULL, -- nombre_comercial
    empresa_email,
    NULL, -- telefono
    NULL, -- direccion
    NULL, -- provincia
    NULL, -- municipio
    NULL, -- sector
    auth_user_id
  )
  LIMIT 1;

  -- Crear usuario
  SELECT * INTO usuario_creado
  FROM create_usuario_with_empresa(
    empresa_creada.id,
    auth_user_id,
    usuario_nombre,
    usuario_apellido,
    usuario_email,
    usuario_rnc_cedula,
    usuario_telefono
  )
  LIMIT 1;

  -- Retornar resultado exitoso
  RETURN json_build_object(
    'success', true,
    'message', 'Registro exitoso',
    'data', json_build_object(
      'empresa_id', empresa_creada.id,
      'usuario_id', usuario_creado.id
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error durante el registro: ' || SQLERRM
    );
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION check_empresa_rnc_exists IS 'Verifica si existe una empresa con el RNC dado';
COMMENT ON FUNCTION create_empresa_with_owner IS 'Crea una empresa con owner_id, bypassa RLS';
COMMENT ON FUNCTION create_usuario_with_empresa IS 'Crea un usuario asociado a una empresa, bypassa RLS';
COMMENT ON FUNCTION registrar_empresa_completa IS 'Función completa para registro de empresa y usuario inicial';
