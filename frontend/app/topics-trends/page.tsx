"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, BarChart3, TrendingUp } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalyses, getTrends, type AnalysisListItem, type TrendsResult } from "@/lib/api"

function formatAnalysisLabel(analysis: AnalysisListItem) {
  const date = analysis.run_at ? new Date(analysis.run_at).toLocaleString() : "Unknown date"
  return `${date} · ${analysis.total_posts} posts`
}

export default function TopicsTrendsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get("analysis_id")
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [trends, setTrends] = useState<TrendsResult | null>(null)
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getAnalyses()
      .then(result => {
        if (active) setAnalyses(result)
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load analyses.")
      })
      .finally(() => {
        if (active) setIsLoadingAnalyses(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!analysisId) return

    let active = true
    getTrends(analysisId)
      .then(result => {
        if (active) setTrends(result)
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load topics and trends.")
      })
    return () => {
      active = false
    }
  }, [analysisId])

  function selectAnalysis(value: string) {
    setError(null)
    router.push(`/topics-trends?analysis_id=${encodeURIComponent(value)}`)
  }

  const topics = trends?.topics ?? []
  const isLoading = !error && Boolean(analysisId) && trends?.analysis_id !== analysisId

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Analysis workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Topics &amp; Trends</h1>
          <p className="mt-1 text-sm text-slate-500">See what the conversation is centered on and where it is moving.</p>
        </div>
        <Select value={analysisId ?? ""} onValueChange={value => value && selectAnalysis(value)}>
          <SelectTrigger className="w-full bg-white sm:w-80">
            <SelectValue placeholder={isLoadingAnalyses ? "Loading analyses..." : "Select an analysis"} />
          </SelectTrigger>
          <SelectContent>
            {analyses.map(analysis => (
              <SelectItem key={analysis.analysis_id} value={analysis.analysis_id}>{formatAnalysisLabel(analysis)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!analysisId ? (
        <Card className="border-dashed border-slate-300 bg-white shadow-sm">
          <CardContent className="flex min-h-72 items-center justify-center p-6 text-center">
            <div className="max-w-sm space-y-2">
              <BarChart3 className="mx-auto size-8 text-indigo-400" />
              <h2 className="font-semibold text-slate-950">Select an analysis to begin</h2>
              <p className="text-sm text-slate-500">Choose a completed analysis above to explore its topics and movement.</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6"><Skeleton className="h-[28rem]" /><Skeleton className="h-64" /></div>
      ) : (
        <>
          {trends?.note && <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{trends.note}</div>}
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader><CardTitle>All topics by volume</CardTitle></CardHeader>
            <CardContent className="h-[min(70vh,38rem)] min-h-80">
              {topics.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topics} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                    <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                    <YAxis type="category" dataKey="label" width={100} stroke="#64748b" fontSize={12} tickLine={false} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="size" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="flex h-full items-center justify-center text-sm text-slate-400">No topics found for this analysis.</div>}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader><CardTitle>Trending topics</CardTitle></CardHeader>
            <CardContent>
              {trends?.trending_topics.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {trends.trending_topics.map(topic => {
                    const rising = topic.direction === "up"
                    return (
                      <div key={topic.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="flex min-w-0 items-center gap-2"><TrendingUp className="size-4 shrink-0 text-indigo-500" /><span className="truncate text-sm font-medium text-slate-700">{topic.label}</span></div>
                        <Badge className={rising ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-red-50 text-red-700 hover:bg-red-50"}>
                          {rising ? <ArrowUp /> : <ArrowDown />}{topic.growth}%
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{trends?.note ?? "No topic movement is available for this analysis."}</div>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}