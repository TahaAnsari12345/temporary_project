"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Workspace</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Personalize how SocialSense looks and feels.</p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700">
          <CardTitle className="text-slate-950 dark:text-slate-100">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Theme</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the color mode used across your workspace.</p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Choose theme">
            <Button type="button" variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className={theme === "light" ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}>
              <Sun />
              Light
            </Button>
            <Button type="button" variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}>
              <Moon />
              Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 dark:border-slate-700"><CardTitle className="text-slate-950 dark:text-slate-100">Account</CardTitle></CardHeader>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Name</p><p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{user?.name || "Not set"}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Email</p><p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{user?.email}</p></div>
        </CardContent>
      </Card>
    </div>
  )
}