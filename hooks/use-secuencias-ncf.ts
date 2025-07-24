export interface SecuenciaNcf {
  id?: string
  tipo_comprobante: string
  prefijo: string
  secuencia_inicial: string
  secuencia_final: string
  secuencia_actual: string
  fecha_vencimiento: string
  activa: boolean
  validacion_inicial?: {
    valido: boolean
    mensaje: string
    estado: "validando" | "valido" | "invalido" | "pendiente"
  }
  validacion_final?: {
    valido: boolean
    mensaje: string
    estado: "validando" | "valido" | "invalido" | "pendiente"
  }
}

const generarSecuenciaActual = (inicial: string): string => {
  if (!/^\d{8}$/.test(inicial)) return ""
  const numero = parseInt(inicial, 10)
  if (Number.isNaN(numero)) return ""
  return (numero + 1).toString().padStart(8, "0")
}

export async function validarNCF(
  ncf: string,
  tipo: string,
  campo: "inicial" | "final",
  index: number,
  empresaRnc: string,
  secuencias: SecuenciaNcf[],
  setSecuencias: React.Dispatch<React.SetStateAction<SecuenciaNcf[]>>,
  toast: (opts: { title: string; description: string; variant?: "destructive" }) => void,
) {
  if (!/^\d{8}$/.test(ncf)) {
    toast({ title: "NCF inválido", description: "La secuencia debe tener 8 dígitos", variant: "destructive" })
    return
  }
  if (!empresaRnc) {
    toast({ title: "RNC no disponible", description: "Configure el RNC de la empresa antes de validar", variant: "destructive" })
    return
  }

  setSecuencias((prev) =>
    prev.map((sec, i) =>
      i === index
        ? {
            ...sec,
            [`validacion_${campo}`]: {
              valido: false,
              mensaje: "Validando...",
              estado: "validando",
            },
          }
        : sec,
    ),
  )

  try {
    const response = await fetch("/api/dgii/consultar-ncf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ncf: `E${empresaRnc}${tipo}${ncf}`,
        tipo_comprobante: tipo,
      }),
    })
    const result = await response.json()
    setSecuencias((prev) =>
      prev.map((sec, i) =>
        i === index
          ? {
              ...sec,
              [`validacion_${campo}`]: {
                valido: result.success && result.disponible,
                mensaje: result.success
                  ? result.disponible
                    ? "NCF disponible para uso"
                    : "NCF ya utilizado o no disponible"
                  : result.error || "Error en validación",
                estado: result.success && result.disponible ? "valido" : "invalido",
              },
            }
          : sec,
      ),
    )
  } catch (error) {
    toast({ title: "Error", description: "No se pudo validar el NCF", variant: "destructive" })
    setSecuencias((prev) =>
      prev.map((sec, i) =>
        i === index
          ? {
              ...sec,
              [`validacion_${campo}`]: {
                valido: false,
                mensaje: "Validación no disponible",
                estado: "pendiente",
              },
            }
          : sec,
      ),
    )
  }
}

export function actualizarSecuencia(
  index: number,
  campo: keyof SecuenciaNcf,
  valor: any,
  secuencias: SecuenciaNcf[],
  setSecuencias: React.Dispatch<React.SetStateAction<SecuenciaNcf[]>>,
  toast: (opts: { title: string; description: string; variant?: "destructive" }) => void,
) {
  if (campo === "tipo_comprobante") {
    if (secuencias.some((s, i) => i !== index && s.tipo_comprobante === valor)) {
      toast({ title: "Duplicado", description: "Ya existe una secuencia para ese tipo de comprobante", variant: "destructive" })
      return
    }
  }
  if (campo === "prefijo") {
    if (!/^[A-Za-z0-9]{1,3}$/.test(valor)) {
      toast({ title: "Prefijo inválido", description: "El prefijo debe ser alfanumérico de máximo 3 caracteres", variant: "destructive" })
      return
    }
  }
  if ((campo === "secuencia_inicial" || campo === "secuencia_final" || campo === "secuencia_actual") && !/^\d*$/.test(valor)) {
    return
  }

  setSecuencias((prev) =>
    prev.map((sec, i) => {
      if (i === index) {
        const updated: SecuenciaNcf = { ...sec, [campo]: valor }
        if (campo === "secuencia_inicial") {
          updated.secuencia_actual = generarSecuenciaActual(valor)
          updated.validacion_inicial = { valido: false, mensaje: "Pendiente de validación", estado: "pendiente" }
        }
        if (campo === "secuencia_final") {
          updated.validacion_final = { valido: false, mensaje: "Pendiente de validación", estado: "pendiente" }
        }
        return updated
      }
      return sec
    }),
  )
}

