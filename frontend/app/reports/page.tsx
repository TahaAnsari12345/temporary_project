"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { FileText, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalyses, type AnalysisListItem } from "@/lib/api"

const emotionStyles: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  neutral: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  negative: "bg-red-50 text-red-700 hover:bg-red-50",
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Unknown date"
}

function emotionBadge(label: string | null) {
  const normalized = label?.toLowerCase() ?? "unknown"
  return <Badge className={emotionStyles[normalized] ?? "bg-indigo-50 text-indigo-700 hover:bg-indigo-50"}>{normalized}</Badge>
}

export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getAnalyses()
      .then(result => {
        if (active) setAnalyses(result)
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load reports.")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-600">History</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Review analyses you have run and return to any result.</p>
        </div>
        <Button render={<Link href="/new-analysis" />} nativeButton={false} className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus />
          New analysis
        </Button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isLoading ? (
        <div className="space-y-3">
          {["one", "two", "three"].map(item => <Skeleton key={item} className="h-20" />)}
        </div>
      ) : analyses.length === 0 ? (
        <Card className="border-dashed border-slate-300 bg-white shadow-sm">
          <CardContent className="flex min-h-72 items-center justify-center p-6 text-center">
            <div className="max-w-sm space-y-3">
              <FileText className="mx-auto size-8 text-indigo-400" />
              <h2 className="font-semibold text-slate-950">You haven&apos;t run any analyses yet</h2>
              <p className="text-sm text-slate-500">Start with a YouTube video and your completed runs will appear here.</p>
              <Button render={<Link href="/new-analysis" />} nativeButton={false} variant="outline">Run an analysis</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle>Past analyses</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="hidden grid-cols-[minmax(0,1fr)_10rem_8rem_6rem] gap-4 border-y border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 md:grid">
              <span>Run</span><span>Date</span><span>Dominant emotion</span><span />
            </div>
            <div className="divide-y divide-slate-100">
              {analyses.map(analysis => (
                <div key={analysis.analysis_id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_10rem_8rem_6rem] md:items-center md:gap-4 md:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{analysis.analysis_id}</p>
                    <p className="mt-1 text-xs text-slate-500">{analysis.total_posts} posts</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatDate(analysis.run_at)}</p>
                  <div>{emotionBadge(analysis.dominant_emotion)}</div>
                  <Button render={<Link href={`/?analysis_id=${encodeURIComponent(analysis.analysis_id)}`} />} nativeButton={false} variant="outline" size="sm">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}