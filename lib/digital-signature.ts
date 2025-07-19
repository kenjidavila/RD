import crypto from "crypto"
import * as forge from "node-forge"

export interface DigitalCertificate {
  id: string
  name: string
  certificate: string
  privateKey: string
  expirationDate: Date
  isActive: boolean
}

export class DigitalSignatureService {
  private certificates: Map<string, DigitalCertificate> = new Map()

  addCertificate(certificate: DigitalCertificate): void {
    this.certificates.set(certificate.id, certificate)
  }

  getCertificate(id: string): DigitalCertificate | undefined {
    return this.certificates.get(id)
  }

  signXML(xmlContent: string, certificateId: string): string {
    const certificate = this.getCertificate(certificateId)
    if (!certificate || !certificate.isActive) {
      throw new Error("Certificado digital no válido o inactivo")
    }

    if (certificate.expirationDate < new Date()) {
      throw new Error("Certificado digital vencido")
    }

    try {
      // Cargar certificado y clave privada usando node-forge
      const cert = forge.pki.certificateFromPem(certificate.certificate)
      const privateKey = forge.pki.privateKeyFromPem(certificate.privateKey)

      // Canonicalizar el XML
      const canonicalXML = this.canonicalizeXML(xmlContent)

      // Crear hash SHA-256 del contenido canonicalizado
      const md = forge.md.sha256.create()
      md.update(canonicalXML, "utf8")
      const hash = md.digest()

      // Firmar el hash con la clave privada
      const signature = privateKey.sign(hash)
      const signatureBase64 = forge.util.encode64(signature)

      // Crear el bloque de firma XML según estándar XMLDSig
      const signedXML = this.embedXMLSignature(xmlContent, signatureBase64, hash.toHex(), cert)

      return signedXML
    } catch (error) {
      console.error("Error en firma digital:", error)
      throw new Error(`Error al firmar digitalmente: ${error}`)
    }
  }

  private canonicalizeXML(xmlContent: string): string {
    // Implementación básica de canonicalización C14N
    // En producción, usar una librería especializada como xml-c14n
    return xmlContent
      .replace(/>\s+</g, "><") // Remover espacios entre elementos
      .replace(/\s+/g, " ") // Normalizar espacios
      .trim()
  }

  private embedXMLSignature(
    xmlContent: string,
    signature: string,
    digestValue: string,
    certificate: forge.pki.Certificate,
  ): string {
    // Obtener información del certificado
    const certPem = forge.pki.certificateToPem(certificate)
    const certBase64 = certPem
      .replace("-----BEGIN CERTIFICATE-----", "")
      .replace("-----END CERTIFICATE-----", "")
      .replace(/\n/g, "")

    // Crear bloque de firma XML según estándar XMLDSig
    const signatureBlock = `
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"/>
        <Reference URI="">
          <Transforms>
            <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
            <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
          </Transforms>
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"/>
          <DigestValue>${digestValue}</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>${signature}</SignatureValue>
      <KeyInfo>
        <X509Data>
          <X509Certificate>${certBase64}</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>`

    // Insertar antes del cierre del elemento raíz
    return xmlContent.replace("</ECF>", `${signatureBlock}</ECF>`)
  }

  verifySignature(signedXML: string): boolean {
    try {
      // Extraer la firma y el certificado del XML
      const signatureMatch = signedXML.match(/<SignatureValue>([^<]+)<\/SignatureValue>/)
      const certMatch = signedXML.match(/<X509Certificate>([^<]+)<\/X509Certificate>/)

      if (!signatureMatch || !certMatch) {
        return false
      }

      const signatureBase64 = signatureMatch[1]
      const certBase64 = certMatch[1]

      // Reconstruir el certificado
      const certPem = `-----BEGIN CERTIFICATE-----\n${certBase64}\n-----END CERTIFICATE-----`
      const cert = forge.pki.certificateFromPem(certPem)

      // Extraer la clave pública del certificado
      const publicKey = cert.publicKey

      // Obtener el contenido original sin la firma
      const originalContent = signedXML.replace(/<Signature[^>]*>[\s\S]*?<\/Signature>/, "")

      // Canonicalizar y crear hash
      const canonicalContent = this.canonicalizeXML(originalContent)
      const md = forge.md.sha256.create()
      md.update(canonicalContent, "utf8")
      const hash = md.digest()

      // Verificar la firma
      const signature = forge.util.decode64(signatureBase64)
      return publicKey.verify(hash.bytes(), signature)
    } catch (error) {
      console.error("Error verificando firma:", error)
      return false
    }
  }

  extractSecurityCode(signedXML: string): string {
    try {
      // Extraer el valor de la firma
      const signatureMatch = signedXML.match(/<SignatureValue>([^<]+)<\/SignatureValue>/)
      if (signatureMatch) {
        const signatureValue = signatureMatch[1]
        // Crear hash del valor de la firma para generar código de seguridad
        const hash = crypto.createHash("sha256").update(signatureValue).digest("hex")
        return hash.substring(0, 6).toUpperCase()
      }

      // Fallback: generar código basado en timestamp
      const timestamp = Date.now().toString()
      const hash = crypto.createHash("sha256").update(timestamp).digest("hex")
      return hash.substring(0, 6).toUpperCase()
    } catch (error) {
      console.error("Error extrayendo código de seguridad:", error)
      return "000000"
    }
  }

  // Método para validar certificado
  validateCertificate(certificateId: string): boolean {
    const certificate = this.getCertificate(certificateId)
    if (!certificate) return false

    try {
      const cert = forge.pki.certificateFromPem(certificate.certificate)

      // Verificar que el certificado no haya expirado
      const now = new Date()
      if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
        return false
      }

      // Verificar que la clave privada corresponde al certificado
      const privateKey = forge.pki.privateKeyFromPem(certificate.privateKey)
      const publicKey = cert.publicKey as forge.pki.rsa.PublicKey

      // Test básico: firmar y verificar un mensaje de prueba
      const testMessage = "test-message"
      const md = forge.md.sha256.create()
      md.update(testMessage, "utf8")
      const signature = privateKey.sign(md)

      md.start()
      md.update(testMessage, "utf8")
      return publicKey.verify(md.digest().bytes(), signature)
    } catch (error) {
      console.error("Error validando certificado:", error)
      return false
    }
  }

  // Método para obtener información del certificado
  getCertificateInfo(certificateId: string): any {
    const certificate = this.getCertificate(certificateId)
    if (!certificate) return null

    try {
      const cert = forge.pki.certificateFromPem(certificate.certificate)

      return {
        subject: cert.subject.attributes.map((attr) => `${attr.shortName}=${attr.value}`).join(", "),
        issuer: cert.issuer.attributes.map((attr) => `${attr.shortName}=${attr.value}`).join(", "),
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        fingerprint: forge.md.sha1
          .create()
          .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
          .digest()
          .toHex(),
      }
    } catch (error) {
      console.error("Error obteniendo información del certificado:", error)
      return null
    }
  }
}
