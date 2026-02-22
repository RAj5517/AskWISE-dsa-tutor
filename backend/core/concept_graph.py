# DSA Concept Prerequisite Graph
# Maps each topic -> list of topics that must be understood first

from collections import deque
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

DSA_CONCEPT_GRAPH: dict[str, list[str]] = {
    "recursion":        [],
    "arrays":           [],
    "hashing":          ["arrays"],
    "two_pointers":     ["arrays"],
    "sliding_window":   ["arrays"],
    "binary_search":    ["arrays"],
    "sorting":          ["arrays"],
    "linked_lists":     ["arrays"],
    "stacks":           ["arrays"],
    "queues":           ["arrays", "linked_lists"],
    "trees":            ["recursion"],
    "bst":              ["trees"],
    "heaps":            ["trees", "arrays"],
    "graphs":           ["recursion", "arrays", "linked_lists"],
    "bfs_dfs":          ["graphs", "queues", "stacks"],
    "dp":               ["recursion", "arrays", "hashing"],
}


# ── TF-IDF + Naive Bayes Training Corpus ─────────────────────────────────────
# Each entry: (training_text, topic_label)
# Minimal but representative — trains in <50ms on startup

_TRAINING_DATA = [
    # arrays
    ("array list index subarray nums element slice iterate for loop append len", "arrays"),
    ("arr nums list index subarray contiguous elements access", "arrays"),
    ("initialize array length size element access index bounds", "arrays"),
    ("sum of array max element find minimum search array linear scan", "arrays"),

    # hashing
    ("hashmap dictionary counter defaultdict frequency count lookup", "hashing"),
    ("hash map key value pair dict get set seen visited frequency", "hashing"),
    ("two sum anagram group valid parentheses hash table", "hashing"),
    ("counter defaultdict collections frequency map occurrence", "hashing"),

    # two_pointers
    ("two pointers left right pointer slow fast converge meet", "two_pointers"),
    ("pair sum sorted array left right move inward shrink", "two_pointers"),
    ("three sum container water trapping rain palindrome check", "two_pointers"),

    # sliding_window
    ("sliding window window size expand shrink substring maximum subarray", "sliding_window"),
    ("window fixed size k elements slide move deque maximum minimum", "sliding_window"),
    ("longest without repeating characters minimum size subarray sum window", "sliding_window"),

    # binary_search
    ("binary search mid lo hi left right bisect sorted search halve", "binary_search"),
    ("log n search space mid equals target sorted array pivoted", "binary_search"),
    ("find peak element search rotated array bisect left right", "binary_search"),

    # sorting
    ("sort merge sort quicksort bubble insertion selection comparator key", "sorting"),
    ("merge sort divide conquer partition pivot compare swap in-place", "sorting"),
    ("sort array ascending descending comparator lambda sorted heapq nsmallest", "sorting"),

    # linked_lists
    ("linked list node next head tail singly doubly curr prev pointer", "linked_lists"),
    ("node next curr head reverse traverse pointer slow fast cycle detection", "linked_lists"),
    ("linked list insert delete merge nodes reverse k groups cycle", "linked_lists"),

    # stacks
    ("stack push pop peek top lifo last in first out overflow", "stacks"),
    ("bracket balanced parentheses stack monotonic next greater element", "stacks"),
    ("stack call undo history last in first out push pop top empty", "stacks"),

    # queues
    ("queue enqueue dequeue popleft fifo first in first out deque", "queues"),
    ("bfs queue level order traversal deque rotate circular buffer", "queues"),
    ("priority queue min heap max heap task scheduling round robin", "queues"),

    # recursion
    ("recursion recursive base case call stack factorial fibonacci", "recursion"),
    ("recurse depth return base case stack overflow memoize top down", "recursion"),
    ("divide conquer recursive split merge combine base case return", "recursion"),

    # trees
    ("binary tree inorder preorder postorder root left right leaf node", "trees"),
    ("tree traversal height depth level bfs dfs root children subtree", "trees"),
    ("binary tree path sum diameter lowest common ancestor lca", "trees"),

    # bst
    ("binary search tree bst insert delete search left right smaller larger", "bst"),
    ("bst inorder sorted valid bst kth smallest successor predecessor", "bst"),

    # heaps
    ("heap heapq min heap max heap priority queue nlargest nsmallest", "heaps"),
    ("heap push pop k largest elements top k frequent words heap", "heaps"),

    # graphs
    ("graph adjacency list matrix edge vertex vertices neighbor connected", "graphs"),
    ("directed undirected weighted cycle detect topological sort", "graphs"),
    ("graph node edge dfs bfs visited neighbors adjacency matrix list", "graphs"),

    # bfs_dfs
    ("dfs depth first search backtrack explore visit mark unvisited stack", "bfs_dfs"),
    ("bfs breadth first search level order queue visited deque shortest path", "bfs_dfs"),
    ("graph traversal connected components islands flood fill bfs dfs", "bfs_dfs"),
    ("shortest path unweighted bfs level visited queue deque", "bfs_dfs"),

    # dp
    ("dynamic programming memoization tabulation knapsack subproblem optimal", "dp"),
    ("dp memo cache top down bottom up state transition table", "dp"),
    ("fibonacci coin change longest increasing subsequence edit distance dp", "dp"),
    ("dp array 2d grid path count memorize overlapping subproblems", "dp"),
]

