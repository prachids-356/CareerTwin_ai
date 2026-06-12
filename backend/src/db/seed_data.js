import db from './database.js';

const SEED_RESOURCES = [
  // Arrays Resources
  { topic: 'Arrays', title: 'Arrays & Dynamic Arrays Crash Course', type: 'video', quality: 9, url: 'https://www.youtube.com/watch?v=ArraysCrashCourse' },
  { topic: 'Arrays', title: 'LeetCode Array Patterns & Cheat Sheet', type: 'notes', quality: 8, url: 'https://leetcode.com/discuss/study-guide/arrays' },
  { topic: 'Arrays', title: 'Sliding Window Algorithm Explained', type: 'blog', quality: 9, url: 'https://medium.com/algorithms/sliding-window' },
  { topic: 'Arrays', title: 'Two-Pointer Technique Guide', type: 'blog', quality: 7, url: 'https://dev.to/twopointers' },

  // Linked Lists Resources
  { topic: 'Linked List', title: 'Linked Lists in 10 Minutes', type: 'video', quality: 8, url: 'https://www.youtube.com/watch?v=LinkedListsIntro' },
  { topic: 'Linked List', title: 'Understanding Pointers and Node Links', type: 'notes', quality: 7, url: 'https://geeksforgeeks.org/linked-list-pointers' },
  { topic: 'Linked List', title: 'How to Reverse a Linked List (Visualized)', type: 'blog', quality: 9, url: 'https://dev.to/reverselinkedlist' },

  // Recursion
  { topic: 'Recursion', title: 'Recursion for Beginners - Recursion Tree Method', type: 'video', quality: 9, url: 'https://www.youtube.com/watch?v=RecursionBeginners' },
  { topic: 'Recursion', title: 'Thinking Recursively: Step by Step Guide', type: 'blog', quality: 8, url: 'https://medium.com/recursion-guide' },
  { topic: 'Recursion', title: 'Recursion vs Iteration Cheat Sheet', type: 'notes', quality: 7, url: 'https://geeksforgeeks.org/recursion-notes' },

  // Trees Resources
  { topic: 'Trees', title: 'Binary Trees & Traversals Complete Guide', type: 'video', quality: 9, url: 'https://www.youtube.com/watch?v=BinaryTreesComplete' },
  { topic: 'Trees', title: 'Binary Search Tree Operations and Complexity', type: 'notes', quality: 8, url: 'https://leetcode.com/discuss/study-guide/trees' },
  { topic: 'Trees', title: 'Level Order Traversal and BFS on Trees', type: 'blog', quality: 9, url: 'https://dev.to/levelordertraversal' },

  // Graphs Resources
  { topic: 'Graphs', title: 'Graph Theory Algorithms Course', type: 'video', quality: 10, url: 'https://www.youtube.com/watch?v=GraphTheory' },
  { topic: 'Graphs', title: 'DFS vs BFS: Core Graph Implementations', type: 'notes', quality: 8, url: 'https://geeksforgeeks.org/dfs-bfs' },
  { topic: 'Graphs', title: 'Dijkstra\'s Shortest Path Algorithm Explained', type: 'blog', quality: 9, url: 'https://medium.com/graphs/dijkstras-algorithm' },

  // Hashing
  { topic: 'Hashing', title: 'Hash Table Internals & Collision Resolution', type: 'video', quality: 8, url: 'https://www.youtube.com/watch?v=HashingInternals' },
  { topic: 'Hashing', title: 'HashMap / HashSet Cheat Sheet', type: 'notes', quality: 9, url: 'https://leetcode.com/discuss/study-guide/hashing' },

  // DP Resources
  { topic: 'Dynamic Programming', title: 'Dynamic Programming Demystified', type: 'video', quality: 10, url: 'https://www.youtube.com/watch?v=DPMystified' },
  { topic: 'Dynamic Programming', title: '0/1 Knapsack Problem Master Class', type: 'blog', quality: 9, url: 'https://medium.com/dp/knapsack' },
  { topic: 'Dynamic Programming', title: 'Top-Down Memoization vs Bottom-Up Tabulation', type: 'notes', quality: 8, url: 'https://geeksforgeeks.org/dp-memoization' }
];

