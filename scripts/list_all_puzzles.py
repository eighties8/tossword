def differs_by_one_letter(word1, word2):
    """Check if two words differ by exactly one letter (allowing rearrangement)"""
    if len(word1) != len(word2):
        return False
    
    # Count letter frequencies for both words
    freq1 = {}
    freq2 = {}
    
    for char in word1:
        freq1[char] = freq1.get(char, 0) + 1
    
    for char in word2:
        freq2[char] = freq2.get(char, 0) + 1
    
    # Count differences
    added_letters = 0
    removed_letters = 0
    
    all_letters = set(freq1.keys()) | set(freq2.keys())
    
    for letter in all_letters:
        count1 = freq1.get(letter, 0)
        count2 = freq2.get(letter, 0)
        
        if count2 > count1:
            added_letters += count2 - count1
        elif count1 > count2:
            removed_letters += count1 - count2
    
    # Must add exactly 1 letter and remove exactly 1 letter
    return added_letters == 1 and removed_letters == 1

def find_solution_path(start_word, target_word, valid_words):
    """Find shortest path from start to target using BFS with rearrangement rules"""
    from collections import deque
    
    if start_word == target_word:
        return [start_word]
    
    queue = deque([(start_word, [start_word])])
    visited = {start_word}
    
    while queue:
        current_word, path = queue.popleft()
        
        # Try all valid words that differ by exactly one letter
        for word in valid_words:
            if word not in visited and differs_by_one_letter(current_word, word):
                new_path = path + [word]
                
                if word == target_word:
                    return new_path
                
                visited.add(word)
                queue.append((word, new_path))
    
    return None  # No solution found

