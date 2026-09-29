"use client"

import { createContext, startTransition, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("socialsense_theme")
    const nextTheme: Theme = savedTheme === "dark" ? "dark" : "light"
    startTransition(() => setThemeState(nextTheme))
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }, [])

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme)
    window.localStorage.setItem("socialsense_theme", nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}