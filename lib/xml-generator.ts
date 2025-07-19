import { CharacterEncodingStandard } from "./character-encoding-standard"
import type { ECFData } from "@/types/ecf-types"

export interface ResumenFCEData {
  version: string
  rncEmisor: string
  eNCF: string
  fechaEmision: string
  montoTotal: number
  totalITBIS: number
  fechaFirma: string
  codigoSeguridadECF: string
  cantidadLineas: number
}

export class XMLGenerator {
  generateECFXML(data: ECFData): string {
    const tipoECF = data.tipoECF
    const version = "1.0"

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<ECF xmlns="http://dgii.gov.do/ecf/schemas/e-CF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://dgii.gov.do/ecf/schemas/e-CF e-CF_${tipoECF}_v${version}.xsd">\n`

    // Encabezado
    xml += `  <Encabezado>\n`
    xml += `    <Version>${version}</Version>\n`
    xml += `    <TipoeCF>${tipoECF}</TipoeCF>\n`
    xml += `    <eNCF>${data.eNCF}</eNCF>\n`
    xml += `    <FechaEmision>${data.fechaEmision}</FechaEmision>\n`
    if (data.fechaVencimiento) {
      xml += `    <FechaVencimiento>${data.fechaVencimiento}</FechaVencimiento>\n`
    }
    xml += `    <IndicadorEnvioPrimerEmail>0</IndicadorEnvioPrimerEmail>\n`
    xml += `    <IndicadorMontoGravado>1</IndicadorMontoGravado>\n`
    xml += `    <TipoIngresos>${data.tipoIngreso}</TipoIngresos>\n`

    // Información de referencia para notas de crédito/débito
    if (data.ncfModificado) {
      xml += `    <NCFModificado>${data.ncfModificado}</NCFModificado>\n`
      if (data.fechaNCFModificado) {
        xml += `    <FechaNCFModificado>${data.fechaNCFModificado}</FechaNCFModificado>\n`
      }
      if (data.codigoModificacion) {
        xml += `    <CodigoModificacion>${data.codigoModificacion.toString().padStart(2, "0")}</CodigoModificacion>\n`
      }
      if (data.indicadorNotaCredito) {
        xml += `    <IndicadorNotaCredito>${data.indicadorNotaCredito}</IndicadorNotaCredito>\n`
      }
    }

    xml += `  </Encabezado>\n`

    // Emisor
    xml += `  <Emisor>\n`
    xml += `    <RNCEmisor>${data.rncEmisor}</RNCEmisor>\n`
    xml += `    <RazonSocialEmisor>${CharacterEncodingStandard.escapeXMLCharacters(data.razonSocialEmisor)}</RazonSocialEmisor>\n`
    if (data.nombreComercialEmisor) {
      xml += `    <NombreComercial>${CharacterEncodingStandard.escapeXMLCharacters(data.nombreComercialEmisor)}</NombreComercial>\n`
    }
    xml += `    <DireccionEmisor>${CharacterEncodingStandard.escapeXMLCharacters(data.direccionEmisor)}</DireccionEmisor>\n`
    xml += `    <MunicipioEmisor>${CharacterEncodingStandard.escapeXMLCharacters(data.municipioEmisor)}</MunicipioEmisor>\n`
    xml += `    <ProvinciaEmisor>${CharacterEncodingStandard.escapeXMLCharacters(data.provinciaEmisor)}</ProvinciaEmisor>\n`
    xml += `  </Emisor>\n`

    // Comprador (si existe)
    if (data.rncComprador || data.idExtranjero || data.razonSocialComprador) {
      xml += `  <Comprador>\n`
      if (data.rncComprador) {
        xml += `    <RNCComprador>${data.rncComprador}</RNCComprador>\n`
      }
      if (data.idExtranjero) {
        xml += `    <IdentificadorExtranjero>${data.idExtranjero}</IdentificadorExtranjero>\n`
      }
      if (data.razonSocialComprador) {
        xml += `    <RazonSocialComprador>${CharacterEncodingStandard.escapeXMLCharacters(data.razonSocialComprador)}</RazonSocialComprador>\n`
      }
      if (data.direccionComprador) {
        xml += `    <DireccionComprador>${CharacterEncodingStandard.escapeXMLCharacters(data.direccionComprador)}</DireccionComprador>\n`
      }
      if (data.municipioComprador) {
        xml += `    <MunicipioComprador>${CharacterEncodingStandard.escapeXMLCharacters(data.municipioComprador)}</MunicipioComprador>\n`
      }
      if (data.provinciaComprador) {
        xml += `    <ProvinciaComprador>${CharacterEncodingStandard.escapeXMLCharacters(data.provinciaComprador)}</ProvinciaComprador>\n`
      }
      if (data.telefonoComprador) {
        xml += `    <ContactoComprador>\n`
        xml += `      <TelefonoComprador>${data.telefonoComprador}</TelefonoComprador>\n`
        if (data.emailComprador) {
          xml += `      <EmailComprador>${data.emailComprador}</EmailComprador>\n`
        }
        xml += `    </ContactoComprador>\n`
      }
      xml += `  </Comprador>\n`
    }

    // Otra moneda (si aplica)
    if (data.codigoMoneda && data.tipoCambio) {
      xml += `  <OtraMoneda>\n`
      xml += `    <TipoMoneda>${data.codigoMoneda}</TipoMoneda>\n`
      xml += `    <TipoCambio>${data.tipoCambio.toFixed(4)}</TipoCambio>\n`
      xml += `  </OtraMoneda>\n`
    }

    // Detalles
    xml += `  <DetallesItems>\n`
    data.detalles.forEach((detalle) => {
      xml += `    <Item>\n`
      xml += `      <NumeroLinea>${detalle.numeroLinea}</NumeroLinea>\n`
      xml += `      <DescripcionItem>${CharacterEncodingStandard.escapeXMLCharacters(detalle.descripcion)}</DescripcionItem>\n`
      xml += `      <TipoItem>${detalle.tipoItem === "bien" ? "1" : "2"}</TipoItem>\n`
      xml += `      <CantidadItem>${detalle.cantidad.toFixed(2)}</CantidadItem>\n`
      if (detalle.unidadMedida) {
        xml += `      <UnidadMedida>${CharacterEncodingStandard.escapeXMLCharacters(detalle.unidadMedida)}</UnidadMedida>\n`
      }
      xml += `      <PrecioUnitarioItem>${detalle.precioUnitario.toFixed(2)}</PrecioUnitarioItem>\n`
      if (detalle.descuento > 0) {
        xml += `      <DescuentoItem>${detalle.descuento.toFixed(2)}</DescuentoItem>\n`
      }
      xml += `      <MontoItem>${detalle.montoItem.toFixed(2)}</MontoItem>\n`

      // ISC - Impuesto Selectivo al Consumo
      if (
        detalle.gradosAlcohol ||
        detalle.montoImpuestoSelectivoEspecifico ||
        detalle.montoImpuestoSelectivoAdValorem
      ) {
        xml += `      <ISC>\n`
        if (detalle.gradosAlcohol) {
          xml += `        <GradosAlcohol>${detalle.gradosAlcohol.toFixed(1)}</GradosAlcohol>\n`
        }
        if (detalle.cantidadReferencia) {
          xml += `        <CantidadReferencia>${detalle.cantidadReferencia.toFixed(2)}</CantidadReferencia>\n`
        }
        if (detalle.subcantidad) {
          xml += `        <Subcantidad>${detalle.subcantidad.toFixed(2)}</Subcantidad>\n`
        }
        if (detalle.precioUnitarioReferencia) {
          xml += `        <PrecioUnitarioReferencia>${detalle.precioUnitarioReferencia.toFixed(2)}</PrecioUnitarioReferencia>\n`
        }
        if (detalle.montoImpuestoSelectivoEspecifico) {
          xml += `        <MontoImpuestoSelectivoEspecifico>${detalle.montoImpuestoSelectivoEspecifico.toFixed(2)}</MontoImpuestoSelectivoEspecifico>\n`
        }
        if (detalle.montoImpuestoSelectivoAdValorem) {
          xml += `        <MontoImpuestoSelectivoAdValorem>${detalle.montoImpuestoSelectivoAdValorem.toFixed(2)}</MontoImpuestoSelectivoAdValorem>\n`
        }
        xml += `      </ISC>\n`
      }

      // Impuestos adicionales
      if (detalle.codigoImpuestoAdicional || detalle.otrosImpuestosAdicionales) {
        xml += `      <ImpuestosAdicionales>\n`
        if (detalle.codigoImpuestoAdicional) {
          xml += `        <CodigoImpuestoAdicional>${detalle.codigoImpuestoAdicional}</CodigoImpuestoAdicional>\n`
          if (detalle.tasaImpuestoAdicional) {
            xml += `        <TasaImpuestoAdicional>${detalle.tasaImpuestoAdicional.toFixed(2)}</TasaImpuestoAdicional>\n`
          }
        }
        if (detalle.otrosImpuestosAdicionales) {
          xml += `        <OtrosImpuestosAdicionales>${detalle.otrosImpuestosAdicionales.toFixed(2)}</OtrosImpuestosAdicionales>\n`
        }
        xml += `      </ImpuestosAdicionales>\n`
      }

      xml += `      <IndicadorFacturacion>${detalle.indicadorFacturacion}</IndicadorFacturacion>\n`
      xml += `    </Item>\n`
    })
    xml += `  </DetallesItems>\n`

    // Subtotales
    xml += `  <Subtotales>\n`
    if (data.montoGravado18 > 0) {
      xml += `    <Subtotal>\n`
      xml += `      <TipoSubtotal>1</TipoSubtotal>\n`
      xml += `      <SubtotalMontoGravado>${data.montoGravado18.toFixed(2)}</SubtotalMontoGravado>\n`
      xml += `      <SubtotalITBIS>${data.totalITBIS18.toFixed(2)}</SubtotalITBIS>\n`
      xml += `    </Subtotal>\n`
    }
    if (data.montoGravado16 > 0) {
      xml += `    <Subtotal>\n`
      xml += `      <TipoSubtotal>2</TipoSubtotal>\n`
      xml += `      <SubtotalMontoGravado>${data.montoGravado16.toFixed(2)}</SubtotalMontoGravado>\n`
      xml += `      <SubtotalITBIS>${data.totalITBIS16.toFixed(2)}</SubtotalITBIS>\n`
      xml += `    </Subtotal>\n`
    }
    if (data.montoGravado0 > 0) {
      xml += `    <Subtotal>\n`
      xml += `      <TipoSubtotal>3</TipoSubtotal>\n`
      xml += `      <SubtotalMontoGravado>${data.montoGravado0.toFixed(2)}</SubtotalMontoGravado>\n`
      xml += `      <SubtotalITBIS>0.00</SubtotalITBIS>\n`
      xml += `    </Subtotal>\n`
    }
    if (data.montoExento > 0) {
      xml += `    <Subtotal>\n`
      xml += `      <TipoSubtotal>4</TipoSubtotal>\n`
      xml += `      <SubtotalMontoGravado>${data.montoExento.toFixed(2)}</SubtotalMontoGravado>\n`
      xml += `      <SubtotalITBIS>0.00</SubtotalITBIS>\n`
      xml += `    </Subtotal>\n`
    }
    xml += `  </Subtotales>\n`

    // Totales
    xml += `  <MontoTotal>${data.montoTotal.toFixed(2)}</MontoTotal>\n`

    // Retenciones (si aplica)
    if (data.totalITBISRetenido > 0 || data.totalISRRetenido > 0) {
      xml += `  <Retenciones>\n`
      if (data.totalITBISRetenido > 0) {
        xml += `    <RetencionITBIS>${data.totalITBISRetenido.toFixed(2)}</RetencionITBIS>\n`
      }
      if (data.totalISRRetenido > 0) {
        xml += `    <RetencionISR>${data.totalISRRetenido.toFixed(2)}</RetencionISR>\n`
      }
      xml += `  </Retenciones>\n`
    }

    // Firma digital (si existe)
    if (data.codigoSeguridad && data.fechaFirma) {
      xml += `  <FirmaDigital>\n`
      xml += `    <CodigoSeguridad>${data.codigoSeguridad}</CodigoSeguridad>\n`
      xml += `    <FechaFirma>${data.fechaFirma}</FechaFirma>\n`
      xml += `  </FirmaDigital>\n`
    }

    xml += `</ECF>`

    return xml
  }

  generateResumenFCEXML(data: ResumenFCEData): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<RFCE xmlns="http://dgii.gov.do/ecf/schemas/RFCE" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://dgii.gov.do/ecf/schemas/RFCE RFCE_v${data.version}.xsd">\n`

    xml += `  <Encabezado>\n`
    xml += `    <Version>${data.version}</Version>\n`
    xml += `    <RNCEmisor>${data.rncEmisor}</RNCEmisor>\n`
    xml += `    <eNCF>${data.eNCF}</eNCF>\n`
    xml += `    <FechaEmision>${data.fechaEmision}</FechaEmision>\n`
    xml += `    <MontoTotal>${data.montoTotal.toFixed(2)}</MontoTotal>\n`
    xml += `    <MontoTotalITBIS>${data.totalITBIS.toFixed(2)}</MontoTotalITBIS>\n`
    xml += `    <FechaFirmaDigital>${data.fechaFirma}</FechaFirmaDigital>\n`
    xml += `    <CodigoSeguridadeCF>${data.codigoSeguridadECF}</CodigoSeguridadeCF>\n`
    xml += `    <CantidadLineasDetalle>${data.cantidadLineas}</CantidadLineasDetalle>\n`
    xml += `  </Encabezado>\n`

    xml += `</RFCE>`

    return xml
  }

