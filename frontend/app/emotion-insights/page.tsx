"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { HeartPulse, Meh, Smile } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalyses, getAnalysisSummary, getSamplePosts, type AnalysisListItem, type AnalysisSummary, type SamplePost } from "@/lib/api"

const emotionMeta = {
  positive: { color: "#16a34a", badge: "bg-emerald-50 text-emerald-700", icon: Smile },
  neutral: { color: "#64748b", badge: "bg-slate-100 text-slate-700", icon: Meh },
  negative: { color: "#dc2626", badge: "bg-red-50 text-red-700", icon: HeartPulse },
} as const

function emotionStyle(label: string) {
  return emotionMeta[label as keyof typeof emotionMeta] ?? {
    color: "#6366f1",
    badge: "bg-indigo-50 text-indigo-700",
    icon: Meh,
  }
}

function formatAnalysisLabel(analysis: AnalysisListItem) {
  const date = analysis.run_at ? new Date(analysis.run_at).toLocaleString() : "Unknown date"
  return `${date} · ${analysis.total_posts} posts`
}

export default function EmotionInsightsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get("analysis_id")
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [summary, setSummary] = useState<AnalysisSummary | null>(null)
  const [samplePosts, setSamplePosts] = useState<SamplePost[]>([])
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadAnalyses() {
      try {
        const result = await getAnalyses()
        if (active) setAnalyses(result)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load analyses.")
      } finally {
        if (active) setIsLoadingAnalyses(false)
      }
    }
    void loadAnalyses()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!analysisId) {
      return
    }

    let active = true
    Promise.all([getAnalysisSummary(analysisId), getSamplePosts(analysisId)])
      .then(([nextSummary, nextPosts]) => {
        if (active) {
          setSummary(nextSummary)
          setSamplePosts(nextPosts)
        }
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load emotion insights.")
      })
      .finally(() => {
        if (active) setIsLoadingData(false)
      })

    return () => {
      active = false
    }
  }, [analysisId])

  const breakdown = summary?.emotion_breakdown ?? {}
  const total = summary?.total_posts ?? 0
  const isDataLoading = isLoadingData || (!error && Boolean(analysisId) && summary?.analysis_id !== analysisId)
  const chartData = Object.entries(breakdown).map(([name, value]) => ({ name, value }))
  const percentage = (label: string) => total ? Math.round(((breakdown[label] ?? 0) / total) * 100) : 0

  function selectAnalysis(value: string) {
    setError(null)
    router.push(`/emotion-insights?analysis_id=${encodeURIComponent(value)}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">Analysis workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Emotion Insights</h1>
          <p className="mt-1 text-sm text-slate-500">See how the conversation feels at a glance.</p>
        </div>
        <Select value={analysisId ?? ""} onValueChange={value => value && selectAnalysis(value)}>
          <SelectTrigger className="w-full bg-white sm:w-80">
            <SelectValue placeholder={isLoadingAnalyses ? "Loading analyses..." : "Select an analysis"} />
          </SelectTrigger>
          <SelectContent>
            {analyses.map(analysis => (
              <SelectItem key={analysis.analysis_id} value={analysis.analysis_id}>
                {formatAnalysisLabel(analysis)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!analysisId ? (
        <Card className="border-dashed border-slate-300 bg-white shadow-sm">
          <CardContent className="flex min-h-72 items-center justify-center p-6 text-center">
            <div className="max-w-sm space-y-2">
              <HeartPulse className="mx-auto size-8 text-indigo-400" />
              <h2 className="font-semibold text-slate-950">Select an analysis to begin</h2>
              <p className="text-sm text-slate-500">Choose a completed analysis above to explore its emotional tone and sample comments.</p>
            </div>
          </CardContent>
        </Card>
      ) : isDataLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["positive", "neutral", "negative"].map(label => <Skeleton key={label} className="h-28" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["positive", "neutral", "negative"] as const).map(label => {
              const meta = emotionStyle(label)
              const Icon = meta.icon
              return (
                <Card key={label} className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`flex size-11 items-center justify-center rounded-full ${meta.badge}`}><Icon className="size-5" /></div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
                      <p className="text-2xl font-bold text-slate-950">{percentage(label)}%</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader><CardTitle>Emotion distribution</CardTitle></CardHeader>
              <CardContent className="h-80">
                {chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                        {chartData.map(entry => <Cell key={entry.name} fill={emotionStyle(entry.name).color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex h-full items-center justify-center text-sm text-slate-400">No emotion data available.</div>}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader><CardTitle>Sample comments</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {samplePosts.length ? samplePosts.map(post => {
                  const label = post.emotion?.label?.toLowerCase() ?? "unknown"
                  const meta = emotionStyle(label)
                  return (
                    <div key={post.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <Badge className={meta.badge}>{label}</Badge>
                        {post.emotion?.confidence != null && <span className="text-xs text-slate-400">{Math.round(post.emotion.confidence * 100)}%</span>}
                      </div>
                      <p className="line-clamp-3 text-sm leading-5 text-slate-600">{post.clean_text}</p>
                    </div>
                  )
                }) : <p className="text-sm text-slate-500">No cleaned comments are available for this analysis.</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}