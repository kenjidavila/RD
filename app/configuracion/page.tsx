"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Building, Users, FileText, Palette } from "lucide-react"
import PerfilEmpresa from "@/components/configuracion/perfil-empresa"
import CertificadosDigitales from "@/components/configuracion/certificados-digitales"
import GestionUsuarios from "@/components/configuracion/gestion-usuarios"
import SecuenciasNCF from "@/components/configuracion/secuencias-ncf"
import PersonalizacionFacturas from "@/components/configuracion/personalizacion-facturas"
import { createClient } from "@/utils/supabase/client"

export default function ConfiguracionPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setIsAuthenticated(true)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>Debe iniciar sesión para acceder a la configuración del sistema.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Configure los parámetros del sistema de facturación electrónica</p>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Certificados
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="secuencias" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Secuencias
            </TabsTrigger>
            <TabsTrigger value="personalizacion" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Personalización
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa">
            <PerfilEmpresa />
          </TabsContent>

          <TabsContent value="certificados">
            <CertificadosDigitales />
          </TabsContent>

          <TabsContent value="usuarios">
            <GestionUsuarios />
          </TabsContent>

          <TabsContent value="secuencias">
            <SecuenciasNCF />
          </TabsContent>

          <TabsContent value="personalizacion">
            <PersonalizacionFacturas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
