"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/contexts/AuthContext"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password)
      router.push("/")
    } catch (error) {
      toast.add({
        title: "Unable to log in",
        description: error instanceof Error ? error.message : "Please check your credentials.",
        type: "error",
      })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-2 border-b border-slate-100 p-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">Welcome back</CardTitle>
          <p className="text-sm text-slate-500">Sign in to continue to SocialSense.</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account? <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}