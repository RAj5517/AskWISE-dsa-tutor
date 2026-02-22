# DSA Concept Prerequisite Graph
# Maps each topic -> list of topics that must be understood first

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
        """How many other topics list t as a prerequisite."""
        return sum(1 for prereqs in DSA_CONCEPT_GRAPH.values() if t in prereqs)

    return sorted(weak, key=blocking_count, reverse=True)


# ── Topic detection (pure Python, zero API cost) ──────────────────────────────

def detect_topic(question: str, code: str) -> str:
    """
    Keyword-based topic detection from student input + code.
    Runs in microseconds, no API call needed.
    Returns a snake_case topic key matching DSA_CONCEPT_GRAPH.
    """
    text = (question + " " + code).lower()

    if any(w in text for w in ["dfs", "depth first", "depth-first"]):
        return "bfs_dfs"
    if any(w in text for w in ["bfs", "breadth first", "breadth-first", "level order"]):
        return "bfs_dfs"
    if any(w in text for w in ["inorder", "preorder", "postorder", "binary tree", "bst", "root.left", "root.right"]):
        return "trees"
    if any(w in text for w in ["graph", "adjacency", "edge", "vertex", "vertices", "neighbor"]):
        return "graphs"
    if any(w in text for w in ["factorial", "fibonacci", "recursion", "recursive", "base case", "recurse"]):
        return "recursion"
    if any(w in text for w in ["linked list", "node.next", "curr.next", "head.next", "singly", "doubly"]):
        return "linked_lists"
    if any(w in text for w in ["stack", "push", "pop", "lifo"]):
        return "stacks"
    if any(w in text for w in ["queue", "enqueue", "dequeue", "fifo", "popleft"]):
        return "queues"
    if any(w in text for w in ["hashmap", "hashtable", "dictionary", "hash map", "counter(", "defaultdict"]):
        return "hashing"
    if any(w in text for w in ["two pointer", "two-pointer", "left pointer", "right pointer", "slow", "fast pointer"]):
        return "two_pointers"
    if any(w in text for w in ["binary search", "mid =", "lo =", "hi =", "bisect"]):
        return "binary_search"
    if any(w in text for w in ["sliding window", "window size", "window["]):
        return "sliding_window"
    if any(w in text for w in ["merge sort", "quicksort", "bubble sort", "insertion sort", "selection sort", "sort("]):
        return "sorting"
    if any(w in text for w in ["dp", "dynamic programming", "memoiz", "tabulation", "knapsack", "subproblem", "memo["]):
        return "dp"
    if any(w in text for w in ["heap", "min heap", "max heap", "heapq", "priority queue"]):
        return "heaps"
    if any(w in text for w in ["array", "subarray", "arr[", "nums[", "list["]):
        return "arrays"

    return "general"


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
