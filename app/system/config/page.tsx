import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

async function checkEnvironmentVariables() {
  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ENCRYPTION_KEY",
    "NEXT_PUBLIC_DGII_API_URL",
  ]

  const results = requiredVars.map((varName) => ({
    name: varName,
    value: process.env[varName],
    isSet: !!process.env[varName],
    isValid: varName.includes("URL")
      ? process.env[varName]?.startsWith("http") || false
      : (process.env[varName]?.length || 0) > 10,
  }))

  return results
}

async function testSupabaseConnection() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/system/test-connection`,
    )
    const data = await response.json()
    return data
  } catch (error) {
    return { success: false, error: "Failed to test connection" }
  }
}

function ConfigStatus({
  name,
  isSet,
  isValid,
  value,
}: {
  name: string
  isSet: boolean
  isValid: boolean
  value?: string
}) {
  const getIcon = () => {
    if (!isSet) return <XCircle className="h-4 w-4 text-red-500" />
    if (!isValid) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getStatus = () => {
    if (!isSet) return <Badge variant="destructive">No configurado</Badge>
    if (!isValid) return <Badge variant="secondary">Formato inválido</Badge>
    return (
      <Badge variant="default" className="bg-green-500">
        Configurado
      </Badge>
    )
  }

  const getMaskedValue = () => {
    if (!value) return "No configurado"
    if (name.includes("KEY") || name.includes("SECRET")) {
      return `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
    }
    return value
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-gray-500">{getMaskedValue()}</p>
        </div>
      </div>
      {getStatus()}
    </div>
  )
}

async function ConfigurationChecker() {
  const envVars = await checkEnvironmentVariables()
  const connectionTest = await testSupabaseConnection()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Variables de Entorno</CardTitle>
          <CardDescription>Verificación de las variables de entorno requeridas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {envVars.map((envVar) => (
            <ConfigStatus
              key={envVar.name}
              name={envVar.name}
              isSet={envVar.isSet}
              isValid={envVar.isValid}
              value={envVar.value}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conexión a Supabase</CardTitle>
          <CardDescription>Estado de la conexión con la base de datos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {connectionTest.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">{connectionTest.success ? "Conexión exitosa" : "Error de conexión"}</p>
              <p className="text-sm text-gray-500">{connectionTest.message || connectionTest.error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SystemConfigPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
        <p className="text-gray-600 mt-2">Verifica que todas las configuraciones estén correctas</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        }
      >
        <ConfigurationChecker />
      </Suspense>
    </div>
  )
}
