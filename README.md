# Sistema de Facturación Electrónica para República Dominicana (e-CF)

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/tu-usuario/facturacion-electronica-rd)
[![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Sistema completo de facturación electrónica que cumple con las normativas de la DGII (Dirección General de Impuestos Internos) de República Dominicana para la emisión de Comprobantes Fiscales Electrónicos (e-CF).

## 🚀 Características Principales

### ✅ Cumplimiento Normativo DGII
- **Comprobantes Fiscales Electrónicos (e-CF)** - Soporte completo para todos los tipos
- **Firma Digital** - Integración con certificados digitales
- **Validación XML** - Esquemas XSD oficiales de la DGII
- **Numeración Controlada de Facturas (NCF)** - Gestión automática de secuencias
- **Consultas DGII** - Validación de RNC y NCF en tiempo real

### 🏢 Gestión Empresarial
- **Multi-empresa** - Soporte para múltiples empresas en una instalación
- **Gestión de Usuarios** - Roles y permisos granulares
- **Configuración Flexible** - Personalización por empresa
- **Auditoría Completa** - Trazabilidad de todas las operaciones

### 📊 Funcionalidades de Facturación
- **Emisión de Facturas** - Interfaz intuitiva para crear comprobantes
- **Gestión de Clientes** - Base de datos completa de clientes
- **Catálogo de Productos** - Gestión de items y servicios
- **Borradores** - Guardar y continuar facturas en proceso
- **Generación de PDF** - Documentos con formato profesional

### 🔧 Características Técnicas
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático para mayor confiabilidad
- **Supabase** - Base de datos PostgreSQL con autenticación
- **Tailwind CSS** - Diseño responsive y moderno
- **Componentes UI** - Librería de componentes reutilizables

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 14.1.0** - Framework React con SSR/SSG
- **TypeScript 5.3.3** - Superset de JavaScript con tipado estático
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **Radix UI** - Componentes accesibles y personalizables
- **Lucide React** - Iconos SVG optimizados
- **React Hook Form** - Manejo eficiente de formularios
- **Zod** - Validación de esquemas TypeScript-first

### Backend
- **Supabase** - Backend-as-a-Service con PostgreSQL
- **PostgreSQL** - Base de datos relacional robusta
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Supabase Auth** - Autenticación y autorización
- **Supabase Storage** - Almacenamiento de archivos

### Herramientas de Desarrollo
- **ESLint** - Linter para JavaScript/TypeScript
- **Prettier** - Formateador de código
- **Husky** - Git hooks para calidad de código
- **Jest** - Framework de testing
- **Vercel** - Plataforma de deployment

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Cuenta de Supabase** (gratuita disponible)
- **Certificado Digital** (para firma de comprobantes)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

\`\`\`bash
git clone https://github.com/tu-usuario/facturacion-electronica-rd.git
cd facturacion-electronica-rd
\`\`\`

### 2. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar Variables de Entorno

Crear archivo `.env.local`:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EMPRESA_RNC=tu_rnc_empresa
LOG_LEVEL=info

# DGII API Configuration
NEXT_PUBLIC_DGII_API_URL=https://ecf.dgii.gov.do
\`\`\`

### 4. Configurar Base de Datos

\`\`\`bash
# Ejecutar migraciones
npm run db:migrate

# Poblar datos iniciales
npm run db:seed
\`\`\`

### 5. Ejecutar en Desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

\`\`\`
facturacion-electronica-rd/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   ├── dgii/                 # Consultas DGII
│   │   ├── comprobantes/         # Gestión de comprobantes
│   │   └── configuracion/        # Configuración del sistema
│   ├── dashboard/                # Panel principal
│   ├── emitir/                   # Emisión de comprobantes
│   ├── consultas/                # Consultas y reportes
│   ├── configuracion/            # Configuración
│   └── layout.tsx                # Layout principal
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base UI
│   ├── auth/                     # Componentes de autenticación
│   ├── dashboard/                # Componentes del dashboard
│   ├── invoices/                 # Componentes de facturación
│   ├── configuracion/            # Componentes de configuración
│   └── layout/                   # Componentes de layout
├── lib/                          # Utilidades y configuración
│   ├── supabase.ts              # Cliente Supabase
│   ├── supabase-server.ts       # Cliente servidor Supabase
│   ├── logger.ts                # Sistema de logging
│   ├── pdf-generator.ts         # Generación de PDFs
│   └── dgii-services.ts         # Servicios DGII
├── types/                        # Definiciones de tipos
│   ├── database.ts              # Tipos de base de datos
│   └── ecf-types.ts             # Tipos específicos e-CF
├── hooks/                        # Custom React hooks
├── utils/                        # Utilidades generales
├── scripts/                      # Scripts de base de datos
├── libraries/                    # Esquemas XSD y catálogos DGII
└── public/                       # Archivos estáticos
\`\`\`

## 🔐 Seguridad

### Autenticación y Autorización
- **Supabase Auth** - Autenticación segura con JWT
- **Row Level Security (RLS)** - Aislamiento de datos por empresa
- **Roles y Permisos** - Control granular de acceso
- **Sesiones Seguras** - Manejo seguro de sesiones de usuario

### Protección de Datos
- **Encriptación en Tránsito** - HTTPS en todas las comunicaciones
- **Encriptación en Reposo** - Datos encriptados en base de datos
- **Validación de Entrada** - Sanitización de todos los inputs
- **Auditoría** - Registro de todas las operaciones críticas

### Certificados Digitales
- **Almacenamiento Seguro** - Certificados encriptados
- **Validación** - Verificación de validez y vigencia
- **Gestión de Vencimiento** - Alertas automáticas

## 📊 Tipos de Comprobantes Soportados

| Código | Tipo de Comprobante | Estado |
|--------|-------------------|--------|
| 31 | Factura de Crédito Fiscal | ✅ |
| 32 | Factura de Consumo | ✅ |
| 33 | Nota de Débito | ✅ |
| 34 | Nota de Crédito | ✅ |
| 41 | Compras | ✅ |
| 43 | Gastos Menores | ✅ |
| 44 | Regímenes Especiales | ✅ |
| 45 | Gubernamental | ✅ |
| 46 | Exportaciones | ✅ |

## 🔄 Flujo de Trabajo

### 1. Configuración Inicial
1. Registro de empresa
2. Configuración de certificados digitales
3. Configuración de secuencias NCF
4. Configuración de usuarios y roles

### 2. Emisión de Comprobantes
1. Selección de tipo de comprobante
2. Ingreso de datos del receptor
3. Adición de items/servicios
4. Cálculo automático de impuestos
5. Generación de XML
6. Firma digital
7. Envío a DGII
8. Generación de PDF

### 3. Gestión y Consultas
1. Consulta de estado en DGII
2. Reimpresión de comprobantes
3. Anulación de comprobantes
4. Reportes y estadísticas

## 🧪 Testing

\`\`\`bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage
\`\`\`

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio** en Vercel
2. **Configurar variables de entorno** en el dashboard
3. **Deploy automático** con cada push a main

### Docker

\`\`\`bash
# Construir imagen
docker build -t ecf-rd .

# Ejecutar contenedor
docker run -p 3000:3000 ecf-rd
\`\`\`

### Manual

\`\`\`bash
# Construir para producción
npm run build

# Iniciar servidor
npm start
\`\`\`

## 📈 Roadmap

### Versión 2.2.0 (Q2 2024)
- [ ] Integración con sistemas contables
- [ ] API REST completa
- [ ] Módulo de inventario
- [ ] Reportes avanzados

### Versión 2.3.0 (Q3 2024)
- [ ] Aplicación móvil
- [ ] Integración con bancos
- [ ] Facturación recurrente
- [ ] Multi-idioma

### Versión 3.0.0 (Q4 2024)
- [ ] Inteligencia artificial para categorización
- [ ] Análisis predictivo
- [ ] Integración con e-commerce
- [ ] API GraphQL

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

### Guías de Contribución
- Seguir las convenciones de código establecidas
- Incluir tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Usar commits descriptivos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

### Documentación
- [Wiki del Proyecto](https://github.com/tu-usuario/facturacion-electronica-rd/wiki)
- [Guía de Usuario](docs/user-guide.md)
- [Guía de Desarrollador](docs/developer-guide.md)

### Comunidad
- [Discussions](https://github.com/tu-usuario/facturacion-electronica-rd/discussions)
- [Issues](https://github.com/tu-usuario/facturacion-electronica-rd/issues)

### Contacto
- **Email**: soporte@tuempresa.com
- **Website**: https://tuempresa.com
- **Discord**: [Servidor de la Comunidad](https://discord.gg/tu-servidor)

## 🙏 Agradecimientos

- **DGII** - Por las especificaciones técnicas y esquemas XSD
- **Supabase** - Por la excelente plataforma BaaS
- **Vercel** - Por el hosting y deployment
- **Comunidad Open Source** - Por las librerías y herramientas utilizadas

## ⚠️ Disclaimer

Este software es una implementación de referencia para el cumplimiento de las normativas de facturación electrónica de República Dominicana. Los usuarios son responsables de:

- Validar el cumplimiento con las regulaciones vigentes
- Obtener los certificados digitales necesarios
- Realizar las pruebas correspondientes con la DGII
- Mantener el software actualizado con los cambios normativos

---

**Desarrollado con ❤️ para la comunidad dominicana**

[![Made in Dominican Republic](https://img.shields.io/badge/Made%20in-Dominican%20Republic-blue.svg)](https://github.com/tu-usuario/facturacion-electronica-rd)
