import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  errors?: string[];
}

export async function GET(
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
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      );
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        {
          success: false,
          error: "Empresa no encontrada",
          errors: ["No se encontró la empresa asociada al usuario"],
        },
        { status: 404 },
      );
    }

    if (!usuario.empresa_id) {
      return NextResponse.json({ success: true, data: null });
    }

    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", usuario.empresa_id)
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al obtener empresa"],
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error obteniendo empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al obtener empresa"],
      },
      { status: 500 },
    );
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
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (!body.rnc || !body.razon_social) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos requeridos faltantes",
          errors: ["RNC y razón social son requeridos"],
        },
        { status: 400 },
      );
    }

    const empresaData = {
      id: body.id || crypto.randomUUID(),
      rnc: body.rnc.trim(),
      razon_social: body.razon_social.trim(),
      nombre_comercial: body.nombre_comercial?.trim() || null,
      direccion: body.direccion?.trim() || null,
      telefono: body.telefono?.trim() || null,
      email: body.email?.trim() || null,
      provincia: body.provincia?.trim() || null,
      municipio: body.municipio?.trim() || null,
      sector: body.sector?.trim() || null,
      actividad_economica: body.actividad_economica?.trim() || null,
      regimen_tributario: body.regimen_tributario?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      activa: true,
    };

    const { data, error } = await supabase
      .from("empresas")
      .insert(empresaData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al crear empresa"],
        },
        { status: 500 },
      );
    }

    await supabase
      .from("usuarios")
      .update({ empresa_id: data.id, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "Empresa creada",
      data,
    });
  } catch (error) {
    console.error("Error creando empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al crear empresa"],
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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
        {
          success: false,
          error: "No autorizado",
          errors: ["Usuario no autenticado"],
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID requerido",
          errors: ["El ID de la empresa es requerido"],
        },
        { status: 400 },
      );
    }

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined),
    );
    cleanUpdateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("empresas")
      .update(cleanUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: ["Error al actualizar empresa"],
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Empresa actualizada",
      data,
    });
  } catch (error) {
    console.error("Error actualizando empresa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        errors: ["Error inesperado al actualizar empresa"],
      },
      { status: 500 },
    );
  }
}
