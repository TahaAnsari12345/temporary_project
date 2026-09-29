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
import { authFetch, type AuthResponse } from "@/lib/auth"
import { useAuth } from "@/contexts/AuthContext"

const signupSchema = z.object({
  name: z.string().trim().max(100, "Name is too long.").optional(),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const form = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(values: SignupValues) {
    try {
      const response = await authFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const error = (await response.json()) as { detail?: string }
        throw new Error(error.detail ?? `Sign up failed (${response.status})`)
      }
      const result = (await response.json()) as AuthResponse
      setSession(result)
      router.push("/")
    } catch (error) {
      toast.add({
        title: "Unable to sign up",
        description: error instanceof Error ? error.message : "Please try again.",
        type: "error",
      })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-2 border-b border-slate-100 p-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">Create your account</CardTitle>
          <p className="text-sm text-slate-500">Start building your SocialSense workspace.</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}