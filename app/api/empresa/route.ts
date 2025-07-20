import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errors?: string[];
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado", errors: ["Usuario no autenticado"] },
        { status: 401 },
      );
    }

    let { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("empresa_id, empresas(*)")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !usuario) {
      ;({ data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("empresa_id, empresas(*)")
        .eq("id", user.id)
        .single());
    }

    if (userError || !usuario) {
      return NextResponse.json(
        { success: false, error: "Empresa no encontrada", errors: ["No se encontró la empresa asociada al usuario"] },
        { status: 404 },
      );
    }

    if (!usuario.empresas && usuario.empresa_id) {
      const { data: empresa } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", usuario.empresa_id)
        .single();
      usuario.empresas = empresa ?? null;
    }

    if (!usuario.empresas) {
      return NextResponse.json(
        { success: false, error: "Empresa no encontrada", errors: ["No se encontró la empresa asociada al usuario"] },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: usuario.empresas });
  } catch (error) {
    console.error("Error obteniendo empresa:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor", errors: ["Error inesperado al obtener empresa"] },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado", errors: ["Usuario no autenticado"] },
        { status: 401 },
      );
    }

    let { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("id, empresa_id")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !usuario) {
      ;({ data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("id, empresa_id")
        .eq("id", user.id)
        .single());
    }

    if (userError || !usuario) {
      return NextResponse.json(
        { success: false, error: "Usuario sin empresa", errors: ["No se pudo obtener el usuario"] },
        { status: 404 },
      );
    }

    let empresaId = usuario.empresa_id as string | null;
    let result;

    if (empresaId) {
      result = await supabase
        .from("empresas")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", empresaId)
        .select()
        .single();
    } else {
      const newId = crypto.randomUUID();
      result = await supabase
        .from("empresas")
        .insert({
          ...body,
          id: newId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: user.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (!result.error && result.data) {
        empresaId = result.data.id;
        const { error: updateError, count } = await supabase
          .from("usuarios")
          .update({ empresa_id: empresaId, updated_at: new Date().toISOString() })
          .eq("auth_user_id", user.id);

        if (updateError || (count ?? 0) === 0) {
          await supabase
            .from("usuarios")
            .update({ empresa_id: empresaId, updated_at: new Date().toISOString() })
            .eq("id", user.id);
        }
      }
    }

    if (result.error) {
      throw result.error;
    }

    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresaId as string)
      .single();

    return NextResponse.json({ success: true, message: "Empresa guardada", data: empresa });
  } catch (error: any) {
    console.error("Error guardando empresa:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error inesperado" },
      { status: 500 },
    );
  }
}
