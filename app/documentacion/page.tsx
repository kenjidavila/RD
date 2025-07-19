"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Book, Video, HelpCircle, Shield, Zap, Globe, Phone, Mail } from "lucide-react"

export default function DocumentacionPage() {
  const recursos = [
    {
      categoria: "Normativas DGII",
      items: [
        {
          titulo: "Norma General 06-2018",
          descripcion: "Comprobantes Fiscales Electrónicos",
          tipo: "PDF",
          url: "#",
          importante: true,
        },
        {
          titulo: "Resolución 13-2019",
          descripcion: "Modificaciones a los e-CF",
          tipo: "PDF",
          url: "#",
        },
        {
          titulo: "Catálogo de Validaciones",
          descripcion: "Validaciones técnicas para e-CF",
          tipo: "Excel",
          url: "#",
        },
      ],
    },
    {
      categoria: "Esquemas XML",
      items: [
        {
          titulo: "e-CF 31 - Factura de Crédito Fiscal",
          descripcion: "Esquema XSD para FCF electrónica",
          tipo: "XSD",
          url: "#",
        },
        {
          titulo: "e-CF 32 - Factura de Consumo",
          descripcion: "Esquema XSD para FC electrónica",
          tipo: "XSD",
          url: "#",
        },
        {
          titulo: "e-CF 33 - Nota de Débito",
          descripcion: "Esquema XSD para ND electrónica",
          tipo: "XSD",
          url: "#",
        },
        {
          titulo: "e-CF 34 - Nota de Crédito",
          descripcion: "Esquema XSD para NC electrónica",
          tipo: "XSD",
          url: "#",
        },
      ],
    },
    {
      categoria: "Guías Técnicas",
      items: [
        {
          titulo: "Manual de Integración",
          descripcion: "Guía completa para desarrolladores",
          tipo: "PDF",
          url: "#",
          importante: true,
        },
        {
          titulo: "Certificados Digitales",
          descripcion: "Configuración y uso de certificados",
          tipo: "PDF",
          url: "#",
        },
        {
          titulo: "Códigos de Error",
          descripcion: "Lista completa de códigos de error",
          tipo: "PDF",
          url: "#",
        },
      ],
    },
  ]

  const tutoriales = [
    {
      titulo: "Configuración Inicial",
      descripcion: "Cómo configurar el sistema por primera vez",
      duracion: "15 min",
      nivel: "Básico",
    },
    {
      titulo: "Emisión de Facturas",
      descripcion: "Proceso completo de emisión de e-CF",
      duracion: "20 min",
      nivel: "Intermedio",
    },
    {
      titulo: "Manejo de Contingencias",
      descripcion: "Qué hacer cuando hay problemas de conectividad",
      duracion: "10 min",
      nivel: "Avanzado",
    },
    {
      titulo: "Personalización de Facturas",
      descripcion: "Cómo personalizar el diseño de sus facturas",
      duracion: "25 min",
      nivel: "Intermedio",
    },
  ]

  const faq = [
    {
      pregunta: "¿Qué es un e-CF?",
      respuesta:
        "Un Comprobante Fiscal Electrónico (e-CF) es un documento digital que reemplaza los comprobantes fiscales tradicionales en papel, cumpliendo con las normativas de la DGII.",
    },
    {
      pregunta: "¿Cómo obtengo un certificado digital?",
      respuesta:
        "Los certificados digitales se obtienen a través de entidades certificadoras autorizadas por la DGII. Debe presentar la documentación requerida y seguir el proceso de validación.",
    },
    {
      pregunta: "¿Qué hago si hay problemas de conectividad?",
      respuesta:
        "El sistema cuenta con un modo de contingencia que permite continuar operando sin conexión. Los comprobantes se envían automáticamente cuando se restablece la conexión.",
    },
    {
      pregunta: "¿Puedo personalizar el diseño de mis facturas?",
      respuesta:
        "Sí, el sistema permite personalizar colores, fuentes, logos y otros elementos visuales de sus facturas manteniendo el cumplimiento normativo.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Centro de Documentación</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encuentre toda la información necesaria para usar el sistema de facturación electrónica
          </p>
        </div>

        {/* Recursos por Categoría */}
        <div className="space-y-8">
          {recursos.map((categoria, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  {categoria.categoria}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoria.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{item.titulo}</h4>
                        <div className="flex gap-1">
                          <Badge variant="outline">{item.tipo}</Badge>
                          {item.importante && <Badge variant="destructive">Importante</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.descripcion}</p>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tutoriales en Video */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Tutoriales en Video
            </CardTitle>
            <CardDescription>Aprenda a usar el sistema con nuestros tutoriales paso a paso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutoriales.map((tutorial, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{tutorial.titulo}</h4>
                    <Badge
                      variant={
                        tutorial.nivel === "Básico"
                          ? "default"
                          : tutorial.nivel === "Intermedio"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {tutorial.nivel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{tutorial.descripcion}</p>
                  <p className="text-xs text-muted-foreground mb-3">Duración: {tutorial.duracion}</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Video className="h-4 w-4 mr-2" />
                    Ver Tutorial
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-medium mb-2">{item.pregunta}</h4>
                  <p className="text-sm text-muted-foreground">{item.respuesta}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enlaces Útiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                DGII
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Portal oficial de la Dirección General de Impuestos Internos
              </p>
              <Button variant="outline" className="w-full bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visitar DGII
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Portal e-CF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Portal oficial para consultas de comprobantes fiscales electrónicos
              </p>
              <Button variant="outline" className="w-full bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                Consultar e-CF
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Estado del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Verifique el estado actual de los servicios de la DGII
              </p>
              <Button variant="outline" className="w-full bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Estado
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Soporte */}
        <Card>
          <CardHeader>
            <CardTitle>¿Necesita Ayuda?</CardTitle>
            <CardDescription>Nuestro equipo de soporte está disponible para ayudarle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Soporte Telefónico</p>
                  <p className="text-sm text-muted-foreground">+1 (809) 123-4567</p>
                  <p className="text-xs text-muted-foreground">Lun-Vie 8:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Soporte por Email</p>
                  <p className="text-sm text-muted-foreground">soporte@dinvbox.com</p>
                  <p className="text-xs text-muted-foreground">Respuesta en 24 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
