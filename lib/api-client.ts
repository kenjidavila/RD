// Cliente HTTP para llamadas desde frontend a API Routes
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  // Métodos HTTP
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers })
  }

  async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    })
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    })
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers })
  }

  // Métodos específicos para la aplicación
  async getClientes(empresaId: string) {
    return this.get(`/clientes?empresa_id=${empresaId}`)
  }

  async createCliente(clienteData: any) {
    return this.post("/clientes", clienteData)
  }

  async updateCliente(id: string, clienteData: any) {
    return this.put(`/clientes/${id}`, clienteData)
  }

  async deleteCliente(id: string) {
    return this.delete(`/clientes/${id}`)
  }

  async getItems(empresaId: string) {
    return this.get(`/items?empresa_id=${empresaId}`)
  }

  async createItem(itemData: any) {
    return this.post("/items", itemData)
  }

  async updateItem(id: string, itemData: any) {
    return this.put(`/items/${id}`, itemData)
  }

  async deleteItem(id: string) {
    return this.delete(`/items/${id}`)
  }

  async getBorradores(empresaId: string) {
    return this.get(`/borradores?empresa_id=${empresaId}`)
  }

  async createBorrador(borradorData: any) {
    return this.post("/borradores", borradorData)
  }

  async updateBorrador(id: string, borradorData: any) {
    return this.put(`/borradores/${id}`, borradorData)
  }

  async deleteBorrador(id: string) {
    return this.delete(`/borradores/${id}`)
  }

  async getConfiguraciones(empresaId: string) {
    return this.get(`/configuracion?empresa_id=${empresaId}`)
  }

  async updateConfiguracion(clave: string, valor: string, empresaId: string) {
    return this.post("/configuracion", { clave, valor, empresa_id: empresaId })
  }

  async consultarRnc(rnc: string) {
    return this.get(`/dgii/consultar-rnc?rnc=${rnc}`)
  }

  async consultarNcf(rnc: string, ncf: string) {
    return this.get(`/dgii/consultar-ncf?rnc=${rnc}&ncf=${ncf}`)
  }

  async generatePdfPreview(data: any) {
    return this.post("/generate-pdf-preview", data)
  }

  async generatePdfFinal(data: any) {
    return this.post("/generate-pdf-final", data)
  }

  async getDashboardStats(empresaId: string) {
    return this.get(`/dashboard/stats?empresa_id=${empresaId}`)
  }

  async getSystemStatus() {
    return this.get("/sistema/salud")
  }

  // Autenticación
  async login(email: string, password: string) {
    return this.post("/auth/login", { email, password })
  }

  async register(userData: any) {
    return this.post("/auth/register", userData)
  }

  async logout() {
    return this.post("/auth/logout")
  }

  async getProfile() {
    return this.get("/auth/me")
  }
}

// Instancia singleton para uso en componentes
export const apiClient = new ApiClient()

// Hook personalizado para React
export function useApiClient() {
  return apiClient
}

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Utilidades para manejo de errores
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError
}
