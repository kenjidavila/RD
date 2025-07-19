-- Función para generar e-NCF
CREATE OR REPLACE FUNCTION generar_encf(p_empresa_id UUID, p_tipo_comprobante tipo_comprobante)
RETURNS VARCHAR(19) AS $$
DECLARE
    empresa_rnc VARCHAR(11);
    secuencia_actual BIGINT;
    nuevo_encf VARCHAR(19);
BEGIN
    -- Obtener RNC de la empresa
    SELECT rnc INTO empresa_rnc
    FROM empresas 
    WHERE id = p_empresa_id;

    IF empresa_rnc IS NULL THEN
        RAISE EXCEPTION 'Empresa no encontrada';
    END IF;

    -- Obtener y actualizar secuencia actual
    UPDATE secuencias_ncf 
    SET secuencia_actual = secuencia_actual + 1,
        updated_at = NOW()
    WHERE empresa_id = p_empresa_id 
    AND tipo_comprobante = p_tipo_comprobante
    AND activa = true
    AND secuencia_actual < secuencia_final
    RETURNING secuencia_actual INTO secuencia_actual;

    IF secuencia_actual IS NULL THEN
        RAISE EXCEPTION 'No hay secuencias NCF disponibles para el tipo %', p_tipo_comprobante;
    END IF;

    -- Generar e-NCF: E + RNC (11) + TipoComprobante (2) + Secuencia (8)
    nuevo_encf := 'E' || empresa_rnc || p_tipo_comprobante || LPAD(secuencia_actual::TEXT, 8, '0');
    
    RETURN nuevo_encf;
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de item automático
CREATE OR REPLACE FUNCTION generar_codigo_item(p_empresa_id UUID, p_tipo_item tipo_item)
RETURNS VARCHAR(50) AS $$
DECLARE
    ultimo_numero INTEGER;
    prefijo VARCHAR(3);
    nuevo_codigo VARCHAR(50);
BEGIN
    -- Determinar prefijo según tipo
    IF p_tipo_item = 'bien' THEN
        prefijo := 'ITM';
    ELSE
        prefijo := 'SRV';
    END IF;

    -- Obtener último número usado
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 
        0
    ) INTO ultimo_numero
    FROM items 
    WHERE empresa_id = p_empresa_id 
    AND codigo LIKE prefijo || '%'
    AND LENGTH(codigo) = 9; -- ITM000001 o SRV000001

    -- Generar nuevo código
    nuevo_codigo := prefijo || LPAD((ultimo_numero + 1)::TEXT, 6, '0');
    
    RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener empresa por user_id
CREATE OR REPLACE FUNCTION get_empresa_by_user_id(p_user_id UUID)
RETURNS TABLE(id UUID, rnc VARCHAR, razon_social VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.rnc, e.razon_social
    FROM empresas e
    WHERE e.user_id = p_user_id
    AND e.activa = true;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar PDFs expirados
CREATE OR REPLACE FUNCTION limpiar_pdfs_expirados()
RETURNS INTEGER AS $$
DECLARE
    registros_eliminados INTEGER;
BEGIN
    DELETE FROM pdf_storage 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS registros_eliminados = ROW_COUNT;
    
    RETURN registros_eliminados;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de PDFs
CREATE OR REPLACE FUNCTION get_pdf_storage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_files', COUNT(*),
        'total_size_mb', ROUND(SUM(file_size::NUMERIC) / 1024 / 1024, 2),
        'files_expiring_soon', COUNT(*) FILTER (WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'),
        'total_downloads', SUM(download_count),
        'last_upload', MAX(created_at)
    ) INTO v_stats
    FROM pdf_storage 
    WHERE user_id = p_user_id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;
