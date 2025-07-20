import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        logger.info("Auth callback successful")
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        logger.error("Auth callback error", { error })
      }
    }

    // Return the user to an error page with instructions
    logger.warn("Auth callback failed - no code or error occurred")
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  } catch (error) {
    logger.error("Auth callback exception", { error })
    return NextResponse.redirect(`${request.nextUrl.origin}/auth/auth-code-error`)
  }
}
