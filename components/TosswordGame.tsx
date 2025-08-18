"use client"
import type { KeyboardEvent } from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import { Lightbulb, BookA, KeyRound, Crown } from "lucide-react"
import { Inter, Poppins } from "next/font/google"
import { VALID_WORDS, bidirectionalBFS, neighborsOneChangeReorder } from "@/lib/dictionary"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
})

type LetterState = "correct" | "present" | "absent"

const MYSTERY_LETTER_FADE_MS = 1000
const AFTER_FADE_BUFFER_MS = 500

interface GameState {
  mysteryWord: string
  rootWord: string
  attempts: string[]
  inputLetters: string[]
  activeIndex: number
  gameWon: boolean
  revealedLetters: boolean[]
  solutionPath: string[]
  showSolution: boolean
  errorMessage: string
  isHardMode: boolean
  showWinAnimation: boolean
  showAutoHint: boolean
  autoHintText: string
  hintShownForRow: number
  hideAttemptsDuringReveal: boolean
  showWinMessage: boolean
  // Index of the final unrevealed mystery letter to delay reveal for; null when not delaying
  finalRevealIndex: number | null
  // During win sequence, how many rows from the bottom have been revealed
  winRevealRowsShown: number
}

const PUZZLES = [
  { root: "STORM", mystery: "LIGHT" },
  { root: "GAMES", mystery: "FRONT" },
  { root: "CEDAR", mystery: "LIGHT" },
  { root: "MINES", mystery: "WORTH" },
  { root: "BREAD", mystery: "HONEY" },
  { root: "CUMIN", mystery: "DEPTH" },
  { root: "ELFIN", mystery: "GRASS" },
  { root: "SWORD", mystery: "BEACH" },
  { root: "HOUSE", mystery: "MAGIC" },
  { root: "OCEAN", mystery: "FIELD" },
  { root: "SPACE", mystery: "GRACE" },
  { root: "BRAVE", mystery: "GRAVE" },
  { root: "SMILE", mystery: "GRIME" },
]

const HARD_PUZZLES = [
  { root: "MAGIC", mystery: "FRONT" },
  { root: "DANCE", mystery: "LIGHT" },
  { root: "MUSIC", mystery: "WORTH" },
  { root: "FIELD", mystery: "GRASS" },
  { root: "MUSIC", mystery: "DEPTH" },
]

