"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GuardarBorradorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datosComprobante: any
  tipoComprobante: string
  montoTotal: number
  cantidadItems: number
  onGuardado?: () => void
}

export function GuardarBorradorDialog({
  open,
  onOpenChange,
  datosComprobante,
  tipoComprobante,
  montoTotal,
  cantidadItems,
  onGuardado,
}: GuardarBorradorDialogProps) {
  const [nombreBorrador, setNombreBorrador] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [guardando, setGuardando] = useState(false)
  const { toast } = useToast()

  const getTipoComprobanteNombre = (tipo: string): string => {
    const tipos: Record<string, string> = {
      "31": "Factura de Crédito Fiscal",
      "32": "Factura de Consumo",
      "33": "Nota de Débito",
      "34": "Nota de Crédito",
      "41": "Compras",
      "43": "Gastos Menores",
      "44": "Regímenes Especiales",
      "45": "Gubernamental",
      "46": "Exportaciones",
      "47": "Pagos al Exterior",
    }
    return tipos[tipo] || `Tipo ${tipo}`
  }

  const handleGuardar = async () => {
    if (!nombreBorrador.trim()) {
      toast({
        title: "Error",
        description: "El nombre del borrador es requerido",
        variant: "destructive",
      })
      return
    }

    setGuardando(true)

    try {
      const response = await fetch("/api/borradores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_borrador: nombreBorrador.trim(),
          descripcion: descripcion.trim() || null,
          datos_comprobante: datosComprobante,
          tipo_comprobante: tipoComprobante,
          monto_total: montoTotal,
          cantidad_items: cantidadItems,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: "Borrador guardado exitosamente",
        })

        // Limpiar formulario
        setNombreBorrador("")
        setDescripcion("")

        // Cerrar diálogo
        onOpenChange(false)

        // Callback opcional
        if (onGuardado) {
          onGuardado()
        }
      } else {
        throw new Error(data.error || "Error guardando borrador")
      }
    } catch (error) {
      console.error("Error guardando borrador:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar el borrador",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleCancel = () => {
    setNombreBorrador("")
    setDescripcion("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Guardar como Borrador
          </DialogTitle>
          <DialogDescription>
            Guarde esta vista previa como borrador para poder editarla y emitirla posteriormente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del comprobante */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Tipo:</span>
              <span className="text-sm">{getTipoComprobanteNombre(tipoComprobante)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Monto Total:</span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat("es-DO", {
                  style: "currency",
                  currency: "DOP",
                }).format(montoTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Cantidad de Items:</span>
              <span className="text-sm">{cantidadItems}</span>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-borrador">Nombre del Borrador *</Label>
              <Input
                id="nombre-borrador"
                placeholder="Ej: Factura Cliente ABC - Enero 2024"
                value={nombreBorrador}
                onChange={(e) => setNombreBorrador(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripción adicional del borrador..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 text-right">{descripcion.length}/500 caracteres</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={guardando || !nombreBorrador.trim()}>
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Borrador
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
