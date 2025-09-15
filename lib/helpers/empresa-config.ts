import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/types/database"

export type EmpresaConfig = Database["public"]["Tables"]["empresas"]["Row"]

export async function fetchEmpresaConfig(): Promise<EmpresaConfig | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !user.id) {
    // No intentes buscar la empresa si el usuario no ha sido creado
    return null
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("empresa_id, rnc_cedula, empresas(*)")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (usuarioError) {
    console.error("Error obteniendo datos de usuario", usuarioError)
  }

  if (usuario?.empresas) {
    return usuario.empresas as EmpresaConfig
  }

  const ownerRnc = usuario?.rnc_cedula?.trim()

  if (!ownerRnc) {
    return null
  }

  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("owner_id", ownerRnc)
    .maybeSingle()

  if (error) {
    console.error("Error fetching empresa config", error)
    return null
  }

  return data
}

export async function upsertEmpresaConfig(
  empresa: Omit<EmpresaConfig, "id" | "owner_id" | "created_at" | "updated_at">,
): Promise<EmpresaConfig | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuario no autenticado")

  const ownerId = empresa.rnc.trim()

  const { data, error } = await supabase
    .from("empresas")
    .upsert(
      {
        ...empresa,
        owner_id: ownerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: ["owner_id"] },
    )
    .select()
    .single()

  if (error) {
    console.error("Error upserting empresa", error)
    throw new Error(error.message)
  }

  return data
}