# Comprehensive word list (same as in the game)
VALID_WORDS = {
    "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
    "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alike", "alive",
    "allow", "alone", "along", "alter", "amber", "amend", "among", "anger", "angle", "angry",
    "apart", "apple", "apply", "arena", "argue", "arise", "array", "arrow", "aside", "asset",
    "atlas", "audio", "audit", "avoid", "awake", "award", "aware", "badly", "baker", "bases",
    "basic", "batch", "beach", "began", "begin", "being", "below", "bench", "billy", "birth",
    "black", "blame", "blank", "blast", "blind", "block", "blood", "bloom", "blown", "blues",
    "blunt", "blush", "board", "boast", "bobby", "boost", "booth", "bound", "brain", "brand",
    "brass", "brave", "bread", "break", "breed", "brick", "bride", "brief", "bring", "broad",
    "broke", "brown", "brush", "build", "built", "burst", "buyer", "cable", "cache", "catch",
    "cause", "chain", "chair", "chaos", "charm", "chart", "chase", "cheap", "check", "chest",
    "chief", "child", "china", "chose", "civil", "claim", "class", "clean", "clear", "click",
    "climb", "clock", "close", "cloud", "coach", "coast", "could", "count", "court", "cover",
    "craft", "crash", "crazy", "cream", "crime", "cross", "crowd", "crown", "crude", "curve",
    "cycle", "daily", "damage", "dance", "dated", "dealt", "death", "debut", "delay", "depth",
    "doing", "doubt", "dozen", "draft", "drama", "drank", "dream", "dress", "drill", "drink",
    "drive", "drove", "dying", "eager", "early", "earth", "eight", "elite", "empty", "enemy",
    "enjoy", "enter", "entry", "equal", "error", "event", "every", "exact", "exist", "extra",
    "faith", "false", "fault", "fiber", "field", "fifth", "fifty", "fight", "final", "first",
    "fixed", "flash", "fleet", "floor", "fluid", "focus", "force", "forth", "forty", "forum",
    "found", "frame", "frank", "fraud", "fresh", "front", "fruit", "fully", "funny", "giant",
    "given", "glass", "globe", "glory", "goods", "grace", "grade", "grain", "grand", "grant",
    "grass", "grave", "great", "green", "gross", "group", "grown", "guard", "guess", "guest",
    "guide", "happy", "harry", "heart", "heavy", "hence", "henry", "horse", "hotel", "house",
    "human", "ideal", "image", "index", "inner", "input", "issue", "japan", "jimmy", "joint",
    "jones", "judge", "known", "label", "large", "laser", "later", "laugh", "layer", "learn",
    "lease", "least", "leave", "legal", "level", "lewis", "light", "limit", "links", "lives",
    "local", "loose", "lower", "lucky", "lunch", "lying", "magic", "major", "maker", "march",
    "maria", "match", "maybe", "mayor", "meant", "media", "metal", "might", "minor", "minus",
    "mixed", "model", "money", "month", "moral", "motor", "mount", "mouse", "mouth", "moved",
    "movie", "music", "needs", "never", "newly", "night", "noise", "north", "noted", "novel",
    "nurse", "occur", "ocean", "offer", "often", "order", "other", "ought", "paint", "panel",
    "paper", "party", "peace", "peter", "phase", "phone", "photo", "piano", "piece", "pilot",
    "pitch", "place", "plain", "plane", "plant", "plate", "point", "pound", "power", "press",
    "price", "pride", "prime", "print", "prior", "prize", "proof", "proud", "prove", "queen",
    "quick", "quiet", "quite", "radio", "raise", "range", "rapid", "ratio", "reach", "ready",
    "realm", "rebel", "refer", "relax", "repay", "reply", "right", "rigid", "river", "robot",
    "roger", "roman", "rough", "round", "route", "royal", "rural", "scale", "scene", "scope",
    "score", "sense", "serve", "seven", "shall", "shape", "share", "sharp", "sheet", "shelf",
    "shell", "shift", "shine", "shirt", "shock", "shoot", "short", "shown", "sides", "sight",
    "silly", "since", "sixth", "sixty", "sized", "skill", "sleep", "slide", "small", "smart",
    "smile", "smith", "smoke", "snake", "snow", "so", "soap", "social", "soft", "soil",
    "solar", "solid", "solve", "sorry", "sound", "south", "space", "spare", "speak", "speed",
    "spend", "spent", "split", "spoke", "sport", "staff", "stage", "stake", "stand", "start",
    "state", "steam", "steel", "steep", "steer", "stick", "still", "stock", "stone", "stood",
    "store", "storm", "story", "strip", "stuck", "study", "stuff", "style", "sugar", "suite",
    "super", "sweet", "swift", "swing", "sword", "table", "taken", "taste", "taxes", "teach",
    "teeth", "terry", "thank", "theft", "their", "theme", "there", "these", "thick", "thing",
    "think", "third", "those", "three", "threw", "throw", "thumb", "tiger", "tight", "timer",
    "tired", "title", "today", "token", "topic", "total", "touch", "tough", "tower", "track",
    "trade", "train", "treat", "trend", "trial", "tribe", "trick", "tried", "tries", "truck",
    "truly", "trunk", "trust", "truth", "twice", "twist", "tyler", "ultra", "uncle", "under",
    "undue", "union", "unity", "until", "upper", "upset", "urban", "usage", "usual", "valid",
    "value", "video", "virus", "visit", "vital", "vocal", "voice", "waste", "watch", "water",
    "wheel", "where", "which", "while", "white", "whole", "whose", "woman", "women", "world",
    "worry", "worse", "worst", "worth", "would", "write", "wrong", "wrote", "young", "youth",
    "birch", "cedar", "maple", "trees", "beach", "coral", "pearl", "shell", "waves", "shore",
    "field", "grass", "hills", "lakes", "mount", "river", "stone", "trail", "woods", "bloom",
    "daisy", "flora", "herbs", "lotus", "peach", "roses", "tulip", "wheat", "amber", "azure",
    "beige", "coral", "ivory", "olive", "rouge", "sepia", "taupe", "umber", "wheat", "bread",
    "candy", "cream", "fruit", "grape", "honey", "lemon", "melon", "olive", "peach", "spice",
    "sugar", "sweet", "apple", "berry", "cherry", "dates", "figs", "kiwi", "lime", "mango",
    "papaya", "plum", "grape", "melon", "peach", "pear", "berry", "dates", "figs", "kiwi",
    "lime", "mango", "papaya", "plum", "stare", "store", "story", "storm", "start", "state",
    "steam", "steel", "steep", "steer", "stick", "still", "stock", "stone", "stood", "strip",
    "stuck", "study", "stuff", "style", "super", "sweet", "swift", "swing", "sword", "table"
}

# Current puzzle pairs from the game
GAME_PAIRS = [
    ["brick", "youth"],
    ["ghost", "plain"], 
    ["flame", "stock"],
    ["sword", "night"],
    ["magic", "front"],
    ["storm", "quick"],
    ["dance", "light"],
    ["music", "worth"],
    ["ocean", "light"],
    ["tiger", "sound"],
]

print("=== HIDDEN LADDER PUZZLE SOLUTIONS ===\n")

for i, (start, target) in enumerate(GAME_PAIRS, 1):
    print(f"PUZZLE {i}: {start.upper()} → {target.upper()}")
    
    solution = find_solution_path(start, target, VALID_WORDS)
    
    if solution:
        print(f"Steps: {len(solution) - 1}")
        print("Progression:")
        for j, word in enumerate(solution):
            if j == 0:
                print(f"  {j+1}. {word.upper()} (starting word)")
            elif j == len(solution) - 1:
                print(f"  {j+1}. {word.upper()} (mystery word)")
            else:
                print(f"  {j+1}. {word.upper()}")
        print()
    else:
        print("❌ NO SOLUTION FOUND")
        print()

print("=== TESTING COMPLETE ===")
