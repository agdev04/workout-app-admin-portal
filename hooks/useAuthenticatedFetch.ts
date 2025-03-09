"use client"

import { useState, useCallback } from "react"
import { getToken, isTokenValid, removeToken } from "@/utils/auth"
import { useRouter } from "next/navigation"

interface FetchOptions extends RequestInit {
  requireAuth?: boolean
}

export const useAuthenticatedFetch = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  const authFetch = useCallback(
    async (url: string, options: FetchOptions = {}) => {
      setIsLoading(true)
      setError(null)

      try {
        if (options.requireAuth !== false && !isTokenValid()) {
          // Since token refresh is no longer available, we'll redirect to login
          removeToken()
          router.push("/login")
          throw new Error("Authentication failed")
        }

        const token = getToken()
        const headers = new Headers(options.headers || {})
        if (token) {
          headers.set("Authorization", `Bearer ${token}`)
          // Also set cookie if not already present
          if (!document.cookie.includes("authToken=")) {
            document.cookie = `authToken=${token}; path=/; max-age=86400`
          }
        }

        const response = await fetch(url, { ...options, headers })

        if (response.status === 401) {
          removeToken()
          router.push("/login")
          throw new Error("Authentication failed")
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `Request failed with status ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        const error = err instanceof Error ? err : new Error("An unknown error occurred")
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [router],
  )

  return { authFetch, isLoading, error }
}

