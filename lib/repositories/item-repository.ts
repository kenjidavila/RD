import { BaseRepository } from "./base-repository"
import type { Item, CreateItem, UpdateItem } from "@/types/database"

export class ItemRepository extends BaseRepository<"items"> {
  constructor(userId?: string) {
    super("items", userId)
  }

  protected getSearchColumns(): string[] {
    return ["codigo", "descripcion", "descripcion_corta"]
  }

  async findByCodigo(codigo: string, empresaId: string): Promise<Item | null> {
    const { data, error } = await this.client
      .from("items")
      .select("*")
      .eq("codigo", codigo)
      .eq("empresa_id", empresaId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error finding item by código: ${error.message}`)
    }

    return data
  }

  async generateNextCodigo(empresaId: string, tipoItem: "bien" | "servicio"): Promise<string> {
    const prefix = tipoItem === "bien" ? "ITM" : "SRV"

    const { data, error } = await this.client
      .from("items")
      .select("codigo")
      .eq("empresa_id", empresaId)
      .like("codigo", `${prefix}%`)
      .order("codigo", { ascending: false })
      .limit(1)

    if (error) {
      throw new Error(`Error generating código: ${error.message}`)
    }

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastCodigo = data[0].codigo
      const match = lastCodigo.match(/(\d+)$/)
      if (match) {
        nextNumber = Number.parseInt(match[1]) + 1
      }
    }

    return `${prefix}${nextNumber.toString().padStart(6, "0")}`
  }

  async create(data: CreateItem): Promise<Item> {
    // Generate código if not provided
    if (!data.codigo) {
      data.codigo = await this.generateNextCodigo(data.empresa_id, data.tipo_item)
    }

    // Validate código uniqueness within empresa
    const existing = await this.findByCodigo(data.codigo, data.empresa_id)
    if (existing) {
      throw new Error("Ya existe un item con este código en esta empresa")
    }

    return super.create({
      ...data,
      activo: data.activo ?? true,
    })
  }

  async update(id: string, data: UpdateItem): Promise<Item> {
    // Validate código uniqueness if changing
    if (data.codigo && data.empresa_id) {
      const existing = await this.findByCodigo(data.codigo, data.empresa_id)
      if (existing && existing.id !== id) {
        throw new Error("Ya existe un item con este código en esta empresa")
      }
    }

    return super.update(id, data)
  }

  async findById(id: string): Promise<Item | null> {
    return super.findById(id)
  }

  async findMany(options: Parameters<BaseRepository<"items">["findMany"]>[0] = {}) {
    return super.findMany(options)
  }

  async findByEmpresa(empresaId: string, options: Parameters<BaseRepository<"items">["findMany"]>[0] = {}) {
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

  async deactivate(id: string): Promise<Item> {
    return super.update(id, { activo: false })
  }

  async activate(id: string): Promise<Item> {
    return super.update(id, { activo: true })
  }

  async updateInventory(id: string, cantidad: number): Promise<Item> {
    const item = await this.findById(id)
    if (!item) {
      throw new Error("Item no encontrado")
    }

    const nuevoInventario = (item.inventario_disponible || 0) + cantidad

    return super.update(id, {
      inventario_disponible: nuevoInventario,
    })
  }
}
