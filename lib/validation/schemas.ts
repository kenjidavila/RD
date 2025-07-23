import { z } from "zod"

// Empresa schemas
export const createEmpresaSchema = z.object({
  rnc: z.string().min(9, "RNC debe tener al menos 9 dígitos").max(11, "RNC no puede tener más de 11 dígitos"),
  razon_social: z.string().min(1, "Razón social es requerida").max(255, "Razón social muy larga"),
  nombre_comercial: z.string().max(255, "Nombre comercial muy largo").optional(),
  email: z.string().email("Email inválido"),
  telefono: z.string().max(20, "Teléfono muy largo").optional(),
  direccion: z.string().max(500, "Dirección muy larga").optional(),
  provincia: z.string().max(100, "Provincia muy larga").optional(),
  municipio: z.string().max(100, "Municipio muy largo").optional(),
})

export const updateEmpresaSchema = createEmpresaSchema.partial()

// Cliente schemas
export const createClienteSchema = z.object({
  empresa_id: z.string().uuid("ID de empresa inválido"),
  rnc_cedula: z.string().min(9, "RNC/Cédula debe tener al menos 9 dígitos").max(11, "RNC/Cédula muy largo"),
  razon_social: z.string().min(1, "Razón social es requerida").max(255, "Razón social muy larga"),
  nombre_comercial: z.string().max(255, "Nombre comercial muy largo").optional(),
  tipo_cliente: z.enum(["persona_fisica", "persona_juridica"], {
    errorMap: () => ({ message: "Tipo de cliente inválido" }),
  }),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().max(20, "Teléfono muy largo").optional(),
  direccion: z.string().max(500, "Dirección muy larga").optional(),
  provincia: z.string().max(100, "Provincia muy larga").optional(),
  municipio: z.string().max(100, "Municipio muy largo").optional(),
  sector: z.string().max(100, "Sector muy largo").optional(),
  codigo_postal: z.string().max(10, "Código postal muy largo").optional(),
  notas: z.string().max(1000, "Notas muy largas").optional(),
})

export const updateClienteSchema = createClienteSchema.partial().omit({ empresa_id: true })

// Item schemas
export const createItemSchema = z.object({
  empresa_id: z.string().uuid("ID de empresa inválido"),
  codigo: z.string().max(50, "Código muy largo").optional(),
  descripcion: z.string().min(1, "Descripción es requerida").max(500, "Descripción muy larga"),
  descripcion_corta: z.string().max(100, "Descripción corta muy larga").optional(),
  tipo_item: z.enum(["bien", "servicio"], {
    errorMap: () => ({ message: "Tipo de item inválido" }),
  }),
  categoria: z.string().max(100, "Categoría muy larga").optional(),
  precio_unitario: z.number().min(0, "Precio no puede ser negativo"),
  unidad_medida: z.string().min(1, "Unidad de medida es requerida").max(20, "Unidad de medida muy larga"),
  tasa_itbis: z.enum(["0", "16", "18"], {
    errorMap: () => ({ message: "Tasa ITBIS inválida" }),
  }),
  inventario_disponible: z.number().min(0, "Inventario no puede ser negativo").optional(),
  costo_unitario: z.number().min(0, "Costo no puede ser negativo").optional(),
  margen_ganancia: z
    .number()
    .min(0, "Margen no puede ser negativo")
    .max(100, "Margen no puede ser mayor a 100%")
    .optional(),
  notas: z.string().max(1000, "Notas muy largas").optional(),
})

export const updateItemSchema = createItemSchema.partial().omit({ empresa_id: true })

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Página debe ser mayor a 0").default(1),
  limit: z.coerce.number().min(1, "Límite debe ser mayor a 0").max(100, "Límite máximo es 100").default(10),
  search: z.string().max(100, "Búsqueda muy larga").optional(),
  orderBy: z.string().max(50, "Campo de ordenamiento inválido").optional(),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
})

// Validation helper
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
    throw new Error(`Validation failed: ${errors}`)
  }

  return result.data
}
