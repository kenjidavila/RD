-- Limpiar base de datos completamente para evitar duplicaciones
-- ADVERTENCIA: Esto eliminará todos los datos existentes

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comprobantes_fiscales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS detalles_comprobantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuraciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pdf_storage DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own company data" ON empresas;
DROP POLICY IF EXISTS "Users can insert their own company data" ON empresas;
DROP POLICY IF EXISTS "Users can update their own company data" ON empresas;
DROP POLICY IF EXISTS "Users can view their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can update their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can view their own items" ON items;
DROP POLICY IF EXISTS "Users can insert their own items" ON items;
DROP POLICY IF EXISTS "Users can update their own items" ON items;
DROP POLICY IF EXISTS "Users can delete their own items" ON items;
DROP POLICY IF EXISTS "Users can view their own PDFs" ON pdf_storage;
DROP POLICY IF EXISTS "Users can insert their own PDFs" ON pdf_storage;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON pdf_storage;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON pdf_storage;

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS validar_nombre_archivo_trigger ON comprobantes_fiscales;
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
DROP TRIGGER IF EXISTS update_configuraciones_updated_at ON configuraciones;
DROP TRIGGER IF EXISTS pdf_storage_updated_at ON pdf_storage;
DROP TRIGGER IF EXISTS pdf_storage_config_updated_at ON pdf_storage_config;
DROP TRIGGER IF EXISTS trigger_update_borradores_updated_at ON borradores_comprobantes;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS trigger_validar_nombre_archivo();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_configuraciones_updated_at();
DROP FUNCTION IF EXISTS update_borradores_updated_at();
DROP FUNCTION IF EXISTS generar_encf(VARCHAR, UUID);
DROP FUNCTION IF EXISTS validar_cuadratura_ecf(UUID);
DROP FUNCTION IF EXISTS validar_nombre_archivo_xml(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS escapar_caracteres_xml(TEXT);
DROP FUNCTION IF EXISTS codificar_para_url(TEXT);
DROP FUNCTION IF EXISTS generar_url_qr(VARCHAR, VARCHAR, VARCHAR, DATE, DECIMAL, TIMESTAMP, VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS generar_codigo_item(UUID, VARCHAR);
DROP FUNCTION IF EXISTS actualizar_stock_item(UUID, DECIMAL, VARCHAR);
DROP FUNCTION IF EXISTS cleanup_expired_pdfs();
DROP FUNCTION IF EXISTS get_pdf_storage_stats(UUID);

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS auditoria_operaciones CASCADE;
DROP TABLE IF EXISTS validaciones_xml CASCADE;
DROP TABLE IF EXISTS tokens_contribuyentes CASCADE;
DROP TABLE IF EXISTS servicios_contribuyente CASCADE;
DROP TABLE IF EXISTS comunicacion_emisor_receptor CASCADE;
DROP TABLE IF EXISTS estatus_servicios_dgii CASCADE;
DROP TABLE IF EXISTS ventanas_mantenimiento CASCADE;
DROP TABLE IF EXISTS envios_dgii CASCADE;
DROP TABLE IF EXISTS ncf_contingencia CASCADE;
DROP TABLE IF EXISTS contingencias CASCADE;
DROP TABLE IF EXISTS historial_precios_items CASCADE;
DROP TABLE IF EXISTS contactos_clientes CASCADE;
DROP TABLE IF EXISTS direcciones_clientes CASCADE;
DROP TABLE IF EXISTS categorias_items CASCADE;
DROP TABLE IF EXISTS detalles_comprobantes CASCADE;
DROP TABLE IF EXISTS borradores_comprobantes CASCADE;
DROP TABLE IF EXISTS comprobantes_fiscales CASCADE;
DROP TABLE IF EXISTS pdf_storage_config CASCADE;
DROP TABLE IF EXISTS pdf_storage CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS secuencias_ncf CASCADE;
DROP TABLE IF EXISTS certificados_digitales CASCADE;
DROP TABLE IF EXISTS configuraciones CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- Eliminar tablas de catálogos DGII
DROP TABLE IF EXISTS municipios CASCADE;
DROP TABLE IF EXISTS provincias CASCADE;
DROP TABLE IF EXISTS unidades_medida CASCADE;
DROP TABLE IF EXISTS tipos_impuestos_adicionales CASCADE;
DROP TABLE IF EXISTS tipos_monedas CASCADE;

-- Eliminar extensiones si existen
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Limpiar base de datos existente
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear tipos ENUM
CREATE TYPE tipo_cliente AS ENUM ('persona_fisica', 'persona_juridica', 'extranjero');
CREATE TYPE tipo_item AS ENUM ('bien', 'servicio');
CREATE TYPE estado_comprobante AS ENUM ('borrador', 'emitido', 'enviado_dgii', 'aceptado', 'rechazado', 'anulado');
CREATE TYPE tipo_comprobante AS ENUM ('31', '32', '33', '34', '41', '43', '44', '45', '46', '47');
CREATE TYPE tasa_itbis AS ENUM ('0', '16', '18');

COMMIT;
