import { Logger } from "@/lib/logger"

export abstract class BaseService {
  protected logger: Logger

  constructor(serviceName: string) {
    this.logger = new Logger(serviceName)
  }

  protected handleError(error: unknown, operation: string): never {
    const message = error instanceof Error ? error.message : "Unknown error"
    this.logger.error(`Error in ${operation}`, { error: message })
    throw new Error(`${operation} failed: ${message}`)
  }

  protected logOperation(operation: string, data?: any) {
    this.logger.info(`Executing ${operation}`, data)
  }
}
