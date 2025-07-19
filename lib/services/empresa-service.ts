import { BaseService } from "./base-service"
import { EmpresaRepository } from "@/lib/repositories/empresa-repository"
import type { Empresa, CreateEmpresa, UpdateEmpresa } from "@/types/database"
import type { PaginationOptions, FilterOptions } from "@/lib/repositories/base-repository"

export class EmpresaService extends BaseService {
  private empresaRepo: EmpresaRepository

  constructor(userId?: string) {
    super("EmpresaService")
    this.empresaRepo = new EmpresaRepository(userId)
  }

  async createEmpresa(data: CreateEmpresa): Promise<Empresa> {
    try {
      this.logOperation("createEmpresa", { rnc: data.rnc })

      // Validate required fields
      if (!data.rnc || !data.razon_social || !data.email) {
        throw new Error("RNC, razón social y email son requeridos")
      }

      // Validate RNC format
      if (!/^\d{9,11}$/.test(data.rnc.replace(/\D/g, ""))) {
        throw new Error("Formato de RNC inválido")
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error("Formato de email inválido")
      }

      const empresa = await this.empresaRepo.create(data)
      this.logger.info("Empresa created successfully", { id: empresa.id, rnc: empresa.rnc })

      return empresa
    } catch (error) {
      this.handleError(error, "createEmpresa")
    }
  }

  async updateEmpresa(id: string, data: UpdateEmpresa): Promise<Empresa> {
    try {
      this.logOperation("updateEmpresa", { id })

      // Validate email format if provided
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error("Formato de email inválido")
      }

      const empresa = await this.empresaRepo.update(id, data)
      this.logger.info("Empresa updated successfully", { id: empresa.id })

      return empresa
    } catch (error) {
      this.handleError(error, "updateEmpresa")
    }
  }

  async getEmpresaById(id: string): Promise<Empresa | null> {
    try {
      this.logOperation("getEmpresaById", { id })
      return await this.empresaRepo.findById(id)
    } catch (error) {
      this.handleError(error, "getEmpresaById")
    }
  }

  async getEmpresaByRnc(rnc: string): Promise<Empresa | null> {
    try {
      this.logOperation("getEmpresaByRnc", { rnc })
      return await this.empresaRepo.findByRnc(rnc)
    } catch (error) {
      this.handleError(error, "getEmpresaByRnc")
    }
  }

  async getEmpresas(options: PaginationOptions & FilterOptions = {}) {
    try {
      this.logOperation("getEmpresas", options)
      return await this.empresaRepo.findMany(options)
    } catch (error) {
      this.handleError(error, "getEmpresas")
    }
  }

  async deleteEmpresa(id: string): Promise<void> {
    try {
      this.logOperation("deleteEmpresa", { id })
      await this.empresaRepo.delete(id)
      this.logger.info("Empresa deleted successfully", { id })
    } catch (error) {
      this.handleError(error, "deleteEmpresa")
    }
  }

  async deactivateEmpresa(id: string): Promise<Empresa> {
    try {
      this.logOperation("deactivateEmpresa", { id })
      const empresa = await this.empresaRepo.deactivate(id)
      this.logger.info("Empresa deactivated successfully", { id })
      return empresa
    } catch (error) {
      this.handleError(error, "deactivateEmpresa")
    }
  }

  async activateEmpresa(id: string): Promise<Empresa> {
    try {
      this.logOperation("activateEmpresa", { id })
      const empresa = await this.empresaRepo.activate(id)
      this.logger.info("Empresa activated successfully", { id })
      return empresa
    } catch (error) {
      this.handleError(error, "activateEmpresa")
    }
  }
}
