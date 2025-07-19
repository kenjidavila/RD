import { BaseRepository } from "./base-repository"
import type { Cliente, CreateCliente, UpdateCliente } from "@/types/database"

export class ClienteRepository extends BaseRepository<"clientes"> {
  constructor(userId?: string) {
    super("clientes", userId)
  }

  protected getSearchColumns(): string[] {
    return ["rnc_cedula", "razon_social", "nombre_comercial", "email"]
  }

  async findByRncCedula(rncCedula: string, empresaId: string): Promise<Cliente | null> {
    const { data, error } = await this.client
      .from("clientes")
      .select("*")
      .eq("rnc_cedula", rncCedula)
      .eq("empresa_id", empresaId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error finding cliente by RNC/Cédula: ${error.message}`)
    }

    return data
  }

  async create(data: CreateCliente): Promise<Cliente> {
    // Validate RNC/Cédula uniqueness within empresa
    const existing = await this.findByRncCedula(data.rnc_cedula, data.empresa_id)
    if (existing) {
      throw new Error("Ya existe un cliente con este RNC/Cédula en esta empresa")
    }

    return super.create({
      ...data,
      activo: data.activo ?? true,
    })
  }

  async update(id: string, data: UpdateCliente): Promise<Cliente> {
    // Validate RNC/Cédula uniqueness if changing
    if (data.rnc_cedula && data.empresa_id) {
      const existing = await this.findByRncCedula(data.rnc_cedula, data.empresa_id)
      if (existing && existing.id !== id) {
        throw new Error("Ya existe un cliente con este RNC/Cédula en esta empresa")
      }
    }

    return super.update(id, data)
  }

  async findById(id: string): Promise<Cliente | null> {
    return super.findById(id)
  }

  async findMany(options: Parameters<BaseRepository<"clientes">["findMany"]>[0] = {}) {
    return super.findMany(options)
  }

  async findByEmpresa(empresaId: string, options: Parameters<BaseRepository<"clientes">["findMany"]>[0] = {}) {
    return super.findMany({
      ...options,
      filters: {
        ...options.filters,
        empresa_id: empresaId,
      },
    })
  }

  async delete(id: string): Promise<void> {
    return super.delete(id)
  }

  async deactivate(id: string): Promise<Cliente> {
    return super.update(id, { activo: false })
  }

  async activate(id: string): Promise<Cliente> {
    return super.update(id, { activo: true })
  }
}
