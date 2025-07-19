export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      borradores: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string
          tipo_comprobante: string
          datos: Json
          nombre: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id: string
          tipo_comprobante: string
          datos: Json
          nombre: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          usuario_id?: string
          tipo_comprobante?: string
          datos?: Json
          nombre?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borradores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados_digitales: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          archivo_url: string
          fecha_vencimiento: string
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          archivo_url: string
          fecha_vencimiento: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          archivo_url?: string
          fecha_vencimiento?: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_digitales_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          id: string
          empresa_id: string
          rnc_cedula: string
          nombre: string
          email: string | null
          telefono: string | null
          direccion: string | null
          tipo: "persona_fisica" | "persona_juridica"
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          rnc_cedula: string
          nombre: string
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          tipo: "persona_fisica" | "persona_juridica"
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          rnc_cedula?: string
          nombre?: string
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          tipo?: "persona_fisica" | "persona_juridica"
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      comprobantes_fiscales: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string
          tipo_comprobante: string
          ncf: string
          fecha_emision: string
          fecha_vencimiento: string | null
          cliente_id: string
          moneda: string
          tasa_cambio: number
          subtotal: number
          descuentos: number
          impuestos: number
          total: number
          estado: "borrador" | "enviado" | "aprobado" | "rechazado" | "anulado"
          xml_firmado: string | null
          pdf_url: string | null
          track_id: string | null
          fecha_envio_dgii: string | null
          respuesta_dgii: Json | null
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id: string
          tipo_comprobante: string
          ncf: string
          fecha_emision: string
          fecha_vencimiento?: string | null
          cliente_id: string
          moneda?: string
          tasa_cambio?: number
          subtotal: number
          descuentos?: number
          impuestos: number
          total: number
          estado?: "borrador" | "enviado" | "aprobado" | "rechazado" | "anulado"
          xml_firmado?: string | null
          pdf_url?: string | null
          track_id?: string | null
          fecha_envio_dgii?: string | null
          respuesta_dgii?: Json | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          usuario_id?: string
          tipo_comprobante?: string
          ncf?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          cliente_id?: string
          moneda?: string
          tasa_cambio?: number
          subtotal?: number
          descuentos?: number
          impuestos?: number
          total?: number
          estado?: "borrador" | "enviado" | "aprobado" | "rechazado" | "anulado"
          xml_firmado?: string | null
          pdf_url?: string | null
          track_id?: string | null
          fecha_envio_dgii?: string | null
          respuesta_dgii?: Json | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_fiscales_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_fiscales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_fiscales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      configuraciones: {
        Row: {
          id: string
          empresa_id: string
          clave: string
          valor: string
          tipo: "string" | "number" | "boolean" | "json"
          descripcion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          clave: string
          valor: string
          tipo?: "string" | "number" | "boolean" | "json"
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          clave?: string
          valor?: string
          tipo?: "string" | "number" | "boolean" | "json"
          descripcion?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuraciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      dgii_catalogo_monedas: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string
          id: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogo_provincias_municipios: {
        Row: {
          codigo_municipio: string
          codigo_provincia: string
          created_at: string
          id: string
          nombre_municipio: string
          nombre_provincia: string
          updated_at: string
        }
        Insert: {
          codigo_municipio: string
          codigo_provincia: string
          created_at?: string
          id?: string
          nombre_municipio: string
          nombre_provincia: string
          updated_at?: string
        }
        Update: {
          codigo_municipio?: string
          codigo_provincia?: string
          created_at?: string
          id?: string
          nombre_municipio?: string
          nombre_provincia?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogo_tipos_impuestos: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string
          id: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogo_unidades_medida: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string
          id: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogs_impuestos_adicionales: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string
          id: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogs_monedas: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string
          id: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogs_provincias_municipios: {
        Row: {
          codigo_municipio: string
          codigo_provincia: string
          created_at: string
          id: string
          municipio: string
          provincia: string
          updated_at: string
        }
        Insert: {
          codigo_municipio: string
          codigo_provincia: string
          created_at?: string
          id?: string
          municipio: string
          provincia: string
          updated_at?: string
        }
        Update: {
          codigo_municipio?: string
          codigo_provincia?: string
          created_at?: string
          id?: string
          municipio?: string
          provincia?: string
          updated_at?: string
        }
        Relationships: []
      }
      dgii_catalogs_unidades_medida: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string
          id: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          id: string
          rnc: string
          razon_social: string
          nombre_comercial: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          provincia: string | null
          municipio: string | null
          sector: string | null
          tipo_contribuyente: string | null
          regimen_tributario: string | null
          actividad_economica: string | null
          website: string | null
          observaciones: string | null
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rnc: string
          razon_social: string
          nombre_comercial?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          provincia?: string | null
          municipio?: string | null
          sector?: string | null
          tipo_contribuyente?: string | null
          regimen_tributario?: string | null
          actividad_economica?: string | null
          website?: string | null
          observaciones?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rnc?: string
          razon_social?: string
          nombre_comercial?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          provincia?: string | null
          municipio?: string | null
          sector?: string | null
          tipo_contribuyente?: string | null
          regimen_tributario?: string | null
          actividad_economica?: string | null
          website?: string | null
          observaciones?: string | null
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          descripcion: string
          precio: number
          unidad_medida: string
          tipo_impuesto: string
          tasa_impuesto: number
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          codigo: string
          descripcion: string
          precio: number
          unidad_medida: string
          tipo_impuesto: string
          tasa_impuesto: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          codigo?: string
          descripcion?: string
          precio?: number
          unidad_medida?: string
          tipo_impuesto?: string
          tasa_impuesto?: number
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ncf_sequences: {
        Row: {
          activa: boolean
          created_at: string
          empresa_id: string
          fecha_vencimiento: string
          id: string
          numero_actual: number
          numero_final: number
          numero_inicial: number
          prefijo: string
          tipo_comprobante: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          empresa_id: string
          fecha_vencimiento: string
          id?: string
          numero_actual?: number
          numero_final: number
          numero_inicial: number
          prefijo: string
          tipo_comprobante: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          empresa_id?: string
          fecha_vencimiento?: string
          id?: string
          numero_actual?: number
          numero_final?: number
          numero_inicial?: number
          prefijo?: string
          tipo_comprobante?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ncf_sequences_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_storage: {
        Row: {
          id: string
          empresa_id: string
          comprobante_id: string | null
          track_id: string | null
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          metadata: Json | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          comprobante_id?: string | null
          track_id?: string | null
          filename: string
          file_path: string
          file_size: number
          mime_type: string
          metadata?: Json | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          comprobante_id?: string | null
          track_id?: string | null
          filename?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          metadata?: Json | null
          created_at?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_storage_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_storage_comprobante_id_fkey"
            columns: ["comprobante_id"]
            isOneToOne: false
            referencedRelation: "comprobantes_fiscales"
            referencedColumns: ["id"]
          },
        ]
      }
      receptor_electronico: {
        Row: {
          id: string
          empresa_id: string
          rnc_receptor: string
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          rnc_receptor: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          rnc_receptor?: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receptor_electronico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          last_activity: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          last_activity?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          last_activity?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      secuencias_ncf: {
        Row: {
          id: string
          empresa_id: string
          tipo_comprobante: string
          serie: string
          secuencia_desde: number
          secuencia_hasta: number
          secuencia_actual: number
          fecha_vencimiento: string
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          tipo_comprobante: string
          serie: string
          secuencia_desde: number
          secuencia_hasta: number
          secuencia_actual?: number
          fecha_vencimiento: string
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          tipo_comprobante?: string
          serie?: string
          secuencia_desde?: number
          secuencia_hasta?: number
          secuencia_actual?: number
          fecha_vencimiento?: string
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secuencias_ncf_empresa_id_fkey"
            columns: ["empresa_id"]
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          id: string
          empresa_id: string
          rnc_cedula: string
          nombre: string
          email: string
          rol: "administrador" | "firmante" | "aprobador_comercial" | "solicitante"
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          empresa_id: string
          rnc_cedula: string
          nombre: string
          email: string
          rol?: "administrador" | "firmante" | "aprobador_comercial" | "solicitante"
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          rnc_cedula?: string
          nombre?: string
          email?: string
          rol?: "administrador" | "firmante" | "aprobador_comercial" | "solicitante"
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_comprobantes: {
        Row: {
          id: string
          comprobante_id: string
          item_id: string | null
          codigo_item: string
          descripcion: string
          cantidad: number
          unidad_medida: string
          precio_unitario: number
          descuento: number
          tipo_impuesto: string
          tasa_impuesto: number
          monto_impuesto: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          comprobante_id: string
          item_id?: string | null
          codigo_item: string
          descripcion: string
          cantidad: number
          unidad_medida: string
          precio_unitario: number
          descuento?: number
          tipo_impuesto: string
          tasa_impuesto: number
          monto_impuesto: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          comprobante_id?: string
          item_id?: string | null
          codigo_item?: string
          descripcion?: string
          cantidad?: number
          unidad_medida?: string
          precio_unitario?: number
          descuento?: number
          tipo_impuesto?: string
          tasa_impuesto?: number
          monto_impuesto?: number
          subtotal?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_comprobantes_comprobante_id_fkey"
            columns: ["comprobante_id"]
            isOneToOne: false
            referencedRelation: "comprobantes_fiscales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_comprobantes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generar_codigo_item: {
        Args: {
          empresa_id: string
        }
        Returns: string
      }
    }
    Enums: {
      tipo_persona: "persona_fisica" | "persona_juridica"
      tipo_configuracion: "string" | "number" | "boolean" | "json"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Tipos derivados para facilitar el uso
export type Empresa = Database["public"]["Tables"]["empresas"]["Row"]
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"]
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"]
export type Item = Database["public"]["Tables"]["items"]["Row"]
export type ComprobanteFiscal = Database["public"]["Tables"]["comprobantes_fiscales"]["Row"]
export type CertificadoDigital = Database["public"]["Tables"]["certificados_digitales"]["Row"]
export type Configuracion = Database["public"]["Tables"]["configuraciones"]["Row"]
export type Borrador = Database["public"]["Tables"]["borradores"]["Row"]
export type SecuenciaNcf = Database["public"]["Tables"]["secuencias_ncf"]["Row"]
export type ReceptorElectronicoDocumento = Database["public"]["Tables"]["receptor_electronico_documentos"]["Row"]
export type PdfStorage = Database["public"]["Tables"]["pdf_storage"]["Row"]
export type ReceptorElectronico = Database["public"]["Tables"]["receptor_electronico"]["Row"]
export type UserSession = Database["public"]["Tables"]["user_sessions"]["Row"]

// Tipos para catálogos DGII
export type DgiiCatalogoMoneda = Database["public"]["Tables"]["dgii_catalogo_monedas"]["Row"]
export type DgiiCatalogoProvinciasMunicipios =
  Database["public"]["Tables"]["dgii_catalogo_provincias_municipios"]["Row"]
export type DgiiCatalogoTiposImpuestos = Database["public"]["Tables"]["dgii_catalogo_tipos_impuestos"]["Row"]
export type DgiiCatalogoUnidadesMedida = Database["public"]["Tables"]["dgii_catalogo_unidades_medida"]["Row"]
export type DGIIProvinciasMunicipios = Database["public"]["Tables"]["dgii_catalogs_provincias_municipios"]["Row"]
export type DGIIUnidadesMedida = Database["public"]["Tables"]["dgii_catalogs_unidades_medida"]["Row"]
export type DGIIMonedas = Database["public"]["Tables"]["dgii_catalogs_monedas"]["Row"]
export type DGIIImpuestosAdicionales = Database["public"]["Tables"]["dgii_catalogs_impuestos_adicionales"]["Row"]

// Enums y constantes
export const ROLES_USUARIO = {
  ADMINISTRADOR: "administrador",
  FIRMANTE: "firmante",
  APROBADOR_COMERCIAL: "aprobador_comercial",
  SOLICITANTE: "solicitante",
} as const

export const TIPOS_COMPROBANTE = {
  FACTURA_CREDITO_FISCAL: "31",
  FACTURA_CONSUMO: "32",
  NOTA_DEBITO: "33",
  NOTA_CREDITO: "34",
  COMPRA: "41",
  GASTOS_MENORES: "43",
  REGIMENES_ESPECIALES: "44",
  GUBERNAMENTAL: "45",
  EXPORTACIONES: "46",
} as const

export const ESTADOS_COMPROBANTE = {
  BORRADOR: "borrador",
  PENDIENTE: "pendiente",
  ENVIADO: "enviado",
  APROBADO: "aprobado",
  RECHAZADO: "rechazado",
  ANULADO: "anulado",
} as const

export const TIPOS_CONFIGURACION = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
} as const

export const TIPOS_CLIENTE = {
  PERSONA_FISICA: "persona_fisica",
  PERSONA_JURIDICA: "persona_juridica",
} as const

export const TIPOS_PDF = {
  PREVIEW: "preview",
  FINAL: "final",
  BACKUP: "backup",
} as const
