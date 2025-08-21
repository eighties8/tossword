"use client"

import { useEffect, useState } from "react"

// ⬇️ PRIVATE clues: bundled at build time, not fetched over HTTP
import rawClues from "@/lib/clues.json"

type Puzzle = { root: string; mystery: string }

// Normalize clues -> lowercased key lookups
const clueMap: Record<string, string> = (() => {
  const source = (rawClues as any)?.clues ?? rawClues
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(source)) {
    out[String(k).toLowerCase()] = String(v)
  }
  return out
})()

export function useDailyPuzzle() {
  const [loading, setLoading] = useState(true)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch("/api/puzzle", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setPuzzle({
          root: String(data.root || "").toUpperCase(),
          mystery: String(data.mystery || "").toUpperCase(),
        })
      } catch (e: any) {
        if (controller.signal.aborted) return
        setError(e?.message ?? "Failed to load puzzle")
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [])

  // Clue lookup (private, from build-time import)
  const getClue = (word: string | null | undefined): string | null => {
    if (!word) return null
    return clueMap[word.toLowerCase()] ?? null
  }

  return {
    loading,
    puzzle,
    error,
    getClue,
    hasClues: Object.keys(clueMap).length > 0,
  }
}