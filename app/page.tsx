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
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  const [showSettings, setShowSettings] = useState(false)

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
    const puzzle = gameState.isHardMode
      ? HARD_PUZZLES[Math.floor(Math.random() * HARD_PUZZLES.length)]
      : PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
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
    })
  }, [gameState.isHardMode])

  useEffect(() => {
    initializeGame()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [gameState.mysteryWord])

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

      const filteredLetter = letter.replace(/[^A-Za-z]/g, "")
      if (!filteredLetter) return

      const newInput = [...gameState.inputLetters]
      newInput[index] = filteredLetter.toUpperCase()

      setGameState((prev) => ({ ...prev, inputLetters: newInput }))

      // Auto-advance focus
      if (filteredLetter && index < 4) {
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

      // If there's an existing letter, clear it
      if (gameState.inputLetters[index]) {
        const newInput = [...gameState.inputLetters]
        newInput[index] = ""
        setGameState((prev) => ({ ...prev, inputLetters: newInput }))
      }
    },
    [gameState.inputLetters],
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
      console.log("✅ Using BFS-found path:", bfsPath)
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
    
    console.log(`\n=== Finding BFS Solution Path: ${startUpper} → ${targetUpper} ===`)
    
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
    if (startUpper === "BREAD" && targetUpper === "HONEY") {
      return ["BREAD", "BREAK", "BRAKE", "BRAVE", "GRAVE", "HONEY"]
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
    
    // Debug logging
    console.log(`🔍 getOptimalLetterHints: ${currentWord} -> ${targetWord}, result:`, optimalHints)
    
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
      console.log(`🔍 Next word in path: "${nextWord}"`)
      
      // Find the letter difference for hints
      const hints = findLetterDifference(currentUpper, nextWord)
      return hints
    }
    
    // If no path found, use fallback approach
    console.log(`❌ BFS no path found for ${currentUpper} → ${targetUpper}`)
    console.log(`🔧 Using fallback hint system`)
    return findFallbackHint(currentUpper, targetWord)
  }, [])

  // Use the imported multiset-based neighbor generation
  const generateValidNeighbors = useCallback((word: string): string[] => {
    return neighborsOneChangeReorder(word)
  }, [])

  const findLetterDifference = useCallback((word1: string, word2: string): number[] => {
      const hints: number[] = []
    const targetLetters = word2.split('')
    
    console.log(`🔍 findLetterDifference: "${word1}" -> "${word2}"`)
    console.log(`🔍 Target letters: [${targetLetters.join(', ')}]`)
    console.log(`🔍 Word1 letters: [${word1.split('').join(', ')}]`)
    
    // Find which letter from word1 is not in word2 (the letter to change)
      for (let i = 0; i < 5; i++) {
      if (!targetLetters.includes(word1[i])) {
            hints.push(i)
        console.log(`🔍 Letter "${word1[i]}" at index ${i} not in target, adding to hints`)
        break // Only highlight one letter for cleaner UI
      }
    }
    
    // If no letter is missing, find the first letter that's different
    if (hints.length === 0) {
      for (let i = 0; i < 5; i++) {
        if (word1[i] !== word2[i]) {
          hints.push(i)
          console.log(`🔍 Letter "${word1[i]}" at index ${i} different from target "${word2[i]}", adding to hints`)
          break
        }
      }
    }
    
    console.log(`🔍 Final hints array: [${hints.join(', ')}]`)
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
        if (index > 0) {
          handleLetterInput(index - 1, "")
          setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
          setTimeout(() => inputRefs.current[index - 1]?.focus(), 0)
        } else {
          // If at first position, just clear it
          handleLetterInput(index, "")
        }
      }
      if (e.key === "ArrowLeft") {
        if (index > 0) {
          handleLetterInput(index - 1, "")
          setGameState((prev) => ({ ...prev, activeIndex: index - 1 }))
          setTimeout(() => inputRefs.current[index - 1]?.focus(), 0)
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

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center p-4 ${inter.variable} ${poppins.variable}`}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 font-poppins">Tossword</h1>
                                            <p className="text-gray-300 text-sm font-inter">
                   Begin unlocking today's mystery word by changing one letter from the Tossword <strong>"{gameState.rootWord}"</strong>. You can rearrange letters to make the new word but you must use all but one letter from the previous word.
                   Today's word can be unlocked in <strong>{(() => {
                      const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                      return path.length > 0 ? path.length - 1 : "?"
                    })()} words. </strong>
                  </p>

                {(() => {
                  const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                  if (path.length >= 2) {
                    // Find the next word based on current game state
                    let nextWord = ""
                    if (gameState.attempts.length === 0) {
                      // If no attempts yet, show clue for first step
                      nextWord = path[1].toLowerCase()
                    } else {
                      // Find the next word in the path after the last attempt
                      const lastAttempt = gameState.attempts[gameState.attempts.length - 1].toUpperCase()
                      const attemptIndex = path.findIndex(word => word === lastAttempt)
                      if (attemptIndex >= 0 && attemptIndex + 1 < path.length) {
                        nextWord = path[attemptIndex + 1].toLowerCase()
                      }
                    }
                    
                    if (nextWord) {
                      // console.log(`🔍 Looking for clue for: "${nextWord}"`)
                      const clue = getWordClue(nextWord)
                      // console.log(`🔍 Found clue: "${clue}"`)
                      if (clue) {
                        return null // Clue display removed - now shown on hover in guess word columns
                      } else {
                        console.log(`❌ No clue found for: "${nextWord}"`)
                      }
                    }
                    
                    // Special case: if user is one step away from mystery word, show mystery word clue
                    if (gameState.attempts.length > 0) {
                      const lastAttempt = gameState.attempts[gameState.attempts.length - 1].toUpperCase()
                      const attemptIndex = path.findIndex(word => word === lastAttempt)
                      if (attemptIndex >= 0 && attemptIndex + 1 === path.length - 1) {
                        // User is one step away from mystery word
                        const mysteryWordClue = getWordClue(gameState.mysteryWord.toLowerCase())
                        if (mysteryWordClue) {
                          return null // Clue display removed - now shown on hover in guess word columns
                        }
                      }
                    }
                  }
                  return null
                })()}
        </div>

        {/* {gameState.gameWon && (
          <div className="text-center mb-6 p-4 bg-emerald-900/30 rounded-lg border border-emerald-700">
            <h2 className="text-emerald-400 text-xl font-bold mb-2 font-poppins">🎉 Congratulations!</h2>
            <p className="text-emerald-300 font-inter">You solved it in {gameState.attempts.length} attempts!</p>
          </div>
        )} */}

        <div className="space-y-2 mb-2">
          {/* Found Letters Display - Right aligned with last letter of mystery word */}
          {/* <div className="flex justify-end mb-2" style={{ width: "256px", margin: "0 auto" }}>
            <div className="flex gap-1 mb-2">
              {foundLetters.map((item, index) => (
                <div key={index} className="w-12 h-12 bg-amber-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold font-inter">{item.letter}</span>
                </div>
              ))}
            </div>
          </div> */}

          <div className="w-[312px] mx-auto flex justify-center gap-1 mb-2">
                         {gameState.mysteryWord.split("").map((letter, index) => {
               // Reveal letters that actually exist in any guessed word
               const isLetterFound = gameState.attempts.some(attempt => {
                 // Check if this letter from the mystery word exists anywhere in the attempt
                 return attempt.includes(letter)
               })
               
               return (
              <div
                key={index}
                className={`w-12 h-12 border-2 flex items-center justify-center shadow-lg ${
                     isLetterFound ? "border-emerald-500 bg-emerald-600" : "border-gray-600 bg-gray-800"
                } ${gameState.showWinAnimation && gameState.gameWon ? "animate-[spinX_1s_ease-in-out_1]" : ""}`}
                style={{
                  animationDelay: gameState.showWinAnimation && gameState.gameWon ? `${index * 200}ms` : "0ms",
                }}
              >
                <span
                     className={`font-bold font-inter leading-none ${
                       isLetterFound ? "text-white text-lg" : "text-gray-400 text-3xl"
                  }`}
                >
                     {isLetterFound ? letter : "*"}
                </span>
              </div>
               )
             })}
            {/* BFS number for mystery word - shows ? until solved, then user's score */}
            <div 
              className="w-12 h-12 border-2 border-gray-600 bg-gray-800 flex items-center justify-center shadow-md cursor-pointer"
              title={gameState.gameWon ? `Solved in ${gameState.attempts.length} steps!` : "Total steps taken to solve this puzzle"}
            >
              <span className="text-yellow-400 text-lg font-bold font-inter">
                {gameState.gameWon ? gameState.attempts.length : "?"}
              </span>
            </div>
          </div>



          {/* Start word row - only show when there are 0 attempts */}
          {gameState.attempts.length === 0 ? (
            <div className="w-[312px] mx-auto flex justify-center gap-1 mb-2">
              {gameState.rootWord.split("").map((letter, index) => {
                const shouldShowHint = !gameState.isHardMode && gameState.attempts.length === 0
                const optimalHints = shouldShowHint
                  ? getOptimalLetterHints(gameState.rootWord, gameState.mysteryWord)
                  : []
                const shouldHighlight = shouldShowHint && optimalHints.includes(index)
                      
                                    return (
                <div
                  key={index}
                  className={`w-12 h-12 border-2 border-gray-600 bg-gray-700 flex items-center justify-center shadow-md ${
                            shouldHighlight ? "!bg-[oklch(0.145_0_0)]" : ""
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
                            shouldHighlight ? "text-[#555]" : "text-white"
                          }`}>
                            {letter}
                          </span>
                          
                          {/* Custom tooltip for start word hints */}
                          {shouldHighlight && (
                            <div
                              id={`start-tooltip-${index}`}
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none whitespace-nowrap"
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
                className="w-12 h-12 border-2 border-gray-600 bg-gray-800 flex items-center justify-center shadow-md cursor-pointer"
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
            console.log(`🔍 DEBUG: attempt="${attempt}", sliceIndex=${sliceIndex}, actualIndex=${actualIndex}, attempts.length=${gameState.attempts.length}, isLastAttempt=${isLastAttempt}`)
            const isCompleted = gameState.gameWon && actualIndex === gameState.attempts.length - 1
            const results = checkWord(attempt, gameState.mysteryWord)
            const shouldShowHint = !gameState.isHardMode && isLastAttempt
            console.log(`🔍 shouldShowHint=${shouldShowHint}, isHardMode=${gameState.isHardMode}, isLastAttempt=${isLastAttempt}`)
            // Get hints for the next word in the BFS path, not the mystery word
            const optimalHints = shouldShowHint ? (() => {
              // Find the next word in the BFS path from this attempt
              const path = bidirectionalBFS(attempt.toUpperCase(), gameState.mysteryWord.toUpperCase())
              console.log(`🔍 BFS path for ${attempt}:`, path)
              if (path.length >= 2) {
                const nextWord = path[1]
                console.log(`🔍 Calculating hints for ${attempt} → ${nextWord}`)
                const hints = getOptimalLetterHints(attempt, nextWord)
                console.log(`🔍 Hints returned:`, hints)
                return hints
              }
              console.log(`🔍 No next word found in path`)
              return []
            })() : []
            
            // Calculate entry order for display when game is won
            const entryOrder = gameState.gameWon ? sliceIndex + 1 : 0

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
                    // Debug hint calculation
                    if (shouldShowHint) {
                      console.log(`🔍 Letter "${letter}" at index ${letterIndex}: shouldHighlight=${shouldHighlight}, optimalHints=${JSON.stringify(optimalHints)}`)
                    }
                    // Hint styling takes priority over mystery word reveal styling
                    const bgColor = shouldHighlight ? "!bg-[oklch(0.145_0_0)]" : "bg-gray-700"
                    const borderColor =
                      results[letterIndex] === "correct"
                        ? "border-b-[3px] border-b-emerald-500"
                        : results[letterIndex] === "present"
                          ? "border-b-[3px] border-b-amber-500"
                          : ""
                    
                    return (
                      <div
                        key={letterIndex}
                        className={`w-12 h-12 border-2 border-gray-600 ${bgColor} flex items-center justify-center shadow-md ${borderColor} ${gameState.showWinAnimation && isCompleted ? "animate-[spinX_1s_ease-in-out_1]" : ""} relative`}
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
                          shouldHighlight ? "text-[#555]" : "text-white"
                        }`}>
                          {letter}
                        </span>
                        
                        {/* Custom tooltip for mobile and desktop */}
                        <div
                          id={`tooltip-${actualIndex}-${letterIndex}`}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none whitespace-nowrap"
                        >
                          {(() => {
                            if (shouldHighlight) return "Hint: Change this letter to reach the next word"
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
                    className="w-12 h-12 border-2 border-gray-600 bg-gray-800 flex items-center justify-center shadow-md cursor-pointer relative"
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
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none whitespace-nowrap"
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
                      className={`w-12 h-12 border-2 border-gray-600 bg-gray-800 text-center text-lg font-bold text-white focus:outline-none shadow-lg font-inter ${
                        gameState.activeIndex === index ? "focus:outline-none focus:shadow-[inset_0_0_0_1px_theme('colors.blue.500')]" : ""
                      }`}
                      maxLength={1}
                    />
                  )
                })}
                {/* "?" placeholder that shows clue for next word in BFS path */}
                <div 
                  className="w-12 h-12 border-2 border-gray-600 bg-gray-800 flex items-center justify-center shadow-md cursor-pointer relative"
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
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 hidden pointer-events-none whitespace-nowrap"
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
                          return clue ? `Next word clue: "${clue}"` : `No clue for "${nextWord}"`
                        }
                      } else {
                        // If no attempts yet, get clue for first word in BFS path
                        const path = bidirectionalBFS(gameState.rootWord.toUpperCase(), gameState.mysteryWord.toUpperCase())
                        if (path.length >= 2) {
                          const nextWord = path[1].toLowerCase()
                          const clue = getWordClue(nextWord)
                          return clue ? `Next word clue: "${clue}"` : `No clue for "${nextWord}"`
                        }
                      }
                      return "No clue available"
                    })()}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              {gameState.errorMessage && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-300 text-center text-sm font-inter">{gameState.errorMessage}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons - constrained to grid width */}
        <div className="w-[312px] mx-auto">
            <div className="grid grid-cols-6 gap-1">
              <button
                onClick={showSolutionPath}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
                title="Show Solution"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </button>

              <button
                onClick={resetGame}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
                title="Reset Game"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
                title="New Game"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowHowToPlay(true)}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
                title="How to Play"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
                title="Settings"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {/* Smiley face icon to complete 6-column layout */}
              <div className="w-12 h-12 bg-gray-700 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

        {/* Solution Modal */}
        {gameState.showSolution && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
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
                    
                    // Debug logging to see what's happening
                    console.log(`🔍 Reveal sequence: stepIndex=${stepIndex}, word=${word}, isTarget=${isTarget}, isStart=${isStart}`)
                    
                    // Get hint letters for this word (except target word)
                    const shouldShowHint = !isTarget && !isStart
                    const optimalHints = shouldShowHint ? getOptimalLetterHints(word, gameState.mysteryWord) : []
                    
                    return (
                  <div key={stepIndex} className="text-center">
                        <div className="flex justify-center gap-1 mb-2">
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
                                  className={`w-12 h-12 border-2 border-gray-600 ${bgColor} flex items-center justify-center shadow-md ${
                                    shouldHighlight ? "!bg-[oklch(0.145_0_0)]" : ""
                                  } ${borderColor}`}
                                  title={(() => {
                                    if (shouldHighlight) return "Hint: Change this letter to reach the next word"
                                    if (results[letterIndex] === "correct") return "Correct letter in correct position"
                                    if (results[letterIndex] === "present") return "Letter is in the word but wrong position"
                                    return "Letter not in the word"
                                  })()}
                                >
                                  <span className={`text-lg font-bold font-inter ${
                                    shouldHighlight ? "text-[#555]" : "text-white"
                                  }`}>
                                    {letter}
                                  </span>
                          </div>
                        )
                      })}
                          {/* Step number indicator - shows entry order for reveal sequence */}
                          {!isTarget && (
                            <div 
                              className="w-12 h-12 border-2 border-gray-600 bg-gray-800 flex items-center justify-center shadow-md cursor-pointer"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
            <div className="flex justify-between items-center mb-6">
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

            <div className="space-y-6">
              {/* Hard Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold font-inter">Hard Mode</h3>
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

              {/* Dark Theme Toggle (placeholder for future implementation) */}
              <div className="flex items-center justify-between opacity-50">
                <div>
                  <h3 className="text-white font-semibold font-inter">Dark Theme</h3>
                  <p className="text-gray-400 text-sm">Switch between light and dark themes</p>
                </div>
                <button disabled className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
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
              <p>Change one letter at a time to reach the mystery word!</p>

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
