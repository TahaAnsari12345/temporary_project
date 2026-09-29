"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"

import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  useEffect(() => {
    if (!isAuthPage && !isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthPage, isLoading, pathname, router, user])

  if (isAuthPage) {
    return children
  }

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading SocialSense...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 border-0 bg-slate-950 p-0 sm:max-w-xs lg:hidden">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>
      <div className={`transition-[margin] duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}