_texts  = [t for t, _ in _TRAINING_DATA]
_labels = [l for _, l in _TRAINING_DATA]

# Train on module load — takes ~30ms, done once per server restart
_classifier: Pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),   # unigrams + bigrams for phrases like "binary search"
        sublinear_tf=True,    # log(TF) — dampens very frequent terms
        min_df=1,
    )),
    ("nb", MultinomialNB(alpha=0.1)),  # alpha=0.1 (low smoothing = sharper predictions)
])
_classifier.fit(_texts, _labels)


# ── Public API ────────────────────────────────────────────────────────────────

def detect_topic(question: str, code: str) -> tuple[str, float]:
    """
    TF-IDF + Naive Bayes topic classification.
    Returns (topic_key, confidence_score).
    Runs in ~1ms, zero API cost.
    """
    text = (question + " " + code).strip()
    if not text:
        return "general", 0.0

    proba = _classifier.predict_proba([text])[0]
    classes = _classifier.classes_
    best_idx = proba.argmax()
    topic = classes[best_idx]
    confidence = round(float(proba[best_idx]), 3)

    # If confidence is very low, fall back to "general"
    if confidence < 0.15:
        return "general", confidence

    return topic, confidence


def get_prerequisites(topic: str) -> list[str]:
    """Return direct prerequisites of a topic."""
    return DSA_CONCEPT_GRAPH.get(topic, [])


def get_root_gaps(topic: str, weak_topics: list[str]) -> list[str]:
    """
    Given a target topic and the student's weak topics,
    return which prerequisites of that topic are also weak.
    These are the 'root gaps' — fix these first.
    """
    prereqs = DSA_CONCEPT_GRAPH.get(topic, [])
    return [p for p in prereqs if p in weak_topics]


def get_weakness_chain(mastery_data: dict[str, int], threshold: int = 40) -> list[str]:
    """
    Return weak topics (mastery below threshold) sorted by how many
    other topics they block — most blocking topics come first.
    """
    weak = [topic for topic, score in mastery_data.items() if score < threshold]

    def blocking_count(t: str) -> int:
        return sum(1 for prereqs in DSA_CONCEPT_GRAPH.values() if t in prereqs)

    return sorted(weak, key=blocking_count, reverse=True)


def get_bfs_learning_path(
    target_topic: str,
    mastery_data: dict[str, int],
    threshold: int = 40,
) -> list[str]:
    """
    BFS-based learning path from fundamentals to target_topic.

    Algorithm:
      1. BFS backwards from target: collect ALL prerequisite topics at each level
      2. Reverse the BFS order → study order (foundations first)
      3. Filter out topics already mastered (score >= threshold)
      4. Append the target itself if not yet mastered

    Returns an ordered list of topics the student should study, from
    most foundational to target.

    Example:
      target="bfs_dfs", weak=["graphs", "stacks", "arrays"]
      → ["arrays", "stacks", "graphs", "bfs_dfs"]
    """
    visited = set()
    bfs_order = []   # topics in BFS order (target → prerequisites)

    queue = deque([target_topic])
    visited.add(target_topic)

    while queue:
        node = queue.popleft()
        bfs_order.append(node)
        for prereq in DSA_CONCEPT_GRAPH.get(node, []):
            if prereq not in visited:
                visited.add(prereq)
                queue.append(prereq)

    # Reverse: prerequisites come before topics that need them
    study_order = list(reversed(bfs_order))

    # Filter: only include topics where student is weak
    weak_path = [
        t for t in study_order
        if mastery_data.get(t, 0) < threshold
    ]

    return weak_path


def count_mistakes(interactions: list, topic: str) -> int:
    """
    Count how many times the student submitted incorrect code for a given topic.
    interactions: list of dicts from the interactions table.
    """
    return sum(
        1 for i in interactions
        if i.get("topic_category", "").lower().replace(" ", "_") == topic
        and i.get("is_correct") is False
    )
