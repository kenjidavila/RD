"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { ItemSelector } from "./item-selector"
import type { InvoiceFormProps, ECFDetalle } from "@/types/invoice"

// ... (interfaces anteriores se mantienen igual)

export default function InvoiceForm({ initialData, onSave, onEmit }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    detalles: [] as ECFDetalle[],
  })

  // Función para agregar item desde el selector
  const handleItemSelected = (item: any) => {
    const newDetalle: ECFDetalle = {
      numeroLinea: formData.detalles.length + 1,
      descripcion: item.descripcion,
      cantidad: 1,
      precioUnitario: item.precio_venta,
      montoItem: item.precio_venta,
      tasaITBIS: item.tasa_itbis,
    }

    setFormData((prev) => ({
      ...prev,
      detalles: [...prev.detalles, newDetalle],
    }))
  }

  const addDetalle = () => {
    // Implementación de la función addDetalle
  }

  // ... (resto de funciones se mantienen igual)

  return (
    <div className="space-y-6">
      {/* ... (secciones anteriores se mantienen igual) */}

      {/* Detalles de la factura */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detalles de la Factura</CardTitle>
              <CardDescription>Productos o servicios facturados</CardDescription>
            </div>
            <div className="flex gap-2">
              <ItemSelector onItemSelected={handleItemSelected} />
              <Button onClick={addDetalle} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Manual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>{/* ... (resto del contenido se mantiene igual) */}</CardContent>
      </Card>

      {/* ... (resto de secciones se mantienen igual) */}
    </div>
  )
}
