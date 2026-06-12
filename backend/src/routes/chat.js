import express from 'express';
import db from '../db/database.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Gemini if key is provided
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI successfully initialized for CareerTwin Coach.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err.message);
  }
}

// Get chat history and memories
router.get('/history', async (req, res) => {
  try {
    const memories = await db.memories.find({});
    res.json({ memories });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat endpoint
router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    // 1. Check if the message contains a struggle to save in memory
    const struggleKeywords = ['struggle', 'hard', 'difficult', 'confused', 'dont understand', "don't get", 'stuck', 'weakness', 'failing'];
    const lowercaseMessage = message.toLowerCase();
    
    let detectedStruggle = null;
    for (const keyword of struggleKeywords) {
      if (lowercaseMessage.includes(keyword)) {
        // Find which topic they are talking about
        const topics = ['array', 'string', 'linked list', 'recursion', 'tree', 'graph', 'hash', 'dp', 'dynamic programming'];
        for (const topic of topics) {
          if (lowercaseMessage.includes(topic)) {
            detectedStruggle = `User finds ${topic} concepts challenging. Context: "${message.substring(0, 100)}..."`;
            break;
          }
        }
        if (!detectedStruggle) {
          detectedStruggle = `User reports general struggle: "${message.substring(0, 100)}..."`;
        }
        break;
      }
    }

    if (detectedStruggle) {
      // Check if memory already exists to avoid duplication
      const existing = await db.memories.findOne({ text: detectedStruggle });
      if (!existing) {
        await db.memories.insertOne({
          text: detectedStruggle,
          timestamp: new Date().toISOString(),
          type: 'struggle'
        });
        console.log(`Saved new memory: ${detectedStruggle}`);
      }
    }

    // 2. Fetch all saved memories for context
    const memories = await db.memories.find({});
    const memoryString = memories.map(m => `- ${m.text} (${new Date(m.timestamp).toLocaleDateString()})`).join('\n');

    // 3. Assemble prompt context based on learning style
    const style = user.learning_style || 'Practice-Oriented';
    const goal = user.goal || 'Amazon SDE Intern';
    
    let styleInstruction = '';
    if (style === 'Practice-Oriented') {
      styleInstruction = 'Explain concepts briefly, then immediately provide concrete, executable code examples. Give a short coding quiz/challenge for the user to try.';
    } else if (style === 'Theory-Oriented') {
      styleInstruction = 'Provide a detailed conceptual breakdown, explaining the underlying math, data structures, and spatial complexity before showing code. Use analogies.';
    } else if (style === 'Video-Oriented') {
      styleInstruction = 'Focus on explaining the steps as if drawing them on a whiteboard. Use ASCII diagrams or step-by-step visual bullet points to represent pointer updates.';
    } else if (style === 'Example-Oriented') {
      styleInstruction = 'Walk through a specific, real-world case study or LeetCode question step-by-step. Show the state of variables at each line of execution.';
    }

    const systemPrompt = `You are CareerTwin Coach, a highly personalized career mentor helping a student target the role of: "${goal}".
The student has the following learning style: "${style}".
Instructions for style: ${styleInstruction}

Saved Student Memories:
${memoryString || 'No previous struggles recorded.'}

Current Student Skill Mastery:
${JSON.stringify(user.current_skills, null, 2)}

Provide a helpful, encouraging response. If the student asks about a topic they struggled with previously (mentioned in memories), acknowledge it gently (e.g. "I know recursion was a bit tricky for you last time, so let's take it slow..."). Keep your answer structured, readable, and highly informative.`;

    let reply = '';

    // 4. Query Gemini if configured, otherwise fall back to smart mock response
    if (ai) {
      try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nStudent Message: ${message}` }] }
          ]
        });
        reply = result.response.text();
      } catch (err) {
        console.error('Error generating content with Gemini API:', err);
        reply = getFallbackResponse(lowercaseMessage, style, memoryString);
      }
    } else {
      reply = getFallbackResponse(lowercaseMessage, style, memoryString);
    }

    res.json({
      reply,
      memoriesUpdated: !!detectedStruggle,
      detectedStruggle
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear memories endpoint
router.post('/clear-memories', async (req, res) => {
  try {
    const memories = await db.memories.find({});
    for (const mem of memories) {
      await db.memories.deleteOne({ _id: mem._id });
    }
    res.json({ message: 'All student memory traces cleared successfully.' });
  } catch (error) {
    console.error('Error clearing memories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// A highly intelligent mock fallback that changes response depending on learning style and query keywords
function getFallbackResponse(query, style, memoryString) {
  const containsRecursion = query.includes('recursion');
  const containsList = query.includes('linked list') || query.includes('node');
  const containsDP = query.includes('dp') || query.includes('dynamic programming');
  
  let recursionStruggleInfo = '';
  if (memoryString.toLowerCase().includes('recursion')) {
    recursionStruggleInfo = `*Acknowledge memory:* I remember recursion was a bit tricky for you in our last session, so let's break it down step-by-step together. `;
  }

  // Linked List Fallbacks
  if (containsList) {
    if (style === 'Practice-Oriented') {
      return `### Understanding Linked List Nodes (Practice-Oriented Mode)
      
A Linked List is a linear data structure where elements are not stored at contiguous memory locations. Instead, each element (node) points to the next.

Here is the basic class structure in JavaScript:

\`\`\`javascript
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}
\`\`\`

Let's practice! Write a function to insert a node at the head of a list:

\`\`\`javascript
function insertAtHead(head, newVal) {
  const newNode = new ListNode(newVal);
  newNode.next = head;
  return newNode;
}
\`\`\`

**Quick Challenge:** Try writing a function that prints all elements in a linked list. (Type \`done\` when you are ready!)`;
    }
    
    if (style === 'Theory-Oriented') {
      return `### The Theoretical Anatomy of Linked Lists (Theory-Oriented Mode)
      
A Linked List represents a dynamic data structure. Unlike arrays which rely on contiguous block allocations (offering $O(1)$ random access but $O(N)$ insertion shifts), a Linked List utilizes pointers to link nodes stored arbitrarily in heap memory.

**Mathematical Complexities:**
* **Accessing Elements:** $O(N)$ (must traverse from head)
* **Insertion at Head:** $O(1)$ (pointer redirection only)
* **Search:** $O(N)$

**Analogy:** Think of a treasure hunt. You start at clue 1 (Head), which gives you the address of clue 2. Clue 2 contains the address of clue 3. You cannot skip directly to clue 3 without visiting clue 2!`;
    }

    if (style === 'Video-Oriented') {
      return `### Visualizing Linked Lists (Video-Oriented Mode)

Here is a simple schematic showing how nodes link in memory. 

\`\`\`
[Head] ──► [ Node A ] ──► [ Node B ] ──► [ Node C ] ──► [ NULL ]
            (val: 12)       (val: 99)       (val: 37)
            (next: B)       (next: C)       (next: null)
\`\`\`

When reversing a list, we redirect these pointers.
1. Save the next node: \`nextTemp = curr.next\`
2. Redirect pointer backwards: \`curr.next = prev\`
3. Step forward: \`prev = curr\`, \`curr = nextTemp\``;
    }

    // Example-Oriented
    return `### Step-by-Step Walkthrough: Removing a Node (Example-Oriented Mode)

Let's delete the node with value \`37\` from this list:
\`10 -> 24 -> 37 -> 42 -> NULL\`

1. Start a runner pointer \`curr = head\` and tracker \`prev = null\`.
2. Move forward. \`curr.val\` is 10 (not 37). \`prev = curr\`, \`curr = curr.next\`.
3. Move forward. \`curr.val\` is 24 (not 37). \`prev = curr\`, \`curr = curr.next\`.
4. Move forward. \`curr.val\` is 37! **Match found.**
5. Link previous node directly to the next node:
   \`prev.next = curr.next\` (This points node 24 directly to node 42).
6. Result: \`10 -> 24 -> 42 -> NULL\`. Node 37 is unlinked and garbage collected.`;
  }

  // Recursion Fallbacks
  if (containsRecursion) {
    let response = `### Mastering Recursion\n\n${recursionStruggleInfo}`;
    
    if (style === 'Practice-Oriented') {
      return response + `Recursion is simply a function calling itself to solve smaller subproblems. Every recursive function needs two parts:
1. **Base Case:** The condition to stop recursion.
2. **Recursive Step:** Calling the function with modified parameters.

Let's look at calculating Factorial ($N!$):

\`\`\`javascript
function factorial(n) {
  // 1. Base Case
  if (n <= 1) return 1;
  // 2. Recursive Step
  return n * factorial(n - 1);
}
\`\`\`

**Your challenge:** Try writing a recursive function to compute the N-th Fibonacci number.`;
    }
    
    if (style === 'Theory-Oriented') {
      return response + `In computer science, recursion is implemented using the Call Stack. Each recursive call pushes a new "activation record" (containing parameters and local variables) onto the stack.

**The Stack Depth Threat:** If the base case is not reached or the input is too large, the system runs out of stack frame memory, leading to a **Stack Overflow**.

**Recurrence Relation:**
For factorial: $T(N) = T(N-1) + O(1)$. By substitution, total time complexity is $O(N)$ and space complexity is $O(N)$ due to stack overhead.`;
    }

    // Video/Example
    return response + `Let's visualize the execution tree of \`factorial(3)\`:

\`\`\`
factorial(3)
  │──► returns 3 * factorial(2)
                     │──► returns 2 * factorial(1)
                                        │──► returns 1 (Base Case reached!)
\`\`\`

Now, tracing the returns back up:
* \`factorial(1)\` returns \`1\`
* \`factorial(2)\` returns \`2 * 1 = 2\`
* \`factorial(3)\` returns \`3 * 2 = 6\``;
  }

  // Default general fallback responses
  if (style === 'Practice-Oriented') {
    return `Hello! I'm your CareerTwin Coach. I see you learn best through practice. 

Let's get straight to it. What topic would you like to build code for today? 
I can help with **Arrays**, **Linked Lists**, **Recursion**, **Trees**, **Graphs**, or **Dynamic Programming**. 

Ask me a question and I'll give you a coding exercise to solve!`;
  }
  
  return `Hello! I'm your CareerTwin Coach. I've configured our conversation for a **${style}** approach. 

Based on your target goal of **Amazon SDE Intern**, we should focus on addressing any skill gaps in your profile.
* You can ask me to explain algorithms, design patterns, or database query concepts.
* Feel free to ask: *"Can you explain the differences between BFS and DFS?"* or *"How does hashing work under the hood?"*

What topic shall we explore?`;
}

export default router;
