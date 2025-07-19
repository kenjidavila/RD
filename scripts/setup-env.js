const fs = require("fs")
const path = require("path")

console.log("🔧 Configurador de Variables de Entorno - Facturación Electrónica RD\n")

const envTemplate = `# Configuración de Supabase
# Obtén estos valores desde: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://ecgkthlevgdtnvchrgoj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2t0aGxldmdkdG52Y2hyZ29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODA3NzQsImV4cCI6MjA2ODM1Njc3NH0.E4Kl6OmG9HQFNzQkZh4bIrK8uJK6nj4SYaLDk3vVyFE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2t0aGxldmdkdG52Y2hyZ29qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4MDc3NCwiZXhwIjoyMDY4MzU2Nzc0fQ.BdjHO4IkAT5Ard29u2fF8Jc7uvurKPA5riLi3zwVfig

# Configuración adicional para el sistema
ENCRYPTION_KEY=\${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Configuración DGII
NEXT_PUBLIC_DGII_API_URL=https://ecf.dgii.gov.do

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
`

const envPath = path.join(process.cwd(), ".env.local")

if (fs.existsSync(envPath)) {
  console.log("⚠️  El archivo .env.local ya existe.")
  console.log("📝 Por favor, verifica que contenga las siguientes variables:\n")
} else {
  fs.writeFileSync(envPath, envTemplate)
  console.log("✅ Archivo .env.local creado exitosamente!\n")
}

console.log("📋 Variables de entorno requeridas:")
console.log("")
console.log("1. NEXT_PUBLIC_SUPABASE_URL")
console.log("   - Obtén desde: Supabase Dashboard > Settings > API > Project URL")
console.log("   - Ejemplo: https://ecgkthlevgdtnvchrgoj.supabase.co")
console.log("")
console.log("2. NEXT_PUBLIC_SUPABASE_ANON_KEY")
console.log("   - Obtén desde: Supabase Dashboard > Settings > API > Project API keys > anon public")
console.log("   - Es seguro exponer esta clave en el frontend")
console.log("")
console.log("3. SUPABASE_SERVICE_ROLE_KEY")
console.log("   - Obtén desde: Supabase Dashboard > Settings > API > Project API keys > service_role")
console.log("   - ⚠️  NUNCA expongas esta clave en el frontend")
console.log("")
console.log("🔗 Pasos para obtener las claves de Supabase:")
console.log("1. Ve a https://supabase.com/dashboard")
console.log("2. Selecciona tu proyecto")
console.log("3. Ve a Settings > API")
console.log("4. Copia las claves necesarias")
console.log("")
console.log("🚀 Después de configurar las variables:")
console.log("1. Ejecuta: npm run dev")
console.log("2. Ve a http://localhost:3000")
console.log("3. Registra tu primera empresa")
