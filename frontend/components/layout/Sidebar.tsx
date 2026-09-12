"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "New Analysis", href: "/new-analysis", icon: Plus },
  { label: "Emotion Insights", href: "/emotion-insights", icon: BrainCircuit },
  { label: "Topics & Trends", href: "/topics-trends", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
]

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/30">
        <Sparkles className="size-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-white">
            SocialSense
          </p>
          <p className="text-[11px] text-slate-400">Social intelligence</p>
        </div>
      )}
    </div>
  )
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = href === "/" ? pathname === href : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={`group flex h-10 items-center gap-3 rounded-r-lg border-l-2 px-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-indigo-400 bg-indigo-500/15 text-white"
                : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Icon className={`size-[18px] shrink-0 ${isActive ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300"}`} />
            {!collapsed && <span>{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({
  collapsed = false,
  onToggle,
  mobile = false,
}: {
  collapsed?: boolean
  onToggle?: () => void
  mobile?: boolean
}) {
  return (
    <aside
      className={`${
        mobile
          ? "flex h-full w-full"
          : "fixed inset-y-0 left-0 z-40 hidden lg:flex"
      } flex-col bg-slate-950 text-slate-100 transition-[width] duration-200 ${
        collapsed && !mobile ? "w-20" : "w-64"
      }`}
    >
      <SidebarBrand collapsed={collapsed && !mobile} />
      <SidebarNav collapsed={collapsed && !mobile} />
      {!mobile && onToggle && (
        <div className="border-t border-white/10 p-3">
          <Button
            type="button"
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`text-slate-400 hover:bg-white/5 hover:text-white ${collapsed ? "mx-auto" : "w-full justify-start"}`}
          >
            <ChevronLeft className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse sidebar</span>}
          </Button>
        </div>
      )}
    </aside>
  )
}