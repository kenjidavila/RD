"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Save, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


interface EmpresaData {
  id?: string
  razon_social: string
  nombre_comercial: string
  rnc: string
  direccion: string
  telefono: string
  email: string
  provincia: string
  municipio: string
  sector: string
  actividad_economica: string
  // Valores permitidos por la restricción de la base de datos
  regimen_tributario: "Ordinario" | "RST" | "PST"
  logo_url?: string
  created_at?: string
  updated_at?: string
}

const provincias = [
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "La Altagracia",
  "San Pedro de Macorís",
  "La Romana",
  "Puerto Plata",
  "Espaillat",
  "La Vega",
  "Monseñor Nouel",
  "Duarte",
  "María Trinidad Sánchez",
  "Hermanas Mirabal",
  "Samaná",
  "Sánchez Ramírez",
  "San Cristóbal",
  "Peravia",
  "Azua",
  "San José de Ocoa",
  "San Juan",
  "Elías Piña",
  "Baoruco",
  "Barahona",
  "Independencia",
  "Pedernales",
  "Monte Cristi",
  "Dajabón",
  "Santiago Rodríguez",
  "Valverde",
  "Monte Plata",
  "Hato Mayor",
  "El Seibo",
]

export default function PerfilEmpresa() {
  const [empresa, setEmpresa] = useState<EmpresaData>({
    razon_social: "",
    nombre_comercial: "",
    rnc: "",
    direccion: "",
    telefono: "",
    email: "",
    provincia: "",
    municipio: "",
    sector: "",
    actividad_economica: "",
    regimen_tributario: "Ordinario",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()


  useEffect(() => {
    cargarDatosEmpresa()
  }, [])

  const cargarDatosEmpresa = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/perfil-empresa")
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setEmpresa(result.data)
        }
      } else if (response.status === 401) {
        toast({
          title: "Error",
          description: "Debe iniciar sesión para acceder a esta función",
          variant: "destructive",
        })
        return
      } else if (response.status !== 404) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error cargando datos")
      }
    } catch (error: any) {
      console.error("Error cargando datos de empresa:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los datos de la empresa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const {
      razon_social,
      rnc,
      telefono,
      email,
      provincia,
      municipio,
      actividad_economica,
      regimen_tributario,
      direccion,
    } = empresa

    if (
      !razon_social ||
      !rnc ||
      !telefono ||
      !email ||
      !provincia ||
      !municipio ||
      !actividad_economica ||
      !regimen_tributario ||
      !direccion
    ) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const response = await fetch("/api/perfil-empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error guardando datos")
      }

      const result = await response.json()
      if (result.data) {
        setEmpresa(result.data)
        // reload data from backend to ensure state matches stored values
        await cargarDatosEmpresa()
      }

      toast({
        title: "Datos guardados",
        description: "Los datos de la empresa se han guardado correctamente",
      })
    } catch (error: any) {
      console.error("Error guardando datos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los datos",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof EmpresaData, value: string) => {
    setEmpresa((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Perfil de la Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando datos de la empresa...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Perfil de la Empresa
        </CardTitle>
        <CardDescription>Configure los datos básicos de su empresa para la facturación electrónica</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social *</Label>
              <Input
                id="razon_social"
                value={empresa.razon_social}
                onChange={(e) => handleInputChange("razon_social", e.target.value)}
                required
                placeholder="Nombre legal de la empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
              <Input
                id="nombre_comercial"
                value={empresa.nombre_comercial}
                onChange={(e) => handleInputChange("nombre_comercial", e.target.value)}
                placeholder="Nombre comercial (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rnc">RNC *</Label>
              <Input
                id="rnc"
                value={empresa.rnc}
                onChange={(e) => handleInputChange("rnc", e.target.value)}
                required
                placeholder="123456789"
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                value={empresa.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                required
                placeholder="(809) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={empresa.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                placeholder="empresa@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Select value={empresa.provincia} onValueChange={(value) => handleInputChange("provincia", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provincias.map((provincia) => (
                    <SelectItem key={provincia} value={provincia}>
                      {provincia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio *</Label>
              <Input
                id="municipio"
                value={empresa.municipio}
                onChange={(e) => handleInputChange("municipio", e.target.value)}
                required
                placeholder="Municipio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={empresa.sector}
                onChange={(e) => handleInputChange("sector", e.target.value)}
                placeholder="Sector o barrio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actividad_economica">Actividad Económica *</Label>
              <Input
                id="actividad_economica"
                value={empresa.actividad_economica}
                onChange={(e) => handleInputChange("actividad_economica", e.target.value)}
                required
                placeholder="Descripción de la actividad económica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regimen_tributario">Régimen Tributario *</Label>
              <Select
                value={empresa.regimen_tributario}
                onValueChange={(value: any) => handleInputChange("regimen_tributario", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un régimen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ordinario">Ordinario</SelectItem>
                  <SelectItem value="RST">RST (Régimen Simplificado de Tributación)</SelectItem>
                  <SelectItem value="PST">PST (Procedimiento Simplificado de Tributación)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Textarea
              id="direccion"
              value={empresa.direccion}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              required
              placeholder="Dirección completa de la empresa"
              rows={3}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Los campos marcados con (*) son obligatorios para el cumplimiento con la DGII.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Datos
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
