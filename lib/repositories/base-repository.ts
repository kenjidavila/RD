import { createAuthenticatedClient } from "@/lib/supabase-client"
import type { Database } from "@/types/database"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface PaginationOptions {
  page?: number
  limit?: number
  cursor?: string
}

export interface FilterOptions {
  search?: string
  filters?: Record<string, any>
  orderBy?: string
  orderDirection?: "asc" | "desc"
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
    nextCursor?: string
  }
}

export abstract class BaseRepository<T extends keyof Database["public"]["Tables"]> {
  protected client: SupabaseClient<Database>
  protected tableName: T

  constructor(tableName: T, userId?: string) {
    this.tableName = tableName
    this.initializeClient(userId)
  }

  private async initializeClient(userId?: string) {
    this.client = await createAuthenticatedClient(userId)
  }

  protected async findById(id: string): Promise<Database["public"]["Tables"][T]["Row"] | null> {
    const { data, error } = await this.client.from(this.tableName).select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw new Error(`Error finding ${this.tableName} by id: ${error.message}`)
    }

    return data
  }

  protected async findMany(
    options: PaginationOptions & FilterOptions = {},
  ): Promise<PaginatedResult<Database["public"]["Tables"][T]["Row"]>> {
    const { page = 1, limit = 10, search, filters = {}, orderBy = "created_at", orderDirection = "desc" } = options

    let query = this.client.from(this.tableName).select("*", { count: "exact" })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query = query.eq(key, value)
      }
    })

    // Apply search if provided
    if (search && this.getSearchColumns().length > 0) {
      const searchColumns = this.getSearchColumns()
      const searchConditions = searchColumns.map((col) => `${col}.ilike.%${search}%`).join(",")
      query = query.or(searchConditions)
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === "asc" })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Error finding ${this.tableName}: ${error.message}`)
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > page * limit,
      },
    }
  }

  protected async create(
    data: Database["public"]["Tables"][T]["Insert"],
  ): Promise<Database["public"]["Tables"][T]["Row"]> {
    const { data: result, error } = await this.client.from(this.tableName).insert(data).select().single()

    if (error) {
      throw new Error(`Error creating ${this.tableName}: ${error.message}`)
    }

    return result
  }

  protected async update(
    id: string,
    data: Database["public"]["Tables"][T]["Update"],
  ): Promise<Database["public"]["Tables"][T]["Row"]> {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating ${this.tableName}: ${error.message}`)
    }

    return result
  }

  protected async delete(id: string): Promise<void> {
    const { error } = await this.client.from(this.tableName).delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting ${this.tableName}: ${error.message}`)
    }
  }

  protected async softDelete(id: string): Promise<Database["public"]["Tables"][T]["Row"]> {
    return this.update(id, { activo: false } as any)
  }

  // Abstract method to be implemented by child classes
  protected abstract getSearchColumns(): string[]
}