export default function TosswordGame() {
  const [debugMode, setDebugMode] = useState(false)
  const [hintTextAuto, setHintTextAuto] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [selectedPuzzle, setSelectedPuzzle] = useState<{ root: string; mystery: string } | null>(null)
  const [countdown, setCountdown] = useState<string>("")

  const [gameState, setGameState] = useState<GameState>({
    mysteryWord: "",
    rootWord: "",
    attempts: [],
    inputLetters: ["", "", "", "", ""],
    activeIndex: 0,
    gameWon: false,
    revealedLetters: [false, false, false, false, false],
    solutionPath: [],
    showSolution: false,
    errorMessage: "",
    isHardMode: false,
    showWinAnimation: false,
    showAutoHint: false,
    autoHintText: "",
    hintShownForRow: -1,
    hideAttemptsDuringReveal: false,
    showWinMessage: false,
    finalRevealIndex: null,
    winRevealRowsShown: 0,
  })

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const deletingRef = useRef(false)
  const debugModeRef = useRef(false)
  const playButtonRef = useRef<HTMLButtonElement | null>(null)

  const solutionPathCache = useRef<Map<string, string[]>>(new Map())
  const hintsCache = useRef<Map<string, number[]>>(new Map())
  const puzzleRef = useRef<HTMLDivElement | null>(null)
  const confettiFiredRef = useRef(false)
  const hasPrimedFocusRef = useRef(false)
  const focusTimersRef = useRef<number[]>([])

  const launchConfettiOverPuzzle = useCallback((durationMs: number = 1600) => {
    if (typeof window === 'undefined') return
    const container = puzzleRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(rect.width)
    canvas.height = Math.ceil(rect.height)
    canvas.style.position = 'fixed'
    canvas.style.left = `${Math.max(0, rect.left)}px`
    canvas.style.top = `${Math.max(0, rect.top)}px`
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '9999'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    if (!ctx) { document.body.removeChild(canvas); return }

    const colors = ['#10b981','#34d399','#f59e0b','#ef4444','#3b82f6','#a855f7']
    const rng = (min: number, max: number) => Math.random() * (max - min) + min
    const particles = Array.from({ length: Math.min(220, Math.max(120, Math.floor((rect.width * rect.height) / 2800))) } , () => ({
      x: rect.width / 2 + rng(-rect.width * 0.15, rect.width * 0.15),
      y: -10,
      size: rng(4, 8),
      angle: rng(0, Math.PI * 2),
      rotationSpeed: rng(-0.2, 0.2),
      vx: rng(-3.5, 3.5),
      vy: rng(-1, 0) + -rng(3, 6),
      g: rng(0.12, 0.22),
      alpha: 1,
      decay: rng(0.005, 0.012),
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.5 ? 'rect' : 'circle' as 'rect' | 'circle',
    }))

    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.vy += p.g
        p.x += p.vx
        p.y += p.vy
        p.angle += p.rotationSpeed
        p.alpha -= p.decay
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
      ctx.globalAlpha = 1
      const alive = particles.some(p => p.alpha > 0 && p.y < canvas.height + 20)
      if (elapsed < durationMs || alive) {
        requestAnimationFrame(tick)
      } else {
        document.body.removeChild(canvas)
      }
    }
    requestAnimationFrame(tick)
  }, [])

  const hideAllTooltips = useCallback(() => {
    try {
      const nodes = document.querySelectorAll('.puzzle-tooltip')
      nodes.forEach((el) => el.classList.add('hidden'))
    } catch {}
  }, [])

  const clearFocusTimers = useCallback(() => {
    try {
      focusTimersRef.current.forEach((id) => clearTimeout(id))
      focusTimersRef.current = []
    } catch {}
  }, [])

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      attempts: [],
      inputLetters: ["", "", "", "", ""],
      activeIndex: 0,
      gameWon: false,
      revealedLetters: new Array(5).fill(false),
      solutionPath: [],
      showSolution: false,
      errorMessage: "",
      showWinAnimation: false,
      showAutoHint: false,
      autoHintText: "",
      hintShownForRow: -1,
      hideAttemptsDuringReveal: false,
      showWinMessage: false,
      finalRevealIndex: null,
      winRevealRowsShown: 0,
    }))
    solutionPathCache.current.clear()
    hintsCache.current.clear()
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
  }, [])

  const initializeGame = useCallback(() => {
    let puzzle
    if (debugModeRef.current) {
      puzzle = { root: "OCEAN", mystery: "FIELD" }
    } else {
      puzzle = gameState.isHardMode
        ? HARD_PUZZLES[Math.floor(Math.random() * HARD_PUZZLES.length)]
        : PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
    }

    setSelectedPuzzle(puzzle)

    const mysteryWord = puzzle.mystery.toUpperCase()
    const rootWord = puzzle.root.toUpperCase()

    solutionPathCache.current.clear()
    hintsCache.current.clear()

    setGameState({
      mysteryWord,
      rootWord,
      attempts: [],
      inputLetters: ["", "", "", "", ""],
      activeIndex: 0,
      gameWon: false,
      revealedLetters: new Array(5).fill(false),
      solutionPath: [],
      showSolution: false,
      errorMessage: "",
      isHardMode: gameState.isHardMode,
      showWinAnimation: false,
      showAutoHint: false,
      autoHintText: "",
      hintShownForRow: -1,
      hideAttemptsDuringReveal: false,
      showWinMessage: false,
      finalRevealIndex: null,
      winRevealRowsShown: 0,
    })

    setIsLoading(false)
  }, [gameState.isHardMode])

  useEffect(() => {
    const savedDebugMode = (() => {
      if (typeof window === 'undefined') return true
      try {
        const ls = window.localStorage
        if (!ls) return true
        let value = ls.getItem('tossword-debug-mode')
        if (value === null) {
          ls.setItem('tossword-debug-mode', 'true')
          value = 'true'
        }
        return value === 'true'
      } catch {
        return true
      }
    })()

    const savedHintTextAuto = (() => {
      if (typeof window === 'undefined') return false
      try {
        const v = window.localStorage?.getItem('tossword-hint-text-auto')
        return v === 'true'
      } catch {
        return false
      }
    })()

    setDebugMode(savedDebugMode)
    debugModeRef.current = savedDebugMode
    setHintTextAuto(savedHintTextAuto)
    setSettingsLoaded(true)
  }, [])

  useEffect(() => {
    if (settingsLoaded) {
      initializeGame()
    }
  }, [settingsLoaded, initializeGame])

  // Hide any visible tooltips when the puzzle is solved
  useEffect(() => {
    if (gameState.gameWon) {
      try {
        const nodes = document.querySelectorAll('.puzzle-tooltip')
        nodes.forEach((el) => el.classList.add('hidden'))
      } catch {}
    }
  }, [gameState.gameWon])

  // Win message trigger: wait for the mystery-word flip to complete, then fade-in message
  useEffect(() => {
    if (gameState.gameWon && gameState.showWinAnimation) {
      const lettersPerWord = 5
      const spinDurationMs = 1000
      const spinDelayStepMs = 200
      const spinTotalMs = spinDurationMs + (lettersPerWord - 1) * spinDelayStepMs
      const extraDelayMs = 500
      const t = setTimeout(() => {
        setGameState(prev => ({ ...prev, showWinMessage: true }))
      }, spinTotalMs + extraDelayMs)
      return () => clearTimeout(t)
    }
  }, [gameState.gameWon, gameState.showWinAnimation])

  // Fire confetti after mystery-word flip completes (previous behavior)
  useEffect(() => {
    if (gameState.gameWon && gameState.showWinAnimation && !confettiFiredRef.current) {
      const lettersPerWord = 5
      const spinDurationMs = 1000
      const spinDelayStepMs = 200
      const spinTotalMs = spinDurationMs + (lettersPerWord - 1) * spinDelayStepMs
      const t = setTimeout(() => {
        confettiFiredRef.current = true
        launchConfettiOverPuzzle(1600)
      }, spinTotalMs)
      return () => clearTimeout(t)
    }
  }, [gameState.gameWon, gameState.showWinAnimation, launchConfettiOverPuzzle])

  // Countdown to next puzzle (midnight US Eastern Time)
  useEffect(() => {
    const format = (totalSeconds: number) => {
      if (totalSeconds <= 0) return '0 hours: 00 minutes: 00 seconds'
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      const pad2 = (n: number) => `${n}`.padStart(2, '0')
      const hoursLabel = hours === 1 ? 'hour' : 'hours'
      const minutesLabel = minutes === 1 ? 'minute' : 'minutes'
      const secondsLabel = seconds === 1 ? 'second' : 'seconds'
      return `${hours} ${hoursLabel}: ${pad2(minutes)} ${minutesLabel}: ${pad2(seconds)} ${secondsLabel}`
    }
    const update = () => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).formatToParts(new Date())
      const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || '0', 10)
      const h = get('hour')
      const m = get('minute')
      const s = get('second')
      const elapsed = h * 3600 + m * 60 + s
      const remaining = 86400 - elapsed
      setCountdown(format(remaining))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (gameState.mysteryWord && gameState.rootWord && !isLoading) {
      setIsLoading(false)
    }
  }, [gameState.mysteryWord, gameState.rootWord, isLoading])

  useEffect(() => {
    if (hintTextAuto && !gameState.gameWon && !gameState.isHardMode && !isLoading && gameState.mysteryWord && gameState.rootWord) {
      const showHint = () => {
        const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
        if (path.length >= 2) {
          const nextWord = path[1].toLowerCase()
          const clue = getWordClue(nextWord)
          if (clue) {
            setGameState((prev) => ({ 
              ...prev, 
              showAutoHint: true, 
              autoHintText: `"${clue}"`,
              hintShownForRow: 0
            }))
            setTimeout(() => {
              setGameState((prev) => ({ ...prev, showAutoHint: false }))
            }, 2000)
          }
        }
      }

      const timer1 = setTimeout(showHint, 1800)
      const timer2 = setTimeout(showHint, 2300)
      const timer3 = setTimeout(showHint, 3000)
      return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3) }
    }
  }, [isLoading, gameState.mysteryWord, gameState.rootWord, gameState.gameWon, gameState.isHardMode])

  useEffect(() => {
    if (hasPrimedFocusRef.current) return
    if (showSplash || gameState.gameWon) return
    if (!gameState.inputLetters.every((l) => l === '')) return
    const timer = window.setTimeout(() => {
      if (!hasPrimedFocusRef.current) {
        inputRefs.current[0]?.focus()
        hasPrimedFocusRef.current = true
      }
    }, 120)
    focusTimersRef.current.push(timer)
    return () => clearTimeout(timer)
  }, [gameState.mysteryWord, gameState.gameWon, showSplash, gameState.inputLetters])

  // When splash is visible, focus the Play button
  useEffect(() => {
    if (showSplash) {
      const t = setTimeout(() => { playButtonRef.current?.focus() }, 100)
      return () => clearTimeout(t)
    }
  }, [showSplash])

  useEffect(() => {
    if (hasPrimedFocusRef.current) return
    if (isLoading || showSplash || gameState.gameWon) return
    if (!(gameState.mysteryWord && gameState.rootWord)) return
    if (!gameState.inputLetters.every((l) => l === '')) return
    const t = window.setTimeout(() => {
      if (!hasPrimedFocusRef.current) {
        inputRefs.current[0]?.focus()
        hasPrimedFocusRef.current = true
      }
    }, 200)
    focusTimersRef.current.push(t)
    return () => clearTimeout(t)
  }, [isLoading, gameState.mysteryWord, gameState.rootWord, gameState.gameWon, showSplash, gameState.inputLetters])

  useEffect(() => {
    if (hasPrimedFocusRef.current) return
    if (showSplash || isLoading || gameState.gameWon) return
    if (!(gameState.mysteryWord && gameState.rootWord)) return
    if (!gameState.inputLetters.every((l) => l === '')) return
    const timer = window.setTimeout(() => {
      if (!hasPrimedFocusRef.current) {
        inputRefs.current[0]?.focus()
        try { inputRefs.current[0]?.setSelectionRange?.(0, 1) } catch {}
        hasPrimedFocusRef.current = true
      }
    }, 120)
    focusTimersRef.current.push(timer)
    return () => clearTimeout(timer)
  }, [showSplash, isLoading, gameState.mysteryWord, gameState.rootWord, gameState.gameWon, gameState.inputLetters])

  const isValidMove = useCallback((fromWord: string, toWord: string): boolean => {
    const toWordLower = toWord.toLowerCase()
    if (!VALID_WORDS.has(toWordLower)) return false
    const from = fromWord.toUpperCase().split("").sort()
    const to = toWord.toUpperCase().split("").sort()
    const fromCounts: { [key: string]: number } = {}
    const toCounts: { [key: string]: number } = {}
    from.forEach((letter) => (fromCounts[letter] = (fromCounts[letter] || 0) + 1))
    to.forEach((letter) => (toCounts[letter] = (toCounts[letter] || 0) + 1))
    let added = 0, removed = 0
    for (const letter in fromCounts) {
      const diff = (toCounts[letter] || 0) - fromCounts[letter]
      if (diff < 0) removed += Math.abs(diff)
    }
    for (const letter in toCounts) {
      const diff = toCounts[letter] - (fromCounts[letter] || 0)
      if (diff > 0) added += diff
    }
    return added === 1 && removed === 1
  }, [])

  const checkWord = useCallback((guess: string, target: string): LetterState[] => {
    const result: LetterState[] = new Array(5).fill("absent")
    const targetLetters = target.toUpperCase().split("")
    const guessLetters = guess.toUpperCase().split("")
    const targetCounts: { [key: string]: number } = {}
    targetLetters.forEach((letter) => {
      targetCounts[letter] = (targetCounts[letter] || 0) + 1
    })
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) { result[i] = "correct"; targetCounts[letter]-- }
    })
    guessLetters.forEach((letter, i) => {
      if (result[i] === "absent" && targetCounts[letter] > 0) { result[i] = "present"; targetCounts[letter]-- }
    })
    return result
  }, [])

  const updateRevealedLetters = useCallback((guess: string) => {
    const results = checkWord(guess, gameState.mysteryWord)
    const newRevealed = [...gameState.revealedLetters]
    results.forEach((result, index) => { if (result === "correct") { newRevealed[index] = true } })
    setGameState((prev) => ({ ...prev, revealedLetters: newRevealed }))
  }, [gameState.mysteryWord, gameState.revealedLetters, checkWord])

  const findSolutionPath = useCallback((start: string, target: string): string[] => {
    const cacheKey = `${start}->${target}`
    if (solutionPathCache.current.has(cacheKey)) { return solutionPathCache.current.get(cacheKey)! }
    const startUpper = start.toUpperCase()
    const targetUpper = target.toUpperCase()
    const queue: { word: string; path: string[] }[] = [{ word: startUpper, path: [startUpper] }]
    const visited = new Set<string>([startUpper])
    while (queue.length > 0) {
      const { word, path } = queue.shift()!
      if (word === targetUpper) { solutionPathCache.current.set(cacheKey, path); return path }
      if (path.length > 15) continue
      for (const validWord of VALID_WORDS) {
        const nextWord = validWord.toUpperCase()
        if (!visited.has(nextWord) && isValidMove(word, nextWord)) {
          visited.add(nextWord)
          queue.push({ word: nextWord, path: [...path, nextWord] })
        }
      }
    }
    solutionPathCache.current.set(cacheKey, [])
    return []
  }, [isValidMove])

  const handleLetterInput = useCallback((index: number, letter: string) => {
    hideAllTooltips()
    if (gameState.gameWon) return
    const newInput = [...gameState.inputLetters]
    if (letter === "") { newInput[index] = "" } else {
      const filteredLetter = letter.replace(/[^A-Za-z]/g, "")
      if (!filteredLetter) return
      newInput[index] = filteredLetter.toUpperCase()
    }
    setGameState((prev) => ({ ...prev, inputLetters: newInput }))
    if (letter !== "" && index < 4) { setTimeout(() => { inputRefs.current[index + 1]?.focus() }, 0) }
  }, [gameState.gameWon, gameState.inputLetters, hideAllTooltips])

  const handleFocus = useCallback((index: number) => {
    setGameState((prev) => ({ ...prev, activeIndex: index }))
  }, [])

  const submitWord = useCallback(() => {
    if (gameState.gameWon) return
    const word = gameState.inputLetters.join("")
    if (word.length !== 5) {
      setGameState((prev) => ({ ...prev, errorMessage: "Please enter exactly 5 letters", inputLetters: ["", "", "", "", ""], activeIndex: 0 }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      setTimeout(() => { inputRefs.current[0]?.focus() }, 50)
      return () => clearTimeout(timer)
    }
    const lastAttempt = gameState.attempts.length > 0 ? gameState.attempts[gameState.attempts.length - 1] : gameState.rootWord
    const wordLower = word.toLowerCase()
    if (!VALID_WORDS.has(wordLower)) {
      setGameState((prev) => ({ ...prev, errorMessage: `"${word.toUpperCase()}" is not a valid word in our dictionary`, inputLetters: ["", "", "", "", ""], activeIndex: 0 }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      setTimeout(() => { inputRefs.current[0]?.focus() }, 50)
      return () => clearTimeout(timer)
    }
    if (!isValidMove(lastAttempt, word)) {
      setGameState((prev) => ({ ...prev, errorMessage: "You must change exactly one letter (rearrangement allowed)", inputLetters: ["", "", "", "", ""], activeIndex: 0 }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      setTimeout(() => { inputRefs.current[0]?.focus() }, 50)
      return () => clearTimeout(timer)
    }
    const newAttempts = [...gameState.attempts, word]
    const isWon = word.toUpperCase() === gameState.mysteryWord.toUpperCase()
    // Determine unrevealed letters based on UI logic (letters not yet present in any prior attempt)
    const mysteryLetters = gameState.mysteryWord.split("")
    const previouslyFound = mysteryLetters.map((ltr) => gameState.attempts.some((a) => a.includes(ltr)))
    const unsolvedIndices = previouslyFound
      .map((found, idx) => (found ? -1 : idx))
      .filter((v) => v !== -1)
    const isFinalLetterSolve = isWon && unsolvedIndices.length === 1
    hintsCache.current.clear()

    if (isFinalLetterSolve) {
      // Final-letter solve: first reveal ALL rows by marking gameWon without hiding attempts
      updateRevealedLetters(word)
      const attemptsCountAfter = newAttempts.length
      setGameState((prev) => ({
        ...prev,
        attempts: newAttempts,
        inputLetters: ["", "", "", "", ""],
        activeIndex: 0,
        errorMessage: "",
        gameWon: true,
        hideAttemptsDuringReveal: false,
        showWinAnimation: false,
        winRevealRowsShown: 0,
      }))

      // Single reveal: show all rows at once, then start the mystery-word flip shortly after
      setGameState((prev) => ({ ...prev, winRevealRowsShown: attemptsCountAfter }))
      setTimeout(() => {
        setGameState((prev) => ({ ...prev, showWinAnimation: true }))
      }, 400)
      return
    }

    updateRevealedLetters(word)
    setGameState((prev) => ({ ...prev, attempts: newAttempts, inputLetters: ["", "", "", "", ""], gameWon: isWon, activeIndex: 0, errorMessage: "" }))
    if (hintTextAuto && !isWon && !gameState.isHardMode) {
      setTimeout(() => {
        const currentWord = word.toUpperCase()
        const path = bidirectionalBFS(currentWord, gameState.mysteryWord.toUpperCase())
        if (path.length >= 2) {
          const nextWord = path[1].toLowerCase()
          const clue = getWordClue(nextWord)
          if (clue) {
            setGameState((prev) => ({ ...prev, showAutoHint: true, autoHintText: `"${clue}"`, hintShownForRow: newAttempts.length }))
            setTimeout(() => { setGameState((prev) => ({ ...prev, showAutoHint: false })) }, 3000)
          }
        }
      }, 100)
    }
    if (isWon) {
      setGameState((prev) => ({ ...prev, hideAttemptsDuringReveal: true }))
      setTimeout(() => { setGameState((prev) => ({ ...prev, showWinAnimation: true })) }, 100)
      setTimeout(() => { setGameState((prev) => ({ ...prev, hideAttemptsDuringReveal: false })) }, 1900)
    } else {
      setTimeout(() => { inputRefs.current[0]?.focus() }, 50)
    }
  }, [gameState.gameWon, gameState.inputLetters, gameState.attempts, gameState.rootWord, gameState.mysteryWord, isValidMove, updateRevealedLetters])

  const showSolutionPath = useCallback(() => {
    const bfsPath = findBFSSolutionPath(gameState.rootWord, gameState.mysteryWord)
    if (bfsPath.length > 2) {
      setGameState((prev) => ({ ...prev, solutionPath: bfsPath, showSolution: true }))
    } else {
      const hardcodedPath = getHardcodedSolution(gameState.rootWord, gameState.mysteryWord)
      setGameState((prev) => ({ ...prev, solutionPath: hardcodedPath, showSolution: true }))
    }
  }, [gameState.rootWord, gameState.mysteryWord])

  const findBFSSolutionPath = useCallback((startWord: string, targetWord: string): string[] => {
    if (startWord === targetWord) return [startWord]
    const startUpper = startWord.toUpperCase()
    const targetUpper = targetWord.toUpperCase()
    const path = bidirectionalBFS(startUpper, targetUpper)
    if (path.length > 0) { return path }
    return [startWord, targetWord]
  }, [])

  const getHardcodedSolution = useCallback((startWord: string, targetWord: string): string[] => {
    const startUpper = startWord.toUpperCase()
    const targetUpper = targetWord.toUpperCase()
    if (startUpper === "SWORD" && targetUpper === "BEACH") { return ["SWORD", "CROWD", "CHORD", "CHARD", "REACH", "BEACH"] }
    if (startUpper === "GAMES" && targetUpper === "FRONT") { return ["GAMES", "GAMER", "ANGER", "GONER", "TENOR", "FRONT"] }
    if (startUpper === "CUMIN" && targetUpper === "DEPTH") { return ["CUMIN", "MINCE", "MEDIC", "EDICT", "TEPID", "DEPTH"] }
    return [startUpper, targetUpper]
  }, [])

  const getBackgroundColor = useCallback((state: LetterState): string => {
    switch (state) {
      case "correct": return "bg-green-500"
      case "present": return "bg-yellow-500"
      default: return "bg-gray-400"
    }
  }, [])

  const getOptimalLetterHints = useCallback((currentWord: string, targetWord: string): number[] => {
    if (!currentWord || currentWord.length !== 5 || gameState.isHardMode) return []
    const cacheKey = `hints-${currentWord}-${targetWord}`
    if (hintsCache.current.has(cacheKey)) { return hintsCache.current.get(cacheKey)! }
    const optimalHints = performRealTimeBFSAnalysis(currentWord, targetWord)
    hintsCache.current.set(cacheKey, optimalHints)
    return optimalHints
  }, [gameState.isHardMode])

  const performRealTimeBFSAnalysis = useCallback((currentWord: string, targetWord: string): number[] => {
    if (currentWord === targetWord) return []
    const currentUpper = currentWord.toUpperCase()
    const targetUpper = targetWord.toUpperCase()
    const path = bidirectionalBFS(currentUpper, targetUpper)
    if (path.length >= 2) {
      const nextWord = path[1]
      const hints = findLetterDifference(currentUpper, nextWord)
      return hints
    }
    return findFallbackHint(currentUpper, targetWord)
  }, [])

  const generateValidNeighbors = useCallback((word: string): string[] => {
    return neighborsOneChangeReorder(word)
  }, [])

  const findLetterDifference = useCallback((word1: string, word2: string): number[] => {
    const hints: number[] = []
    const targetLetters = word2.split('')
    for (let i = 0; i < 5; i++) {
      if (!targetLetters.includes(word1[i])) { hints.push(i); break }
    }
    if (hints.length === 0) {
      for (let i = 0; i < 5; i++) {
        if (word1[i] !== word2[i]) { hints.push(i); break }
      }
    }
    return hints
  }, [])

  const findFallbackHint = useCallback((currentWord: string, targetWord: string): number[] => {
    const targetLetters = targetWord.split('')
    for (let i = 0; i < 5; i++) { if (!targetLetters.includes(currentWord[i])) { return [i] } }
    for (let i = 0; i < 5; i++) { if (currentWord[i] !== targetWord[i]) { return [i] } }
    return []
  }, [])

  const getWordClue = useCallback((word: string): string | null => {
    const clues: Record<string, string> = {
      "sinew": "tendon", "twine": "string", "write": "compose", "tower": "building", "crowd": "group",
      "chord": "notes", "chard": "vegetable", "reach": "extend", "gamer": "player",
      "aback": "surprised", "abase": "humiliate", "abate": "lessen", "abbey": "monastery", "abbot": "monk",
      "abhor": "hate", "abide": "endure", "abled": "capable", "abode": "home", "abort": "cancel",
      "about": "concerning", "above": "overhead", "abuse": "mistreat", "abyss": "chasm", "acorn": "nut",
      "acrid": "bitter", "actor": "performer", "acute": "sharp", "adage": "proverb", "adapt": "adjust",
      "adept": "skilled", "admin": "manager", "admit": "confess", "adobe": "brick", "adopt": "embrace",
      "adore": "love", "adorn": "decorate", "adult": "grown", "affix": "attach", "afire": "burning",
      "afoot": "happening", "afoul": "conflicting", "after": "following", "again": "repeatedly",
      "agape": "open", "agate": "stone", "agent": "representative", "agile": "nimble", "aging": "maturing",
      "aglow": "shining", "agony": "pain", "agora": "marketplace", "agree": "consent", "ahead": "forward",
      "aider": "helper", "aisle": "passage", "alarm": "warning", "album": "collection", "alert": "vigilant",
      "algae": "seaweed", "alibi": "excuse", "align": "arrange", "alike": "similar", "alive": "living",
      "allay": "soothe", "alley": "pathway", "allot": "assign", "allow": "permit", "alloy": "mixture",
      "aloft": "airborne", "along": "together", "aloof": "distant", "aloud": "audible", "alpha": "first",
      "altar": "shrine", "alter": "change", "amass": "gather", "amaze": "astonish", "amber": "resin",
      "amble": "stroll", "amend": "improve", "amiss": "wrong", "amity": "friendship", "among": "between",
      "ample": "sufficient", "amply": "adequately", "amuse": "entertain", "angel": "messenger", "angle": "corner",
      "angry": "furious", "angst": "anxiety", "anime": "cartoon", "ankle": "joint", "annex": "addition",
      "annoy": "irritate", "annul": "cancel", "anode": "electrode", "antic": "prank", "anvil": "tool",
      "aorta": "artery", "apart": "separate", "aphid": "insect", "aping": "copying", "apnea": "breathing",
      "apple": "fruit", "apply": "use", "arena": "stadium", "argue": "dispute", "arise": "emerge",
      "array": "arrangement", "aside": "separately", "asset": "property", "audio": "sound", "audit": "examination",
      "avoid": "evade", "await": "wait", "awake": "conscious", "award": "prize", "aware": "conscious",
      "awful": "terrible", "axiom": "principle",

      "storm": "tempest", "light": "illumination", "games": "play", "front": "foremost",
      "bread": "food", "honey": "sweet", "cumin": "spice", "depth": "profundity",
      "sword": "weapon", "beach": "shore", "anger": "rage", "goner": "finished", "tenor": "voice",
      "break": "shatter", "brake": "stop", "brave": "courageous", "grave": "serious", "mince": "chop",
      "medic": "doctor", "edict": "decree", "tepid": "lukewarm",

      "triad": "group", "third": "ordinal", "girth": "circumference", "ridge": "crest", "tiger": "feline",
      "cedar": "tree", "worth": "value",

      "wards": "guards", "shard": "fragment", "heard": "listened",
      "morse": "code",
      "swear": "curse", "share": "divide",
      "elfin": "fairy",
      "manic": "crazy", "meant": "intended", "tamed": "domesticated", "short": "brief", "shirt": "garment",
      "fling": "throw", "sling": "strap", "glans": "tip", "glass": "transparent", "grass": "lawn",
      "smear": "spread", "rates": "prices", "roast": "cook", "snort": "laugh",
      "house": "home", "mouse": "rodent", "males": "men", "email": "message", "image": "picture", "magic": "spell",
      "serum": "liquid", "miser": "stingy", "grime": "dirt",
      "ocean": "sea", "alone": "solitary", "alien": "foreign", "ideal": "perfect", "field": "meadow",
      "yearn": "desire", "hyena": "animal", "ready": "prepared", "denim": "fabric", "pined": "longed",
      "space": "area", "place": "location", "smile": "grin", "stile": "step",
    }
    return clues[word] || null
  }, [])

  const foundLetters = useMemo(() => {
    const found: { letter: string; position: number }[] = []
    gameState.mysteryWord.split("").forEach((letter, index) => {
      const isRevealed = gameState.revealedLetters[index]
      if (isRevealed) return
      for (const attempt of gameState.attempts) {
        const results = checkWord(attempt, gameState.mysteryWord)
        const attemptLetters = attempt.split("")
        attemptLetters.forEach((attemptLetter, attemptIndex) => {
          if (attemptLetter === letter && results[attemptIndex] === "present") {
            if (!found.some((f) => f.letter === letter)) { found.push({ letter, position: index }) }
          }
        })
      }
    })
    return found.sort((a, b) => a.position - b.position)
  }, [gameState.mysteryWord, gameState.revealedLetters, gameState.attempts, checkWord])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, index: number) => {
    hideAllTooltips()
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      const currentEmpty = !gameState.inputLetters[index]
      if (currentEmpty && index > 0) {
        handleLetterInput(index - 1, "")
        setTimeout(() => {
          setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
          inputRefs.current[index - 1]?.focus()
        }, 0)
      } else {
        handleLetterInput(index, "")
        if (index > 0) {
          setTimeout(() => {
            setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
            inputRefs.current[index - 1]?.focus()
          }, 0)
        }
      }
      return
    }
    if (e.key === "ArrowLeft" && index > 0) {
      setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 0)
    }
    if (e.key === "ArrowRight" && index < 4) {
      setGameState((prev) => ({ ...prev, activeIndex: index + 1 }))
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
    }
    if (e.key === "Enter") {
      const allLettersFilled = gameState.inputLetters.every((letter) => letter.trim() !== "")
      if (allLettersFilled) { submitWord() }
    }
  }, [handleLetterInput, gameState.inputLetters, submitWord, hideAllTooltips])

  const handleBeforeInput = useCallback((e: any, index: number) => {
    const inputType = (e && (e as any).inputType) || ""
    if (inputType === "deleteContentBackward") {
      e.preventDefault?.()
      const currentEmpty = !gameState.inputLetters[index]
      if (currentEmpty && index > 0) {
        handleLetterInput(index - 1, "")
        setTimeout(() => {
          setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
          inputRefs.current[index - 1]?.focus()
        }, 0)
      } else {
        handleLetterInput(index, "")
        if (index > 0) {
          setTimeout(() => {
            setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
            inputRefs.current[index - 1]?.focus()
          }, 0)
        }
      }
    }
  }, [gameState.inputLetters, handleLetterInput])

  if (showSplash) {
    return (
      <div className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${inter.variable} ${poppins.variable}`}>
        <div className="text-center max-w-md text-gray-700">
          <div className="mb-6">
            <div className="puzzle-splash-grid grid grid-cols-[repeat(3,_24px)] auto-rows-[24px] gap-2 w-fit mx-auto mb-4 bg-[#444] p-2 rounded-lg">
              <div className="bg-gray-400 rounded flex items-center justify-center"><span className="text-white text-sm font-bold">?</span></div>
              <div className="bg-gray-400 rounded flex items-center justify-center"><span className="text-white text-sm font-bold">?</span></div>
              <div className="bg-gray-400 rounded flex items-center justify-center"><span className="text-white text-sm font-bold">?</span></div>
              <div className="bg-gray-400 rounded"></div>
              <div className="bg-yellow-400 rounded"></div>
              <div className="bg-green-500 rounded"></div>
              <div className="bg-green-500 rounded"></div>
              <div className="bg-green-500 rounded"></div>
              <div className="bg-green-500 rounded"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-700 mb-4 font-poppins">Tossword</h1>
          <p className="text-lg text-gray-700 mb-4 font-inter">
            Today's start word is <strong className="text-emerald-500">{settingsLoaded ? (debugMode ? "OCEAN" : (selectedPuzzle?.root || "Loading...")) : "..."}</strong>.
            {!settingsLoaded && <span className="text-sm text-gray-500"> (Loading...)</span>}
          </p>
          <p className="text-lg text-gray-700 mb-8 font-inter">Using this word as a starting point, change one letter at a time, in any order, to unlock today's mystery word.</p>
          <button
            ref={playButtonRef}
            onClick={() => setShowSplash(false)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors font-inter cursor-pointer focus-visible:outline focus-visible:outline-[4px] focus-visible:outline-gray-700 focus-visible:outline-offset-2"
          >
            Play
          </button>
          <div className="mt-8 text-sm text-gray-700 font-inter">
            <p>Solve the mystery word in as few steps as possible</p>
            <p>Challenge your vocabulary and logic</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-black flex items-center justify-center p-4 ${inter.variable} ${poppins.variable}`}>
        <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-white mb-4 font-poppins">Tossword</h1>
          <div className="flex justify-center mb-4"><div className="w-8 h-8 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div></div>
          <p className="text-gray-400 text-sm font-inter">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-white flex flex-col ${inter.variable} ${poppins.variable}`}>
      <header className="bg-white text-gray-900 py-4 px-6 border-b border-gray-300 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowSplash(true)}>
            <Image src="/tossword-logo.webp" alt="Tossword logo" width={24} height={24} className="h-6 w-6" />
            <span className="hidden md:inline text-lg text-gray-700 font-bold font-poppins uppercase">Tossword</span>
          </div>
          <div className="flex items-center gap-3">
            {debugMode && (
              <>
                <button onClick={showSolutionPath} className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" title="Show Solution (Debug)">
                  <Lightbulb className="w-6 h-6" />
                </button>
                <button onClick={resetGame} className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" title="Reset Game (Debug)">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
                <button onClick={initializeGame} className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" title="New Game (Debug)">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </button>
              </>
            )}
            <button onClick={() => setShowHowToPlay(true)} className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" title="How to Play">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
            <button onClick={() => setShowStats(true)} className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" title="Statistics">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" title="Settings">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pb-20 md:pb-4">
        <div ref={puzzleRef} className={`w-full max-w-md puzzle ${gameState.gameWon ? 'puzzle-solved' : ''}`}> 
          <div className="text-center mb-6 min-h-[64px]">
            <div className={[
              "transition-opacity duration-900 ease-in-out",
              gameState.showWinMessage ? "opacity-100 visible" : "opacity-0 invisible"
            ].join(" ")}
            aria-hidden={!gameState.showWinMessage}>
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-700 font-poppins">
                You solved the puzzle in {gameState.attempts.length} steps. Great Job!
              </h2>
              <p className="text-sm text-gray-600 mt-2 font-inter">Next puzzle in {countdown} (EST)</p>
            </div>
            {!gameState.showWinMessage && null}
          </div>
          <div className={`transition-transform duration-900 ease-in-out`} style={{ transform: gameState.showWinMessage ? "translateY(0)" : "translateY(-64px)" }}>
          <div className="mb-2">
            <div className="w-[328px] mx-auto flex justify-center gap-2 mb-2">
              {gameState.mysteryWord.split("").map((letter, index) => {
                const isHeldForFinalReveal = gameState.finalRevealIndex === index
                const isLetterFoundGeneric = gameState.attempts.some(attempt => attempt.includes(letter))
                const isLetterFound = !isHeldForFinalReveal && isLetterFoundGeneric
                return (
                  <div key={index} className={`w-12 h-12 rounded-lg puzzle-grid flex items-center justify-center ${isLetterFound ? `relative bg-emerald-500 ${gameState.showWinAnimation && gameState.gameWon ? "animate-[spinX_1s_ease-in-out_1]" : ""}` : "bg-emerald-500"}`}
                       style={{ animationDelay: gameState.showWinAnimation && gameState.gameWon ? `${index * 200}ms` : "0ms" }}
                       onTouchStart={() => { if (gameState.gameWon) return; const tooltip = document.getElementById(`mystery-letter-tooltip-${index}`); if (tooltip) { tooltip.classList.remove('hidden'); setTimeout(() => tooltip.classList.add('hidden'), 3000) } }}
                       onMouseEnter={() => { if (gameState.gameWon) return; const tooltip = document.getElementById(`mystery-letter-tooltip-${index}`); if (tooltip) tooltip.classList.remove('hidden') }}
                       onMouseLeave={() => { const tooltip = document.getElementById(`mystery-letter-tooltip-${index}`); if (tooltip) tooltip.classList.add('hidden') }}>
                    <span className={isLetterFound ? "text-white text-lg font-bold font-inter leading-none mystery-letter-reveal" : "text-white text-2xl font-bold leading-none"}>{isLetterFound ? letter : "\u2022"}</span>
                    <div id={`mystery-letter-tooltip-${index}`} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words">
                      {isLetterFound ? `Letter "${letter}" found in your guesses` : "Mystery letter - keep guessing to reveal"}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )
              })}
              <div className="w-12 h-12 bg-gray-500 rounded-lg puzzle-grid flex items-center justify-center cursor-pointer relative puzzle-row-last"
                   onTouchStart={() => { const tooltip = document.getElementById('mystery-tooltip'); if (tooltip) { tooltip.classList.remove('hidden'); setTimeout(() => tooltip.classList.add('hidden'), 3000) } }}
                   onMouseEnter={() => { const tooltip = document.getElementById('mystery-tooltip'); if (tooltip) tooltip.classList.remove('hidden') }}
                   onMouseLeave={() => { const tooltip = document.getElementById('mystery-tooltip'); if (tooltip) tooltip.classList.add('hidden') }}>
                {gameState.gameWon ? (
                  gameState.hideAttemptsDuringReveal ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : (
                    <Crown className="w-6 h-6 text-white" />
                  )
                ) : (
                  <KeyRound className="w-6 h-6 text-white" />
                )}
                <div id="mystery-tooltip" className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-left whitespace-nowrap puzzle-tooltip">
                  {gameState.gameWon ? "Puzzle unlocked! Well done!" : "Unlock the puzzle!"}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
                </div>
              </div>
            </div>

            {gameState.attempts.length === 0 ? (
              <div className="w-[328px] mx-auto flex justify-center gap-2 mb-2">
                {gameState.rootWord.split("").map((letter, index) => {
                  const shouldShowHint = !gameState.isHardMode && gameState.attempts.length === 0
                  const optimalHints = shouldShowHint ? getOptimalLetterHints(gameState.rootWord, gameState.mysteryWord) : []
                  const shouldHighlight = shouldShowHint && optimalHints.includes(index)
                  return (
                    <div
                      key={index}
                      className={`w-12 h-12 bg-gray-400 rounded-lg puzzle-grid flex items-center justify-center ${shouldHighlight ? "tossable bg-white !text-gray-400 border border-gray-400" : ""} relative`}
                      onTouchStart={() => {
                        if (!shouldHighlight || gameState.gameWon) return
                        const tooltip = document.getElementById(`start-tooltip-${index}`)
                        if (tooltip) { tooltip.classList.remove('hidden'); setTimeout(() => tooltip.classList.add('hidden'), 3000) }
                      }}
                      onMouseEnter={() => { if (shouldHighlight && !gameState.gameWon) { document.getElementById(`start-tooltip-${index}`)?.classList.remove('hidden') } }}
                      onMouseLeave={() => { if (shouldHighlight) { document.getElementById(`start-tooltip-${index}`)?.classList.add('hidden') } }}
                    >
                      <span className={`text-lg font-bold font-inter ${shouldHighlight ? "text-gray-400" : "text-white"}`}>{letter}</span>
                      {shouldHighlight && (
                        <div
                          id={`start-tooltip-${index}`}
                          className={`absolute top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-left puzzle-tooltip ${index <= 2 ? 'left-full ml-2' : 'right-full mr-2'}`}
                        >
                          Tossable
                          <div
                            className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-transparent ${index <= 2 ? '-left-1 border-r-4 border-r-gray-900' : '-right-1 border-l-4 border-l-gray-900'}`}
                          ></div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div
                  className="w-12 h-12 bg-gray-500 rounded-lg puzzle-grid flex items-center justify-center cursor-pointer relative puzzle-row-last"
                  onTouchStart={() => {
                    if (gameState.gameWon) return
                    const tooltip = document.getElementById('start-steps-tooltip')
                    if (tooltip) {
                      tooltip.classList.remove('hidden')
                      setTimeout(() => tooltip.classList.add('hidden'), 3000)
                    }
                  }}
                  onMouseEnter={() => {
                    if (gameState.gameWon) return
                    const tooltip = document.getElementById('start-steps-tooltip')
                    if (tooltip) tooltip.classList.remove('hidden')
                  }}
                  onMouseLeave={() => {
                    const tooltip = document.getElementById('start-steps-tooltip')
                    if (tooltip) tooltip.classList.add('hidden')
                  }}
                  title="Minimum steps to solve this puzzle"
                >
                  {/* Start/Begin icon */}
                  <Lightbulb className="w-6 h-6 text-white" />

                  {/* Tooltip with BFS steps */}
                  <div
                    id="start-steps-tooltip"
                    className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-left whitespace-nowrap puzzle-tooltip"
                  >
                    {(() => {
                      const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                      const steps = path.length > 0 ? path.length - 1 : '?' 
                      return `Now solvable in: ${steps} steps`
                    })()}
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {(gameState.gameWon ? [gameState.rootWord, ...gameState.attempts] : gameState.attempts.slice(-1)).map((attempt, sliceIndex) => {
            const actualIndex = gameState.gameWon ? sliceIndex : gameState.attempts.length - 1
            const isLastAttempt = true
            const lastAttemptRowIndex = gameState.gameWon ? gameState.attempts.length : gameState.attempts.length - 1
            const isCompleted = actualIndex === lastAttemptRowIndex
            const totalRows = gameState.gameWon ? (gameState.attempts.length + 1) : 1
            const revealStep = gameState.gameWon ? ((totalRows - 2) - actualIndex) : 0 // bottom row already visible
            if (gameState.gameWon && gameState.hideAttemptsDuringReveal) { return null }
            const results = checkWord(attempt, gameState.mysteryWord)
            const shouldShowHint = !gameState.isHardMode && isLastAttempt
            const optimalHints = shouldShowHint ? (() => {
              const path = bidirectionalBFS(attempt.toUpperCase(), gameState.mysteryWord.toUpperCase())
              if (path.length >= 2) { const nextWord = path[1]; const hints = getOptimalLetterHints(attempt, nextWord); return hints }
              return []
            })() : []
            const currentWord = attempt
            const targetWord = gameState.mysteryWord
            const path = bidirectionalBFS(currentWord.toUpperCase(), targetWord.toUpperCase())
            const remainingSteps = path.length > 0 ? path.length - 1 : 0
            const entryOrder = gameState.gameWon ? sliceIndex + 1 : remainingSteps

            return (
              <div
                key={actualIndex}
                className={[
                  'w-[328px] mx-auto flex items-center gap-2 justify-center mb-2',
                  (gameState.gameWon && actualIndex < lastAttemptRowIndex && (lastAttemptRowIndex - actualIndex) <= gameState.winRevealRowsShown)
                    ? 'animate-[rowReveal_0.35s_ease-in_forwards]'
                    : ''
                ].join(' ')}
                style={{
                  display: gameState.gameWon && actualIndex < lastAttemptRowIndex
                    ? ((lastAttemptRowIndex - actualIndex) <= gameState.winRevealRowsShown ? 'flex' : 'none')
                    : 'flex',
                }}
              >
                <div className="flex gap-2">
                  {attempt.split("").map((letter, letterIndex) => {
                    const shouldHighlightCell = shouldShowHint && optimalHints.includes(letterIndex)
                    const bgColor = results[letterIndex] === "correct" ? "bg-emerald-500" : results[letterIndex] === "present" ? "bg-amber-500" : (shouldHighlightCell ? "bg-[#aaaaaa]" : "bg-gray-400")
                    const borderColor = ""
                    return (
                      <div
                        key={letterIndex}
                        className={`w-12 h-12 ${bgColor} rounded-lg puzzle-grid flex items-center justify-center ${borderColor} ${shouldHighlightCell ? "tossable bg-white !text-gray-400 border border-gray-400" : ""} ${(gameState.showWinAnimation && isCompleted && gameState.gameWon === false) ? "animate-[spinX_1s_ease-in-out_1]" : ""} relative`}
                        style={{ animationDelay: gameState.showWinAnimation && isCompleted ? `${letterIndex * 200}ms` : "0ms" }}
                        onTouchStart={() => {
                          if (!shouldHighlightCell || gameState.gameWon) return
                          const tooltip = document.getElementById(`tooltip-${actualIndex}-${letterIndex}`)
                          if (tooltip) { tooltip.classList.remove('hidden'); setTimeout(() => tooltip.classList.add('hidden'), 3000) }
                        }}
                        onMouseEnter={() => {
                          if (!shouldHighlightCell || gameState.gameWon) return
                          const tooltip = document.getElementById(`tooltip-${actualIndex}-${letterIndex}`)
                          if (tooltip) tooltip.classList.remove('hidden')
                        }}
                        onMouseLeave={() => {
                          if (!shouldHighlightCell) return
                          const tooltip = document.getElementById(`tooltip-${actualIndex}-${letterIndex}`)
                          if (tooltip) tooltip.classList.add('hidden')
                        }}
                      >
                        <span className={`text-lg font-bold font-inter ${shouldHighlightCell ? "text-gray-400" : "text-white"}`}>{letter}</span>
                        <div
                          id={`tooltip-${actualIndex}-${letterIndex}`}
                          className={`absolute top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-left break-words puzzle-tooltip ${letterIndex <= 2 ? 'left-full ml-2' : 'right-full mr-2'}`}
                        >
                          {(() => { if (shouldHighlightCell) return "Tossable"; if (results[letterIndex] === "correct") return "Correct letter in correct position"; if (results[letterIndex] === "present") return "Letter is in the word but wrong position"; return "Letter not in the word" })()}
                          <div
                            className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-transparent ${letterIndex <= 2 ? '-left-1 border-r-4 border-r-gray-900' : '-right-1 border-l-4 border-l-gray-900'}`}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                  <div
                    className="w-12 h-12 bg-gray-500 rounded-lg puzzle-grid flex items-center justify-center cursor-pointer relative puzzle-row-last"
                    onTouchStart={() => {
                      if (gameState.gameWon) return
                      const tooltip = document.getElementById(`entry-tooltip-${actualIndex}`)
                      if (tooltip) { tooltip.classList.remove('hidden'); setTimeout(() => tooltip.classList.add('hidden'), 3000) }
                    }}
                    onMouseEnter={() => {
                      if (gameState.gameWon) return
                      const tooltip = document.getElementById(`entry-tooltip-${actualIndex}`)
                      if (tooltip) tooltip.classList.remove('hidden')
                    }}
                    onMouseLeave={() => {
                      const tooltip = document.getElementById(`entry-tooltip-${actualIndex}`)
                      if (tooltip) tooltip.classList.add('hidden')
                    }}
                  >
                    {gameState.gameWon ? (
                      entryOrder === 0 ? (
                        <Crown className="w-8 h-8 text-white" />
                      ) : (
                        <span className="end-of-row text-white text-lg font-bold font-inter">{entryOrder}</span>
                      )
                    ) : (
                      <Lightbulb className="w-6 h-6 text-white" />
                    )}
                    <div id={`entry-tooltip-${actualIndex}`} className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-left break-words puzzle-tooltip">
                      {gameState.gameWon ? `Word entered ${entryOrder}${entryOrder === 1 ? 'st' : entryOrder === 2 ? 'nd' : entryOrder === 3 ? 'rd' : 'th'}` : `Remaining steps to solve: ${entryOrder}`}
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {!gameState.gameWon && (
            <>
              <div className={`w-[328px] mx-auto overflow-hidden transition-[max-height,opacity,margin] duration-1300 ease-in-out ${gameState.showAutoHint ? 'max-h-12 my-2 opacity-100' : 'max-h-0 my-0 opacity-0'}`}>
                <div className="h-12 w-full bg-gray-400 shadow-lg flex items-center justify-center">
                  <p className="text-white text-sm font-inter" aria-live="polite">{gameState.autoHintText}</p>
                </div>
              </div>

              <div className="w-[328px] mx-auto flex justify-center gap-2">
                {gameState.inputLetters.map((letter, index) => (
                  <input
                    key={index}
                    id={`guess-${index}`}
                    name={`guess-${index}`}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    value={letter}
                    onChange={(e) => handleLetterInput(index, e.target.value.slice(-1))}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={() => handleFocus(index)}
                    className={`w-12 h-12 rounded-lg bg-transparent border border-gray-400 text-center text-lg font-bold text-gray-900 focus:outline-none font-inter puzzle-grid ${gameState.activeIndex === index ? "" : ""}`}
                    maxLength={1}
                    autoComplete="off"
                    inputMode="text"
                    aria-label={`Letter ${index + 1}`}
                  />
                ))}
                <div className="w-12 h-12 bg-gray-500 rounded-lg puzzle-grid flex items-center justify-center cursor-pointer relative puzzle-row-last"
                     onTouchStart={() => { const tooltip = document.getElementById('clue-tooltip'); if (tooltip) { tooltip.classList.remove('hidden'); setTimeout(() => tooltip.classList.add('hidden'), 3000) } }}
                     onMouseEnter={() => { const tooltip = document.getElementById('clue-tooltip'); if (tooltip) tooltip.classList.remove('hidden') }}
                     onMouseLeave={() => { const tooltip = document.getElementById('clue-tooltip'); if (tooltip) tooltip.classList.add('hidden') }}>
                  <BookA className="w-6 h-6 text-white" />
                  <div id="clue-tooltip" className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-left break-words puzzle-tooltip">
                    {(() => {
                      if (gameState.attempts.length > 0) {
                        const lastAttempt = gameState.attempts[gameState.attempts.length - 1].toUpperCase()
                        const path = bidirectionalBFS(lastAttempt, gameState.mysteryWord.toUpperCase())
                        if (path.length >= 2) { const nextWord = path[1].toLowerCase(); const clue = getWordClue(nextWord); return clue ? `"${clue}"` : `No clue for "${nextWord}"` }
                      } else {
                        const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                        if (path.length >= 2) { const nextWord = path[1].toLowerCase(); const clue = getWordClue(nextWord); return clue ? `"${clue}"` : `No clue for "${nextWord}"` }
                      }
                      return "No clue available"
                    })()}
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              </div>

              <div className={["w-[328px] mx-auto overflow-hidden","transition-[max-height,opacity,margin] duration-300 ease-in-out rounded-lg puzzle-error-message", gameState.errorMessage ? "opacity-100 my-2" : "opacity-0 my-0"].join(" ")} aria-live="polite">
                <div className="h-12 w-full flex items-center justify-center px-4">
                  <p className="text-white text-sm font-inter">{gameState.errorMessage}</p>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Settings and How To Play sections remain unchanged from original and are included below */}
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white font-poppins">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4 text-gray-300 font-inter">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Hard Mode</h3>
                  <p className="text-gray-400 text-sm">No hints - pure challenge!</p>
                </div>
                <button onClick={() => setGameState((prev) => ({ ...prev, isHardMode: !prev.isHardMode }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gameState.isHardMode ? "bg-emerald-600" : "bg-gray-400"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gameState.isHardMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Debug Mode</h3>
                  <p className="text-gray-400 text-sm">Force OCEAN → FIELD puzzle for testing</p>
                </div>
                <button onClick={() => { const newDebugMode = !debugMode; setDebugMode(newDebugMode); if (typeof window !== 'undefined') { localStorage.setItem('tossword-debug-mode', newDebugMode.toString()) } }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${debugMode ? "bg-emerald-500" : "bg-gray-400"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${debugMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Auto Hints</h3>
                  <p className="text-gray-400 text-sm">Automatically show hints for next words</p>
                </div>
                <button onClick={() => { const newHintTextAuto = !hintTextAuto; setHintTextAuto(newHintTextAuto); if (typeof window !== 'undefined') { localStorage.setItem('tossword-hint-text-auto', newHintTextAuto.toString()) } }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hintTextAuto ? "bg-emerald-500" : "bg-gray-400"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hintTextAuto ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between opacity-50">
                <div>
                  <h3 className="text-white font-semibold">Dark Theme</h3>
                  <p className="text-gray-400 text-sm">Switch between light and dark themes</p>
                </div>
                <button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-400">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
              <div className="pt-4 border-t border-gray-600">
                <p className="text-gray-400 text-sm mb-3 text-center">Settings are saved automatically. Click below to start a new game with current settings.</p>
                <button onClick={() => { setShowSettings(false); initializeGame() }} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Reset Game (Apply Settings)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-white text-gray-900 py-4 px-6 border-t border-gray-300 shadow-sm md:relative">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm text-gray-600 font-inter">© Red Mountain Media, LLC 2025</p>
        </div>
      </footer>

      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowHowToPlay(false)}>
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white font-poppins">How To Play</h2>
              <button onClick={() => setShowHowToPlay(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4 text-gray-300 font-inter">
              <p>Using this word as a starting point, change one letter at a time, in any order,to unlock the mystery word!</p>
              <div className="space-y-2">
                <p className="font-semibold text-white">Rules:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Each guess must be a valid 5-letter word</li>
                  <li>You can rearrange letters as long as you change exactly one letter</li>
                  <li>The starting word shares no letters with the mystery word</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-white">Color Guide:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-emerald-500 flex items-center justify-center"><span className="text-white font-bold text-sm">W</span></div><span className="text-sm">Letter is in the word and in the correct spot</span></div>
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-amber-500 flex items-center justify-center"><span className="text-white font-bold text-sm">I</span></div><span className="text-sm">Letter is in the word but in the wrong spot</span></div>
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-400 flex items-center justify-center"><span className="text-white font-bold text-sm">U</span></div><span className="text-sm">Letter is not in the word</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-white">Modes:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Easy Mode:</strong> Shows hints for optimal letter changes</li>
                  <li><strong>Hard Mode:</strong> No hints - pure challenge!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
