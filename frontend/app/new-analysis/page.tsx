"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { analyzeUrl } from "@/lib/api"

const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+$/i
const blueskyPostPattern = /^https:\/\/bsky\.app\/profile\/[^/\s]+\/post\/[^/\s]+$/i
const blueskySearchPattern = /^(?!https?:\/\/)(?=.{1,100}$)(?:#?[\p{L}\p{N}_-]+(?:[ \t]+#?[\p{L}\p{N}_-]+)*)$/u

const analysisSchema = z.object({
  platform: z.enum(["youtube", "bluesky"], { message: "Select a platform." }),
  url: z.string().trim().min(1, "Enter a URL or search term."),
}).superRefine((values, context) => {
  const matchesPlatform = values.platform === "youtube"
    ? youtubePattern.test(values.url)
    : blueskyPostPattern.test(values.url) || blueskySearchPattern.test(values.url)

  if (!matchesPlatform) {
    context.addIssue({
      code: "custom",
      path: ["url"],
      message: values.platform === "youtube"
        ? "Enter a YouTube video URL."
        : "Enter a Bluesky post URL or a keyword/hashtag.",
    })
  }
})

type AnalysisFormValues = z.infer<typeof analysisSchema>

const stages = [
  "Collecting posts",
  "Cleaning data",
  "Detecting language",
  "Analyzing emotion & topics",
  "Generating insights",
]

export default function NewAnalysisPage() {
  const router = useRouter()
  const [activeStage, setActiveStage] = useState(-1)
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([])
  const form = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisSchema),
    defaultValues: { platform: "youtube", url: "" },
  })
  const platform = useWatch({ control: form.control, name: "platform" })

  useEffect(() => {
    return () => timerIds.current.forEach(clearTimeout)
  }, [])

  function stopProgress() {
    timerIds.current.forEach(clearTimeout)
    timerIds.current = []
  }

  async function onSubmit(values: AnalysisFormValues) {
    stopProgress()
    setActiveStage(0)
    stages.slice(1).forEach((_, index) => {
      const timer = setTimeout(() => setActiveStage(index + 1), (index + 1) * 1500)
      timerIds.current.push(timer)
    })

    try {
      await analyzeUrl(values.platform, values.url)
      stopProgress()
      setActiveStage(stages.length)
      toast.add({ title: "Analysis complete!", type: "success" })
      router.push("/dashboard")
    } catch (error) {
      stopProgress()
      setActiveStage(-1)
      toast.add({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unable to complete the analysis.",
        type: "error",
      })
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-2 border-b border-slate-100 p-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">Start a New Analysis</CardTitle>
          <p className="text-sm leading-6 text-slate-500">
            Paste a YouTube video or Reddit thread URL to analyze emotions, topics, and trends.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)} className="space-y-6">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Choose a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="bluesky">Bluesky</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder={platform === "youtube" ? "https://youtube.com/watch?v=..." : "Paste a bsky.app post URL, or type a keyword/hashtag to search"}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormDescription>We will collect and analyze publicly available posts.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeStage >= 0 && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Analysis progress</p>
                  <ol className="space-y-3">
                    {stages.map((stage, index) => {
                      const complete = activeStage > index
                      const active = activeStage === index
                      return (
                        <li key={stage} className={`flex items-center gap-3 text-sm ${active || complete ? "text-indigo-700" : "text-slate-400"}`}>
                          <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${complete ? "border-indigo-600 bg-indigo-600 text-white" : active ? "border-indigo-600" : "border-slate-300"}`}>
                            {complete ? <Check className="size-3" /> : index + 1}
                          </span>
                          {stage}
                          {active && <Loader2 className="ml-auto size-4 animate-spin" />}
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                Fetch & Analyze
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}