const SEED_QUESTIONS = [
  // Easy DSA
  {
    topic: 'Arrays',
    difficulty: 'Easy',
    questionType: 'dsa',
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    starterCode: 'function twoSum(nums, target) {\n  // Write your code here\n  \n}',
    solutionExplanation: 'Use a Hash Map to store the elements and their indices. For each element, check if (target - element) exists in the map. Time complexity: O(N), Space complexity: O(N).'
  },
  {
    topic: 'Linked List',
    difficulty: 'Easy',
    questionType: 'dsa',
    title: 'Reverse Linked List',
    description: 'Given the `head` of a singly linked list, reverse the list, and return its reversed list head.',
    starterCode: 'function reverseList(head) {\n  // Write your code here\n  \n}',
    solutionExplanation: 'Keep track of `prev`, `curr`, and `next` nodes. Iterate through the list, setting `curr.next` to `prev`, then advancing `prev` and `curr`. Time complexity: O(N), Space complexity: O(1).'
  },
  
  // Medium DSA
  {
    topic: 'Trees',
    difficulty: 'Medium',
    questionType: 'dsa',
    title: 'Lowest Common Ancestor of a Binary Tree',
    description: 'Given a binary tree, find the lowest common ancestor (LCA) of two given nodes `p` and `q` in the tree. The LCA is defined between two nodes `p` and `q` as the lowest node in T that has both `p` and `q` as descendants.',
    starterCode: 'function lowestCommonAncestor(root, p, q) {\n  // Write your code here\n  \n}',
    solutionExplanation: 'Recursively traverse the tree. If the root is null or matches p or q, return root. Recurse on left and right children. If both left and right recursion return non-null, the current root is the LCA. Otherwise, return the non-null result. Time complexity: O(N).'
  },
  {
    topic: 'Recursion',
    difficulty: 'Medium',
    questionType: 'dsa',
    title: 'Generate Parentheses',
    description: 'Given `n` pairs of parentheses, write a function to generate all combinations of well-formed parentheses.',
    starterCode: 'function generateParenthesis(n) {\n  // Write your code here\n  \n}',
    solutionExplanation: 'Use backtracking. Keep track of the number of open and close parentheses. We can add an open parenthesis if open < n, and we can add a close parenthesis if close < open. Time complexity: O(4^n / sqrt(n)) Catalan number.'
  },

  // Hard DSA
  {
    topic: 'Graphs',
    difficulty: 'Hard',
    questionType: 'dsa',
    title: 'Word Ladder',
    description: 'A transformation sequence from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence of words such that: (1) Every adjacent pair of words differs by a single letter. (2) All words in the sequence are in `wordList`. Find the length of the shortest transformation sequence.',
    starterCode: 'function ladderLength(beginWord, endWord, wordList) {\n  // Write your code here\n  \n}',
    solutionExplanation: 'This is a shortest-path problem in an unweighted graph, which can be solved using Breadth-First Search (BFS). Generate all intermediate words by changing one letter at a time, check if they exist in the dictionary, and traverse level by level. Time: O(M^2 * N) where M is word length and N is word list size.'
  },
  {
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    questionType: 'dsa',
    title: 'Edit Distance',
    description: 'Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`. You have three operations permitted on a word: Insert a character, Delete a character, Replace a character.',
    starterCode: 'function minDistance(word1, word2) {\n  // Write your code here\n  \n}',
    solutionExplanation: 'Use dynamic programming. Let dp[i][j] be the edit distance between word1[0...i-1] and word2[0...j-1]. If word1[i-1] == word2[j-1], dp[i][j] = dp[i-1][j-1]. Otherwise, dp[i][j] = 1 + min(dp[i-1][j] (delete), dp[i][j-1] (insert), dp[i-1][j-1] (replace)). Time: O(M*N), Space: O(M*N).'
  },

  // SQL Questions
  {
    topic: 'SQL',
    difficulty: 'Easy',
    questionType: 'sql',
    title: 'Second Highest Salary',
    description: 'Write a SQL query to report the second highest salary from the `Employee` table. If there is no second highest salary, query should report `null`. Table columns: `id (int)`, `salary (int)`.',
    starterCode: 'SELECT Max(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT Max(salary) FROM Employee);',
    solutionExplanation: 'Find the maximum salary that is strictly less than the overall maximum salary.'
  },
  {
    topic: 'SQL',
    difficulty: 'Medium',
    questionType: 'sql',
    title: 'Department Top Three Salaries',
    description: 'A company\'s department manager wants to select employees who earn the high salaries in each department. A high salary in a department is a salary that is in the top three unique salaries. Write a SQL query to find employees who earn top salaries. Tables: `Employee (id, name, salary, departmentId)`, `Department (id, name)`.',
    starterCode: '-- Write your SQL query here\n',
    solutionExplanation: 'Use DENSE_RANK() window function partitioned by departmentId ordered by salary descending, and filter where rank <= 3. Alternatively, count the number of distinct salaries in the same department that are greater than the employee\'s salary.'
  },

  // Behavioral Questions
  {
    topic: 'Behavioral',
    difficulty: 'Easy',
    questionType: 'behavioral',
    title: 'Describe Your Career Goals',
    description: 'Why do you want to pursue a career as an SDE, and what is your immediate target for the next 1-2 years?',
    starterCode: 'Write a paragraph summarizing your SDE aspirations...',
    solutionExplanation: 'Focus on your passion for building scale, solving structural problems, and your path towards gaining hands-on internship or full-time experience.'
  },
  {
    topic: 'Behavioral',
    difficulty: 'Medium',
    questionType: 'behavioral',
    title: 'Handling a Team Conflict',
    description: 'Tell me about a time you worked in a team project and encountered a conflict or disagreement with a peer. How did you resolve it, and what was the outcome?',
    starterCode: 'Describe the situation (S), task (T), action (A), and result (R)...',
    solutionExplanation: 'Use the STAR method. Focus on professional communication, active listening, focusing on data/requirements rather than ego, and driving consensus.'
  }
];

