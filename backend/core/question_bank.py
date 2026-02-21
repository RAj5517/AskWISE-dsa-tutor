import random

# ── Naming convention: all keys match DSA_CONCEPT_GRAPH exactly ──────────────
# Topics: recursion, arrays, hashing, two_pointers, sliding_window,
#         binary_search, sorting, linked_lists, stacks, queues,
#         trees, bst, heaps, graphs, bfs_dfs, dp

# Difficulty tiers:
#   mastery < 40  → easy
#   mastery 40-70 → medium
#   mastery > 70  → hard

QUESTION_BANK: dict[str, dict[str, list[str]]] = {

    "recursion": {
        "easy": [
            "Write a recursive function factorial(n) that returns n! (product of all positive integers up to n). Handle the base case for n=0.",
            "Write a recursive function sum_list(arr) that returns the sum of all elements without using loops or built-in sum().",
        ],
        "medium": [
            "Write a recursive function to compute the nth Fibonacci number. Then explain why this naive approach is slow and how memoization fixes it.",
            "Write a recursive function flatten(nested) that takes a list of potentially nested lists and returns one flat list.",
        ],
        "hard": [
            "Write a recursive function generate_permutations(arr) that returns all permutations of a list. Analyze its time complexity.",
            "Implement a recursive solution to the Tower of Hanoi problem for n disks. Count the minimum number of moves needed.",
        ],
    },

    "arrays": {
        "easy": [
            "Write a function to find two numbers in an array that add up to a given target. Return their indices.",
            "Given a sorted array, remove duplicates in-place and return the new length.",
        ],
        "medium": [
            "Given an array, find the contiguous subarray with the largest product.",
            "Rotate an array to the right by k steps in-place using O(1) extra space.",
        ],
        "hard": [
            "Given an unsorted array of n integers from 0 to n, find all numbers that appear twice and all missing numbers in O(n) time.",
            "Find the median of two sorted arrays of sizes m and n in O(log(min(m,n))) time.",
        ],
    },

    "hashing": {
        "easy": [
            "Given a list of words, return the first word that appears more than once using a hash map.",
            "Write a function that checks if two strings are anagrams of each other using a hash map.",
        ],
        "medium": [
            "Given an array and integer k, find the length of the longest subarray that sums to k.",
            "Group an array of strings into lists of anagrams. Return a list of groups.",
        ],
        "hard": [
            "Design a data structure that supports insert, delete, and getRandom in O(1) average time.",
            "Given a stream of integers, find the top K frequent elements at any point using a hash map and heap.",
        ],
    },

    "two_pointers": {
        "easy": [
            "Given a sorted array and a target, find if any two numbers sum to the target using two pointers.",
            "Given a string, check if it is a palindrome using two pointers (ignore non-alphanumeric characters).",
        ],
        "medium": [
            "Given a sorted array, find all unique triplets that sum to zero (3-sum problem).",
            "Given two sorted arrays, merge them into one sorted array in O(m+n) time without extra space.",
        ],
        "hard": [
            "Given an array of non-negative integers representing bar heights, find the max water that can be trapped between bars.",
            "Given a string and a pattern, find the minimum window substring that contains all characters of the pattern.",
        ],
    },

    "sliding_window": {
        "easy": [
            "Find the maximum sum of any contiguous subarray of size k.",
            "Given a string, find the length of the longest substring without repeating characters.",
        ],
        "medium": [
            "Given a binary array, find the maximum number of consecutive 1s if you can flip at most k zeros.",
            "Find the longest subarray of 1s after deleting exactly one element from a binary array.",
        ],
        "hard": [
            "Given a string and a list of words, find all starting indices of substrings that are a concatenation of all words (each used exactly once).",
            "Find the minimum length subarray whose sum is greater than or equal to a given target. Return its length.",
        ],
    },

    "binary_search": {
        "easy": [
            "Implement binary search on a sorted array. Return the index of the target or -1 if not found.",
            "Given a sorted array with one missing number from 1 to n+1, find the missing number using binary search.",
        ],
        "medium": [
            "A sorted array has been rotated at some pivot. Find the index of a given target value.",
            "Find the square root of a non-negative integer n, rounded down, without using math.sqrt().",
        ],
        "hard": [
            "Given a 2D matrix sorted row by row and column by column, search for a target value in O(log(m*n)) time.",
            "There are n piles of bananas. Find the minimum eating speed k such that all piles can be eaten within h hours.",
        ],
    },

    "sorting": {
        "easy": [
            "Implement bubble sort on an array in-place. What is its time complexity in best and worst case?",
            "Given an array of 0s, 1s, and 2s, sort it in-place without using a sorting library (Dutch National Flag).",
        ],
        "medium": [
            "Implement merge sort. Explain why it's preferred over bubble sort for large datasets.",
            "Given an array of intervals, merge all overlapping intervals and return the result.",
        ],
        "hard": [
            "Implement quicksort with a random pivot. Discuss its average vs worst-case time complexity and how randomization helps.",
            "Given k sorted lists, merge them into one sorted list in O(n log k) time using a heap.",
        ],
    },

    "linked_lists": {
        "easy": [
            "Write a function to reverse a singly linked list in-place. Return the new head.",
            "Write a function to find the middle node of a linked list in one pass using the slow/fast pointer technique.",
        ],
        "medium": [
            "Detect if a linked list has a cycle. If yes, return the node where the cycle begins.",
            "Merge two sorted linked lists into one sorted linked list without creating new nodes.",
        ],
        "hard": [
            "Given a linked list, reverse nodes in groups of k. If remaining nodes are fewer than k, leave them as-is.",
            "Copy a linked list where each node has an extra 'random' pointer pointing to any node or null. Do it in O(n) time and O(1) extra space.",
        ],
    },

    "stacks": {
        "easy": [
            "Implement a stack using a list. Support push, pop, peek, and is_empty operations.",
            "Given a string of brackets, return True if it is valid (every opening bracket has a matching closing bracket in order).",
        ],
        "medium": [
            "Design a MinStack that supports push, pop, top, and getMin — all in O(1) time.",
            "Given a histogram as an array of bar heights, find the area of the largest rectangle that fits inside it.",
        ],
        "hard": [
            "Evaluate a math expression given as a string with +, -, *, / and parentheses without using eval().",
            "Given a list of daily temperatures, return a list where each element is the number of days until a warmer temperature (use a monotonic stack).",
        ],
    },

    "queues": {
        "easy": [
            "Implement a queue using two stacks. Support enqueue and dequeue operations.",
            "Given a binary tree, print each level's nodes on a new line using a queue (level-order traversal).",
        ],
        "medium": [
            "Implement a circular queue with a fixed size that supports enqueue, dequeue, isEmpty, and isFull.",
            "Given a stream of integers, find the maximum of every sliding window of size k using a deque.",
        ],
        "hard": [
            "Design a data structure that simulates a hospital queue: patients with higher priority are served first; equal priority is FIFO.",
            "Given n tasks with cooldown time n, find the minimum time to finish all tasks respecting that the same task must wait n intervals before repeating.",
        ],
    },

    "trees": {
        "easy": [
            "Given a binary tree, print all node values using inorder traversal (left → root → right).",
            "Write a function to find the height (maximum depth) of a binary tree using recursion.",
        ],
        "medium": [
            "Write all three traversals (preorder, inorder, postorder) of a binary tree iteratively using a stack.",
            "Given a binary tree, return the level-order traversal as a list of lists, where each inner list has one level.",
        ],
        "hard": [
            "Given a binary tree, find the diameter — the longest path between any two nodes (doesn't need to pass through root).",
            "Serialize a binary tree to a string and deserialize it back to the original tree.",
        ],
    },

    "bst": {
        "easy": [
            "Write a function to search for a value in a BST. Return the node if found, else None.",
            "Insert a value into a BST and return the root of the updated tree.",
        ],
        "medium": [
            "Given a BST, find the kth smallest element. Can you do it without storing all nodes in a list?",
            "Validate whether a given binary tree is a valid BST (each node satisfies the BST property).",
        ],
        "hard": [
            "Given a BST with two nodes swapped by mistake, restore the BST without changing its structure.",
            "Convert a sorted doubly linked list to a balanced BST in O(n) time.",
        ],
    },

    "heaps": {
        "easy": [
            "Given a list of integers, find the k largest elements using a min-heap of size k.",
            "Implement a max-heap from scratch (or explain how Python's heapq works and how to simulate a max-heap).",
        ],
        "medium": [
            "Given k sorted lists, merge them into one sorted list using a heap.",
            "Find the kth largest element in an unsorted array in O(n log k) time.",
        ],
        "hard": [
            "Design a data structure that finds the median of a data stream in O(log n) per insert and O(1) for median.",
            "Given a list of tasks with deadlines and profits, find the max profit when you can do at most one task per unit time.",
        ],
    },

    "graphs": {
        "easy": [
            "Given an undirected graph as an adjacency list, print all nodes reachable from a start node using DFS.",
            "Given a graph, determine if it is connected (every node can reach every other node).",
        ],
        "medium": [
            "Given a directed graph, detect if it has a cycle using DFS and a visited + recursion-stack set.",
            "Given a graph, return all its connected components as a list of lists.",
        ],
        "hard": [
            "Given a directed graph, return its nodes in topological sort order. Handle cycles (return empty if cycle exists).",
            "Find all bridges in an undirected graph — edges whose removal increases the number of connected components.",
        ],
    },

    "bfs_dfs": {
        "easy": [
            "Given an undirected graph as an adjacency list, print all nodes reachable from a start node using BFS.",
            "Find the shortest path (in edges) between two nodes in an unweighted undirected graph using BFS.",
        ],
        "medium": [
            "Given a 2D grid where 0=open and 1=wall, find the shortest path from top-left to bottom-right using BFS.",
            "Given a graph and a source node, find the shortest distance from source to every other node using BFS.",
        ],
        "hard": [
            "Given a word list and start/end words, find the shortest word ladder transformation sequence using BFS.",
            "Given a grid of '1's (land) and '0's (water), count the number of islands using DFS or BFS.",
        ],
    },

    "dp": {
        "easy": [
            "Write a bottom-up DP function to compute the nth Fibonacci number in O(n) time and O(1) space.",
            "Given an array of positive integers, find the maximum sum subarray (Kadane's algorithm).",
        ],
        "medium": [
            "Given coin denominations and a target amount, find the minimum number of coins needed to make that amount.",
            "Given a string, find the length of its longest palindromic substring using DP.",
        ],
        "hard": [
            "Given two strings, find their longest common subsequence (LCS). Return both the length and the actual subsequence.",
            "Given items with weights and values and a max capacity, find the maximum value you can carry (0/1 knapsack).",
        ],
    },
}


def get_question(topic: str, mastery_score: int) -> str:
    """
    Pick a question for the given topic based on the student's mastery.

    Boundaries (smoother than 35/65):
      mastery < 40  → easy
      mastery 40-70 → medium
      mastery > 70  → hard

    Falls back to easy recursion if topic not in bank.
    """
    questions = QUESTION_BANK.get(topic)
    if not questions:
        questions = QUESTION_BANK["recursion"]

    if mastery_score < 40:
        tier = "easy"
    elif mastery_score <= 70:
        tier = "medium"
    else:
        tier = "hard"

    pool = questions.get(tier, questions["easy"])
    return random.choice(pool)
