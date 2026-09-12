export type AnalysisResult = {
  [key: string]: unknown
}

export async function analyzeUrl(platform: string, url: string): Promise<AnalysisResult> {
  const response = await fetch("http://localhost:8000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, url }),
  })

  if (!response.ok) {
    let message = `Analysis failed (${response.status})`
    try {
      const error = (await response.json()) as { detail?: string; message?: string }
      message = error.detail ?? error.message ?? message
    } catch {
      // Keep the status-based message when the server response is not JSON.
    }
    throw new Error(message)
  }

  return (await response.json()) as AnalysisResult
}