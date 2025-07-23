import { z } from "zod"

// Esquemas de validación usando Zod
export const empresaSchema = z.object({
  rnc: z.string().min(9, "RNC debe tener al menos 9 caracteres").max(11, "RNC no puede tener más de 11 caracteres"),
  razon_social: z.string().min(1, "Razón social es obligatoria").max(255, "Razón social muy larga"),
  nombre_comercial: z.string().max(255, "Nombre comercial muy largo").optional(),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().max(20, "Teléfono muy largo").optional(),
  direccion: z.string().max(500, "Dirección muy larga").optional(),
  provincia: z.string().max(100, "Provincia muy larga").optional(),
  municipio: z.string().max(100, "Municipio muy largo").optional(),
  activa: z.boolean().default(true),
})

export const usuarioSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(1, "Nombre es obligatorio").max(255, "Nombre muy largo"),
  rnc_cedula: z.string().min(9, "RNC/Cédula debe tener al menos 9 caracteres").max(11, "RNC/Cédula muy largo"),
  rol: z.enum(["administrador", "firmante", "aprobador_comercial", "solicitante"], {
    errorMap: () => ({ message: "Rol inválido" }),
  }),
  activo: z.boolean().default(true),
})

export const clienteSchema = z.object({
  rnc_cedula: z.string().min(9, "RNC/Cédula debe tener al menos 9 caracteres").max(11, "RNC/Cédula muy largo"),
  nombre: z.string().min(1, "Nombre es obligatorio").max(255, "Nombre muy largo"),
  email: z.string().email("Email inválido").optional(),
  telefono: z.string().max(20, "Teléfono muy largo").optional(),
  direccion: z.string().max(500, "Dirección muy larga").optional(),
  tipo: z.enum(["persona_fisica", "persona_juridica"], {
    errorMap: () => ({ message: "Tipo de cliente inválido" }),
  }),
  activo: z.boolean().default(true),
})

export const itemSchema = z.object({
  codigo: z.string().min(1, "Código es obligatorio").max(50, "Código muy largo"),
  descripcion: z.string().min(1, "Descripción es obligatoria").max(500, "Descripción muy larga"),
  precio: z.number().min(0, "Precio debe ser mayor o igual a 0"),
  unidad_medida: z.string().min(1, "Unidad de medida es obligatoria").max(10, "Unidad de medida muy larga"),
  tipo_impuesto: z.string().min(1, "Tipo de impuesto es obligatorio").max(10, "Tipo de impuesto muy largo"),
  tasa_impuesto: z.number().min(0, "Tasa de impuesto debe ser mayor o igual a 0").max(100, "Tasa de impuesto muy alta"),
  activo: z.boolean().default(true),
})

export const configuracionSchema = z.object({
  clave: z.string().min(1, "Clave es obligatoria").max(100, "Clave muy larga"),
  valor: z.string().min(1, "Valor es obligatorio").max(1000, "Valor muy largo"),
  tipo: z.enum(["string", "number", "boolean", "json"], {
    errorMap: () => ({ message: "Tipo de configuración inválido" }),
  }),
  descripcion: z.string().max(500, "Descripción muy larga").optional(),
})

export const borradorSchema = z.object({
  nombre: z.string().min(1, "Nombre es obligatorio").max(255, "Nombre muy largo"),
  tipo_comprobante: z.string().min(1, "Tipo de comprobante es obligatorio").max(10, "Tipo de comprobante muy largo"),
  datos: z.record(z.any(), "Datos del borrador son obligatorios"),
})

export const certificadoDigitalSchema = z.object({
  nombre: z.string().min(1, "Nombre es obligatorio").max(255, "Nombre muy largo"),
  archivo_url: z.string().url("URL del archivo inválida"),
  fecha_vencimiento: z.string().datetime("Fecha de vencimiento inválida"),
  activo: z.boolean().default(true),
})

export const secuenciaNcfSchema = z
  .object({
    tipo_comprobante: z.string().min(1, "Tipo de comprobante es obligatorio").max(10, "Tipo de comprobante muy largo"),
    secuencia_inicial: z.number().min(1, "Secuencia inicial debe ser mayor a 0"),
    secuencia_final: z.number().min(1, "Secuencia final debe ser mayor a 0"),
    fecha_vencimiento: z.string().datetime("Fecha de vencimiento inválida"),
    activa: z.boolean().default(true),
  })
  .refine((data) => data.secuencia_final > data.secuencia_inicial, {
    message: "La secuencia final debe ser mayor que la inicial",
    path: ["secuencia_final"],
  })

