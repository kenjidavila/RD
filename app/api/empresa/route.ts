import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SupabaseServerUtils } from "@/lib/supabase-server-utils";

export const dynamic = "force-dynamic";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const { empresa } = await SupabaseServerUtils.getSessionAndEmpresa();
    return NextResponse.json({ success: true, data: empresa });
  } catch (error: any) {
    const message = error.message || "Error inesperado";
    const status = message === "Usuario no autenticado" ? 401 : 404;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      rnc,
      razon_social,
      nombre_comercial,
      direccion,
      email,
      telefono,
      provincia,
      municipio,
    } = body;

    const empresaInput = {
      rnc: rnc?.trim(),
      razon_social: razon_social?.trim(),
      nombre_comercial: nombre_comercial?.trim() || null,
      direccion: direccion?.trim() || null,
      email: email?.trim(),
      telefono: telefono?.trim() || null,
      provincia: provincia?.trim() || null,
      municipio: municipio?.trim() || null,
    };

    // Obtener datos del usuario autenticado o crear registro básico si no existe
    const { data: usuario } = await supabase
      .from("usuarios")
      // @ts-ignore - columna custom en la tabla
      .select("id, rnc_cedula, empresa_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    let ownerRnc = usuario?.rnc_cedula?.trim();
    let usuarioId = usuario?.id;

    if (!usuario) {
      // Crear registro de usuario si no existe o actualizar datos básicos
      const { data: newUser, error: newUserError } = await supabase
        .from("usuarios")
        .upsert(
          {
            // @ts-ignore - columnas adicionales no definidas en tipos
            auth_user_id: user.id,
            nombre: user.user_metadata?.nombre || "",
            email: user.email,
            password_hash: "supabase_auth",
            rnc_cedula: empresaInput.rnc,
            rol: "administrador",
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: ["auth_user_id", "email"] },
        )
        .select("id, rnc_cedula")
        .single();

      if (newUserError || !newUser) {
        return NextResponse.json(
          {
            success: false,
            error: newUserError?.message || "Error creando usuario",
          },
          { status: 500 },
        );
      }

      ownerRnc = newUser.rnc_cedula?.trim();
      usuarioId = newUser.id;
    }

    const normalizedOwnerId = ownerRnc || empresaInput.rnc;

    if (!normalizedOwnerId) {
      return NextResponse.json(
        { success: false, error: "RNC no encontrado para el usuario" },
        { status: 400 },
      );
    }



    const { data: empresa, error } = await supabase
      .from("empresas")
      .upsert(
        {
          ...empresaInput,
          owner_id: normalizedOwnerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["owner_id"] },
      )
      .select()
      .single();

    if (error) throw error;

    // Intentar vincular la empresa al registro de usuario si existe
    const usuarioRegistroId = usuarioId
      ? usuarioId
      : (
          await supabase
            .from("usuarios")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle()
        ).data?.id;

    if (usuarioRegistroId) {
      const { error: userUpdateError } = await supabase
        .from("usuarios")
        .update({
          empresa_id: empresa.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuarioRegistroId);

      if (userUpdateError) {
        console.error("Error vinculando empresa al usuario:", userUpdateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: empresa,
      message: "Empresa guardada",
    });
  } catch (error: any) {
    console.error("Error guardando empresa:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error inesperado" },
      { status: 500 },
    );
  }
}
