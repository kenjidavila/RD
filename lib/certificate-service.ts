import { createClient } from "@/utils/supabase/server";
import {
  DigitalSignatureService,
  DigitalCertificate,
} from "./digital-signature";

export class CertificateService {
  static async getActiveCertificate(
    empresaId: string,
    password?: string,
  ): Promise<DigitalCertificate> {
    const supabase = await createClient();

    const { data: certRow, error } = await supabase
      .from("certificados_digitales")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !certRow) {
      throw new Error("Certificado digital no encontrado");
    }

    const { data: configRow } = await supabase
      .from("configuraciones")
      .select("configuracion")
      .eq("empresa_id", empresaId)
      .eq("tipo", "certificados")
      .maybeSingle();

    const storedPassword = configRow?.configuracion?.password_certificado as
      | string
      | undefined;
    const finalPassword = password || storedPassword;
    if (!finalPassword) {
      throw new Error("Se requiere contraseña del certificado");
    }

    const filePath = certRow.archivo_url.split("/certificados/")[1];
    if (!filePath) {
      throw new Error("Ruta de certificado inválida");
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("certificados")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error("No se pudo descargar el certificado");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const parsed = DigitalSignatureService.parsePfx(buffer, finalPassword);

    if (parsed.expirationDate < new Date()) {
      throw new Error("Certificado digital vencido");
    }

    return {
      id: certRow.id,
      name: certRow.nombre,
      certificate: parsed.certificate,
      privateKey: parsed.privateKey,
      expirationDate: parsed.expirationDate,
      isActive: true,
    };
  }
}
