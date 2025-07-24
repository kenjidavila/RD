"use client"
import { useState, useEffect, useCallback } from "react"
import { fetchEmpresaConfig, type EmpresaConfig } from "@/lib/helpers/empresa-config"
import { createClient } from "@/utils/supabase/client"

const CACHE_KEY = "empresa_profile"

export function useEmpresaConfig() {
  const [empresa, setEmpresa] = useState<EmpresaConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !user.id) {
        setEmpresa(null)
        localStorage.removeItem(CACHE_KEY)
        return
      }

      const data = await fetchEmpresaConfig()
      setEmpresa(data)
      if (data) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        } catch {
          /* ignore */
        }
      } else {
        localStorage.removeItem(CACHE_KEY)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        setEmpresa(JSON.parse(stored))
      }
    } catch {
      /* ignore */
    }
    load()
  }, [load])

  return { empresa, loading, refresh: load }
}
