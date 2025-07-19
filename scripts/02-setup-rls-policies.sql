-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE secuencias_ncf ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE borradores_comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_storage ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas
CREATE POLICY "Users can view their own empresa" ON empresas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own empresa" ON empresas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own empresa" ON empresas
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para configuraciones
CREATE POLICY "Users can manage their empresa configurations" ON configuraciones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = configuraciones.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );

-- Políticas para clientes
CREATE POLICY "Users can manage their empresa clients" ON clientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = clientes.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );

-- Políticas para items
CREATE POLICY "Users can manage their empresa items" ON items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = items.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );

-- Políticas para secuencias NCF
CREATE POLICY "Users can manage their empresa NCF sequences" ON secuencias_ncf
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = secuencias_ncf.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );

-- Políticas para comprobantes fiscales
CREATE POLICY "Users can manage their empresa comprobantes" ON comprobantes_fiscales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = comprobantes_fiscales.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );

-- Políticas para detalles de comprobantes
CREATE POLICY "Users can manage their comprobante details" ON detalles_comprobantes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM comprobantes_fiscales cf
            JOIN empresas e ON e.id = cf.empresa_id
            WHERE cf.id = detalles_comprobantes.comprobante_id 
            AND e.user_id = auth.uid()
        )
    );

-- Políticas para borradores
CREATE POLICY "Users can manage their empresa drafts" ON borradores_comprobantes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = borradores_comprobantes.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );

-- Políticas para PDF storage
CREATE POLICY "Users can manage their empresa PDFs" ON pdf_storage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas 
            WHERE empresas.id = pdf_storage.empresa_id 
            AND empresas.user_id = auth.uid()
        )
    );
