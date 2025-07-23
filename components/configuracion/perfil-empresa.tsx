"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Save, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Provincia, Municipio } from "@/lib/dgii-catalogs"
import { DGIICatalogsService } from "@/lib/dgii-catalogs"
import { useEmpresa } from "@/components/empresa-context"
import { useConfiguracionTabs } from "./configuracion-tabs-context"


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
  logo_url?: string
  created_at?: string
  updated_at?: string
}
export default function PerfilEmpresa() {
  const router = useRouter()
  const { setEmpresaId } = useEmpresa()
  const { reportError, reportSuccess } = useConfiguracionTabs()
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [provinciaCodigo, setProvinciaCodigo] = useState("")
  const [empresa, setEmpresa] = useState<EmpresaData>({
    razon_social: "",
    nombre_comercial: "",
    rnc: "",
    direccion: "",
    telefono: "",
    email: "",
    provincia: "",
    municipio: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    DGIICatalogsService.getProvincias()
      .then(setProvincias)
      .catch(() => {
        setError("No se pudieron cargar las provincias")
        toast({
          title: "Error",
          description: "No se pudieron cargar las provincias",
          variant: "destructive",
        })
      })
  }, [])

  useEffect(() => {
    if (provincias.length > 0) {
      cargarDatosEmpresa()
    }
  }, [provincias])

  useEffect(() => {
    if (provinciaCodigo) {
      DGIICatalogsService.getMunicipiosByProvincia(provinciaCodigo).then((data) => {
        setMunicipios(data)
        if (!data.find((m) => m.nombre === empresa.municipio)) {
          setEmpresa((prev) => ({ ...prev, municipio: "" }))
        }
      })
    } else {
      setMunicipios([])
      setEmpresa((prev) => ({ ...prev, municipio: "" }))
    }
  }, [provinciaCodigo])

  useEffect(() => {
    if (empresa.provincia && provincias.length > 0) {
      const prov = provincias.find((p) => p.nombre === empresa.provincia)
      setProvinciaCodigo(prov?.codigo || "")
    }
  }, [empresa.provincia, provincias])

  const cargarDatosEmpresa = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/perfil-empresa")
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setEmpresa(result.data)
          setEmpresaId(result.data.id)
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
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos de la empresa",
      )
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos de la empresa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { razon_social, rnc, telefono, email, provincia, municipio, direccion } = empresa

    if (
      !razon_social ||
      !rnc ||
      !telefono ||
      !email ||
      !provincia ||
      !municipio ||
      !direccion
    ) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      reportError("perfil")
      return
    }

    if (!/^\d{9,11}$/.test(rnc)) {
      toast({
        title: "RNC inválido",
        description: "El RNC debe contener solo números",
        variant: "destructive",
      })
      reportError("perfil")
      return
    }

    if (!/^\+?[0-9\-()\s]{7,20}$/.test(telefono)) {
      toast({
        title: "Teléfono inválido",
        description: "Ingrese un teléfono válido",
        variant: "destructive",
      })
      reportError("perfil")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Email inválido",
        description: "Ingrese un correo electrónico válido",
        variant: "destructive",
      })
      reportError("perfil")
      return
    }

    const provinciaValida = provincias.find((p) => p.codigo === provinciaCodigo)
    const municipioValido = municipios.find((m) => m.nombre === municipio)

    if (!provinciaValida) {
      toast({
        title: "Provincia inválida",
        description: "Seleccione una provincia válida",
        variant: "destructive",
      })
      reportError("perfil")
      return
    }

    if (!municipioValido) {
      toast({
        title: "Municipio inválido",
        description: "Seleccione un municipio válido",
        variant: "destructive",
      })
      reportError("perfil")
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
        setEmpresaId(result.data.id)
        // reload data from backend to ensure state matches stored values
        await cargarDatosEmpresa()
        router.refresh()
      }

      toast({
        title: "Datos guardados",
        description: "Los datos de la empresa se han guardado correctamente",
      })
      reportSuccess("perfil")
    } catch (error: any) {
      console.error("Error guardando datos:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los datos",
        variant: "destructive",
      })
      reportError("perfil")
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
                onChange={(e) =>
                  handleInputChange("rnc", e.target.value.replace(/\D/g, ""))
                }
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
              <Select
                value={provinciaCodigo}
                onValueChange={(value) => {
                  setProvinciaCodigo(value)
                  const prov = provincias.find((p) => p.codigo === value)
                  if (prov) {
                    handleInputChange("provincia", prov.nombre)
                  } else {
                    toast({
                      title: "Error",
                      description: "Código de provincia no válido",
                      variant: "destructive",
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provincias.map((prov) => (
                    <SelectItem key={prov.codigo} value={prov.codigo}>
                      {prov.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio *</Label>
              <Select
                value={empresa.municipio}
                onValueChange={(value) => handleInputChange("municipio", value)}
                disabled={!provinciaCodigo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map((mun) => (
                    <SelectItem key={mun.codigo} value={mun.nombre}>
                      {mun.nombre}
                    </SelectItem>
                  ))}
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
