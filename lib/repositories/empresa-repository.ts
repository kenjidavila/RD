import { BaseRepository } from "./base-repository"
import type { Empresa, CreateEmpresa, UpdateEmpresa } from "@/types/database"

export class EmpresaRepository extends BaseRepository<"empresas"> {
  constructor(userId?: string) {
    super("empresas", userId)
  }

  protected getSearchColumns(): string[] {
    return ["rnc", "razon_social", "nombre_comercial", "email"]
  }

  async findByRnc(rnc: string): Promise<Empresa | null> {
    const { data, error } = await this.client.from("empresas").select("*").eq("rnc", rnc).single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error finding empresa by RNC: ${error.message}`)
    }

    return data
  }

  async findByEmail(email: string): Promise<Empresa | null> {
    const { data, error } = await this.client.from("empresas").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error finding empresa by email: ${error.message}`)
    }

    return data
  }

  async create(data: CreateEmpresa): Promise<Empresa> {
    // Validate RNC uniqueness
    const existing = await this.findByRnc(data.rnc)
    if (existing) {
      throw new Error("Ya existe una empresa con este RNC")
    }

    // Validate email uniqueness
    if (data.email) {
      const existingEmail = await this.findByEmail(data.email)
      if (existingEmail) {
        throw new Error("Ya existe una empresa con este email")
      }
    }

    return super.create({
      ...data,
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      activa: data.activa ?? true,
    })
  }

  async update(id: string, data: UpdateEmpresa): Promise<Empresa> {
    // Validate RNC uniqueness if changing
    if (data.rnc) {
      const existing = await this.findByRnc(data.rnc)
      if (existing && existing.id !== id) {
        throw new Error("Ya existe una empresa con este RNC")
      }
    }

    // Validate email uniqueness if changing
    if (data.email) {
      const existing = await this.findByEmail(data.email)
      if (existing && existing.id !== id) {
        throw new Error("Ya existe una empresa con este email")
      }
    }

    return super.update(id, {
      ...data,
      fecha_actualizacion: new Date().toISOString(),
    })
  }

  async findById(id: string): Promise<Empresa | null> {
    return super.findById(id)
  }

  async findMany(options: Parameters<BaseRepository<"empresas">["findMany"]>[0] = {}) {
    return super.findMany(options)
  }

  async delete(id: string): Promise<void> {
    return super.delete(id)
  }

  async deactivate(id: string): Promise<Empresa> {
    return super.update(id, { activa: false })
  }

  async activate(id: string): Promise<Empresa> {
    return super.update(id, { activa: true })
  }
}
