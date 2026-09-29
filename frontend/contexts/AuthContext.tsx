"use client"

import { createContext, useContext, useEffect, useState } from "react"

import { authFetch, clearToken, getToken, setToken, type AuthResponse, type AuthUser } from "@/lib/auth"

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  setSession: (result: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; message?: string }
    return body.detail ?? body.message ?? `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!getToken()) {
        setIsLoading(false)
        return
      }

      try {
        const response = await authFetch("/api/auth/me")
        if (!response.ok) {
          clearToken()
          return
        }
        setUser((await response.json()) as AuthUser)
      } catch {
        clearToken()
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [])

  async function login(email: string, password: string) {
    const body = new URLSearchParams({ username: email, password })
    const response = await authFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
    if (!response.ok) {
      throw new Error(await readError(response))
    }

    const result = (await response.json()) as AuthResponse
    setSession(result)
    return result.user
  }

  function setSession(result: AuthResponse) {
    setToken(result.access_token)
    setUser(result.user)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, setSession, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}