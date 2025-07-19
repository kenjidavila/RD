import { NextResponse } from "next/server"
import { getDatabaseValidator } from "@/lib/database-validator"

export async function GET() {
  try {
    const validator = getDatabaseValidator()
    const health = await validator.validateAll()

    const overallSuccess = Object.values(health).every((result) => result.success)

    return NextResponse.json(
      {
        success: overallSuccess,
        timestamp: new Date().toISOString(),
        health,
        summary: {
          connection: health.connection.success ? "✅" : "❌",
          tables: health.tables.success ? "✅" : "❌",
          functions: health.functions.success ? "✅" : "❌",
          policies: health.policies.success ? "✅" : "❌",
          performance: health.performance.success ? "✅" : "❌",
        },
      },
      {
        status: overallSuccess ? 200 : 500,
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      },
    )
  }
}