export async function seedDatabase() {
  const existingResources = await db.resources.find({});
  if (existingResources.length === 0) {
    console.log('Seeding Resources...');
    for (const res of SEED_RESOURCES) {
      await db.resources.insertOne(res);
    }
  }

  const existingQuestions = await db.questions.find({});
  if (existingQuestions.length === 0) {
    console.log('Seeding Questions...');
    for (const q of SEED_QUESTIONS) {
      await db.questions.insertOne(q);
    }
  }

  // Create a default user if none exists
  const existingUsers = await db.users.find({});
  if (existingUsers.length === 0) {
    console.log('Creating Default User...');
    await db.users.insertOne({
      username: 'CareerTwin_Learner',
      goal: 'Amazon SDE Intern',
      target_months: '3',
      learning_style: 'Practice-Oriented',
      current_skills: {
        "Arrays": 75,
        "Strings": 60,
        "Linked List": 40,
        "Hashing": 30,
        "Recursion": 25,
        "Trees": 10,
        "Graphs": 0,
        "Dynamic Programming": 0
      },
      learning_logs: {
        time_spent_theory: 1800,   // 30 mins
        time_spent_practice: 5400, // 90 mins
        time_spent_videos: 2400,   // 40 mins
        time_spent_examples: 1200, // 20 mins
        accuracy: 68
      }
    });

    // Create some initial attempts to show data in Dashboard
    console.log('Creating Default Attempts...');
    const defaultAttempts = [
      { topic: "Arrays", questions_attempted: 12, accuracy: 85, time_taken: 960, difficulty: "Easy" },
      { topic: "Arrays", questions_attempted: 8, accuracy: 70, time_taken: 1440, difficulty: "Medium" },
      { topic: "Strings", questions_attempted: 10, accuracy: 60, time_taken: 1200, difficulty: "Easy" },
      { topic: "Linked List", questions_attempted: 5, accuracy: 40, time_taken: 1500, difficulty: "Medium" }
    ];
    for (const att of defaultAttempts) {
      await db.attempts.insertOne(att);
    }
  }
  
  console.log('Database verification complete.');
}
