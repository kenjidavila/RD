import { GET as empresaGET, POST as empresaPOST } from "../empresa/route"

// Use the same dynamic config as the empresa route
export const dynamic = "force-dynamic"

// Reexport handlers so this route mirrors /api/empresa
export const GET = empresaGET
export const POST = empresaPOST
