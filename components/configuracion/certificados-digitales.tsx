"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Upload, Download, AlertTriangle, CheckCircle } from "lucide-react"
import { DigitalSignatureService } from "@/lib/digital-signature"
import { createClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import type { CertificadoDigital } from "@/types/database"
import { useEmpresa } from "@/components/empresa-context"
import { useConfiguracionTabs } from "./configuracion-tabs-context"

const CERTS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_CERTS_BUCKET || "certificados"

export default function CertificadosDigitales() {
  const { empresaId } = useEmpresa()
  const { reportError, reportSuccess } = useConfiguracionTabs()
  const [certificados, setCertificados] = useState<CertificadoDigital[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const { toast } = useToast()



  useEffect(() => {
    if (empresaId) {
      cargarCertificados()
    } else {
      // Si no hay empresa definida, detener el indicador de carga
      setLoading(false)
    }
  }, [empresaId])

  const cargarCertificados = async () => {
    if (!empresaId) {
      setError("Empresa no identificada")
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("certificados_digitales")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })

      if (error) throw error

      let certs = data || []
      // Verificar existencia en storage
      const {
        data: stored,
        error: storageListError,
      } = await supabase.storage.from(CERTS_BUCKET).list(`${empresaId}`)
      if (storageListError) {
        throw storageListError
      }
      if (stored) {
        const names = new Set(stored.map((f) => f.name))
        certs = certs.filter((c) => {
          const name = c.archivo_url.split("/").pop()
          return name && names.has(name)
        })
      }
      setCertificados(certs)
      if (certs.length > 0) {
        reportSuccess("certificados")
      }
      logger.info("Certificados cargados", { empresaId, count: certs.length })
    } catch (error) {
      logger.error("Error cargando certificados", { error, empresaId })
      const msg = "Error al cargar certificados digitales"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
      reportError("certificados")
    } finally {
      setLoading(false)
    }
  }

  const validateFields = () => {
    const file = selectedFile
    if (!file) {
      toast({
        title: "Archivo requerido",
        description: "Seleccione un certificado antes de continuar",
        variant: "destructive",
      })
      return false
    }
    if (!empresaId) {
      setError("Empresa no identificada")
      toast({ title: "Error", description: "Empresa no identificada", variant: "destructive" })
      reportError("certificados")
      return false
    }

    // Validar tipo de archivo
    const allowedTypes = [".p12", ".pfx", ".pem", ".crt", ".cer", ".key", ".txt"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!allowedTypes.includes(fileExtension)) {
      setError("Tipo de archivo no válido. Solo se permiten archivos .p12, .pfx, .pem, .crt, .cer, .key o .txt")
      toast({
        title: "Error",
        description: "Tipo de archivo no válido. Solo se permiten archivos .p12, .pfx, .pem, .crt, .cer, .key o .txt",
        variant: "destructive",
      })
      return false
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 5MB permitido")
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 5MB permitido",
        variant: "destructive",
      })
      return false
    }
    if ([".pfx", ".p12"].includes(fileExtension) && !password) {
      toast({
        title: "Contraseña requerida",
        description: "Ingrese la contraseña del archivo PFX/P12",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const subirCertificado = async () => {
    if (uploading) return
    if (!validateFields()) return
    const file = selectedFile!
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    try {
      setUploading(true)
      setError(null)
      if ([".pfx", ".p12"].includes(fileExtension)) {
        if (!password) {
          toast({
            title: "Contraseña requerida",
            description: "Ingrese la contraseña del archivo PFX/P12",
            variant: "destructive",
          })
          return
        }
        try {
          await DigitalSignatureService.parsePfx(await file.arrayBuffer(), password)
        } catch (err) {
          toast({
            title: "Contraseña inválida",
            description: "La contraseña no coincide con el certificado",
            variant: "destructive",
          })
          return
        }
      }

      if (certificados.some((c) => c.nombre === file.name)) {
        const msg = "Ya existe un certificado con el mismo nombre"
        setError(msg)
        toast({ title: "Error", description: msg, variant: "destructive" })
        return
      }

      const { data: existing } = await supabase
        .from("certificados_digitales")
        .select("id")
        .eq("empresa_id", empresaId)
        .eq("nombre", file.name)
        .maybeSingle()
      if (existing) {
        const msg = "Ya existe un certificado con el mismo nombre"
        setError(msg)
        toast({ title: "Error", description: msg, variant: "destructive" })
        return
      }

      // Subir archivo a Supabase Storage
      const sanitized = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
      const fileName = `${empresaId}/${Date.now()}-${sanitized}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(CERTS_BUCKET)
        .upload(fileName, file)

      if (uploadError) {
        throw new Error(uploadError.message || "Fallo la subida de archivo")
      }

      // Obtener URL pública del archivo
      const {
        data: { publicUrl },
        error: urlError,
      } = supabase.storage.from(CERTS_BUCKET).getPublicUrl(fileName)

      if (urlError || !publicUrl) throw urlError || new Error("No se pudo obtener URL pública")

      // Guardar información del certificado en la base de datos
      const { data: inserted, error: dbError } = await supabase
        .from("certificados_digitales")
        .insert({
          empresa_id: empresaId,
          nombre: file.name,
          archivo_url: publicUrl,
          fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          activo: true,
        })
        .select()
        .single()

      if (dbError || !inserted) throw dbError

      await supabase
        .from("configuraciones")
        .upsert(
          {
            empresa_id: empresaId,
            tipo: "certificados",
            configuracion: {
              certificado_activo: inserted.id,
              password_certificado: password,
              fecha_vencimiento: inserted.fecha_vencimiento,
              configurado: true,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "empresa_id,tipo" },
        )

      setSuccess("Certificado digital subido exitosamente")
      toast({ title: "Éxito", description: "Certificado digital subido exitosamente" })
      reportSuccess("certificados")
      await cargarCertificados()

      // Limpiar estados
      setSelectedFile(null)
      setPassword("")

      logger.info("Certificado digital subido", { empresaId, fileName })
    } catch (error) {
      logger.error("Error subiendo certificado", { error, empresaId })
      setError("Error al subir certificado digital")
      toast({ title: "Error", description: "Error al subir certificado digital", variant: "destructive" })
      reportError("certificados")
    } finally {
      setUploading(false)
    }
  }

  const eliminarCertificado = async (certificado: CertificadoDigital) => {
    if (!confirm("¿Está seguro de eliminar este certificado digital?")) return

    if (!empresaId) {
      setError("Empresa no identificada")
      toast({ title: "Error", description: "Empresa no identificada", variant: "destructive" })
      reportError("certificados")
      return
    }

    try {
      // Eliminar archivo de storage
      const fileName = certificado.archivo_url.split("/").pop()
      if (fileName) {
        const { error: removeErr } = await supabase.storage
          .from(CERTS_BUCKET)
          .remove([`${empresaId}/${fileName}`])
        if (removeErr) throw removeErr
      }

      // Eliminar registro de base de datos
      const { error } = await supabase.from("certificados_digitales").delete().eq("id", certificado.id)

      if (error) throw error

      setSuccess("Certificado eliminado exitosamente")
      toast({ title: "Éxito", description: "Certificado eliminado exitosamente" })
      reportSuccess("certificados")
      setCertificados((prev) => prev.filter((c) => c.id !== certificado.id))
      await cargarCertificados()

      logger.info("Certificado eliminado", { empresaId, certificadoId: certificado.id })
    } catch (error) {
      logger.error("Error eliminando certificado", { error, empresaId })
      setError("Error al eliminar certificado")
      toast({ title: "Error", description: "Error al eliminar certificado", variant: "destructive" })
      reportError("certificados")
    }
  }

  const descargarCertificado = async (certificado: CertificadoDigital) => {
    if (!empresaId) {
      setError("Empresa no identificada")
      toast({ title: "Error", description: "Empresa no identificada", variant: "destructive" })
      reportError("certificados")
      return
    }
    try {
      const response = await fetch(certificado.archivo_url)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)

      try {
        const a = document.createElement("a")
        a.href = url
        a.download = certificado.nombre
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        window.URL.revokeObjectURL(url)
      }

      logger.info("Certificado descargado", { empresaId, certificadoId: certificado.id })
    } catch (error) {
      logger.error("Error descargando certificado", { error, empresaId })
      setError("Error al descargar certificado")
      toast({ title: "Error", description: "Error al descargar certificado", variant: "destructive" })
      reportError("certificados")
    }
  }

  const estaVencido = (fecha: string) => {
    return new Date(fecha) < new Date()
  }

  const diasParaVencer = (fecha: string) => {
    const fechaVencimiento = new Date(fecha)
    const hoy = new Date()
    const diferencia = fechaVencimiento.getTime() - hoy.getTime()
    return Math.ceil(diferencia / (1000 * 3600 * 24))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificados Digitales</CardTitle>
          <CardDescription>Gestione los certificados digitales para la firma de comprobantes fiscales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificados Digitales</CardTitle>
        <CardDescription>Gestione los certificados digitales para la firma de comprobantes fiscales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Subir nuevo certificado */}
        <div className="space-y-4">
          <Label htmlFor="certificado-upload">Subir Nuevo Certificado</Label>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
            <Input
              id="certificado-upload"
              type="file"
              accept=".p12,.pfx,.pem,.crt,.cer,.key,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={uploading}
              className="flex-1"
            />
            {selectedFile && [".pfx", ".p12"].includes(selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf("."))) && (
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1"
              />
            )}
            <Button onClick={subirCertificado} disabled={uploading || !selectedFile}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Subiendo..." : "Subir"}
            </Button>
          </div>
          <p className="text-sm text-gray-500">Formatos soportados: .p12, .pfx, .pem, .crt (máximo 5MB)</p>
        </div>

        {/* Lista de certificados */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Certificados Existentes</h3>

          {certificados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay certificados digitales configurados</div>
          ) : (
            <div className="space-y-3">
              {certificados.map((certificado) => (
                <div key={certificado.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{certificado.nombre}</h4>
                      {certificado.activo ? (
                        estaVencido(certificado.fecha_vencimiento) ? (
                          <Badge variant="destructive">Vencido</Badge>
                        ) : diasParaVencer(certificado.fecha_vencimiento) <= 30 ? (
                          <Badge variant="secondary">Por vencer</Badge>
                        ) : (
                          <Badge variant="default">Activo</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Vence: {new Date(certificado.fecha_vencimiento).toLocaleDateString()}
                      {diasParaVencer(certificado.fecha_vencimiento) > 0 && (
                        <span className="ml-2">({diasParaVencer(certificado.fecha_vencimiento)} días restantes)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      Subido: {new Date(certificado.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => descargarCertificado(certificado)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => eliminarCertificado(certificado)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Los certificados digitales son necesarios para firmar los comprobantes fiscales</li>
            <li>• Asegúrese de que el certificado esté vigente y sea válido para uso fiscal</li>
            <li>• Mantenga una copia de seguridad de sus certificados en un lugar seguro</li>
            <li>• Renueve sus certificados antes de que venzan para evitar interrupciones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
