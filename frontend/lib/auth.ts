const API_BASE_URL = "http://localhost:8000"
const TOKEN_KEY = "socialsense_access_token"

export type AuthUser = {
  id: string
  email: string
  name: string | null
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: AuthUser
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const url = input.startsWith("http") ? input : `${API_BASE_URL}${input}`
  return fetch(url, { ...init, headers })
}