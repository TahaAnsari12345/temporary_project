"use client"

import { useEffect, useState } from "react"
import { Globe, MessageSquare, Smile, TrendingUp } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { getAnalyses, getAnalysisSummary, getTrends, type AnalysisListItem, type AnalysisSummary, type TrendsResult } from "@/lib/api"

const emotionColors: Record<string, string> = { positive: "#16a34a", neutral: "#64748b", negative: "#dc2626" }

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get("analysis_id")
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [summary, setSummary] = useState<AnalysisSummary | null>(null)
  const [trends, setTrends] = useState<TrendsResult | null>(null)
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getAnalyses().then(result => {
      if (!active) return
      setAnalyses(result)
      if (!analysisId && result[0]) router.replace(`/?analysis_id=${encodeURIComponent(result[0].analysis_id)}`)
    }).catch(loadError => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load analyses.")
    }).finally(() => {
      if (active) setIsLoadingAnalyses(false)
    })
    return () => { active = false }
  }, [analysisId, router])

  useEffect(() => {
    if (!analysisId) return
    let active = true
    Promise.all([getAnalysisSummary(analysisId), getTrends(analysisId)]).then(([nextSummary, nextTrends]) => {
      if (active) {
        setSummary(nextSummary)
        setTrends(nextTrends)
      }
    }).catch(loadError => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this analysis.")
    })
    return () => { active = false }
  }, [analysisId])

  const isLoading = Boolean(analysisId) && !error && summary?.analysis_id !== analysisId
  const emotionBreakdown = summary?.emotion_breakdown ?? {}
  const emotionData = Object.entries(emotionBreakdown).map(([name, value]) => ({ name, value }))
  const topicData = trends?.topics.slice(0, 8) ?? []
  const dominantEmotion = Object.entries(emotionBreakdown).sort(([, first], [, second]) => second - first)[0]
  const dominantLabel = dominantEmotion?.[0] ?? "No data"
  const dominantPercent = dominantEmotion && summary?.total_posts ? Math.round((dominantEmotion[1] / summary.total_posts) * 100) : 0
  const topTopic = trends?.topics[0]?.label ?? "No topics yet"

  if (!analysisId && !isLoadingAnalyses && analyses.length === 0) {
    return <div className="space-y-6"><div><p className="text-sm font-medium text-indigo-600">Overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1></div><Card className="border-dashed border-slate-300 bg-white shadow-sm"><CardContent className="flex min-h-72 items-center justify-center p-6 text-center"><div className="max-w-sm space-y-2"><MessageSquare className="mx-auto size-8 text-indigo-400" /><h2 className="font-semibold text-slate-950">Your dashboard is ready</h2><p className="text-sm text-slate-500">Run your first YouTube analysis to see real emotions, topics, and trends here.</p></div></CardContent></Card></div>
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-indigo-600">Overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Live results from your selected SocialSense analysis.</p></div>{analysisId && <p className="font-mono text-xs text-slate-400">{analysisId}</p>}</div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {isLoading ? <div className="space-y-6"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{["one", "two", "three", "four"].map(item => <Skeleton key={item} className="h-40" />)}</div><Skeleton className="h-96" /></div> : <>
      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><KpiCard title="Posts Analyzed" value={summary?.total_posts ?? 0} icon={MessageSquare} accent="blue" /><KpiCard title="Dominant Emotion" value={`${dominantLabel} (${dominantPercent}%)`} icon={Smile} accent="yellow" /><KpiCard title="Top Topic" value={topTopic} icon={TrendingUp} accent="purple" /><KpiCard title="Topics Found" value={trends?.topics.length ?? 0} icon={Globe} accent="green" /></section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><Card className="border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle>Emotion mix</CardTitle></CardHeader><CardContent className="h-80">{emotionData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={emotionData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={3}>{emotionData.map(item => <Cell key={item.name} fill={emotionColors[item.name] ?? "#6366f1"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No emotion data yet.</div>}</CardContent></Card><Card className="border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle>Topic volume</CardTitle></CardHeader><CardContent className="h-80">{topicData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={topicData} layout="vertical" margin={{ left: 16, right: 16 }}><CartesianGrid horizontal={false} stroke="#e2e8f0" /><XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={12} /><YAxis type="category" dataKey="label" width={90} stroke="#64748b" fontSize={12} tickLine={false} /><Tooltip /><Bar dataKey="size" fill="#4f46e5" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No topic data yet.</div>}</CardContent></Card></div>
      <Card className="border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle>Trending now</CardTitle></CardHeader><CardContent>{trends?.trending_topics.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{trends.trending_topics.slice(0, 4).map(topic => <div key={topic.label} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="truncate text-sm font-medium text-slate-700">{topic.label}</span><span className={topic.direction === "up" ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-red-600"}>{topic.direction === "up" ? "+" : "-"}{topic.growth}%</span></div>)}</div> : <p className="text-sm text-slate-500">{trends?.note ?? "Trend data will appear when there is enough time spread."}</p>}</CardContent></Card>
    </>}
  </div>
}