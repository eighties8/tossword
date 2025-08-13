"use client"
import type { KeyboardEvent } from "react" // Import KeyboardEvent for handleKeyDown

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

import { Inter, Poppins } from "next/font/google"

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

const VALID_WORDS = new Set([
  "aback",
  "abase",
  "abate",
  "abbey",
  "abbot",
  "abhor",
  "abide",
  "abled",
  "abode",
  "abort",
  "about",
  "above",
  "abuse",
  "abyss",
  "acorn",
  "acrid",
  "actor",
  "acute",
  "adage",
  "adapt",
  "adept",
  "admin",
  "admit",
  "adobe",
  "adopt",
  "adore",
  "adorn",
  "adult",
  "affix",
  "afire",
  "afoot",
  "afoul",
  "after",
  "again",
  "agape",
  "agate",
  "agent",
  "agile",
  "aging",
  "aglow",
  "agony",
  "agora",
  "agree",
  "ahead",
  "aider",
  "aisle",
  "alarm",
  "album",
  "alert",
  "algae",
  "alibi",
  "alien",
  "align",
  "alike",
  "alive",
  "allay",
  "alley",
  "allot",
  "allow",
  "alloy",
  "aloft",
  "alone",
  "along",
  "aloof",
  "aloud",
  "alpha",
  "altar",
  "alter",
  "amass",
  "amaze",
  "amber",
  "amble",
  "amend",
  "amiss",
  "amity",
  "among",
  "ample",
  "amply",
  "amuse",
  "angel",
  "anger",
  "angle",
  "angry",
  "angst",
  "anime",
  "ankle",
  "annex",
  "annoy",
  "annul",
  "anode",
  "antic",
  "anvil",
  "aorta",
  "apart",
  "aphid",
  "aping",
  "apnea",
  "apple",
  "apply",
  "apron",
  "aptly",
  "arbor",
  "ardor",
  "arena",
  "argue",
  "arise",
  "armor",
  "aroma",
  "arose",
  "array",
  "arrow",
  "arson",
  "artsy",
  "ascot",
  "ashen",
  "aside",
  "askew",
  "assay",
  "asset",
  "atoll",
  "atone",
  "attic",
  "audio",
  "audit",
  "augur",
  "aunty",
  "avail",
  "avert",
  "avian",
  "avoid",
  "await",
  "awake",
  "award",
  "aware",
  "awash",
  "awful",
  "awoke",
  "axial",
  "axiom",
  "axion",
  "azure",
  "bacon",
  "badge",
  "badly",
  "bagel",
  "baggy",
  "baker",
  "baler",
  "balmy",
  "banal",
  "banjo",
  "barge",
  "baron",
  "basal",
  "basic",
  "basil",
  "basin",
  "basis",
  "baste",
  "batch",
  "bathe",
  "baton",
  "batty",
  "bawdy",
  "bayou",
  "beach",
  "beady",
  "beard",
  "beast",
  "beech",
  "beefy",
  "befit",
  "began",
  "begat",
  "beget",
  "begin",
  "begun",
  "being",
  "belch",
  "belie",
  "belle",
  "belly",
  "below",
  "bench",
  "beret",
  "berry",
  "berth",
  "beset",
  "betel",
  "bevel",
  "bezel",
  "bible",
  "bicep",
  "biddy",
  "bigot",
  "bilge",
  "billy",
  "binge",
  "bingo",
  "biome",
  "birch",
  "birth",
  "bison",
  "bitty",
  "black",
  "blade",
  "blame",
  "bland",
  "blank",
  "blare",
  "blast",
  "blaze",
  "bleak",
  "bleat",
  "bleed",
  "bleep",
  "blend",
  "bless",
  "blimp",
  "blind",
  "blink",
  "bliss",
  "blitz",
  "bloat",
  "block",
  "bloke",
  "blond",
  "blood",
  "bloom",
  "blown",
  "bluer",
  "bluff",
  "blunt",
  "blurb",
  "blurt",
  "blush",
  "board",
  "boast",
  "bobby",
  "boney",
  "bongo",
  "bonus",
  "booby",
  "boost",
  "booth",
  "booty",
  "booze",
  "boozy",
  "borax",
  "borne",
  "bosom",
  "bossy",
  "botch",
  "bough",
  "boule",
  "bound",
  "bowel",
  "boxer",
  "brace",
  "braid",
  "brain",
  "brake",
  "brand",
  "brash",
  "brass",
  "brave",
  "bravo",
  "brawl",
  "brawn",
  "bread",
  "break",
  "breed",
  "briar",
  "bribe",
  "brick",
  "bride",
  "brief",
  "brine",
  "bring",
  "brink",
  "briny",
  "brisk",
  "broad",
  "broil",
  "broke",
  "brood",
  "brook",
  "broom",
  "broth",
  "brown",
  "brunt",
  "brush",
  "brute",
  "buddy",
  "budge",
  "buggy",
  "bugle",
  "build",
  "built",
  "bulge",
  "bulky",
  "bully",
  "bunch",
  "bunny",
  "burly",
  "burnt",
  "burst",
  "bused",
  "bushy",
  "butch",
  "butte",
  "buxom",
  "buyer",
  "bylaw",
  "cabal",
  "cabby",
  "cabin",
  "cable",
  "cacao",
  "cache",
  "cacti",
  "caddy",
  "cadet",
  "cagey",
  "cairn",
  "camel",
  "cameo",
  "canal",
  "candy",
  "canny",
  "canoe",
  "canon",
  "caper",
  "caput",
  "carat",
  "cargo",
  "carol",
  "carry",
  "carve",
  "caste",
  "catch",
  "cater",
  "catty",
  "caulk",
  "cause",
  "cavil",
  "cease",
  "cedar",
  "cello",
  "chafe",
  "chaff",
  "chain",
  "chair",
  "chalk",
  "champ",
  "chant",
  "chaos",
  "chard",
  "charm",
  "chart",
  "chase",
  "chasm",
  "cheap",
  "cheat",
  "check",
  "cheek",
  "cheer",
  "chess",
  "chest",
  "chick",
  "chide",
  "chief",
  "child",
  "chili",
  "chill",
  "chime",
  "china",
  "chirp",
  "chock",
  "choir",
  "choke",
  "chord",
  "chore",
  "chose",
  "chuck",
  "chump",
  "chunk",
  "churn",
  "chute",
  "cider",
  "cigar",
  "cinch",
  "circa",
  "civic",
  "civil",
  "clack",
  "claim",
  "clamp",
  "clang",
  "clank",
  "clash",
  "clasp",
  "class",
  "clean",
  "clear",
  "cleat",
  "cleft",
  "clerk",
  "click",
  "cliff",
  "climb",
  "cling",
  "clink",
  "cloak",
  "clock",
  "clone",
  "close",
  "cloth",
  "cloud",
  "clout",
  "clove",
  "clown",
  "cluck",
  "clued",
  "clump",
  "clung",
  "coach",
  "coast",
  "cobra",
  "cocoa",
  "colon",
  "color",
  "comet",
  "comfy",
  "comic",
  "comma",
  "conch",
  "condo",
  "conic",
  "copse",
  "coral",
  "corer",
  "corny",
  "couch",
  "cough",
  "could",
  "count",
  "coupe",
  "court",
  "coven",
  "cover",
  "covet",
  "covey",
  "cower",
  "coyly",
  "crack",
  "craft",
  "cramp",
  "crane",
  "crank",
  "crash",
  "crass",
  "crate",
  "crave",
  "crawl",
  "craze",
  "crazy",
  "creak",
  "cream",
  "credo",
  "creed",
  "creek",
  "creep",
  "creme",
  "crepe",
  "crept",
  "cress",
  "crest",
  "crick",
  "cried",
  "crier",
  "crime",
  "crimp",
  "crisp",
  "croak",
  "crock",
  "crone",
  "crony",
  "crook",
  "cross",
  "croup",
  "crowd",
  "crown",
  "crude",
  "cruel",
  "crumb",
  "crump",
  "crush",
  "crust",
  "crypt",
  "cubic",
  "cumin",
  "curio",
  "curly",
  "curry",
  "curse",
  "curve",
  "curvy",
  "cutie",
  "cyber",
  "cycle",
  "cynic",
  "daddy",
  "daily",
  "dairy",
  "daisy",
  "dally",
  "dance",
  "dandy",
  "datum",
  "daunt",
  "dealt",
  "death",
  "debar",
  "debit",
  "debug",
  "debut",
  "decal",
  "decay",
  "decor",
  "decoy",
  "decry",
  "defer",
  "deign",
  "deity",
  "delay",
  "delta",
  "delve",
  "demon",
  "demur",
  "denim",
  "dense",
  "depot",
  "depth",
  "derby",
  "deter",
  "detox",
  "deuce",
  "devil",
  "diary",
  "dicey",
  "digit",
  "dilly",
  "dimly",
  "diner",
  "dingo",
  "dingy",
  "diode",
  "dirge",
  "dirty",
  "disco",
  "ditch",
  "ditto",
  "ditty",
  "diver",
  "dizzy",
  "dodge",
  "dodgy",
  "dogma",
  "doing",
  "dolly",
  "donor",
  "donut",
  "dopey",
  "doubt",
  "dough",
  "dowdy",
  "dowel",
  "downy",
  "dowry",
  "dozen",
  "draft",
  "drain",
  "drake",
  "drama",
  "drank",
  "drape",
  "drawl",
  "drawn",
  "dread",
  "dream",
  "dress",
  "dried",
  "drier",
  "drift",
  "drill",
  "drink",
  "drive",
  "droit",
  "droll",
  "drone",
  "drool",
  "droop",
  "dross",
  "drove",
  "drown",
  "druid",
  "drunk",
  "dryer",
  "dryly",
  "duchy",
  "dully",
  "dummy",
  "dumpy",
  "dunce",
  "dusky",
  "dusty",
  "dutch",
  "duvet",
  "dwarf",
  "dwell",
  "dwelt",
  "dying",
  "eager",
  "eagle",
  "early",
  "earth",
  "easel",
  "eaten",
  "eater",
  "ebony",
  "eclat",
  "edict",
  "edify",
  "eerie",
  "egret",
  "eight",
  "eject",
  "eking",
  "elate",
  "elbow",
  "elder",
  "elect",
  "elegy",
  "elfin",
  "elide",
  "elite",
  "elope",
  "elude",
  "email",
  "embed",
  "ember",
  "emcee",
  "empty",
  "enact",
  "endow",
  "enema",
  "enemy",
  "enjoy",
  "ennui",
  "ensue",
  "enter",
  "entry",
  "envoy",
  "epoch",
  "epoxy",
  "equal",
  "equip",
  "erase",
  "erect",
  "erode",
  "error",
  "erupt",
  "essay",
  "ester",
  "ether",
  "ethic",
  "ethos",
  "etude",
  "evade",
  "event",
  "every",
  "evict",
  "evoke",
  "exact",
  "exalt",
  "excel",
  "exert",
  "exile",
  "exist",
  "expel",
  "extol",
  "extra",
  "exult",
  "eying",
  "fable",
  "facet",
  "faint",
  "fairy",
  "faith",
  "false",
  "fancy",
  "fanny",
  "farce",
  "fatal",
  "fatty",
  "fault",
  "fauna",
  "favor",
  "feast",
  "fecal",
  "feign",
  "fella",
  "felon",
  "femme",
  "femur",
  "fence",
  "feral",
  "ferry",
  "fetal",
  "fetch",
  "fetid",
  "fetus",
  "fever",
  "fewer",
  "fiber",
  "fibre",
  "ficus",
  "field",
  "fiend",
  "fiery",
  "fifth",
  "fifty",
  "fight",
  "filer",
  "filet",
  "filly",
  "filmy",
  "filth",
  "final",
  "finch",
  "finer",
  "first",
  "fishy",
  "fixer",
  "fizzy",
  "fjord",
  "flack",
  "flail",
  "flair",
  "flake",
  "flaky",
  "flame",
  "flank",
  "flare",
  "flash",
  "flask",
  "fleck",
  "fleet",
  "flesh",
  "flick",
  "flier",
  "fling",
  "flint",
  "flirt",
  "float",
  "flock",
  "flood",
  "floor",
  "flora",
  "floss",
  "flour",
  "flout",
  "flown",
  "fluff",
  "fluid",
  "fluke",
  "flume",
  "flung",
  "flunk",
  "flush",
  "flute",
  "flyer",
  "foamy",
  "focal",
  "focus",
  "foggy",
  "foist",
  "folio",
  "folly",
  "foray",
  "force",
  "forge",
  "forgo",
  "forte",
  "forth",
  "forty",
  "forum",
  "found",
  "foyer",
  "frail",
  "frame",
  "frank",
  "fraud",
  "freak",
  "freed",
  "freer",
  "fresh",
  "friar",
  "fried",
  "frill",
  "frisk",
  "fritz",
  "frock",
  "frond",
  "front",
  "frost",
  "froth",
  "frown",
  "froze",
  "fruit",
  "fudge",
  "fugue",
  "fully",
  "fungi",
  "funky",
  "funny",
  "furor",
  "furry",
  "fussy",
  "fuzzy",
  "gaffe",
  "gaily",
  "gamer",
  "gamma",
  "gamut",
  "gassy",
  "gaudy",
  "gauge",
  "gaunt",
  "gauze",
  "gavel",
  "gawky",
  "gayer",
  "gayly",
  "gazer",
  "gecko",
  "geeky",
  "geese",
  "genie",
  "genre",
  "ghost",
  "ghoul",
  "giant",
  "giddy",
  "gipsy",
  "girly",
  "girth",
  "given",
  "giver",
  "glade",
  "gland",
  "glare",
  "glass",
  "glaze",
  "gleam",
  "glean",
  "glide",
  "glint",
  "gloat",
  "globe",
  "gloom",
  "glory",
  "gloss",
  "glove",
  "glyph",
  "gnash",
  "gnome",
  "godly",
  "going",
  "golem",
  "golly",
  "gonad",
  "goner",
  "goody",
  "gooey",
  "goofy",
  "goose",
  "gorge",
  "gouge",
  "gourd",
  "grace",
  "grade",
  "graft",
  "grail",
  "grain",
  "grand",
  "grant",
  "grape",
  "graph",
  "grasp",
  "grass",
  "grate",
  "grave",
  "gravy",
  "graze",
  "great",
  "greed",
  "green",
  "greet",
  "grief",
  "grill",
  "grime",
  "grimy",
  "grind",
  "gripe",
  "groan",
  "groin",
  "groom",
  "grope",
  "gross",
  "group",
  "grout",
  "grove",
  "growl",
  "grown",
  "gruel",
  "gruff",
  "grunt",
  "guard",
  "guava",
  "guess",
  "guest",
  "guide",
  "guild",
  "guile",
  "guilt",
  "guise",
  "gulch",
  "gully",
  "gumbo",
  "gummy",
  "guppy",
  "gusto",
  "gusty",
  "gypsy",
  "habit",
  "hairy",
  "halve",
  "handy",
  "happy",
  "hardy",
  "harem",
  "harpy",
  "harry",
  "harsh",
  "haste",
  "hasty",
  "hatch",
  "hater",
  "haunt",
  "haute",
  "haven",
  "havoc",
  "hazel",
  "heady",
  "heard",
  "heart",
  "heath",
  "heave",
  "heavy",
  "hedge",
  "hefty",
  "heist",
  "helix",
  "hello",
  "hence",
  "heron",
  "hilly",
  "hinge",
  "hippo",
  "hippy",
  "hitch",
  "hoard",
  "hobby",
  "hoist",
  "holly",
  "homer",
  "honey",
  "honor",
  "horde",
  "horny",
  "horse",
  "hotel",
  "hotly",
  "hound",
  "house",
  "hovel",
  "hover",
  "howdy",
  "human",
  "humid",
  "humor",
  "humph",
  "humus",
  "hunch",
  "hunky",
  "hurry",
  "husky",
  "hussy",
  "hutch",
  "hydro",
  "hyena",
  "hymen",
  "hyper",
  "icily",
  "icing",
  "ideal",
  "idiom",
  "idiot",
  "idler",
  "idyll",
  "igloo",
  "iliac",
  "image",
  "imbue",
  "impel",
  "imply",
  "inane",
  "inbox",
  "incur",
  "index",
  "inept",
  "inert",
  "infer",
  "ingot",
  "inlay",
  "inlet",
  "inner",
  "input",
  "inter",
  "intro",
  "ionic",
  "irate",
  "irony",
  "islet",
  "issue",
  "itchy",
  "ivory",
  "jaunt",
  "jazzy",
  "jelly",
  "jerky",
  "jetty",
  "jewel",
  "jiffy",
  "joint",
  "joist",
  "joker",
  "jolly",
  "joust",
  "judge",
  "juice",
  "juicy",
  "jumbo",
  "jumpy",
  "junta",
  "junto",
  "juror",
  "kappa",
  "karma",
  "kayak",
  "kebab",
  "khaki",
  "kinky",
  "kiosk",
  "kitty",
  "knack",
  "knave",
  "knead",
  "kneed",
  "kneel",
  "knelt",
  "knife",
  "knock",
  "knoll",
  "known",
  "koala",
  "krill",
  "label",
  "labor",
  "laden",
  "ladle",
  "lager",
  "lance",
  "lanky",
  "lapel",
  "lapse",
  "large",
  "larva",
  "lasso",
  "latch",
  "later",
  "lathe",
  "latte",
  "laugh",
  "layer",
  "leach",
  "leafy",
  "leaky",
  "leant",
  "leapt",
  "learn",
  "lease",
  "leash",
  "least",
  "leave",
  "ledge",
  "leech",
  "leery",
  "lefty",
  "legal",
  "leggy",
  "lemon",
  "lemur",
  "leper",
  "level",
  "lever",
  "libel",
  "liege",
  "light",
  "liken",
  "lilac",
  "limbo",
  "limit",
  "linen",
  "liner",
  "lingo",
  "lipid",
  "lithe",
  "liver",
  "livid",
  "llama",
  "loamy",
  "loath",
  "lobby",
  "local",
  "locus",
  "lodge",
  "lofty",
  "logic",
  "login",
  "loopy",
  "loose",
  "lorry",
  "loser",
  "loner",
  "louse",
  "lousy",
  "lover",
  "lower",
  "lowly",
  "loyal",
  "lucid",
  "lucky",
  "lumen",
  "lumpy",
  "lunar",
  "lunch",
  "lunge",
  "lupus",
  "lurch",
  "lurid",
  "lusty",
  "lying",
  "lymph",
  "lynch",
  "lyric",
  "macaw",
  "macho",
  "macro",
  "madam",
  "madly",
  "mafia",
  "magic",
  "magma",
  "maize",
  "major",
  "maker",
  "mambo",
  "mamma",
  "mammy",
  "manga",
  "mange",
  "mango",
  "mangy",
  "mania",
  "manic",
  "manly",
  "manor",
  "maple",
  "march",
  "marry",
  "marsh",
  "mason",
  "masse",
  "match",
  "matey",
  "mauve",
  "maxim",
  "maybe",
  "mayor",
  "mealy",
  "meant",
  "meaty",
  "mecca",
  "medal",
  "media",
  "medic",
  "melee",
  "melon",
  "mercy",
  "merge",
  "merit",
  "merry",
  "metal",
  "meter",
  "metro",
  "micro",
  "midge",
  "midst",
  "might",
  "milky",
  "mimic",
  "mince",
  "miner",
  "minim",
  "minor",
  "minty",
  "minus",
  "mirth",
  "miser",
  "missy",
  "mocha",
  "modal",
  "model",
  "modem",
  "mogul",
  "moist",
  "molar",
  "moldy",
  "money",
  "month",
  "moody",
  "moose",
  "moral",
  "moron",
  "morph",
  "mossy",
  "motel",
  "motif",
  "motor",
  "motto",
  "moult",
  "mound",
  "mount",
  "mourn",
  "mouse",
  "mouth",
  "mover",
  "movie",
  "mower",
  "mucky",
  "mucus",
  "muddy",
  "mulch",
  "mummy",
  "munch",
  "mural",
  "murky",
  "mushy",
  "music",
  "musky",
  "musty",
  "myrrh",
  "nadir",
  "naive",
  "nanny",
  "nasal",
  "nasty",
  "natal",
  "naval",
  "navel",
  "needy",
  "neigh",
  "nerdy",
  "nerve",
  "never",
  "newer",
  "newly",
  "nicer",
  "niche",
  "niece",
  "night",
  "ninja",
  "ninny",
  "ninth",
  "noble",
  "nobly",
  "noise",
  "noisy",
  "nomad",
  "noose",
  "north",
  "nosey",
  "notch",
  "novel",
  "nudge",
  "nurse",
  "nutty",
  "nylon",
  "nymph",
  "oaken",
  "obese",
  "occur",
  "ocean",
  "octal",
  "octet",
  "odder",
  "oddly",
  "offal",
  "offer",
  "often",
  "olden",
  "older",
  "olive",
  "ombre",
  "omega",
  "onion",
  "onset",
  "opera",
  "opine",
  "opium",
  "optic",
  "orbit",
  "order",
  "organ",
  "other",
  "otter",
  "ought",
  "ounce",
  "outdo",
  "outer",
  "outgo",
  "ovary",
  "ovate",
  "overt",
  "ovine",
  "ovoid",
  "owing",
  "owner",
  "oxide",
  "ozone",
  "paddy",
  "pagan",
  "paint",
  "paler",
  "palsy",
  "panel",
  "panic",
  "pansy",
  "papal",
  "paper",
  "parer",
  "parka",
  "parry",
  "parse",
  "party",
  "pasta",
  "paste",
  "pasty",
  "patch",
  "patio",
  "patsy",
  "patty",
  "pause",
  "payee",
  "payer",
  "peace",
  "peach",
  "pearl",
  "pecan",
  "pedal",
  "penal",
  "pence",
  "penne",
  "penny",
  "perch",
  "peril",
  "perky",
  "pesky",
  "pesto",
  "petal",
  "petty",
  "phase",
  "phone",
  "phony",
  "photo",
  "piano",
  "picky",
  "piece",
  "piety",
  "piggy",
  "pilot",
  "pinch",
  "piney",
  "pinky",
  "pinto",
  "piper",
  "pique",
  "pitch",
  "pithy",
  "pivot",
  "pixel",
  "pixie",
  "pizza",
  "place",
  "plaid",
  "plain",
  "plait",
  "plane",
  "plank",
  "plant",
  "plate",
  "plaza",
  "plead",
  "pleat",
  "plied",
  "plier",
  "pluck",
  "plumb",
  "plume",
  "plump",
  "plunk",
  "plush",
  "poesy",
  "point",
  "poise",
  "poker",
  "polar",
  "polka",
  "polyp",
  "pooch",
  "poppy",
  "porch",
  "poser",
  "posit",
  "posse",
  "pouch",
  "pound",
  "pouty",
  "power",
  "prank",
  "prawn",
  "preen",
  "press",
  "price",
  "prick",
  "pride",
  "pried",
  "prime",
  "primo",
  "print",
  "prior",
  "prism",
  "privy",
  "prize",
  "probe",
  "prone",
  "prong",
  "proof",
  "prose",
  "proud",
  "prove",
  "prowl",
  "proxy",
  "prude",
  "prune",
  "psalm",
  "pubic",
  "pudgy",
  "puffy",
  "pulpy",
  "pulse",
  "punch",
  "pupal",
  "pupil",
  "puppy",
  "puree",
  "purer",
  "purge",
  "purse",
  "pushy",
  "putty",
  "pygmy",
  "quack",
  "quail",
  "quake",
  "qualm",
  "quark",
  "quart",
  "quash",
  "quasi",
  "queen",
  "queer",
  "quell",
  "query",
  "quest",
  "queue",
  "quick",
  "quiet",
  "quill",
  "quilt",
  "quirk",
  "quite",
  "quota",
  "quote",
  "quoth",
  "rabbi",
  "rabid",
  "racer",
  "radar",
  "radii",
  "radio",
  "rainy",
  "raise",
  "rajah",
  "rally",
  "ralph",
  "ramen",
  "ranch",
  "randy",
  "range",
  "rapid",
  "rarer",
  "raspy",
  "ratio",
  "ratty",
  "raven",
  "rayon",
  "razor",
  "reach",
  "react",
  "ready",
  "realm",
  "rearm",
  "rebar",
  "rebel",
  "rebus",
  "rebut",
  "recap",
  "recur",
  "recut",
  "reedy",
  "refer",
  "refit",
  "regal",
  "rehab",
  "reign",
  "relax",
  "relay",
  "relic",
  "remit",
  "renal",
  "renew",
  "repay",
  "repel",
  "reply",
  "rerun",
  "reset",
  "resin",
  "retch",
  "retro",
  "retry",
  "reuse",
  "revel",
  "revue",
  "rhino",
  "rhyme",
  "rider",
  "ridge",
  "rifle",
  "right",
  "rigid",
  "rigor",
  "rinse",
  "ripen",
  "riper",
  "risen",
  "riser",
  "risky",
  "rival",
  "river",
  "rivet",
  "roach",
  "roast",
  "robin",
  "robot",
  "rocky",
  "rodeo",
  "roger",
  "rogue",
  "roomy",
  "roost",
  "rotor",
  "rouge",
  "rough",
  "round",
  "rouse",
  "route",
  "rover",
  "rowdy",
  "rower",
  "royal",
  "ruddy",
  "ruder",
  "rugby",
  "ruler",
  "rumba",
  "rumor",
  "rupee",
  "rural",
  "rusty",
  "sadly",
  "safer",
  "saint",
  "salad",
  "sally",
  "salon",
  "salsa",
  "salty",
  "salve",
  "salvo",
  "sandy",
  "saner",
  "sappy",
  "sassy",
  "satin",
  "satyr",
  "sauce",
  "saucy",
  "sauna",
  "saute",
  "savor",
  "savoy",
  "savvy",
  "scald",
  "scale",
  "scalp",
  "scaly",
  "scamp",
  "scant",
  "scare",
  "scarf",
  "scary",
  "scene",
  "scent",
  "scion",
  "scoff",
  "scold",
  "scone",
  "scoop",
  "scope",
  "score",
  "scorn",
  "scour",
  "scout",
  "scowl",
  "scram",
  "scrap",
  "scree",
  "screw",
  "scrub",
  "scrum",
  "scuba",
  "sedan",
  "seedy",
  "segue",
  "seize",
  "semen",
  "sense",
  "sepia",
  "serif",
  "serum",
  "serve",
  "setup",
  "seven",
  "sever",
  "sewer",
  "shack",
  "shade",
  "shady",
  "shaft",
  "shake",
  "shaky",
  "shale",
  "shall",
  "shalt",
  "shame",
  "shank",
  "shape",
  "shard",
  "share",
  "shark",
  "sharp",
  "shave",
  "shawl",
  "shear",
  "sheen",
  "sheep",
  "sheer",
  "sheet",
  "sheik",
  "shelf",
  "shell",
  "shied",
  "shift",
  "shine",
  "shiny",
  "shire",
  "shirk",
  "shirt",
  "shoal",
  "shock",
  "shone",
  "shook",
  "shoot",
  "shore",
  "shorn",
  "short",
  "shout",
  "shove",
  "shown",
  "showy",
  "shrew",
  "shrub",
  "shrug",
  "shuck",
  "shunt",
  "shush",
  "shyly",
  "siege",
  "sieve",
  "sight",
  "sigma",
  "silky",
  "silly",
  "since",
  "sinew",
  "singe",
  "siren",
  "sissy",
  "sixth",
  "sixty",
  "skate",
  "skier",
  "skiff",
  "skill",
  "skimp",
  "skirt",
  "skulk",
  "skull",
  "skunk",
  "slack",
  "slain",
  "slang",
  "slant",
  "slash",
  "slate",
  "slave",
  "sleek",
  "sleep",
  "sleet",
  "slept",
  "slice",
  "slick",
  "slide",
  "slime",
  "slimy",
  "sling",
  "slink",
  "sloop",
  "slope",
  "slosh",
  "sloth",
  "slump",
  "slung",
  "slunk",
  "slurp",
  "slush",
  "slyly",
  "smack",
  "small",
  "smart",
  "smash",
  "smear",
  "smell",
  "smelt",
  "smile",
  "smirk",
  "smite",
  "smith",
  "smock",
  "smoke",
  "smoky",
  "smote",
  "snack",
  "snail",
  "snake",
  "snaky",
  "snare",
  "snarl",
  "sneak",
  "sneer",
  "snide",
  "sniff",
  "snipe",
  "snoop",
  "snore",
  "snort",
  "snout",
  "snowy",
  "snuck",
  "snuff",
  "soapy",
  "sober",
  "soggy",
  "solar",
  "solid",
  "solve",
  "sonar",
  "sonic",
  "sooth",
  "sooty",
  "sorry",
  "sound",
  "south",
  "sower",
  "space",
  "spade",
  "spank",
  "spare",
  "spark",
  "spasm",
  "spawn",
  "speak",
  "spear",
  "speck",
  "speed",
  "spell",
  "spelt",
  "spend",
  "spent",
  "sperm",
  "spice",
  "spicy",
  "spied",
  "spiel",
  "spike",
  "spiky",
  "spill",
  "spilt",
  "spine",
  "spiny",
  "spire",
  "spite",
  "splat",
  "split",
  "spoil",
  "spoke",
  "spoof",
  "spook",
  "spool",
  "spoon",
  "spore",
  "sport",
  "spout",
  "spray",
  "spree",
  "sprig",
  "spunk",
  "spurn",
  "spurt",
  "squad",
  "squat",
  "squib",
  "stack",
  "staff",
  "stage",
  "staid",
  "stain",
  "stair",
  "stake",
  "stale",
  "stalk",
  "stall",
  "stamp",
  "stand",
  "stank",
  "stare",
  "stark",
  "start",
  "stash",
  "state",
  "stave",
  "stead",
  "steak",
  "steal",
  "steam",
  "steed",
  "steel",
  "steep",
  "steer",
  "stein",
  "stern",
  "stick",
  "stiff",
  "still",
  "stilt",
  "sting",
  "stink",
  "stint",
  "stock",
  "stoic",
  "stoke",
  "stole",
  "stomp",
  "stone",
  "stony",
  "stood",
  "stool",
  "stoop",
  "store",
  "stork",
  "storm",
  "story",
  "stout",
  "stove",
  "strap",
  "straw",
  "stray",
  "strip",
  "strut",
  "stuck",
  "study",
  "stuff",
  "stump",
  "stung",
  "stunk",
  "stunt",
  "style",
  "suave",
  "sugar",
  "suing",
  "suite",
  "sulky",
  "sully",
  "sumac",
  "sunny",
  "super",
  "surer",
  "surge",
  "surly",
  "sushi",
  "swami",
  "swamp",
  "swarm",
  "swash",
  "swath",
  "swear",
  "sweat",
  "sweep",
  "sweet",
  "swell",
  "swept",
  "swift",
  "swill",
  "swine",
  "swing",
  "swirl",
  "swish",
  "swoon",
  "swoop",
  "sword",
  "swore",
  "sworn",
  "swung",
  "synod",
  "syrup",
  "tabby",
  "table",
  "taboo",
  "tacit",
  "tacky",
  "taffy",
  "taint",
  "taken",
  "taker",
  "tally",
  "talon",
  "tamer",
  "tango",
  "tangy",
  "taper",
  "tapir",
  "tardy",
  "tarot",
  "taste",
  "tasty",
  "tatty",
  "taunt",
  "tawny",
  "teach",
  "teary",
  "tease",
  "teddy",
  "teeth",
  "tempo",
  "tenet",
  "tenor",
  "tense",
  "tenth",
  "tepee",
  "tepid",
  "terra",
  "terse",
  "testy",
  "thank",
  "theft",
  "their",
  "theme",
  "there",
  "these",
  "theta",
  "thick",
  "thief",
  "thigh",
  "thing",
  "think",
  "third",
  "thong",
  "thorn",
  "those",
  "three",
  "threw",
  "throb",
  "throw",
  "thrum",
  "thumb",
  "thump",
  "thyme",
  "tiara",
  "tibia",
  "tidal",
  "tiger",
  "tight",
  "tilde",
  "timer",
  "timid",
  "tipsy",
  "titan",
  "tithe",
  "title",
  "toast",
  "today",
  "toddy",
  "token",
  "tonal",
  "tonga",
  "tonic",
  "tooth",
  "topaz",
  "topic",
  "torch",
  "torso",
  "torus",
  "total",
  "totem",
  "touch",
  "tough",
  "towel",
  "tower",
  "toxic",
  "toxin",
  "trace",
  "track",
  "tract",
  "trade",
  "trail",
  "train",
  "trait",
  "tramp",
  "trash",
  "trawl",
  "tread",
  "treat",
  "trend",
  "triad",
  "trial",
  "tribe",
  "trice",
  "trick",
  "tried",
  "tripe",
  "trite",
  "troll",
  "troop",
  "trope",
  "trout",
  "trove",
  "truce",
  "truck",
  "truer",
  "truly",
  "trump",
  "trunk",
  "truss",
  "trust",
  "truth",
  "tryst",
  "tubal",
  "tuber",
  "tulip",
  "tulle",
  "tumor",
  "tunic",
  "turbo",
  "tutor",
  "twang",
  "tweak",
  "tweed",
  "tweet",
  "twice",
  "twine",
  "twirl",
  "twist",
  "twixt",
  "tying",
  "udder",
  "ulcer",
  "ultra",
  "umbra",
  "uncle",
  "uncut",
  "under",
  "undid",
  "undue",
  "unfed",
  "unfit",
  "unify",
  "union",
  "unite",
  "unity",
  "unlit",
  "unmet",
  "unset",
  "untie",
  "until",
  "unwed",
  "unzip",
  "upper",
  "upset",
  "urban",
  "urine",
  "usage",
  "usher",
  "using",
  "usual",
  "usurp",
  "utile",
  "utter",
  "vague",
  "valet",
  "valid",
  "valor",
  "value",
  "valve",
  "vapid",
  "vapor",
  "vault",
  "vaunt",
  "vegan",
  "venom",
  "venue",
  "verge",
  "verse",
  "verso",
  "verve",
  "vicar",
  "video",
  "vigil",
  "vigor",
  "villa",
  "vinyl",
  "viola",
  "viper",
  "viral",
  "virus",
  "visit",
  "visor",
  "vista",
  "vital",
  "vivid",
  "vixen",
  "vocal",
  "vodka",
  "vogue",
  "voice",
  "voila",
  "vomit",
  "voter",
  "vouch",
  "vowel",
  "vying",
  "wacky",
  "wafer",
  "wager",
  "wagon",
  "waist",
  "waive",
  "waltz",
  "warty",
  "waste",
  "watch",
  "water",
  "waver",
  "waxen",
  "weary",
  "weave",
  "wedge",
  "weedy",
  "weigh",
  "weird",
  "welch",
  "welsh",
  "wench",
  "whack",
  "whale",
  "wharf",
  "wheat",
  "wheel",
  "whelp",
  "where",
  "which",
  "whiff",
  "while",
  "whine",
  "whiny",
  "whirl",
  "whisk",
  "white",
  "whole",
  "whoop",
  "whose",
  "widen",
  "wider",
  "widow",
  "width",
  "wield",
  "wight",
  "willy",
  "wimpy",
  "wince",
  "winch",
  "windy",
  "wiser",
  "wispy",
  "witch",
  "witty",
  "woken",
  "woman",
  "women",
  "woody",
  "wooer",
  "wooly",
  "woozy",
  "wordy",
  "world",
  "worry",
  "worse",
  "worst",
  "worth",
  "would",
  "wound",
  "woven",
  "wrack",
  "wrath",
  "wreak",
  "wreck",
  "wrest",
  "wring",
  "wrist",
  "write",
  "wrong",
  "wrote",
  "wrung",
  "wryly",
  "yacht",
  "yearn",
  "yeast",
  "yield",
  "young",
  "youth",
  "zebra",
  "zesty",
  "zonal",
])

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
    if (word.length !== 5) return

    const lastAttempt =
      gameState.attempts.length > 0 ? gameState.attempts[gameState.attempts.length - 1] : gameState.rootWord

    if (!isValidMove(lastAttempt, word)) {
      setGameState((prev) => ({ ...prev, errorMessage: "You must change exactly one letter (rearrangement allowed)" }))
      const timer = setTimeout(() => setGameState((prev) => ({ ...prev, errorMessage: "" })), 3000)
      return () => clearTimeout(timer)
    }

    const newAttempts = [...gameState.attempts, word]
    const isWon = word.toUpperCase() === gameState.mysteryWord.toUpperCase()

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
    const path = findSolutionPath(gameState.rootWord, gameState.mysteryWord)
    setGameState((prev) => ({ ...prev, solutionPath: path, showSolution: true }))
  }, [gameState.rootWord, gameState.mysteryWord, findSolutionPath])

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

  const getOptimalLetterHints = useMemo(() => {
    return (currentWord: string, targetWord: string): number[] => {
      if (!currentWord || currentWord.length !== 5 || gameState.isHardMode) return []

      const cacheKey = `hints-${currentWord}-${targetWord}`
      if (solutionPathCache.current.has(cacheKey)) {
        return solutionPathCache.current.get(cacheKey) as number[]
      }

      // Find the actual next step in the solution path
      const solutionPath = findSolutionPath(currentWord, targetWord)
      if (solutionPath.length < 2) {
        solutionPathCache.current.set(cacheKey, [])
        return []
      }

      const nextWord = solutionPath[1] // The next word in the optimal path
      const currentUpper = currentWord.toUpperCase()
      const nextUpper = nextWord.toUpperCase()

      // Find which letter is different between current and next word
      const hints: number[] = []
      for (let i = 0; i < 5; i++) {
        if (currentUpper[i] !== nextUpper[i]) {
          // Check if this letter is being removed (not in next word)
          if (!nextUpper.includes(currentUpper[i])) {
            hints.push(i)
            break // Only highlight one letter
          }
        }
      }

      solutionPathCache.current.set(cacheKey, hints)
      return hints
    }
  }, [gameState.isHardMode, findSolutionPath])

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
          <h1 className="text-3xl font-bold text-white mb-2 font-poppins">Word Breaker</h1>
          <p className="text-gray-300 text-sm font-inter">Change one letter at a time to unlock today's word</p>
        </div>

        {gameState.gameWon && (
          <div className="text-center mb-6 p-4 bg-emerald-900/30 rounded-lg border border-emerald-700">
            <h2 className="text-emerald-400 text-xl font-bold mb-2 font-poppins">🎉 Congratulations!</h2>
            <p className="text-emerald-300 font-inter">You solved it in {gameState.attempts.length} attempts!</p>
          </div>
        )}

        <div className="space-y-2 mb-6">
          {/* Found Letters Display - Right aligned with last letter of mystery word */}
          <div className="flex justify-end mb-2" style={{ width: "256px", margin: "0 auto" }}>
            <div className="flex gap-1 mb-2">
              {foundLetters.map((item, index) => (
                <div key={index} className="w-12 h-12 bg-amber-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold font-inter">{item.letter}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-1 mb-2">
            {gameState.mysteryWord.split("").map((letter, index) => (
              <div
                key={index}
                className={`w-12 h-12 border-2 flex items-center justify-center shadow-lg ${
                  gameState.revealedLetters[index] ? "border-emerald-500 bg-emerald-600" : "border-gray-600 bg-gray-800"
                } ${gameState.showWinAnimation && gameState.gameWon ? "animate-[spin_1s_ease-in-out_1]" : ""}`}
                style={{
                  animationDelay: gameState.showWinAnimation && gameState.gameWon ? `${index * 200}ms` : "0ms",
                }}
              >
                <span
                  className={`font-bold font-inter ${
                    gameState.revealedLetters[index] ? "text-white text-lg" : "text-gray-400 text-2xl"
                  }`}
                >
                  {gameState.revealedLetters[index] ? letter : "*"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1 mb-2">
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
                    shouldHighlight ? "border-b-[5px] border-b-yellow-400" : ""
                  }`}
                >
                  <span className="text-white text-lg font-bold font-inter">{letter}</span>
                </div>
              )
            })}
          </div>

          {gameState.attempts.map((attempt, attemptIndex) => {
            const isLastAttempt = attemptIndex === gameState.attempts.length - 1
            const isCompleted = gameState.gameWon && attemptIndex === gameState.attempts.length - 1
            const results = checkWord(attempt, gameState.mysteryWord)
            const shouldShowHint = !gameState.isHardMode && isLastAttempt
            const optimalHints = shouldShowHint ? getOptimalLetterHints(attempt, gameState.mysteryWord) : []

            return (
              <div key={attemptIndex} className="flex items-center gap-2 justify-center">
                <div className="flex gap-1">
                  {attempt.split("").map((letter, letterIndex) => {
                    const shouldHighlight = shouldShowHint && optimalHints.includes(letterIndex)
                    const bgColor =
                      results[letterIndex] === "correct"
                        ? "bg-emerald-600"
                        : results[letterIndex] === "present"
                          ? "bg-amber-500"
                          : "bg-gray-600"

                    return (
                      <div
                        key={letterIndex}
                        className={`w-12 h-12 border-2 border-gray-600 ${bgColor} flex items-center justify-center shadow-md ${
                          shouldHighlight ? "border-b-[5px] border-b-yellow-400" : ""
                        } ${gameState.showWinAnimation && isCompleted ? "animate-[spin_1s_ease-in-out_1]" : ""}`}
                        style={{
                          animationDelay: gameState.showWinAnimation && isCompleted ? `${letterIndex * 200}ms` : "0ms",
                        }}
                      >
                        <span className="text-white text-lg font-bold font-inter">{letter}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!gameState.gameWon && (
            <>
              <div className="flex justify-center gap-1">
                {gameState.inputLetters.map((letter, index) => {
                  return (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      value={letter}
                      onChange={(e) => handleLetterInput(index, e.target.value.slice(-1))}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={() => handleFocus(index)}
                      className={`w-12 h-12 border-2 border-gray-600 bg-gray-800 text-center text-lg font-bold text-white focus:outline-none shadow-lg font-inter ${
                        gameState.activeIndex === index ? "border-blue-400 bg-gray-700 ring-2 ring-blue-400/50" : ""
                      }`}
                      maxLength={1}
                    />
                  )
                })}
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
        <div className="w-[256px] mx-auto">
          <div className="grid grid-cols-5 gap-1">
            <button
              onClick={showSolutionPath}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
              title="Show Solution"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                />
              </svg>
            </button>

            <button
              onClick={initializeGame}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
              title="New Game"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowHowToPlay(true)}
              className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all duration-200 flex items-center justify-center shadow-md"
              title="How to Play"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Solution Modal */}
        {gameState.showSolution && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white font-poppins">
                  {gameState.solutionPath.length > 0
                    ? `Solution Path (${gameState.solutionPath.length - 1} steps)`
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
                  {gameState.solutionPath.map((word, stepIndex) => (
                    <div key={stepIndex} className="text-center">
                      <div className="flex justify-center gap-1 mb-2">
                        {word.split("").map((letter, letterIndex) => {
                          const results = checkWord(word, gameState.mysteryWord)
                          const bgColor =
                            results[letterIndex] === "correct"
                              ? "bg-emerald-600"
                              : results[letterIndex] === "present"
                                ? "bg-amber-500"
                                : "bg-gray-600"
                          return (
                            <div
                              key={letterIndex}
                              className={`w-12 h-12 border-2 border-gray-600 ${bgColor} flex items-center justify-center shadow-md`}
                            >
                              <span className="text-white text-lg font-bold font-inter">{letter}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="text-yellow-400 text-sm font-medium font-inter">
                        {stepIndex === 0
                          ? "Start"
                          : stepIndex === gameState.solutionPath.length - 1
                            ? "Mystery Word"
                            : `Step ${stepIndex}`}
                      </div>
                      {stepIndex < gameState.solutionPath.length - 1 && (
                        <div className="text-yellow-400 text-xl font-bold">↓</div>
                      )}
                    </div>
                  ))}
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
