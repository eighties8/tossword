// src/hooks/useDailyPuzzle.ts
"use client"

import { useEffect, useMemo, useState } from "react"

// ⬇️ PRIVATE clues: bundled at build time, not fetched over HTTP
import rawClues from "@/lib/clues.json"

// Types the game already expects
export type DailyPuzzle = {
  date: string          // "YYYY-MM-DD"
  root: string          // "OCEAN"
  mystery: string       // "FIELD"
}

type PuzzlesFile = DailyPuzzle[]

// Normalize clues -> lowercased key lookups
const clueMap: Record<string, string> = (() => {
  const source = (rawClues as any)?.clues ?? rawClues
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(source)) {
    out[String(k).toLowerCase()] = String(v)
  }
  return out
})()

/** Eastern (New York) “calendar day” string so your countdown + puzzle day align */
function todayInET(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  // en-CA returns YYYY-MM-DD already
  return fmt.format(new Date())
}

/** Choose puzzles file for a given year (supports 2025 now; easy to expand) */
function puzzlesPathForYear(year: number) {
  return `/puzzles-${year}.json` // served from /public
}

/** Safe JSON fetch with short-circuiting/caching by the browser */
async function fetchPuzzles(path: string): Promise<PuzzlesFile> {
  const res = await fetch(path, { cache: "force-cache" })
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json()
}

export function useDailyPuzzle() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [puzzles, setPuzzles] = useState<PuzzlesFile>([])

  const year = useMemo(() => {
    const y = Number(todayInET().slice(0, 4))
    return Number.isFinite(y) ? y : 2025
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPuzzles(puzzlesPathForYear(year))
      .then((data) => {
        if (!cancelled) setPuzzles(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [year])

  // Pick today’s puzzle by ET date (exact match on "date" field)
  const puzzleForToday: DailyPuzzle | null = useMemo(() => {
    if (!puzzles.length) return null
    const today = todayInET()
    const match = puzzles.find((p) => p.date === today)
    if (match) return match

    // Fallbacks that won’t affect animations:
    // 1) If we’re past the last built day, show the last available (keeps UI stable)
    // 2) Otherwise, first available (useful during bring-up)
    const sorted = [...puzzles].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    const last = sorted[sorted.length - 1]
    const first = sorted[0]
    return last?.date < today ? last : first ?? null
  }, [puzzles])

  // Clue lookup (private, from build-time import)
  const getClue = (word: string | null | undefined): string | null => {
    if (!word) return null
    return clueMap[word.toLowerCase()] ?? null
  }

  return {
    loading,
    error,
    puzzle: puzzleForToday,       // { date, root, mystery } | null
    getClue,                      // (word) => string | null
    hasClues: Object.keys(clueMap).length > 0,
  }
}