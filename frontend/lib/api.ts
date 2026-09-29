export type AnalysisResult = {
  analysis_id: string
  total_collected: number
  total_cleaned: number
  language_breakdown: Record<string, number>
  emotion_breakdown: Record<string, number>
}

import { authFetch } from "@/lib/auth"

export type AnalysisSummary = {
  analysis_id: string
  total_posts: number
  emotion_breakdown: Record<string, number>
}

export type SamplePost = {
  id: string
  clean_text: string
  emotion: { label?: string; confidence?: number } | null
}

async function readApiError(response: Response): Promise<string> {
  try {
    const error = (await response.json()) as { detail?: string; message?: string }
    return error.detail ?? error.message ?? `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const response = await authFetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform: "youtube", url }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return (await response.json()) as AnalysisResult
}

export async function getAnalysisSummary(analysisId: string): Promise<AnalysisSummary> {
  const response = await authFetch(`/api/analyses/${encodeURIComponent(analysisId)}/summary`)
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return (await response.json()) as AnalysisSummary
}

export async function getSamplePosts(analysisId: string): Promise<SamplePost[]> {
  const response = await authFetch(`/api/analyses/${encodeURIComponent(analysisId)}/sample-posts`)
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return (await response.json()) as SamplePost[]
}

export type AnalysisListItem = {
  analysis_id: string
  run_at: string | null
  total_posts: number
  dominant_emotion: string | null
}

export async function getAnalyses(): Promise<AnalysisListItem[]> {
  const response = await authFetch("/api/analyses")
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return (await response.json()) as AnalysisListItem[]
}

export type TrendTopic = {
  label: string
  size: number
}

export type TrendingTopic = {
  label: string
  growth: number
  direction: "up" | "down"
}

export type TrendsResult = {
  analysis_id: string
  topics: TrendTopic[]
  trending_topics: TrendingTopic[]
  note: string | null
}

export async function getTrends(analysisId: string): Promise<TrendsResult> {
  const response = await authFetch(`/api/trends/${encodeURIComponent(analysisId)}`)
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return (await response.json()) as TrendsResult
}