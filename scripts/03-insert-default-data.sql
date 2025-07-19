-- Insertar configuraciones por defecto para nuevas empresas
CREATE OR REPLACE FUNCTION crear_configuraciones_default(empresa_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Configuración de certificados digitales
    INSERT INTO configuraciones (empresa_id, tipo, configuracion) VALUES
    (empresa_uuid, 'certificados', '{
        "certificado_activo": null,
        "password_certificado": null,
        "fecha_vencimiento": null,
        "emisor": null,
        "configurado": false
    }');

    -- Configuración de personalización de facturas
    INSERT INTO configuraciones (empresa_id, tipo, configuracion) VALUES
    (empresa_uuid, 'personalizacion', '{
        "mostrar_logo": true,
        "color_primario": "#1f2937",
        "color_secundario": "#6b7280",
        "fuente": "Inter",
        "mostrar_qr": true,
        "mostrar_codigo_seguridad": true,
        "pie_pagina": "Gracias por su preferencia",
        "terminos_condiciones": ""
    }');

    -- Configuración de secuencias NCF por defecto
    INSERT INTO configuraciones (empresa_id, tipo, configuracion) VALUES
    (empresa_uuid, 'secuencias_ncf', '{
        "configuradas": false,
        "validadas_dgii": false,
        "mensaje_validacion": "Secuencias no configuradas"
    }');

    -- Configuración de notificaciones
    INSERT INTO configuraciones (empresa_id, tipo, configuracion) VALUES
    (empresa_uuid, 'notificaciones', '{
        "email_comprobantes": true,
        "email_errores": true,
        "webhook_url": null,
        "notificar_vencimiento_ncf": true,
        "dias_aviso_vencimiento": 30
    }');
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear configuraciones automáticamente
CREATE OR REPLACE FUNCTION trigger_crear_configuraciones_default()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM crear_configuraciones_default(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_empresa
    AFTER INSERT ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_crear_configuraciones_default();
