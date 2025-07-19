-- Actualizar tabla de configuraciones para incluir configuración de papel
-- Esta tabla ya existe, solo agregamos los nuevos campos de configuración

-- Insertar configuración por defecto para personalización de facturas si no existe
INSERT INTO configuraciones (tipo, configuracion, created_at, updated_at)
SELECT 
  'personalizacion_facturas',
  jsonb_build_object(
    'mostrar_logo', true,
    'color_primario', '#3B82F6',
    'color_secundario', '#1E40AF',
    'pie_pagina', '',
    'terminos_condiciones', '',
    'papel_tamaño', 'A4',
    'papel_orientacion', 'portrait',
    'papel_margenes_superior', 20,
    'papel_margenes_inferior', 20,
    'papel_margenes_izquierdo', 20,
    'papel_margenes_derecho', 20,
    'papel_customSize_ancho', 210,
    'papel_customSize_alto', 297,
    'marca_agua_habilitada', false,
    'marca_agua_texto', 'COPIA',
    'marca_agua_opacidad', 30,
    'marca_agua_posicion', 'diagonal',
    'marca_agua_tamaño', 'mediano',
    'fuentes_encabezado', 'helvetica',
    'fuentes_cuerpo', 'helvetica',
    'fuentes_numeros', 'helvetica',
    'fuentes_tamaño_titulo', 18,
    'fuentes_tamaño_subtitulo', 14,
    'fuentes_tamaño_texto', 12,
    'fuentes_tamaño_pequeño', 10,
    'layout_logoTamaño', 'mediano',
    'layout_mostrarLineasSeparadoras', true,
    'layout_espaciadoLineas', 'normal',
    'layout_mostrarBordes', true,
    'layout_estiloBordes', 'simple'
  ),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM configuraciones WHERE tipo = 'personalizacion_facturas'
);
