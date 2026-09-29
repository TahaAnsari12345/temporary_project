import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type Accent = "blue" | "yellow" | "purple" | "green"

type KpiCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  accent: Accent
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

const accentStyles: Record<Accent, string> = {
  blue: "bg-blue-100 text-blue-600",
  yellow: "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-emerald-100 text-emerald-600",
}

export function KpiCard({ title, value, icon: Icon, accent, trend }: Readonly<KpiCardProps>) {
  const TrendIcon = trend?.direction === "down" ? ArrowDown : ArrowUp

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex min-h-40 flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex size-10 items-center justify-center rounded-full ${accentStyles[accent]}`}>
            <Icon className="size-5" />
          </div>
          {trend && (
            <Badge
              className={
                trend.direction === "up"
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  : "bg-red-50 text-red-700 hover:bg-red-50"
              }
            >
              <TrendIcon />
              {trend.value}%
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}