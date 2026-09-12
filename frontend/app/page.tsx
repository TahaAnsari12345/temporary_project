import { Globe, MessageSquare, Smile, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/KpiCard"

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Overview</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">A quick pulse check on your social intelligence.</p>
      </div>

      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Posts Analyzed"
          value={1284}
          icon={MessageSquare}
          trend={{ value: 8, direction: "up" }}
          accent="blue"
        />
        <KpiCard
          title="Dominant Emotion"
          value="Joy (42%)"
          icon={Smile}
          trend={{ value: 5, direction: "up" }}
          accent="yellow"
        />
        <KpiCard
          title="Top Trending Topic"
          value="Pricing"
          icon={TrendingUp}
          trend={{ value: 23, direction: "up" }}
          accent="purple"
        />
        <KpiCard title="Languages Detected" value={6} icon={Globe} accent="green" />
      </section>

      <Card className="min-h-80 border-dashed border-slate-300 bg-white shadow-sm">
        <CardContent className="flex min-h-80 items-center justify-center p-6">
          <p className="text-sm font-medium text-slate-400">Charts coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}
