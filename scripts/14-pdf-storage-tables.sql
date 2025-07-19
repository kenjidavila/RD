-- Crear tabla para almacenar metadatos de PDFs temporales
CREATE TABLE IF NOT EXISTS pdf_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID,
  track_id TEXT,
  e_ncf TEXT,
  tipo_documento TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  
  -- Metadatos del documento
  emisor_rnc TEXT,
  emisor_nombre TEXT,
  comprador_rnc TEXT,
  comprador_nombre TEXT,
  monto_total DECIMAL(15,2),
  fecha_emision DATE,
  
  -- Control de acceso
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 10,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices para búsquedas
  CONSTRAINT pdf_storage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pdf_storage_user_id ON pdf_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_storage_track_id ON pdf_storage(track_id);
CREATE INDEX IF NOT EXISTS idx_pdf_storage_e_ncf ON pdf_storage(e_ncf);
CREATE INDEX IF NOT EXISTS idx_pdf_storage_expires_at ON pdf_storage(expires_at);
CREATE INDEX IF NOT EXISTS idx_pdf_storage_created_at ON pdf_storage(created_at);

-- Crear tabla de configuración para el almacenamiento de PDFs
CREATE TABLE IF NOT EXISTS pdf_storage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID,
  
  -- Configuración de retención
  default_retention_days INTEGER DEFAULT 30,
  max_retention_days INTEGER DEFAULT 90,
  
  -- Configuración de descargas
  default_max_downloads INTEGER DEFAULT 10,
  max_downloads_limit INTEGER DEFAULT 50,
  
  -- Configuración de almacenamiento
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT[] DEFAULT '{"application/pdf"}',
  
  -- Configuración de notificaciones
  notify_before_expiry_days INTEGER DEFAULT 7,
  notify_on_download BOOLEAN DEFAULT false,
  notify_on_expiry BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT pdf_storage_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT pdf_storage_config_user_unique UNIQUE(user_id)
);

-- Función para limpiar archivos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_pdfs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  expired_record RECORD;
BEGIN
  -- Obtener archivos expirados
  FOR expired_record IN 
    SELECT id, file_path, filename
    FROM pdf_storage
    WHERE expires_at < NOW()
  LOOP
    -- Eliminar registro de base de datos
    DELETE FROM pdf_storage WHERE id = expired_record.id;
    deleted_count := deleted_count + 1;
    
    -- Log para auditoría
    INSERT INTO system_logs (level, message, metadata, created_at)
    VALUES (
      'INFO',
      'PDF expired and cleaned up',
      json_build_object(
        'pdf_id', expired_record.id,
        'filename', expired_record.filename,
        'file_path', expired_record.file_path
      ),
      NOW()
    );
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de almacenamiento
CREATE OR REPLACE FUNCTION get_pdf_storage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_files', COUNT(*),
    'total_size_mb', ROUND(SUM(file_size::NUMERIC) / 1024 / 1024, 2),
    'files_by_type', json_object_agg(tipo_documento, type_count),
    'files_expiring_soon', COUNT(*) FILTER (WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'),
    'total_downloads', SUM(download_count),
    'last_upload', MAX(created_at)
  ) INTO stats
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY tipo_documento) as type_count
    FROM pdf_storage 
    WHERE user_id = p_user_id
  ) s;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pdf_storage_updated_at
  BEFORE UPDATE ON pdf_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER pdf_storage_config_updated_at
  BEFORE UPDATE ON pdf_storage_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE pdf_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_storage_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pdf_storage
CREATE POLICY "Users can view their own PDFs"
  ON pdf_storage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs"
  ON pdf_storage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDFs"
  ON pdf_storage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDFs"
  ON pdf_storage FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para pdf_storage_config
CREATE POLICY "Users can view their own config"
  ON pdf_storage_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
  ON pdf_storage_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
  ON pdf_storage_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Insertar configuración por defecto para usuarios existentes
INSERT INTO pdf_storage_config (user_id, default_retention_days, max_retention_days, default_max_downloads, max_downloads_limit)
SELECT 
  id,
  30,
  90,
  10,
  50
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM pdf_storage_config)
ON CONFLICT (user_id) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE pdf_storage IS 'Almacena metadatos de PDFs temporales con control de acceso y expiración';
COMMENT ON TABLE pdf_storage_config IS 'Configuración personalizable para el almacenamiento de PDFs por usuario';
COMMENT ON FUNCTION cleanup_expired_pdfs() IS 'Limpia archivos PDF expirados y actualiza estadísticas';
COMMENT ON FUNCTION get_pdf_storage_stats(UUID) IS 'Obtiene estadísticas detalladas del almacenamiento de PDFs para un usuario';
