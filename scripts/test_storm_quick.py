def count_letter_differences(word1, word2):
    """Count how many letters are different between two words"""
    if len(word1) != len(word2):
        return float('inf')
    
    # Count letters in each word
    from collections import Counter
    counter1 = Counter(word1.lower())
    counter2 = Counter(word2.lower())
    
    # Calculate the number of letters that need to be changed
    # This is the sum of letters that appear more in word2 than word1
    differences = 0
    for letter in counter2:
        if counter2[letter] > counter1.get(letter, 0):
            differences += counter2[letter] - counter1.get(letter, 0)
    
    return differences

def is_valid_move(from_word, to_word, valid_words):
    """Check if moving from one word to another is valid (exactly one letter change with rearrangement)"""
    if len(from_word) != len(to_word) or from_word == to_word:
        return False
    
    if to_word.lower() not in [w.lower() for w in valid_words]:
        return False
    
    return count_letter_differences(from_word, to_word) == 1

def find_solution_path(start, target, valid_words):
    """Find the shortest path from start to target word"""
    if start.lower() == target.lower():
        return [start]
    
    from collections import deque
    
    queue = deque([(start, [start])])
    visited = {start.lower()}
    
    while queue:
        current_word, path = queue.popleft()
        
        # Try all valid words as next steps
        for candidate in valid_words:
            candidate_lower = candidate.lower()
            
            if candidate_lower not in visited and is_valid_move(current_word, candidate, valid_words):
                new_path = path + [candidate]
                
                if candidate_lower == target.lower():
                    return new_path
                
                visited.add(candidate_lower)
                queue.append((candidate, new_path))
    
    return []  # No solution found

# Basic word list for testing (subset of common 5-letter words)
BASIC_WORDS = {
    "STORM", "QUICK", "STORE", "STORY", "STOCK", "STUCK", "TRUCK", "TRACK", "TRICK", "THICK",
    "QUACK", "QUEEN", "QUEST", "QUIET", "QUITE", "QUOTE", "QUIRK", "QUILT", "QUART", "QUAIL",
    "SPORT", "SHORT", "SHIRT", "SMART", "START", "STARK", "SPARK", "SPORK", "SNORT", "COURT",
    "COUNT", "MOUNT", "MOIST", "ROAST", "TOAST", "COAST", "BOAST", "BEAST", "LEAST", "FEAST"
}

# Test STORM to QUICK
print("Testing STORM to QUICK puzzle...")
print(f"Letter differences between STORM and QUICK: {count_letter_differences('STORM', 'QUICK')}")

solution = find_solution_path("STORM", "QUICK", BASIC_WORDS)

if solution:
    print(f"\nSolution found ({len(solution)} steps):")
    for i, word in enumerate(solution):
        if i == 0:
            print(f"  {word} (Start)")
        elif i == len(solution) - 1:
            print(f"  {word} (Target)")
        else:
            print(f"  {word} (Step {i})")
else:
    print("\nNo solution found with basic word set!")
    print("This puzzle may be unsolvable or require a much larger dictionary.")

# Test a few potential intermediate words
print(f"\nTesting some potential moves from STORM:")
test_words = ["SPORT", "SHORT", "STORY", "STORE"]
for word in test_words:
    if is_valid_move("STORM", word, BASIC_WORDS):
        print(f"  STORM -> {word}: Valid")
    else:
        print(f"  STORM -> {word}: Invalid")

print(f"\nTesting some potential moves to QUICK:")
test_words = ["QUACK", "QUIRK", "QUILT", "QUART"]
for word in test_words:
    if is_valid_move(word, "QUICK", BASIC_WORDS):
        print(f"  {word} -> QUICK: Valid")
    else:
        print(f"  {word} -> QUICK: Invalid")