export async function guardarSecuencias(
  secuencias: SecuenciaNcf[],
  empresaRnc: string,
  toast: (opts: { title: string; description: string; variant?: "destructive" }) => void,
  reportError: (s: string) => void,
  reportSuccess: (s: string) => void,
  cargarSecuencias: () => Promise<void>,
  setSaving: React.Dispatch<React.SetStateAction<boolean>>,
) {
  setSaving(true)
  try {
    if (!empresaRnc) {
      toast({ title: "Empresa no configurada", description: "Debe configurar el RNC de la empresa primero", variant: "destructive" })
      reportError("secuencias")
      setSaving(false)
      return
    }
    const tipos = new Set<string>()
    for (let i = 0; i < secuencias.length; i++) {
      const a = secuencias[i]
      if (
        !a.tipo_comprobante.trim() ||
        !/^[A-Za-z0-9]{1,3}$/.test(a.prefijo) ||
        !/^\d{8}$/.test(a.secuencia_inicial) ||
        !/^\d{8}$/.test(a.secuencia_final) ||
        !/^\d{8}$/.test(a.secuencia_actual) ||
        !a.fecha_vencimiento.trim()
      ) {
        toast({ title: "Campos requeridos", description: "Complete todos los campos de cada secuencia", variant: "destructive" })
        reportError("secuencias")
        setSaving(false)
        return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(a.fecha_vencimiento)) {
        toast({ title: "Fecha inválida", description: "La fecha de vencimiento debe tener formato AAAA-MM-DD", variant: "destructive" })
        reportError("secuencias")
        setSaving(false)
        return
      }
      if (tipos.has(a.tipo_comprobante)) {
        toast({ title: "Error", description: "Ya existe una secuencia para ese tipo de comprobante", variant: "destructive" })
        reportError("secuencias")
        setSaving(false)
        return
      }
      tipos.add(a.tipo_comprobante)
      if (a.validacion_inicial?.estado !== "valido" || a.validacion_final?.estado !== "valido") {
        toast({ title: "Validación pendiente", description: "Todas las secuencias deben validarse correctamente", variant: "destructive" })
        reportError("secuencias")
        setSaving(false)
        return
      }
      const startA = parseInt(a.secuencia_inicial, 10)
      const endA = parseInt(a.secuencia_final, 10)
      if (endA < startA) {
        toast({ title: "Error", description: "La secuencia inicial debe ser menor que la final", variant: "destructive" })
        reportError("secuencias")
        setSaving(false)
        return
      }
      for (let j = i + 1; j < secuencias.length; j++) {
        const b = secuencias[j]
        if (a.tipo_comprobante !== b.tipo_comprobante) continue
        const startB = parseInt(b.secuencia_inicial, 10)
        const endB = parseInt(b.secuencia_final, 10)
        if (startA <= endB && startB <= endA) {
          toast({ title: "Error", description: "Hay secuencias duplicadas o solapadas", variant: "destructive" })
          reportError("secuencias")
          setSaving(false)
          return
        }
      }
    }
    const response = await fetch("/api/configuracion/secuencias-ncf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secuencias }),
    })
    if (response.ok) {
      toast({ title: "Éxito", description: "Secuencias NCF guardadas correctamente" })
      reportSuccess("secuencias")
      await cargarSecuencias()
    } else {
      throw new Error("Error al guardar")
    }
  } catch (error) {
    toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudieron guardar las secuencias NCF", variant: "destructive" })
    reportError("secuencias")
  } finally {
    setSaving(false)
  }
}