  generateQRCodeURL(data: ECFData, isRFCE = false): string {
    const baseURL = "https://dgii.gov.do/ecf/consulta"
    const params = new URLSearchParams({
      rnc: data.rncEmisor,
      encf: data.eNCF,
      fecha: data.fechaEmision,
      monto: data.montoTotal.toFixed(2),
      tipo: isRFCE ? "RFCE" : "ECF",
    })

    if (data.codigoSeguridad) {
      params.append("codigo", data.codigoSeguridad)
    }

    return `${baseURL}?${params.toString()}`
  }

  validateXMLStructure(xml: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validaciones básicas de estructura XML
    if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      errors.push("Falta declaración XML")
    }

    if (!xml.includes("<ECF") && !xml.includes("<RFCE")) {
      errors.push("Falta elemento raíz ECF o RFCE")
    }

    if (!xml.includes("</ECF>") && !xml.includes("</RFCE>")) {
      errors.push("Falta cierre del elemento raíz")
    }

    // Validar elementos requeridos
    const requiredElements = ["Encabezado", "Version", "TipoeCF", "eNCF", "FechaEmision", "Emisor", "RNCEmisor"]

    requiredElements.forEach((element) => {
      if (!xml.includes(`<${element}>`)) {
        errors.push(`Falta elemento requerido: ${element}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
