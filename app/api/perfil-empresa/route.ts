import {
  GET as empresaGET,
  POST as empresaPOST,
  dynamic as empresaDynamic,
} from "../empresa/route"

// Reexport handlers so this route mirrors /api/empresa
export const GET = empresaGET
export const POST = empresaPOST
export const dynamic = empresaDynamic
