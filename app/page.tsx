"use client"
import type { KeyboardEvent } from "react" // Import KeyboardEvent for handleKeyDown

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

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
  isHardMode: boolean // Added difficulty flag
  showWinAnimation: boolean // Added win animation flag
  showAutoHint: boolean // Auto-hint display state
  autoHintText: string // Text to show in auto-hint
  hintShownForRow: number // Track which row has already shown a hint
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

export default function WordBreakerGame() {
  // DEBUG FLAG: Set to true to force OCEAN → FIELD puzzle only
  const [debugMode, setDebugMode] = useState(false)

  // HINT TEXT AUTO FLAG: Set to true to automatically show hints when focusing on new rows
  const [hintTextAuto, setHintTextAuto] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)
    const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [selectedPuzzle, setSelectedPuzzle] = useState<{ root: string; mystery: string } | null>(null)

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
    isHardMode: false, // Default to easy mode with hints
    showWinAnimation: false, // Default win animation state
    showAutoHint: false, // Auto-hint display state
    autoHintText: "", // Text to show in auto-hint
    hintShownForRow: -1, // Track which row has already shown a hint
  })

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const solutionPathCache = useRef<Map<string, string[]>>(new Map())
  const hintsCache = useRef<Map<string, number[]>>(new Map())

  const resetGame = useCallback(() => {
    // Reset current game state without changing the puzzle
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
    }))
    
    // Clear solution cache
    solutionPathCache.current.clear()
    // Clear hints cache
    hintsCache.current.clear()
    
    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
  }, [])

  const initializeGame = useCallback(() => {
    let puzzle
    if (debugMode) {
      // Force OCEAN → FIELD puzzle in debug mode
      puzzle = { root: "OCEAN", mystery: "FIELD" }
    } else {
      // Normal random puzzle selection
      puzzle = gameState.isHardMode
      ? HARD_PUZZLES[Math.floor(Math.random() * HARD_PUZZLES.length)]
      : PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
    }
    
    // Store the selected puzzle so splash screen can use it
    setSelectedPuzzle(puzzle)
    
    const mysteryWord = puzzle.mystery.toUpperCase()
    const rootWord = puzzle.root.toUpperCase()

    // Clear solution cache when starting new game
    solutionPathCache.current.clear()
    // Clear hints cache when starting new game
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
      showWinAnimation: false, // Reset win animation state
      showAutoHint: false,
      autoHintText: "",
      hintShownForRow: -1,
    })

    // Mark game as ready after initialization
    setIsLoading(false)
  }, [gameState.isHardMode, debugMode])

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedDebugMode = (() => {
      if (typeof window === 'undefined') return true
      try {
        const ls = window.localStorage
        if (!ls) return true
        const value = ls.getItem('wordbreaker-debug-mode')
        // If not set, default to true when storage is present but unset
        return value === null ? true : value === 'true'
      } catch {
        // Any access error (e.g., privacy mode) → default to true
        return true
      }
    })()

    const savedHintTextAuto = typeof window !== 'undefined' ? localStorage.getItem('wordbreaker-hint-text-auto') === 'true' : false

    setDebugMode(savedDebugMode)
    setHintTextAuto(savedHintTextAuto)
    setSettingsLoaded(true)
  }, [])

  useEffect(() => {
    if (settingsLoaded) {
      initializeGame()
    }
  }, [settingsLoaded, initializeGame])
  
  // Ensure loading state is properly managed
  useEffect(() => {
    if (gameState.mysteryWord && gameState.rootWord && !isLoading) {
      // Game is ready, ensure loading is false
      setIsLoading(false)
    }
  }, [gameState.mysteryWord, gameState.rootWord, isLoading])
  
  // Auto-show hint when game starts (after loading completes)
  useEffect(() => {
    if (hintTextAuto && !gameState.gameWon && !gameState.isHardMode && !isLoading && gameState.mysteryWord && gameState.rootWord) {
      // Show hint immediately when game is ready
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
              hintShownForRow: 0 // Mark initial row (0 attempts) as having shown a hint
            }))
            
            // Hide hint after 3 seconds
            setTimeout(() => {
              setGameState((prev) => ({ ...prev, showAutoHint: false }))
            }, 2000)
          }
        }
      }
      
      // Try multiple times to ensure hint shows (with 1.5s additional delay)
      const timer1 = setTimeout(showHint, 1800) // 300 + 1500
      const timer2 = setTimeout(showHint, 2300) // 800 + 1500
      const timer3 = setTimeout(showHint, 3000) // 1500 + 1500
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isLoading, gameState.mysteryWord, gameState.rootWord, gameState.gameWon, gameState.isHardMode])

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [gameState.mysteryWord])
  
  // Additional focus effect specifically for mobile after loading
  useEffect(() => {
    if (!isLoading && gameState.mysteryWord && gameState.rootWord) {
      // Multiple attempts to focus on mobile
      const focusTimer1 = setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 200)
      
      const focusTimer2 = setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 500)
      
      const focusTimer3 = setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 1000)
      
      return () => {
        clearTimeout(focusTimer1)
        clearTimeout(focusTimer2)
        clearTimeout(focusTimer3)
      }
    }
  }, [isLoading, gameState.mysteryWord, gameState.rootWord])

  // Ensure focus moves to the first input when the splash screen is closed
  useEffect(() => {
    if (!showSplash && !isLoading && gameState.mysteryWord && gameState.rootWord && !gameState.gameWon) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus()
        try {
          inputRefs.current[0]?.setSelectionRange?.(0, 1)
        } catch {}
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showSplash, isLoading, gameState.mysteryWord, gameState.rootWord, gameState.gameWon])

  const isValidMove = useCallback((fromWord: string, toWord: string): boolean => {
    const toWordLower = toWord.toLowerCase()
    if (!VALID_WORDS.has(toWordLower)) return false

    const from = fromWord.toUpperCase().split("").sort()
    const to = toWord.toUpperCase().split("").sort()

    const fromCounts: { [key: string]: number } = {}
    const toCounts: { [key: string]: number } = {}

    from.forEach((letter) => (fromCounts[letter] = (fromCounts[letter] || 0) + 1))
    to.forEach((letter) => (toCounts[letter] = (toCounts[letter] || 0) + 1))

    let added = 0,
      removed = 0

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
      if (letter === targetLetters[i]) {
        result[i] = "correct"
        targetCounts[letter]--
      }
    })

    guessLetters.forEach((letter, i) => {
      if (result[i] === "absent" && targetCounts[letter] > 0) {
        result[i] = "present"
        targetCounts[letter]--
      }
    })

    return result
  }, [])

  const updateRevealedLetters = useCallback(
    (guess: string) => {
      const results = checkWord(guess, gameState.mysteryWord)
      const newRevealed = [...gameState.revealedLetters]

      results.forEach((result, index) => {
        if (result === "correct") {
          newRevealed[index] = true
        }
      })

      setGameState((prev) => ({ ...prev, revealedLetters: newRevealed }))
    },
    [gameState.mysteryWord, gameState.revealedLetters, checkWord],
  )

  const findSolutionPath = useCallback(
    (start: string, target: string): string[] => {
      const cacheKey = `${start}->${target}`

      // Check cache first
      if (solutionPathCache.current.has(cacheKey)) {
        return solutionPathCache.current.get(cacheKey)!
      }

      const startUpper = start.toUpperCase()
      const targetUpper = target.toUpperCase()

      const queue: { word: string; path: string[] }[] = [{ word: startUpper, path: [startUpper] }]
      const visited = new Set<string>([startUpper])

      while (queue.length > 0) {
        const { word, path } = queue.shift()!

        if (word === targetUpper) {
          // Cache the result
          solutionPathCache.current.set(cacheKey, path)
          return path
        }

        if (path.length > 15) continue // Reduced search depth for performance

        for (const validWord of VALID_WORDS) {
          const nextWord = validWord.toUpperCase()
          if (!visited.has(nextWord) && isValidMove(word, nextWord)) {
            visited.add(nextWord)
            queue.push({ word: nextWord, path: [...path, nextWord] })
          }
        }
      }

      // Cache empty result to avoid recalculation
      solutionPathCache.current.set(cacheKey, [])
      return []
    },
    [isValidMove],
  )

  const handleLetterInput = useCallback(
    (index: number, letter: string) => {
      if (gameState.gameWon) return

      const newInput = [...gameState.inputLetters]
      
      if (letter === "") {
        // Clear the cell
        newInput[index] = ""
      } else {
        // Set a new letter
      const filteredLetter = letter.replace(/[^A-Za-z]/g, "")
      if (!filteredLetter) return
      newInput[index] = filteredLetter.toUpperCase()
      }

      setGameState((prev) => ({ ...prev, inputLetters: newInput }))

      // Auto-advance focus only when adding letters
      if (letter !== "" && index < 4) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus()
        }, 0)
      }
    },
    [gameState.gameWon, gameState.inputLetters],
  )

  const handleFocus = useCallback(
    (index: number) => {
      setGameState((prev) => ({ ...prev, activeIndex: index }))
      // Auto-hint removed from focus handler - now only triggers on game load and word submission
    },
    [],
  )

  const submitWord = useCallback(() => {
    if (gameState.gameWon) return

    const word = gameState.inputLetters.join("")
    if (word.length !== 5) {
      // This shouldn't happen in normal gameplay, but handle it gracefully
      setGameState((prev) => ({ 
        ...prev, 
        errorMessage: "Please enter exactly 5 letters",
        inputLetters: ["", "", "", "", ""],
        activeIndex: 0
      }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }

    const lastAttempt =
      gameState.attempts.length > 0 ? gameState.attempts[gameState.attempts.length - 1] : gameState.rootWord

    // Check if word is in dictionary first
    const wordLower = word.toLowerCase()
    if (!VALID_WORDS.has(wordLower)) {
      setGameState((prev) => ({ 
        ...prev, 
        errorMessage: `"${word.toUpperCase()}" is not a valid word in our dictionary`,
        inputLetters: ["", "", "", "", ""],
        activeIndex: 0
      }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      // Clear input and refocus to first position
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }

    if (!isValidMove(lastAttempt, word)) {
      setGameState((prev) => ({ 
        ...prev, 
        errorMessage: "You must change exactly one letter (rearrangement allowed)",
        inputLetters: ["", "", "", "", ""],
        activeIndex: 0
      }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      // Clear input and refocus to first position
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }

    const newAttempts = [...gameState.attempts, word]
    const isWon = word.toUpperCase() === gameState.mysteryWord.toUpperCase()

    // Clear hints cache so BFS recalculates for next hint
    hintsCache.current.clear()

    updateRevealedLetters(word)

    setGameState((prev) => ({
      ...prev,
      attempts: newAttempts,
      inputLetters: ["", "", "", "", ""],
      gameWon: isWon,
      activeIndex: 0,
      errorMessage: "",
    }))
    
         // Show auto-hint for next word after successful submission (if not won and flag enabled)
     if (hintTextAuto && !isWon && !gameState.isHardMode) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const currentWord = word.toUpperCase()
        const path = bidirectionalBFS(currentWord, gameState.mysteryWord.toUpperCase())
        if (path.length >= 2) {
          const nextWord = path[1].toLowerCase()
          const clue = getWordClue(nextWord)
          if (clue) {
            setGameState((prev) => ({ 
              ...prev, 
              showAutoHint: true, 
              autoHintText: `"${clue}"`,
              hintShownForRow: newAttempts.length // Mark this row as having shown a hint
            }))
            
            // Hide hint after 3 seconds
            setTimeout(() => {
              setGameState((prev) => ({ ...prev, showAutoHint: false }))
            }, 3000)
          }
        }
      }, 100)
    }

    if (isWon) {
      setTimeout(() => {
        setGameState((prev) => ({ ...prev, showWinAnimation: true }))
      }, 500)
    } else {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
    }
  }, [
    gameState.gameWon,
    gameState.inputLetters,
    gameState.attempts,
    gameState.rootWord,
    gameState.mysteryWord,
    isValidMove,
    updateRevealedLetters,
  ])

  const showSolutionPath = useCallback(() => {
    // Try BFS first, fallback to hardcoded if BFS fails
    const bfsPath = findBFSSolutionPath(gameState.rootWord, gameState.mysteryWord)
    
    // If BFS found a path, use it; otherwise use hardcoded solution
    if (bfsPath.length > 2) {
      // console.log("✅ Using BFS-found path:", bfsPath)
      setGameState((prev) => ({ ...prev, solutionPath: bfsPath, showSolution: true }))
    } else {
      console.log("🔄 BFS failed, using hardcoded solution")
      // Fallback to hardcoded solution for known puzzles
      const hardcodedPath = getHardcodedSolution(gameState.rootWord, gameState.mysteryWord)
      setGameState((prev) => ({ ...prev, solutionPath: hardcodedPath, showSolution: true }))
    }
  }, [gameState.rootWord, gameState.mysteryWord])

  const findBFSSolutionPath = useCallback((startWord: string, targetWord: string): string[] => {
    if (startWord === targetWord) return [startWord]

    const startUpper = startWord.toUpperCase()
    const targetUpper = targetWord.toUpperCase()
    
    // console.log(`\n=== Finding BFS Solution Path: ${startUpper} → ${targetUpper} ===`)
    
    // Use the imported bidirectional BFS for guaranteed shortest paths
    const path = bidirectionalBFS(startUpper, targetUpper)
    
    if (path.length > 0) {
      console.log(`🎯 Solution path found: ${path.join(' → ')}`)
      return path
    }
    
    console.log(`❌ No solution path found`)
    return [startWord, targetWord] // Fallback
  }, [])

  const getHardcodedSolution = useCallback((startWord: string, targetWord: string): string[] => {
    const startUpper = startWord.toUpperCase()
    const targetUpper = targetWord.toUpperCase()
    
    // Known solution paths for specific puzzles
    if (startUpper === "SWORD" && targetUpper === "BEACH") {
      return ["SWORD", "CROWD", "CHORD", "CHARD", "REACH", "BEACH"]
    }
    if (startUpper === "GAMES" && targetUpper === "FRONT") {
      return ["GAMES", "GAMER", "ANGER", "GONER", "TENOR", "FRONT"]
    }

    if (startUpper === "CUMIN" && targetUpper === "DEPTH") {
      return ["CUMIN", "MINCE", "MEDIC", "EDICT", "TEPID", "DEPTH"]
    }
    
    // Default fallback
    return [startUpper, targetUpper]
  }, [])

  const getBackgroundColor = useCallback((state: LetterState): string => {
    switch (state) {
      case "correct":
        return "bg-green-500"
      case "present":
        return "bg-yellow-500"
      default:
        return "bg-gray-600"
    }
  }, [])

  const getOptimalLetterHints = useCallback((currentWord: string, targetWord: string): number[] => {
      if (!currentWord || currentWord.length !== 5 || gameState.isHardMode) return []

      const cacheKey = `hints-${currentWord}-${targetWord}`
    if (hintsCache.current.has(cacheKey)) {
      return hintsCache.current.get(cacheKey)!
    }

    // Perform real-time BFS analysis to find the optimal next move
    const optimalHints = performRealTimeBFSAnalysis(currentWord, targetWord)
    
    // Cache the result
    hintsCache.current.set(cacheKey, optimalHints)
    return optimalHints
  }, [gameState.isHardMode])

  const performRealTimeBFSAnalysis = useCallback((currentWord: string, targetWord: string): number[] => {
    if (currentWord === targetWord) return []

      const currentUpper = currentWord.toUpperCase()
    const targetUpper = targetWord.toUpperCase()
    
    console.log(`\n=== BFS Analysis: ${currentUpper} → ${targetUpper} ===`)
    
    // Use bidirectional BFS to find the shortest path
    const path = bidirectionalBFS(currentUpper, targetUpper)
    
    if (path.length >= 2) {
      const nextWord = path[1]
      console.log(`🎯 TARGET FOUND! Complete path: ${path.join(' → ')}`)
      console.log(`📊 Path length: ${path.length} steps`)
      // console.log(`🔍 Next word in path: "${nextWord}"`)
      
      // Find the letter difference for hints
      const hints = findLetterDifference(currentUpper, nextWord)
      return hints
    }
    
    // If no path found, use fallback approach
    
    return findFallbackHint(currentUpper, targetWord)
  }, [])

  // Use the imported multiset-based neighbor generation
  const generateValidNeighbors = useCallback((word: string): string[] => {
    return neighborsOneChangeReorder(word)
  }, [])

  const findLetterDifference = useCallback((word1: string, word2: string): number[] => {
      const hints: number[] = []
    const targetLetters = word2.split('')
    
    
    // Find which letter from word1 is not in word2 (the letter to change)
      for (let i = 0; i < 5; i++) {
      if (!targetLetters.includes(word1[i])) {
            hints.push(i)
        
        break // Only highlight one letter for cleaner UI
      }
    }
    
    // If no letter is missing, find the first letter that's different
    if (hints.length === 0) {
      for (let i = 0; i < 5; i++) {
        if (word1[i] !== word2[i]) {
          hints.push(i)
          break
        }
      }
    }
    
      return hints
  }, [])

  const findFallbackHint = useCallback((currentWord: string, targetWord: string): number[] => {
    // Find any letter that's not in the target word and suggest changing it
    const targetLetters = targetWord.split('')
    for (let i = 0; i < 5; i++) {
      if (!targetLetters.includes(currentWord[i])) {
        return [i]
      }
    }
    
    // If all letters are in target, suggest changing the first letter that's in wrong position
    for (let i = 0; i < 5; i++) {
      if (currentWord[i] !== targetWord[i]) {
        return [i]
      }
    }
    
    return []
  }, [])

  // Function to provide semantic clues for words in the BFS path
  const getWordClue = useCallback((word: string): string | null => {
    const clues: Record<string, string> = {
      // Common 5-letter words with concise clues
      "sinew": "tendon",
      "twine": "string",
      "write": "compose",
      "tower": "building",
      "crowd": "group",
      "chord": "notes",
      "chard": "vegetable",
      "reach": "extend",
      "gamer": "player",
      "aback": "surprised",
      "abase": "humiliate",
      "abate": "lessen",
      "abbey": "monastery",
      "abbot": "monk",
      "abhor": "hate",
      "abide": "endure",
      "abled": "capable",
      "abode": "home",
      "abort": "cancel",
      "about": "concerning",
      "above": "overhead",
      "abuse": "mistreat",
      "abyss": "chasm",
      "acorn": "nut",
      "acrid": "bitter",
      "actor": "performer",
      "acute": "sharp",
      "adage": "proverb",
      "adapt": "adjust",
      "adept": "skilled",
      "admin": "manager",
      "admit": "confess",
      "adobe": "brick",
      "adopt": "embrace",
      "adore": "love",
      "adorn": "decorate",
      "adult": "grown",
      "affix": "attach",
      "afire": "burning",
      "afoot": "happening",
      "afoul": "conflicting",
      "after": "following",
      "again": "repeatedly",
      "agape": "open",
      "agate": "stone",
      "agent": "representative",
      "agile": "nimble",
      "aging": "maturing",
      "aglow": "shining",
      "agony": "pain",
      "agora": "marketplace",
      "agree": "consent",
      "ahead": "forward",
      "aider": "helper",
      "aisle": "passage",
      "alarm": "warning",
      "album": "collection",
      "alert": "vigilant",
      "algae": "seaweed",
      "alibi": "excuse",
      "align": "arrange",
      "alike": "similar",
      "alive": "living",
      "allay": "soothe",
      "alley": "pathway",
      "allot": "assign",
      "allow": "permit",
      "alloy": "mixture",
      "aloft": "airborne",
      "along": "together",
      "aloof": "distant",
      "aloud": "audible",
      "alpha": "first",
      "altar": "shrine",
      "alter": "change",
      "amass": "gather",
      "amaze": "astonish",
      "amber": "resin",
      "amble": "stroll",
      "amend": "improve",
      "amiss": "wrong",
      "amity": "friendship",
      "among": "between",
      "ample": "sufficient",
      "amply": "adequately",
      "amuse": "entertain",
      "angel": "messenger",
      "angle": "corner",
      "angry": "furious",
      "angst": "anxiety",
      "anime": "cartoon",
      "ankle": "joint",
      "annex": "addition",
      "annoy": "irritate",
      "annul": "cancel",
      "anode": "electrode",
      "antic": "prank",
      "anvil": "tool",
      "aorta": "artery",
      "apart": "separate",
      "aphid": "insect",
      "aping": "copying",
      "apnea": "breathing",
      "apple": "fruit",
      "apply": "use",
      "arena": "stadium",
      "argue": "dispute",
      "arise": "emerge",
      "array": "arrangement",
      "aside": "separately",
      "asset": "property",
      "audio": "sound",
      "audit": "examination",
      "avoid": "evade",
      "await": "wait",
      "awake": "conscious",
      "award": "prize",
      "aware": "conscious",
      "awful": "terrible",
      "axiom": "principle",
      
      // Current puzzle rotation words
      "storm": "tempest",
      "light": "illumination",
      "games": "play",
      "front": "foremost",
      "bread": "food",
      "honey": "sweet",
      "cumin": "spice",
      "depth": "profundity",
      "sword": "weapon",
      "beach": "shore",
      "anger": "rage",
      "goner": "finished",
      "tenor": "voice",
      "break": "shatter",
      "brake": "stop",
      "brave": "courageous",
      "grave": "serious",
      "mince": "chop",
      "medic": "doctor",
      "edict": "decree",
      "tepid": "lukewarm",
      
      // Additional words from BFS paths
      "triad": "group",
      "third": "ordinal",
      "girth": "circumference",
      "ridge": "crest",
      "tiger": "feline",
      "cedar": "tree",
      "worth": "value",
      
      // Additional words from SWORD → BEACH path
      "wards": "guards",
      "shard": "fragment",
      "heard": "listened",
      
      // Additional words from GAMES → FRONT path
      "morse": "code",
      
      // Additional words from SWORD → BEACH path
      "swear": "curse",
      "share": "divide",
      
      // Additional words from current puzzle
      
      // Additional words from all puzzle starting words
      "elfin": "fairy",
      
      // Words from BFS paths that are missing clues
      "manic": "crazy",
      "meant": "intended",
      "tamed": "domesticated",
      "short": "brief",
      "shirt": "garment",
      "fling": "throw",
      "sling": "strap",
      "glans": "tip",
      "glass": "transparent",
      "grass": "lawn",
      
      // Additional words from all BFS paths
      "smear": "spread",
      "rates": "prices",
      "roast": "cook",
      "snort": "laugh",
      
      // Additional words from HOUSE → MAGIC path and other missing words
      "house": "home",
      "mouse": "rodent",
      "males": "men",
      "email": "message",
      "image": "picture",
      "magic": "spell",
      "serum": "liquid",
      "miser": "stingy",
      "grime": "dirt",
      
      // Additional words from OCEAN → FIELD path and other missing words
      "ocean": "sea",
      "alone": "solitary",
      "alien": "foreign",
      "ideal": "perfect",
      "field": "meadow",
      
      // Additional words from BREAD → HONEY path and other missing words
      "yearn": "desire",
      "hyena": "animal",
      "ready": "prepared",
      "denim": "fabric",
      "pined": "longed",
      
      // New puzzles with single letter overlaps
      "space": "area",
      "place": "location",
      "smile": "grin",
      "stile": "step",
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
            if (!found.some((f) => f.letter === letter)) {
              found.push({ letter, position: index })
            }
          }
        })
      }
    })

    return found.sort((a, b) => a.position - b.position)
  }, [gameState.mysteryWord, gameState.revealedLetters, gameState.attempts, checkWord])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        // Clear the current cell first
        handleLetterInput(index, "")
        if (index > 0) {
          // Then move to previous cell with a delay so clearing is visible
          setTimeout(() => {
          setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
            inputRefs.current[index - 1]?.focus()
          }, 50)
        }
      }
      if (e.key === "ArrowLeft") {
        if (index > 0) {
          // Just move cursor, don't clear any letters
          setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
          setTimeout(() => inputRefs.current[index - 1]?.focus(), 0)
        }
      }
      if (e.key === "ArrowRight") {
        if (index < 4) {
          // Just move cursor, don't clear any letters
          setGameState((prev) => ({ ...prev, activeIndex: index + 1 }))
          setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
        }
      }
      if (e.key === "Enter") {
        const allLettersFilled = gameState.inputLetters.every((letter) => letter.trim() !== "")
        if (allLettersFilled) {
          submitWord()
        }
      }
    },
    [handleLetterInput, gameState.inputLetters, submitWord],
  )

  // Show splash screen first
  if (showSplash) {
  return (
      <div className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${inter.variable} ${poppins.variable}`}>
        <div className="text-center max-w-md">
          {/* Tossword Logo - Placeholder for now */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 w-24 h-24 mx-auto mb-4">
              <div className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">*</span>
              </div>
              <div className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">*</span>
              </div>
              <div className="bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">*</span>
              </div>
              <div className="bg-gray-800 border-2 border-gray-600 rounded"></div>
              <div className="bg-yellow-400 border-2 border-yellow-500 rounded"></div>
              <div className="bg-green-500 border-2 border-green-600 rounded"></div>
              <div className="bg-green-500 border-2 border-green-600 rounded"></div>
              <div className="bg-green-500 border-2 border-green-600 rounded"></div>
              <div className="bg-green-500 border-2 border-green-600 rounded"></div>
            </div>
          </div>
          
          {/* Game Title */}
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-poppins">Tossword</h1>
          
          {/* Today's Tossword */}
          <p className="text-lg text-gray-700 mb-4 font-inter">
            Today's tossword is <strong>{settingsLoaded ? (debugMode ? "OCEAN" : (selectedPuzzle?.root || "Loading...")) : "..."}</strong>.
            {!settingsLoaded && <span className="text-sm text-gray-500"> (Loading...)</span>}
          </p>
          
          {/* Instructions */}
          <p className="text-lg text-gray-700 mb-8 font-inter">
            Using this word as a starting point, change one letter at a time, in any order, to unlock today's mystery word.
          </p>
          
          {/* Play Button */}
          <button
            onClick={() => setShowSplash(false)}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors font-inter cursor-pointer"
          >
            Play
          </button>
          
          {/* Game Info */}
          <div className="mt-8 text-sm text-gray-500 font-inter">
            <p>Word Ladder Puzzle Game</p>
            <p>Challenge your vocabulary and logic</p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-gray-200 rounded text-xs text-gray-600">
                <p>Debug: settingsLoaded={settingsLoaded.toString()}</p>
                <p>Debug: debugMode={debugMode.toString()}</p>
                <p>Debug: localStorage debug={typeof window !== 'undefined' ? localStorage.getItem('wordbreaker-debug-mode') : null}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show loading screen until game is ready
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-black flex items-center justify-center p-4 ${inter.variable} ${poppins.variable}`}>
        <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-white mb-4 font-poppins">Tossword</h1>
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm font-inter">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-white flex flex-col ${inter.variable} ${poppins.variable}`}>
      {/* Header */}
      <header className="bg-white text-gray-900 py-4 px-6 border-b border-gray-300 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="text-xl font-bold font-poppins">Tossword</div>
          <div className="flex items-center gap-3">
            {/* Debug-only buttons */}
            {debugMode && (
              <>
                <button
                  onClick={showSolutionPath}
                  className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  title="Show Solution (Debug)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </button>

                <button
                  onClick={resetGame}
                  className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  title="Reset Game (Debug)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                <button
                  onClick={initializeGame}
                  className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  title="New Game (Debug)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Always visible buttons */}
            <button
              onClick={() => setShowHowToPlay(true)}
              className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              title="How to Play"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowStats(true)}
              className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              title="Statistics"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-20 md:pb-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-poppins">Tossword</h1>
        </div>

        {/* {gameState.gameWon && (
          <div className="text-center mb-6 p-4 bg-emerald-900/30 rounded-lg border border-emerald-700">
            <h2 className="text-emerald-400 text-xl font-bold mb-2 font-poppins">🎉 Congratulations!</h2>
            <p className="text-emerald-300 font-inter">You solved it in {gameState.attempts.length} attempts!</p>
          </div>
        )} */}

        <div className="space-y-1 mb-2">
          {/* Found Letters Display - Right aligned with last letter of mystery word */}
          {/* <div className="flex justify-end mb-2" style={{ width: "256px", margin: "0 auto" }}>
            <div className="flex gap-1 mb-1">
              {foundLetters.map((item, index) => (
                <div key={index} className="w-12 h-12 bg-amber-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold font-inter">{item.letter}</span>
                </div>
              ))}
            </div>
          </div> */}

          <div className="w-[312px] mx-auto flex justify-center gap-1 mb-1">
                         {gameState.mysteryWord.split("").map((letter, index) => {
               // Reveal letters that actually exist in any guessed word
               const isLetterFound = gameState.attempts.some(attempt => {
                 // Check if this letter from the mystery word exists anywhere in the attempt
                 return attempt.includes(letter)
               })
               
               return (
              <div
                key={index}
                className={`w-12 h-12 flex items-center justify-center shadow-lg relative ${
                     isLetterFound ? "bg-emerald-600" : "bg-gray-600"
                } ${gameState.showWinAnimation && gameState.gameWon ? "animate-[spinX_1s_ease-in-out_1]" : ""}`}
                style={{
                  animationDelay: gameState.showWinAnimation && gameState.gameWon ? `${index * 200}ms` : "0ms",
                }}
                onTouchStart={() => {
                  // Show tooltip on touch for mobile
                  const tooltip = document.getElementById(`mystery-letter-tooltip-${index}`)
                  if (tooltip) {
                    tooltip.classList.remove('hidden')
                    setTimeout(() => tooltip.classList.add('hidden'), 3000) // Hide after 3 seconds
                  }
                }}
                onMouseEnter={() => {
                  // Show tooltip on hover for desktop
                  const tooltip = document.getElementById(`mystery-letter-tooltip-${index}`)
                  if (tooltip) tooltip.classList.remove('hidden')
                }}
                onMouseLeave={() => {
                  // Hide tooltip on hover out for desktop
                  const tooltip = document.getElementById(`mystery-letter-tooltip-${index}`)
                  if (tooltip) tooltip.classList.add('hidden')
                }}
              >
                <span
                     className={`font-bold font-inter leading-none ${
                       isLetterFound ? "text-white text-lg" : "text-gray-400 text-3xl"
                  }`}
                >
                     {isLetterFound ? letter : "*"}
                </span>
                
                {/* Custom tooltip for mystery word letters */}
                <div
                  id={`mystery-letter-tooltip-${index}`}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words"
                >
                  {isLetterFound ? `Letter "${letter}" found in your guesses` : "Mystery letter - keep guessing to reveal"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
               )
             })}
                         {/* Padlock icon for mystery word - shows locked until solved, then unlocked */}
             <div 
               className="w-12 h-12 bg-gray-600 flex items-center justify-center shadow-md cursor-pointer relative"
               onTouchStart={() => {
                 // Show tooltip on touch for mobile
                 const tooltip = document.getElementById('mystery-tooltip')
                 if (tooltip) {
                   tooltip.classList.remove('hidden')
                   setTimeout(() => tooltip.classList.add('hidden'), 3000) // Hide after 3 seconds
                 }
               }}
               onMouseEnter={() => {
                 // Show tooltip on hover for desktop
                 const tooltip = document.getElementById('mystery-tooltip')
                 if (tooltip) tooltip.classList.remove('hidden')
               }}
               onMouseLeave={() => {
                 // Hide tooltip on hover out for desktop
                 const tooltip = document.getElementById('mystery-tooltip')
                 if (tooltip) tooltip.classList.add('hidden')
               }}
             >
               {gameState.gameWon ? (
                 // Unlocked padlock icon when puzzle is solved
                //  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                //    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                //    <rect width="16" height="12" x="4" y="11" rx="2" ry="2"/>
                //    <path d="M8 15h8"/>
                //  </svg>
                <svg xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"
                  className="w-5 h-5 text-green-400">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
               ) : (
                 // Locked padlock icon when puzzle is unsolved
                 <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                   <rect width="16" height="12" x="4" y="11" rx="2" ry="2"/>
                   <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                 </svg>
               )}
                
                {/* Custom tooltip for mystery word padlock */}
                <div
                  id="mystery-tooltip"
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words"
                >
                  {gameState.gameWon ? "Puzzle unlocked! Well done!" : "Puzzle locked - solve it to unlock!"}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
          </div>



          {/* Start word row - only show when there are 0 attempts */}
          {gameState.attempts.length === 0 ? (
            <div className="w-[312px] mx-auto flex justify-center gap-1 mb-1">
              {gameState.rootWord.split("").map((letter, index) => {
                const shouldShowHint = !gameState.isHardMode && gameState.attempts.length === 0
                const optimalHints = shouldShowHint
                  ? getOptimalLetterHints(gameState.rootWord, gameState.mysteryWord)
                  : []
                const shouldHighlight = shouldShowHint && optimalHints.includes(index)
                      
                                    return (
                <div
                  key={index}
                  className={`w-12 h-12 bg-gray-500 flex items-center justify-center shadow-md ${
                            shouldHighlight ? "discard !bg-[oklch(0.145_0_0)]" : ""
                          } relative`}
                          onTouchStart={() => {
                            // Show tooltip on touch for mobile
                            const tooltip = document.getElementById(`start-tooltip-${index}`)
                            if (tooltip) {
                              tooltip.classList.remove('hidden')
                              setTimeout(() => tooltip.classList.add('hidden'), 3000) // Hide after 3 seconds
                            }
                          }}
                          onMouseEnter={() => {
                            // Show tooltip on hover for desktop
                            const tooltip = document.getElementById(`start-tooltip-${index}`)
                            if (tooltip) tooltip.classList.remove('hidden')
                          }}
                          onMouseLeave={() => {
                            // Hide tooltip on hover out for desktop
                            const tooltip = document.getElementById(`start-tooltip-${index}`)
                            if (tooltip) tooltip.classList.add('hidden')
                          }}
                        >
                          <span className={`text-lg font-bold font-inter ${
                            shouldHighlight ? "text-gray-400" : "text-white"
                          }`}>
                            {letter}
                          </span>
                          
                          {/* Custom tooltip for start word hints */}
                          {shouldHighlight && (
                            <div
                              id={`start-tooltip-${index}`}
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words"
                            >
                              Hint: Change this letter to reach the next word
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                </div>
              )
              })}
              {/* Step number for start word - shows total steps needed */}
              <div 
                className="w-12 h-12 bg-gray-600 flex items-center justify-center shadow-md cursor-pointer"
                title="Minimum steps to solve this puzzle"
              >
                <span className="text-yellow-400 text-lg font-bold font-inter">
                  {(() => {
                    const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                    return path.length > 0 ? path.length - 1 : "?"
                  })()}
                </span>
              </div>
            </div>
          ) : null}
          


                    {/* Show all attempts when solved, otherwise only show the last submitted attempt */}
          {(gameState.gameWon ? gameState.attempts : gameState.attempts.slice(-1)).map((attempt, sliceIndex) => {
            // Calculate the actual index in the full attempts array
            const actualIndex = gameState.gameWon ? sliceIndex : gameState.attempts.length - 1
            // When solved, show hints on all attempts. When playing, only show hints on the last attempt
            const isLastAttempt = gameState.gameWon ? true : true
            const isCompleted = gameState.gameWon && actualIndex === gameState.attempts.length - 1
            const results = checkWord(attempt, gameState.mysteryWord)
            const shouldShowHint = !gameState.isHardMode && isLastAttempt
            // Get hints for the next word in the BFS path, not the mystery word
            const optimalHints = shouldShowHint ? (() => {
              // Find the next word in the BFS path from this attempt
              const path = bidirectionalBFS(attempt.toUpperCase(), gameState.mysteryWord.toUpperCase())
              if (path.length >= 2) {
                const nextWord = path[1]
                const hints = getOptimalLetterHints(attempt, nextWord)
                return hints
              }
              return []
            })() : []
            
                         // Calculate remaining steps to target based on BFS path during gameplay
             // Only show entry order when game is won
            const currentWord = attempt
            const targetWord = gameState.mysteryWord
            const path = bidirectionalBFS(currentWord.toUpperCase(), targetWord.toUpperCase())
            const remainingSteps = path.length > 0 ? path.length - 1 : 0
             const entryOrder = gameState.gameWon ? sliceIndex + 1 : remainingSteps

            return (
              <div 
                key={actualIndex} 
                className={`w-[312px] mx-auto flex items-center gap-1 justify-center ${
                  gameState.gameWon ? "animate-[slideInFromTop_0.5s_ease-out_forwards]" : ""
                }`}
                style={{
                  animationDelay: gameState.gameWon ? `${1500 + actualIndex * 200}ms` : "0ms",
                  visibility: gameState.gameWon && actualIndex > 0 ? "hidden" : "visible"
                }}
              >
                <div className="flex gap-1">
                  {attempt.split("").map((letter, letterIndex) => {
                    const shouldHighlight = shouldShowHint && optimalHints.includes(letterIndex)
                    // Hint styling takes priority over mystery word reveal styling
                    const bgColor = shouldHighlight ? "!bg-[oklch(0.145_0_0)]" : "bg-gray-600"
                    const borderColor =
                      results[letterIndex] === "correct"
                        ? "border-b-[3px] border-b-emerald-500"
                        : results[letterIndex] === "present"
                          ? "border-b-[3px] border-b-amber-500"
                          : ""
                    
                    return (
                      <div
                        key={letterIndex}
                        className={`w-12 h-12 ${bgColor} flex items-center justify-center shadow-md ${borderColor} ${shouldHighlight ? "discard" : ""} ${gameState.showWinAnimation && isCompleted ? "animate-[spinX_1s_ease-in-out_1]" : ""} relative`}
                        style={{
                          animationDelay: gameState.showWinAnimation && isCompleted ? `${letterIndex * 200}ms` : "0ms",
                        }}
                        onTouchStart={() => {
                          // Show tooltip on touch for mobile
                          const tooltip = document.getElementById(`tooltip-${actualIndex}-${letterIndex}`)
                          if (tooltip) {
                            tooltip.classList.remove('hidden')
                            setTimeout(() => tooltip.classList.add('hidden'), 3000) // Hide after 3 seconds
                          }
                        }}
                        onMouseEnter={() => {
                          // Show tooltip on hover for desktop
                          const tooltip = document.getElementById(`tooltip-${actualIndex}-${letterIndex}`)
                          if (tooltip) tooltip.classList.remove('hidden')
                        }}
                        onMouseLeave={() => {
                          // Hide tooltip on hover out for desktop
                          const tooltip = document.getElementById(`tooltip-${actualIndex}-${letterIndex}`)
                          if (tooltip) tooltip.classList.add('hidden')
                        }}
                      >
                        <span className={`text-lg font-bold font-inter ${
                          shouldHighlight ? "text-gray-400" : "text-white"
                        }`}>
                          {letter}
                        </span>
                        
                        {/* Custom tooltip for mobile and desktop */}
                        <div
                          id={`tooltip-${actualIndex}-${letterIndex}`}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words"
                        >
                          {(() => {
                            if (shouldHighlight) return "Tossable"
                            if (results[letterIndex] === "correct") return "Correct letter in correct position"
                            if (results[letterIndex] === "present") return "Letter is in the word but wrong position"
                            return "Letter not in the word"
                          })()}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Entry order for completed rows when game is won */}
                  <div 
                    className="w-12 h-12 bg-gray-600 flex items-center justify-center shadow-md cursor-pointer relative"
                    onTouchStart={() => {
                      // Show tooltip on touch for mobile
                      const tooltip = document.getElementById(`entry-tooltip-${actualIndex}`)
                      if (tooltip) {
                        tooltip.classList.remove('hidden')
                        setTimeout(() => tooltip.classList.add('hidden'), 3000) // Hide after 3 seconds
                      }
                    }}
                    onMouseEnter={() => {
                      // Show tooltip on hover for desktop
                      const tooltip = document.getElementById(`entry-tooltip-${actualIndex}`)
                      if (tooltip) tooltip.classList.remove('hidden')
                    }}
                    onMouseLeave={() => {
                      // Hide tooltip on hover out for desktop
                      const tooltip = document.getElementById(`entry-tooltip-${actualIndex}`)
                      if (tooltip) tooltip.classList.add('hidden')
                    }}
                  >
                    {gameState.gameWon && entryOrder === 0 ? (
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-yellow-400 text-lg font-bold font-inter">
                        {entryOrder}
                      </span>
                    )}
                    
                    {/* Custom tooltip for entry order */}
                    <div
                      id={`entry-tooltip-${actualIndex}`}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words"
                    >
                      {gameState.gameWon ? `Word entered ${entryOrder}${entryOrder === 1 ? 'st' : entryOrder === 2 ? 'nd' : entryOrder === 3 ? 'rd' : 'th'}` : `Remaining steps to solve: ${entryOrder}`}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {!gameState.gameWon && (
            <>
              {/* Auto-hint display */}
              {/* {gameState.showAutoHint && (
                <div className="w-[312px] mx-auto mb-4">
                  <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-3 text-center animate-[fadeIn_0.3s_ease-out_forwards]">
                    <p className="text-amber-300 text-sm font-inter">
                      {gameState.autoHintText}
                    </p>
                  </div>
                </div>
              )} */}
              {/* Auto‑hint (fades + collapses) */}
              <div
                className={`
                  w-[312px] mx-auto overflow-hidden
                  transition-[max-height,opacity,margin] duration-1300 ease-in-out
                  ${gameState.showAutoHint ? 'max-h-12 my-2 opacity-100' : 'max-h-0 my-0 opacity-0'}
                `}
              >
                <div className="h-12 w-full border-2 border-gray-600 bg-gray-800 shadow-lg flex items-center justify-center">
                  <p className="text-gray-300 text-sm font-inter" aria-live="polite">
                    {gameState.autoHintText}
                  </p>
                </div>
              </div>

              <div className="w-[312px] mx-auto flex justify-center gap-1">
                {gameState.inputLetters.map((letter, index) => {
                  return (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      value={letter}
                      onChange={(e) => handleLetterInput(index, e.target.value.slice(-1))}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={() => handleFocus(index)}
                      className={`w-12 h-12 bg-transparent border border-gray-500 text-center text-lg font-bold text-gray-900 focus:outline-none font-inter ${
                        gameState.activeIndex === index ? "" : ""
                      }`}
                      maxLength={1}
                    />
                  )
                })}
                {/* "?" placeholder that shows clue for next word in BFS path */}
                <div 
                  className="w-12 h-12 bg-gray-600 flex items-center justify-center cursor-pointer relative"
                  onTouchStart={() => {
                    // Show tooltip on touch for mobile
                    const tooltip = document.getElementById('clue-tooltip')
                    if (tooltip) {
                      tooltip.classList.remove('hidden')
                      setTimeout(() => tooltip.classList.add('hidden'), 3000) // Hide after 3 seconds
                    }
                  }}
                  onMouseEnter={() => {
                    // Show tooltip on hover for desktop
                    const tooltip = document.getElementById('clue-tooltip')
                    if (tooltip) tooltip.classList.remove('hidden')
                  }}
                  onMouseLeave={() => {
                    // Hide tooltip on hover out for desktop
                    const tooltip = document.getElementById('clue-tooltip')
                    if (tooltip) tooltip.classList.add('hidden')
                  }}
                >
                  <span className="text-yellow-400 text-lg font-bold font-inter">?</span>
                  
                  {/* Custom tooltip for clue button */}
                  <div
                    id="clue-tooltip"
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none max-w-[200px] text-center break-words"
                  >
                    {(() => {
                    // Get clue for the next word in the BFS path
                    if (gameState.attempts.length > 0) {
                      // If there are attempts, get clue for next word after last attempt
                      const lastAttempt = gameState.attempts[gameState.attempts.length - 1].toUpperCase()
                      const path = bidirectionalBFS(lastAttempt, gameState.mysteryWord.toUpperCase())
                      if (path.length >= 2) {
                        const nextWord = path[1].toLowerCase()
                        const clue = getWordClue(nextWord)
                          return clue ? `"${clue}"` : `No clue for "${nextWord}"`
                      }
                    } else {
                      // If no attempts yet, get clue for first word in BFS path
                      const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                      if (path.length >= 2) {
                        const nextWord = path[1].toLowerCase()
                        const clue = getWordClue(nextWord)
                          return clue ? `"${clue}"` : `No clue for "${nextWord}"`
                      }
                    }
                    return "No clue available"
                  })()}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
              </div>
              {/* {gameState.errorMessage && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-center text-sm font-inter">{gameState.errorMessage}</p>
                </div>
              )} */}
              {/* Error message (matches grid cell + fades/collapses) */}
              <div
                className={[
                  "w-[312px] mx-auto overflow-hidden",
                  "transition-[max-height,opacity,margin] duration-300 ease-in-out",
                  gameState.errorMessage ? "max-h-12 opacity-100 my-2" : "max-h-0 opacity-0 my-0",
                ].join(" ")}
                aria-live="polite"
              >
                <div className="h-12 w-full border-2 border-gray-600 bg-gray-800 shadow-lg flex items-center justify-center">
                  <p className="text-gray-400 text-sm font-inter">
                    {gameState.errorMessage}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>



        {/* Solution Modal */}
        {gameState.showSolution && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setGameState((prev) => ({ ...prev, showSolution: false }))}
          >
            <div 
              className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white font-poppins">
                {gameState.solutionPath.length > 0
                    ? `Solution Path (${gameState.solutionPath.length - 1} words)`
                  : "Solution Path"}
                </h2>
              <button
                onClick={() => setGameState((prev) => ({ ...prev, showSolution: false }))}
                className="text-gray-400 hover:text-white transition-colors"
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              
            {gameState.solutionPath.length > 0 ? (
                <div className="space-y-4">
                  {gameState.solutionPath.map((word, stepIndex) => {
                    const isTarget = stepIndex === gameState.solutionPath.length - 1
                    const isStart = stepIndex === 0
                    
                    // Get hint letters for this word (except target word)
                    const shouldShowHint = !isTarget && !isStart
                    const optimalHints = shouldShowHint ? getOptimalLetterHints(word, gameState.mysteryWord) : []
                    
                    return (
                  <div key={stepIndex} className="text-center">
                        <div className="flex justify-center gap-1 mb-1">
                      {word.split("").map((letter, letterIndex) => {
                        const results = checkWord(word, gameState.mysteryWord)
                                                             const bgColor = "bg-gray-700"
                              const borderColor =
                          results[letterIndex] === "correct"
                                  ? "border-b-[3px] border-b-emerald-500"
                            : results[letterIndex] === "present"
                                    ? "border-b-[3px] border-b-amber-500"
                                    : ""
                              
                              // Check if this letter should show hint underline
                              const shouldHighlight = shouldShowHint && optimalHints.includes(letterIndex)
                              
                        return (
                          <div
                            key={letterIndex}
                                  className={`w-12 h-12 ${bgColor} flex items-center justify-center shadow-md ${
                                    shouldHighlight ? "discard !bg-[oklch(0.145_0_0)]" : ""
                                  } ${borderColor}`}
                                  title={(() => {
                                    if (shouldHighlight) return "Hint: Change this letter to reach the next word"
                                    if (results[letterIndex] === "correct") return "Correct letter in correct position"
                                    if (results[letterIndex] === "present") return "Letter is in the wrong position"
                                    return "Letter not in the word"
                                  })()}
                                >
                                  <span className={`text-lg font-bold font-inter ${
                                    shouldHighlight ? "text-gray-400" : "text-white"
                                  }`}>
                                    {letter}
                                  </span>
                          </div>
                        )
                      })}
                          {/* Step number indicator - shows entry order for reveal sequence */}
                          {!isTarget && (
                            <div 
                              className="w-12 h-12 bg-gray-600 flex items-center justify-center shadow-md cursor-pointer"
                              title={`Word ${stepIndex + 1}`}
                            >
                              <span className="text-yellow-400 text-lg font-bold font-inter">
                                {stepIndex + 1}
                              </span>
                            </div>
                          )}
                    </div>
                    <div className="text-yellow-400 text-sm font-medium font-inter">
                      {stepIndex === 0
                        ? "Start"
                        : stepIndex === gameState.solutionPath.length - 1
                          ? "Mystery Word"
                          : `Word ${stepIndex + 1}`}
                    </div>
                        {stepIndex < gameState.solutionPath.length - 1 && (
                          <div className="text-yellow-400 text-xl font-bold">↓</div>
                        )}
                  </div>
                    )
                  })}
              </div>
            ) : (
                <div className="text-center font-inter">
                  <p className="text-yellow-400 text-lg">No solution path found.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    This puzzle may be unsolvable.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                  Debug: {gameState.rootWord} → {gameState.mysteryWord}
                </p>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white font-poppins">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-gray-300 font-inter">
              {/* Hard Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Hard Mode</h3>
                  <p className="text-gray-400 text-sm">No hints - pure challenge!</p>
                </div>
                <button
                  onClick={() => setGameState((prev) => ({ ...prev, isHardMode: !prev.isHardMode }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gameState.isHardMode ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gameState.isHardMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Debug Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Debug Mode</h3>
                  <p className="text-gray-400 text-sm">Force OCEAN → FIELD puzzle for testing</p>
                </div>
                <button
                  onClick={() => {
                    const newDebugMode = !debugMode
                    setDebugMode(newDebugMode)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('wordbreaker-debug-mode', newDebugMode.toString())
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    debugMode ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      debugMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Hint Text Auto Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">Auto Hints</h3>
                  <p className="text-gray-400 text-sm">Automatically show hints for next words</p>
                </div>
                <button
                  onClick={() => {
                    const newHintTextAuto = !hintTextAuto
                    setHintTextAuto(newHintTextAuto)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('wordbreaker-hint-text-auto', newHintTextAuto.toString())
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    hintTextAuto ? "bg-emerald-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      hintTextAuto ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Dark Theme Toggle (placeholder for future implementation) */}
              <div className="flex items-center justify-between opacity-50">
                <div>
                  <h3 className="text-white font-semibold">Dark Theme</h3>
                  <p className="text-gray-400 text-sm">Switch between light and dark themes</p>
                </div>
                <button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>

              {/* Reset Game Button */}
              <div className="pt-4 border-t border-gray-600">
                <p className="text-gray-400 text-sm mb-3 text-center">
                  Settings are saved automatically. Click below to start a new game with current settings.
                </p>
                <button
                  onClick={() => {
                    setShowSettings(false)
                    initializeGame()
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Reset Game (Apply Settings)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white text-gray-900 py-4 px-6 border-t border-gray-300 shadow-sm md:relative">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm text-gray-600 font-inter">© Red Mountain Media, LLC 2025</p>
        </div>
      </footer>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowHowToPlay(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white font-poppins">How To Play</h2>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <span className="text-sm">Letter is in the word and in the correct spot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">I</span>
                    </div>
                    <span className="text-sm">Letter is in the word but in the wrong spot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">U</span>
                    </div>
                    <span className="text-sm">Letter is not in the word</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white">Modes:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>Easy Mode:</strong> Shows hints for optimal letter changes
                  </li>
                  <li>
                    <strong>Hard Mode:</strong> No hints - pure challenge!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
