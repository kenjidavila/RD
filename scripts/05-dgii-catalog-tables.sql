-- Tabla de Provincias según DGII
CREATE TABLE IF NOT EXISTS provincias (
  codigo VARCHAR(6) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Municipios según DGII
CREATE TABLE IF NOT EXISTS municipios (
  codigo VARCHAR(6) PRIMARY KEY,
  provincia_codigo VARCHAR(6) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provincia_codigo) REFERENCES provincias(codigo)
);

-- Tabla de Unidades de Medida según DGII
CREATE TABLE IF NOT EXISTS unidades_medida (
  codigo VARCHAR(2) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tipos de Impuestos Adicionales según DGII
CREATE TABLE IF NOT EXISTS tipos_impuestos_adicionales (
  codigo VARCHAR(3) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('especifico', 'ad_valorem')),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tipos de Monedas según DGII
CREATE TABLE IF NOT EXISTS tipos_monedas (
  codigo VARCHAR(3) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar Provincias
INSERT INTO provincias (codigo, nombre) VALUES
('010000', 'DISTRITO NACIONAL'),
('020000', 'PROVINCIA AZUA'),
('030000', 'PROVINCIA BAHORUCO'),
('040000', 'PROVINCIA BARAHONA'),
('050000', 'PROVINCIA DAJABÓN'),
('060000', 'PROVINCIA DUARTE'),
('070000', 'PROVINCIA ELÍAS PIÑA'),
('080000', 'PROVINCIA EL SEIBO'),
('090000', 'PROVINCIA ESPAILLAT'),
('100000', 'PROVINCIA HATO MAYOR'),
('110000', 'PROVINCIA HERMANAS MIRABAL'),
('120000', 'PROVINCIA INDEPENDENCIA'),
('130000', 'PROVINCIA LA ALTAGRACIA'),
('140000', 'PROVINCIA LA ROMANA'),
('150000', 'PROVINCIA LA VEGA'),
('160000', 'PROVINCIA MARÍA TRINIDAD SÁNCHEZ'),
('170000', 'PROVINCIA MONSEÑOR NOUEL'),
('180000', 'PROVINCIA MONTE CRISTI'),
('190000', 'PROVINCIA MONTE PLATA'),
('200000', 'PROVINCIA PEDERNALES'),
('210000', 'PROVINCIA PERAVIA'),
('220000', 'PROVINCIA PUERTO PLATA'),
('230000', 'PROVINCIA SAMANÁ'),
('240000', 'PROVINCIA SAN CRISTÓBAL'),
('250000', 'PROVINCIA SAN JOSÉ DE OCOA'),
('260000', 'PROVINCIA SAN JUAN'),
('270000', 'PROVINCIA SAN PEDRO DE MACORÍS'),
('280000', 'PROVINCIA SÁNCHEZ RAMÍREZ'),
('290000', 'PROVINCIA SANTIAGO'),
('300000', 'PROVINCIA SANTIAGO RODRÍGUEZ'),
('310000', 'PROVINCIA SANTO DOMINGO'),
('320000', 'PROVINCIA VALVERDE')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar algunos municipios principales
INSERT INTO municipios (codigo, provincia_codigo, nombre) VALUES
('010100', '010000', 'MUNICIPIO SANTO DOMINGO DE GUZMÁN'),
('010101', '010000', 'SANTO DOMINGO DE GUZMÁN (D. M.)'),
('020100', '020000', 'MUNICIPIO AZUA'),
('020101', '020000', 'AZUA (D. M.)'),
('020102', '020000', 'BARRO ARRIBA (D. M.)'),
('030100', '030000', 'MUNICIPIO NEIBA'),
('030101', '030000', 'NEIBA (D. M.)'),
('310100', '310000', 'MUNICIPIO SANTO DOMINGO ESTE'),
('310101', '310000', 'SANTO DOMINGO ESTE (D. M.)'),
('310200', '310000', 'MUNICIPIO SANTO DOMINGO NORTE'),
('310201', '310000', 'SANTO DOMINGO NORTE (D. M.)'),
('310300', '310000', 'MUNICIPIO SANTO DOMINGO OESTE'),
('310301', '310000', 'SANTO DOMINGO OESTE (D. M.)'),
('290100', '290000', 'MUNICIPIO SANTIAGO'),
('290101', '290000', 'SANTIAGO (D. M.)'),
('310102', '310000', 'SAN LUÍS (D. M.)'),
('310202', '310000', 'LA VICTORIA (D. M.)'),
('310400', '310000', 'MUNICIPIO BOCA CHICA'),
('310401', '310000', 'BOCA CHICA (D. M.)'),
('310402', '310000', 'LA CALETA (D. M.)'),
('310500', '310000', 'MUNICIPIO SAN ANTONIO DE GUERRA'),
('310501', '310000', 'SAN ANTONIO DE GUERRA (D. M.)'),
('310502', '310000', 'HATO VIEJO (D. M.)'),
('310600', '310000', 'MUNICIPIO LOS ALCARRIZOS'),
('310601', '310000', 'LOS ALCARRIZOS (D. M.)'),
('310602', '310000', 'PALMAREJO-VILLA LINDA (D. M.)'),
('310603', '310000', 'PANTOJA (D. M.)'),
('310700', '310000', 'MUNICIPIO PEDRO BRAND'),
('310701', '310000', 'PEDRO BRAND (D. M.)'),
('310702', '310000', 'LA GUÁYIGA (D. M.)'),
('310703', '310000', 'LA CUABA (D. M.)')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar Unidades de Medida
INSERT INTO unidades_medida (codigo, nombre) VALUES
('1', 'Barril'),
('2', 'Bolsa'),
('3', 'Bote'),
('4', 'Bultos'),
('5', 'Botella'),
('6', 'Caja/Cajón'),
('7', 'Cajetilla'),
('8', 'Centímetro'),
('9', 'Cilindro'),
('10', 'Conjunto'),
('11', 'Contenedor'),
('12', 'Día'),
('13', 'Docena'),
('14', 'Fardo'),
('15', 'Galones'),
('16', 'Grado'),
('17', 'Gramo'),
('18', 'Granel'),
('19', 'Hora'),
('20', 'Huacal'),
('21', 'Kilogramo'),
('22', 'Kilovatio Hora'),
('23', 'Libra'),
('24', 'Litro'),
('25', 'Lote'),
('26', 'Metro'),
('27', 'Metro Cuadrado'),
('28', 'Metro Cúbico'),
('29', 'Millones de Unidades Térmicas'),
('30', 'Minuto'),
('31', 'Paquete'),
('32', 'Par'),
('33', 'Pie'),
('34', 'Pieza'),
('35', 'Rollo'),
('36', 'Sobre'),
('37', 'Segundo'),
('38', 'Tanque'),
('39', 'Tonelada'),
('40', 'Tubo'),
('41', 'Yarda'),
('42', 'Yarda cuadrada'),
('43', 'Unidad'),
('44', 'Elemento'),
('45', 'Millar'),
('46', 'Saco'),
('47', 'Lata'),
('48', 'Display'),
('49', 'Bidón'),
('50', 'Ración'),
('51', 'Quintal'),
('52', 'Gross Register Tonnage (Toneladas de registro bruto)'),
('53', 'Pie cuadrado'),
('54', 'Pasajero'),
('55', 'Pulgadas'),
('56', 'Parqueo barcos en muelle'),
('57', 'Bandeja'),
('58', 'Hectárea'),
('59', 'Mililitro'),
('60', 'Miligramo'),
('61', 'Onzas'),
('62', 'Onzas Troy')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar Tipos de Impuestos Adicionales
INSERT INTO tipos_impuestos_adicionales (codigo, nombre, tipo) VALUES
('001', 'Propina Legal', 'especifico'),
('002', 'Contribución al Desarrollo de las Telecomunicaciones', 'especifico'),
('003', 'Impuesto Selectivo al Consumo (Servicios Seguros en general)', 'especifico'),
('004', 'Servicios de Telecomunicaciones', 'especifico'),
('005', 'Impuesto sobre el Primer Registro de Vehículos (Primera Placa)', 'especifico'),
('006', 'Cerveza (ISC Específico)', 'especifico'),
('007', 'Vinos de uva', 'especifico'),
('008', 'Vermuth y demás vinos de uvas frescas', 'especifico'),
('009', 'Demás bebidas fermentadas', 'especifico'),
('010', 'Alcohol Etílico sin desnaturalizar (Mayor o igual a 80%)', 'especifico'),
('011', 'Alcohol Etílico sin desnaturalizar (inferior a 80%)', 'especifico'),
('012', 'Aguardientes de uva', 'especifico'),
('013', 'Whisky', 'especifico'),
('014', 'Ron y demás aguardientes de caña', 'especifico'),
('015', 'Gin y Ginebra', 'especifico'),
('016', 'Vodka', 'especifico'),
('017', 'Licores', 'especifico'),
('018', 'Los demás (Bebidas y Alcoholes)', 'especifico'),
('019', 'Cigarrillos que contengan tabaco cajetilla 20 unidades', 'especifico'),
('020', 'Los demás cigarrillos que contengan 20 unidades', 'especifico'),
('021', 'Cigarrillos que contengan 10 unidades', 'especifico'),
('022', 'Los demás cigarrillos que contengan 10 unidades', 'especifico'),
('023', 'Cerveza (ISC AdValorem)', 'ad_valorem'),
('024', 'Vinos de uva', 'ad_valorem'),
('025', 'Vermuth y demás vinos de uvas frescas', 'ad_valorem'),
('026', 'Demás bebidas fermentadas', 'ad_valorem'),
('027', 'Alcohol Etílico sin desnaturalizar (Mayor o igual a 80%)', 'ad_valorem'),
('028', 'Alcohol Etílico sin desnaturalizar (inferior a 80%)', 'ad_valorem'),
('029', 'Aguardientes de uva', 'ad_valorem'),
('030', 'Whisky', 'ad_valorem'),
('031', 'Ron y demás aguardientes de caña', 'ad_valorem'),
('032', 'Gin y Ginebra', 'ad_valorem'),
('033', 'Vodka', 'ad_valorem'),
('034', 'Licores', 'ad_valorem'),
('035', 'Los demás (Bebidas y Alcoholes)', 'ad_valorem'),
('036', 'Cigarrillos que contengan tabaco cajetilla 20 unidades', 'ad_valorem'),
('037', 'Los demás cigarrillos que contengan 20 unidades', 'ad_valorem'),
('038', 'Cigarrillos que contengan 10 unidades', 'ad_valorem'),
('039', 'Los demás cigarrillos que contengan 10 unidades', 'ad_valorem')
ON CONFLICT (codigo) DO NOTHING;

-- Insertar Tipos de Monedas
INSERT INTO tipos_monedas (codigo, nombre) VALUES
('BRL', 'REAL BRASILENO'),
('CAD', 'DOLAR CANADIENSE'),
('CHF', 'FRANCO SUIZO'),
('CHY', 'YUAN CHINO'),
('XDR', 'DERECHO ESPECIAL DE GIRO'),
('DKK', 'CORONA DANESA'),
('EUR', 'EURO'),
('GBP', 'LIBRA ESTERLINA'),
('JPY', 'YEN JAPONES'),
('NOK', 'CORONA NORUEGA'),
('SCP', 'LIBRA ESCOCESA'),
('SEK', 'CORONA SUECA'),
('USD', 'DOLAR ESTADOUNIDENSE'),
('VEF', 'BOLIVAR FUERTE VENEZOLANO'),
('HTG', 'GURDA HAITIANA'),
('MXN', 'PESO MEXICANO')
ON CONFLICT (codigo) DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_municipios_provincia ON municipios(provincia_codigo);
CREATE INDEX IF NOT EXISTS idx_provincias_activa ON provincias(activa);
CREATE INDEX IF NOT EXISTS idx_municipios_activa ON municipios(activa);
CREATE INDEX IF NOT EXISTS idx_unidades_medida_activa ON unidades_medida(activa);
CREATE INDEX IF NOT EXISTS idx_tipos_impuestos_activa ON tipos_impuestos_adicionales(activa);
CREATE INDEX IF NOT EXISTS idx_tipos_monedas_activa ON tipos_monedas(activa);
