"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/utils/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Edit, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthService, type AuthUser } from "@/lib/auth"
import { useConfiguracionTabs } from "./configuracion-tabs-context"
import { useEmpresa } from "@/components/empresa-context"

interface NewUser {
  nombre: string
  email: string
  password: string
  rol: "admin" | "usuario" | "contador"
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<AuthUser[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)
  const [newUser, setNewUser] = useState<NewUser>({
    nombre: "",
    email: "",
    password: "",
    rol: "usuario",
  })
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const supabase = createClient()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { toast } = useToast()
  const authService = getAuthService()
  const { reportError, reportSuccess } = useConfiguracionTabs()
  const { empresaId } = useEmpresa()

  const displayedUsers = usuarios.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  // Ajustar la página actual si la cantidad de usuarios cambia
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(usuarios.length / pageSize))
    setPage((p) => Math.min(p, totalPages))
  }, [usuarios.length])

  useEffect(() => {
    const stored = localStorage.getItem("usuarios")
    if (stored) {
      try {
        setUsuarios(JSON.parse(stored))
      } catch {
        /* ignore */
      }
    }
    cargarUsuarios()
    cargarUsuarioActual()
  }, [])

  const cargarUsuarioActual = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (user) {
        const userData = await authService.getUserData(user.id)
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error("Error cargando usuario actual:", error)
    }
  }

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const user = await authService.getCurrentUser()
      if (!user) return

      const userData = await authService.getUserData(user.id)
      if (!userData?.empresa_id) return

      const result = await authService.getUsers(userData.empresa_id)
      if (result.success) {
        setUsuarios(result.data || [])
        localStorage.setItem("usuarios", JSON.stringify(result.data || []))
        reportSuccess("usuarios")
      } else {
        localStorage.removeItem("usuarios")
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        reportError("usuarios")
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      localStorage.removeItem("usuarios")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
      reportError("usuarios")
  } finally {
      setLoading(false)
  }
}

  const validateFields = () => {
    if (!newUser.nombre.trim() || !newUser.email.trim() || !newUser.rol) {
      toast({
        title: "Campos requeridos",
        description: "Nombre, email y rol son obligatorios",
        variant: "destructive",
      })
      reportError("usuarios")
      return false
    }

    if (!/^\S+@\S+\.\S+$/.test(newUser.email)) {
      toast({
        title: "Correo inválido",
        description: "Ingrese un correo electrónico válido",
        variant: "destructive",
      })
      reportError("usuarios")
      return false
    }

    const empresaRef = empresaId || currentUser?.empresa_id
    if (!empresaRef) {
      toast({
        title: "Empresa no identificada",
        description: "No se pudo identificar la empresa",
        variant: "destructive",
      })
      reportError("usuarios")
      return false
    }

    if (!editingUser && newUser.password.trim().length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      reportError("usuarios")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (saving) return
    setSaving(true)

    if (!validateFields()) {
      setSaving(false);
      return;
    }

    const empresaRef = empresaId || currentUser?.empresa_id

    // Validar duplicidad de email localmente
    if (
      usuarios.some(
        (u) =>
          u.email.toLowerCase() === newUser.email.toLowerCase() &&
          (!editingUser || u.id !== editingUser.id),
      )
    ) {
      toast({
        title: "Error",
        description: "Ya existe un usuario con ese correo electrónico",
        variant: "destructive",
      })
      reportError("usuarios")
      setSaving(false)
      return
    }

    // Validar duplicidad de email en Supabase
    try {
      const { data: existing } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", newUser.email)
        .maybeSingle()
      if (existing && (!editingUser || editingUser.id !== existing.id)) {
        toast({
          title: "Correo duplicado",
          description: "Ya existe un usuario con ese correo electrónico",
          variant: "destructive",
        })
        reportError("usuarios")
        setSaving(false)
        return
      }
    } catch (err) {
      // ignore error and let backend handle
    }

    if (
      editingUser &&
      newUser.nombre === editingUser.nombre &&
      newUser.email === editingUser.email &&
      newUser.rol === editingUser.rol &&
      !newUser.password.trim()
    ) {
      toast({
        title: "Sin cambios",
        description: "No se realizaron modificaciones",
      })
      setSaving(false)
      return
    }

    if (!empresaRef) {
      toast({
        title: "Error",
        description: "No se pudo identificar la empresa",
        variant: "destructive",
      })
      reportError("usuarios")
      setSaving(false)
      return
    }

    try {
      if (editingUser) {
        if (
          editingUser.id === currentUser?.id &&
          currentUser.rol === "admin"
        ) {
          toast({
            title: "Acción no permitida",
            description: "No puede modificar su propio usuario administrador",
            variant: "destructive",
          })
          reportError("usuarios")
          setSaving(false)
          return
        }
        if (newUser.rol !== editingUser.rol) {
          const confirmed = confirm("¿Confirma el cambio de rol del usuario?")
          if (!confirmed) {
            setSaving(false)
            return
          }
        }
        // Actualizar usuario existente
        const result = await authService.updateUser(editingUser.id, {
          nombre: newUser.nombre,
          email: newUser.email,
          rol: newUser.rol,
          empresa_id: empresaRef,
        })

        if (result.success) {
          toast({
            title: "Usuario actualizado",
            description: "El usuario se ha actualizado correctamente",
          })
          setSuccessMessage("Usuario actualizado correctamente")
          reportSuccess("usuarios")
          setDialogOpen(false)
          cargarUsuarios()
        } else {
          reportError("usuarios")
          throw new Error(result.error)
        }
      } else {
        // Crear nuevo usuario
        const result = await authService.signUp(newUser.email, newUser.password, {
          nombre: newUser.nombre,
          rol: newUser.rol,
          empresa_id: empresaRef,
        })

        if (result.success) {
          toast({
            title: "Usuario creado",
            description: "El usuario se ha creado correctamente",
          })
          setSuccessMessage("Usuario creado correctamente")
          reportSuccess("usuarios")
          setDialogOpen(false)
          cargarUsuarios()
        } else {
          reportError("usuarios")
          throw new Error(result.error)
        }
      }

      // Limpiar formulario
      setNewUser({
        nombre: "",
        email: "",
        password: "",
        rol: "usuario",
      })
      setEditingUser(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la solicitud",
        variant: "destructive",
      })
      reportError("usuarios")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (usuario: AuthUser) => {
    if (usuario.id === currentUser?.id) {
      toast({
        title: "Acción no permitida",
        description: "No puede modificar su propio usuario administrador",
        variant: "destructive",
      })
      return
    }
    setSuccessMessage(null)
    setEditingUser(usuario)
    setNewUser((prev) => ({
      ...prev,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    }))
    setDialogOpen(true)
  }

  const handleDelete = async (usuario: AuthUser) => {
    if (!confirm(`¿Está seguro de que desea desactivar al usuario ${usuario.nombre}?`)) {
      return
    }

    if (usuario.id === currentUser?.id) {
      toast({
        title: "Acción no permitida",
        description: "No puede desactivar su propio usuario administrador",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await authService.deleteUser(usuario.id)
      if (result.success) {
        toast({
          title: "Usuario desactivado",
          description: "El usuario se ha desactivado correctamente",
        })
        reportSuccess("usuarios")
        const updated = usuarios.filter((u) => u.id !== usuario.id)
        setUsuarios(updated)
        localStorage.setItem("usuarios", JSON.stringify(updated))
        cargarUsuarios()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo desactivar el usuario",
        variant: "destructive",
      })
      reportError("usuarios")
    }
  }

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "contador":
        return "bg-blue-100 text-blue-800"
      case "usuario":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case "admin":
        return "Administrador"
      case "contador":
        return "Contador"
      case "usuario":
        return "Usuario"
      default:
        return rol
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando usuarios...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administre los usuarios que tienen acceso al sistema</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingUser(null)
                  setSuccessMessage(null)
                  setNewUser({
                    nombre: "",
                    email: "",
                    password: "",
                    rol: "usuario",
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Modifique los datos del usuario" : "Complete los datos para crear un nuevo usuario"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input
                      id="nombre"
                      value={newUser.nombre}
                      onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div>
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="rol">Rol</Label>
                    <Select
                      value={newUser.rol}
                      onValueChange={(value: any) =>
                        setNewUser({ ...newUser, rol: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usuario">Usuario</SelectItem>
                        <SelectItem value="contador">Contador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingUser ? "Actualizar" : "Crear"} Usuario
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {usuarios.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No hay usuarios registrados. Cree el primer usuario para comenzar.</AlertDescription>
          </Alert>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsers.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(usuario.rol)}>{getRoleLabel(usuario.rol)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Activo</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {usuario.created_at
                      ? new Date(usuario.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(usuario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(usuario)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {usuarios.length > pageSize && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {page} de {Math.ceil(usuarios.length / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * pageSize >= usuarios.length}
              >
                Siguiente
              </Button>
            </div>
          )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
