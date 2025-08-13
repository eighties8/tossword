from collections import deque

# Comprehensive word list (same as in the game)
VALID_WORDS = {
    'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
    'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIKE', 'ALIVE',
    'ALLOW', 'ALONE', 'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE',
    'APPLY', 'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AVOID', 'AWAKE', 'AWARD',
    'AWARE', 'BADLY', 'BAKER', 'BASES', 'BASIC', 'BEACH', 'BEGAN', 'BEGIN', 'BEING', 'BELOW',
    'BENCH', 'BILLY', 'BIRTH', 'BLACK', 'BLAME', 'BLANK', 'BLAST', 'BLIND', 'BLOCK', 'BLOOD',
    'BOARD', 'BOAST', 'BOBBY', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN', 'BRAND', 'BRASS', 'BRAVE',
    'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN', 'BUILD', 'BUILT',
    'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHAOS', 'CHARM',
    'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL',
    'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIMB', 'CLOCK', 'CLOSE', 'CLOUD', 'COACH',
    'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME',
    'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CURVE', 'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT',
    'DEATH', 'DEBUT', 'DELAY', 'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DRANK',
    'DRAWN', 'DREAM', 'DRESS', 'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DYING', 'EAGER', 'EARLY',
    'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR',
    'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FIBER', 'FIELD',
    'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLEET', 'FLOOR', 'FLUID',
    'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH',
    'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GOING', 'GRACE',
    'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN',
    'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HARRY', 'HEART', 'HEAVY', 'HENCE', 'HENRY',
    'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'HURRY', 'IMAGE', 'INDEX', 'INNER', 'INPUT', 'ISSUE',
    'JAPAN', 'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL', 'LARGE', 'LASER', 'LATER',
    'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL', 'LEVEL', 'LEWIS', 'LIGHT',
    'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOOSE', 'LOWER', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC',
    'MAJOR', 'MAKER', 'MARCH', 'MARIA', 'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'METAL',
    'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL', 'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT',
    'MOUSE', 'MOUTH', 'MOVED', 'MOVIE', 'MUSIC', 'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE',
    'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER',
    'OUGHT', 'PAINT', 'PANEL', 'PAPER', 'PARTY', 'PEACE', 'PETER', 'PHASE', 'PHONE', 'PHOTO',
    'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'POINT',
    'POUND', 'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF',
    'PROUD', 'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID',
    'RATIO', 'REACH', 'READY', 'REALM', 'REBEL', 'REFER', 'RELAX', 'REPAY', 'REPLY', 'RIGHT',
    'RIGID', 'RIVAL', 'RIVER', 'ROBIN', 'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL',
    'RURAL', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SETUP', 'SEVEN', 'SHALL',
    'SHAPE', 'SHARE', 'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK',
    'SHOOT', 'SHORT', 'SHOWN', 'SIGHT', 'SILLY', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL',
    'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLID', 'SOLVE', 'SORRY',
    'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE',
    'SPORT', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP',
    'STEER', 'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP',
    'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'TABLE', 'TAKEN',
    'TASTE', 'TAXES', 'TEACH', 'TEAMS', 'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR',
    'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW',
    'THROW', 'THUMB', 'TIGHT', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH',
    'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TRIED',
    'TRIES', 'TRUCK', 'TRULY', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST', 'TYLER', 'UNCLE',
    'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL',
    'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE', 'WATCH',
    'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN',
    'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WRITE', 'WRONG', 'WROTE', 'YOUNG',
    'YOUTH', 'LANCE', 'LACED', 'CLADE', 'GLIDE', 'STARE', 'TEARS', 'RATES', 'TALES', 'STEAL'
}

def is_valid_move_with_rearrangement(word1, word2):
    """Check if word2 is a valid move from word1 (exactly one letter different, rearrangement allowed)"""
    if len(word1) != len(word2) or word1 == word2:
        return False
    
    # Count letter frequencies in both words
    freq1 = {}
    freq2 = {}
    
    for char in word1:
        freq1[char] = freq1.get(char, 0) + 1
    
    for char in word2:
        freq2[char] = freq2.get(char, 0) + 1
    
    # Calculate differences
    letters_removed = 0
    letters_added = 0
    
    # Check what letters were removed
    for char, count in freq1.items():
        if char not in freq2:
            letters_removed += count
        elif freq2[char] < count:
            letters_removed += count - freq2[char]
    
    # Check what letters were added
    for char, count in freq2.items():
        if char not in freq1:
            letters_added += count
        elif freq1[char] < count:
            letters_added += count - freq1[char]
    
    # Valid move: exactly one letter removed and one letter added
    return letters_removed == 1 and letters_added == 1

def find_path_with_rearrangement(start, target):
    """Find shortest path from start to target using BFS with rearrangement rules"""
    if start == target:
        return [start]
    
    queue = deque([(start, [start])])
    visited = {start}
    
    while queue:
        current_word, path = queue.popleft()
        
        # Try all valid words as next moves
        for next_word in VALID_WORDS:
            if next_word not in visited and is_valid_move_with_rearrangement(current_word, next_word):
                new_path = path + [next_word]
                
                if next_word == target:
                    return new_path
                
                visited.add(next_word)
                queue.append((next_word, new_path))
    
    return None  # No path found

# Find path from DANCE to LIGHT
start_word = "DANCE"
target_word = "LIGHT"

print(f"Finding path from {start_word} to {target_word}...")
path = find_path_with_rearrangement(start_word, target_word)

if path:
    print(f"\n✅ Path found! ({len(path) - 1} steps)")
    print("\nProgression:")
    for i, word in enumerate(path):
        if i == 0:
            print(f"{i + 1}. {word} (starting word)")
        else:
            prev_word = path[i - 1]
            # Show what changed
            freq1 = {}
            freq2 = {}
            for char in prev_word:
                freq1[char] = freq1.get(char, 0) + 1
            for char in word:
                freq2[char] = freq2.get(char, 0) + 1
            
            removed = []
            added = []
            for char, count in freq1.items():
                if char not in freq2:
                    removed.extend([char] * count)
                elif freq2[char] < count:
                    removed.extend([char] * (count - freq2[char]))
            
            for char, count in freq2.items():
                if char not in freq1:
                    added.extend([char] * count)
                elif freq1[char] < count:
                    added.extend([char] * (count - freq1[char]))
            
            change_desc = f"removed {removed[0]}, added {added[0]}"
            if sorted(prev_word) == sorted(word):
                change_desc = "rearranged letters"
            
            print(f"{i + 1}. {word} ({change_desc})")
else:
    print(f"\n❌ No path found from {start_word} to {target_word}")
