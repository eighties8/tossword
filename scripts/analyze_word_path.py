from collections import deque

# Comprehensive list of valid 5-letter words
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
    'RIVAL', 'RIVER', 'ROBIN', 'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL', 'RURAL',
    'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SETUP', 'SEVEN', 'SHALL', 'SHAPE',
    'SHARE', 'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT',
    'SHORT', 'SHOWN', 'SIGHT', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SLEEP', 'SLIDE',
    'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLID', 'SOLVE', 'SORRY', 'SOUND', 'SOUTH',
    'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT', 'SPOKE', 'SPORT', 'STAFF',
    'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STICK',
    'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK', 'STUDY',
    'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUPER', 'SWEET', 'TABLE', 'TAKEN', 'TASTE', 'TAXES',
    'TEACH', 'TEAMS', 'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR', 'THEME', 'THERE',
    'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW', 'THROW', 'THUMB',
    'TIGER', 'TIGHT', 'TIMER', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH',
    'TOUGH', 'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK',
    'TRIED', 'TRIES', 'TRUCK', 'TRULY', 'TRUNK', 'TRUST', 'TRUTH', 'TWICE', 'TWIST', 'TYLER',
    'UNCLE', 'UNDER', 'UNDUE', 'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE',
    'USUAL', 'VALID', 'VALUE', 'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE',
    'WATCH', 'WATER', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN',
    'WOMEN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WRITE', 'WRONG', 'WROTE',
    'YOUNG', 'YOUTH', 'STARE', 'STORE', 'SHORE', 'SHARE', 'SPARE', 'SPACE', 'PLACE', 'PLANE',
    'LANCE', 'LACED', 'FACED', 'FADED', 'ADDED', 'AIDED', 'AIMED', 'AIRED', 'ASKED', 'BASED',
    'BAKED', 'CAKED', 'CARED', 'DARED', 'DATED', 'FATED', 'GATED', 'HATED', 'JADED', 'LACED',
    'MACED', 'NAMED', 'PACED', 'PAGED', 'RAGED', 'RATED', 'SAVED', 'TAMED', 'WAGED', 'WAVED'
}

def is_valid_move(from_word, to_word):
    """Check if moving from from_word to to_word is valid (change exactly one letter, rearrangement allowed)"""
    if len(from_word) != len(to_word):
        return False

    from_letters = sorted(from_word)
    to_letters = sorted(to_word)

    from_count = {}
    to_count = {}

    for letter in from_letters:
        from_count[letter] = from_count.get(letter, 0) + 1

    for letter in to_letters:
        to_count[letter] = to_count.get(letter, 0) + 1

    added_letters = 0
    removed_letters = 0

    # Check what letters were added
    for letter in to_count:
        diff = to_count[letter] - from_count.get(letter, 0)
        if diff > 0:
            added_letters += diff

    # Check what letters were removed
    for letter in from_count:
        diff = from_count[letter] - to_count.get(letter, 0)
        if diff > 0:
            removed_letters += diff

    # Must add exactly one letter and remove exactly one letter
    return added_letters == 1 and removed_letters == 1

def find_path_with_rearrangement(start_word, target_word):
    """Find shortest path from start_word to target_word with rearrangement allowed"""
    if start_word == target_word:
        return [start_word]
    
    if start_word not in VALID_WORDS or target_word not in VALID_WORDS:
        return None
    
    queue = deque([(start_word, [start_word])])
    visited = {start_word}
    
    while queue:
        current_word, path = queue.popleft()
        
        # Try all valid words that differ by exactly one letter
        for candidate_word in VALID_WORDS:
            if candidate_word not in visited and is_valid_move(current_word, candidate_word):
                if candidate_word == target_word:
                    return path + [candidate_word]
                
                visited.add(candidate_word)
                queue.append((candidate_word, path + [candidate_word]))
    
    return None  # No path found

def analyze_letter_change(from_word, to_word):
    """Analyze what letters changed between two words"""
    from_count = {}
    to_count = {}
    
    for letter in from_word:
        from_count[letter] = from_count.get(letter, 0) + 1
    
    for letter in to_word:
        to_count[letter] = to_count.get(letter, 0) + 1
    
    added = []
    removed = []
    
    for letter in to_count:
        diff = to_count[letter] - from_count.get(letter, 0)
        if diff > 0:
            added.extend([letter] * diff)
    
    for letter in from_count:
        diff = from_count[letter] - to_count.get(letter, 0)
        if diff > 0:
            removed.extend([letter] * diff)
    
    return added, removed

# Analyze DANCE to LIGHT with rearrangement rule
start = "DANCE"
target = "LIGHT"

print(f"Analyzing path from '{start}' to '{target}' with rearrangement rule...")
print("Rule: You can rearrange letters as long as you change exactly one letter")
print("=" * 70)

path = find_path_with_rearrangement(start, target)

if path:
    print(f"✅ PATH FOUND! ({len(path)} steps)")
    print("\nSolution:")
    for i, word in enumerate(path):
        if i == 0:
            print(f"{i+1:2d}. {word} (starting word)")
        elif i == len(path) - 1:
            print(f"{i+1:2d}. {word} (target word)")
        else:
            # Show what letters changed
            prev_word = path[i-1]
            added, removed = analyze_letter_change(prev_word, word)
            print(f"{i+1:2d}. {word} (removed: {removed[0]}, added: {added[0]})")
else:
    print("❌ NO PATH FOUND!")
    print("It's impossible to get from DANCE to LIGHT using the rearrangement rule.")

print("\n" + "=" * 70)