export const comprobanteFiscalSchema = z.object({
  tipo_comprobante: z.string().min(1, "Tipo de comprobante es obligatorio").max(10, "Tipo de comprobante muy largo"),
  encf: z.string().min(1, "eNCF es obligatorio").max(19, "eNCF muy largo"),
  fecha_emision: z.string().datetime("Fecha de emisión inválida"),
  monto_total: z.number().min(0, "Monto total debe ser mayor o igual a 0"),
  receptor_rnc: z.string().max(11, "RNC del receptor muy largo").optional(),
  datos_xml: z.record(z.any(), "Datos XML son obligatorios"),
  track_id: z.string().min(1, "Track ID es obligatorio").max(50, "Track ID muy largo"),
  codigo_seguridad: z.string().min(1, "Código de seguridad es obligatorio").max(50, "Código de seguridad muy largo"),
  estado: z
    .enum(["borrador", "pendiente", "enviado", "aprobado", "rechazado", "anulado"], {
      errorMap: () => ({ message: "Estado inválido" }),
    })
    .default("pendiente"),
})

// Esquemas para autenticación
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
})

export const registerSchema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(8, "Contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Contraseña debe contener al menos una mayúscula, una minúscula y un número",
      ),
    confirmPassword: z.string(),
    nombre: z.string().min(1, "Nombre es obligatorio").max(255, "Nombre muy largo"),
    rnc_cedula: z.string().min(9, "RNC/Cédula debe tener al menos 9 caracteres").max(11, "RNC/Cédula muy largo"),
    empresa: empresaSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

// Esquemas para consultas DGII
export const consultaRncSchema = z.object({
  rnc: z.string().min(9, "RNC debe tener al menos 9 caracteres").max(11, "RNC muy largo"),
})

export const consultaNcfSchema = z.object({
  rnc: z.string().min(9, "RNC debe tener al menos 9 caracteres").max(11, "RNC muy largo"),
  ncf: z.string().min(11, "NCF debe tener al menos 11 caracteres").max(19, "NCF muy largo"),
})

// Esquemas para generación de PDF
export const pdfGenerationSchema = z.object({
  ecfData: z.record(z.any(), "Datos del e-CF son obligatorios"),
  empresaData: z.record(z.any(), "Datos de la empresa son obligatorios"),
  filename: z.string().max(255, "Nombre de archivo muy largo").optional(),
  incluirQR: z.boolean().default(true),
})

// Utilidades de validación
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}

      error.errors.forEach((err) => {
        const path = err.path.join(".")
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })

      return { success: false, errors }
    }

    return { success: false, errors: { general: ["Error de validación desconocido"] } }
  }
}

export function validatePartialSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean
  data?: Partial<T>
  errors?: Record<string, string[]>
} {
  return validateSchema(schema.partial(), data)
}

// Middleware para validación en API Routes
export function withValidation<T>(schema: z.ZodSchema<T>, handler: (validatedData: T) => Promise<Response>) {
  return async (data: unknown): Promise<Response> => {
    const validation = validateSchema(schema, data)

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Datos de entrada inválidos",
          details: validation.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return handler(validation.data!)
  }
}

// Tipos derivados de los esquemas
export type EmpresaInput = z.infer<typeof empresaSchema>
export type UsuarioInput = z.infer<typeof usuarioSchema>
export type ClienteInput = z.infer<typeof clienteSchema>
export type ItemInput = z.infer<typeof itemSchema>
export type ConfiguracionInput = z.infer<typeof configuracionSchema>
export type BorradorInput = z.infer<typeof borradorSchema>
export type CertificadoDigitalInput = z.infer<typeof certificadoDigitalSchema>
export type SecuenciaNcfInput = z.infer<typeof secuenciaNcfSchema>
export type ComprobanteFiscalInput = z.infer<typeof comprobanteFiscalSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ConsultaRncInput = z.infer<typeof consultaRncSchema>
export type ConsultaNcfInput = z.infer<typeof consultaNcfSchema>
export type PdfGenerationInput = z.infer<typeof pdfGenerationSchema>
