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
  } catch (err) {
    console.error('Failed to initialize Gemini AI for interview:', err.message);
  }
}

// Start a new interview session
router.post('/start', async (req, res) => {
  const { questionType, difficulty } = req.body; // questionType: dsa, sql, behavioral

  try {
    const type = questionType || 'dsa';
    const diff = difficulty || 'Easy';

    // Find questions matching type and difficulty
    let question = await db.questions.findOne({ questionType: type, difficulty: diff });
    
    // Fallback if none found
    if (!question) {
      question = await db.questions.findOne({ questionType: type });
    }

    if (!question) {
      return res.status(404).json({ error: 'No questions available for this type.' });
    }

    res.json({
      questionId: question._id,
      title: question.title,
      description: question.description,
      starterCode: question.starterCode,
      difficulty: question.difficulty,
      topic: question.topic,
      questionType: question.questionType
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit answer for evaluation
router.post('/submit', async (req, res) => {
  const { questionId, answer, timeSpent } = req.body;

  if (!questionId || answer === undefined) {
    return res.status(400).json({ error: 'questionId and answer are required' });
  }

  try {
    const question = await db.questions.findOne({ _id: questionId });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    let score = 50;
    let feedback = '';
    let timeComplexity = 'N/A';
    let spaceComplexity = 'N/A';
    let starBreakdown = null;

    // 1. Evaluate answer (STAR NLP for behavioral, Gemini AI vs Heuristics for others)
    if (question.questionType === 'behavioral') {
      try {
        const starResponse = await fetch('http://localhost:5005/analyze_star', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: answer })
        });
        if (starResponse.ok) {
          const starData = await starResponse.json();
          score = starData.score;
          feedback = `STAR Completeness Analysis:\n${starData.suggestions.join('\n')}`;
          starBreakdown = starData.breakdown;
        } else {
          throw new Error('STAR ML engine offline');
        }
      } catch (err) {
        console.error('STAR NLP evaluation failed, using heuristics:', err);
        const evalData = runHeuristicEvaluation(question, answer);
        score = evalData.score;
        feedback = evalData.feedback;
      }
    } else if (ai) {
      try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const evalPrompt = `You are a technical interviewer at a tier-1 tech company.
Evaluate the candidate's answer for this question:
Question: ${question.title} (${question.difficulty})
Description: ${question.description}

Candidate Answer:
${answer}

Return a JSON object with exactly these fields (do not put other text, markdown wrapper, or extra quotes):
{
  "score": (number 0 to 100),
  "feedback": (string detailing what was correct, any syntax or logic errors, and how to improve),
  "timeComplexity": (string, e.g. "O(N)"),
  "spaceComplexity": (string, e.g. "O(1)")
}`;
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: evalPrompt }] }]
        });
        
        let textResult = result.response.text().trim();
        if (textResult.startsWith('```json')) {
          textResult = textResult.substring(7, textResult.length - 3).trim();
        } else if (textResult.startsWith('```')) {
          textResult = textResult.substring(3, textResult.length - 3).trim();
        }
        
        const evalData = JSON.parse(textResult);
        score = Number(evalData.score || 50);
        feedback = evalData.feedback || 'Answer received and graded.';
        timeComplexity = evalData.timeComplexity || 'Unknown';
        spaceComplexity = evalData.spaceComplexity || 'Unknown';
      } catch (err) {
        console.error('Gemini grading failed, using fallback heuristics:', err);
        const evalData = runHeuristicEvaluation(question, answer);
        score = evalData.score;
        feedback = evalData.feedback;
      }
    } else {
      const evalData = runHeuristicEvaluation(question, answer);
      score = evalData.score;
      feedback = evalData.feedback;
    }

    // 2. Adjust next difficulty recommendation
    let nextDifficulty = question.difficulty;
    if (score >= 80) {
      if (question.difficulty === 'Easy') nextDifficulty = 'Medium';
      else if (question.difficulty === 'Medium') nextDifficulty = 'Hard';
    } else if (score < 55) {
      if (question.difficulty === 'Hard') nextDifficulty = 'Medium';
      else if (question.difficulty === 'Medium') nextDifficulty = 'Easy';
    }

    // 3. Log attempt to database so it updates skill gaps & learning style
    const timeTakenSec = timeSpent ? Number(timeSpent) : 180;
    
    // Call our internal tracker simulation
    const trackerResponse = await fetch(`http://localhost:5000/api/tracker/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: question.topic,
        questions_attempted: 1,
        accuracy: score,
        time_taken: timeTakenSec,
        difficulty: question.difficulty
      })
    });
    
    let analysisUpdate = null;
    if (trackerResponse.ok) {
      const trackData = await trackerResponse.json();
      analysisUpdate = trackData.analysis;
    }

    res.json({
      score,
      feedback,
      timeComplexity,
      spaceComplexity,
      nextDifficultyRecommendation: nextDifficulty,
      correctSolutionHint: question.solutionExplanation,
      analysisUpdate,
      starBreakdown
    });

  } catch (error) {
    console.error('Error evaluating interview answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Heuristic fallback evaluator
function runHeuristicEvaluation(question, answer) {
  const ansLower = answer.toLowerCase();
  
  if (question.questionType === 'behavioral') {
    if (answer.trim().length < 50) {
      return {
        score: 40,
        feedback: "Your response is too brief. In behavioral interviews, you should use the STAR method (Situation, Task, Action, Result) to provide sufficient detail."
      };
    }
    
    let score = 70;
    const keywords = ['result', 'learned', 'team', 'resolved', 'challenge', 'star'];
    let matches = 0;
    keywords.forEach(kw => {
      if (ansLower.includes(kw)) matches++;
    });
    
    score += matches * 4;
    return {
      score: Math.min(100, score),
      feedback: `Good effort! Your response covers the scenario. ${matches >= 3 ? 'You used structured STAR-like terms.' : 'Try to emphasize the specific actions you took and quantify the final result.'}`
    };
  }

  // DSA evaluation
  if (answer.trim().length < 15) {
    return {
      score: 10,
      feedback: "Answer is empty or too short to represent a valid code solution."
    };
  }

  let score = 60;
  let feedback = '';

  // Specific question heuristics
  if (question.title === 'Two Sum') {
    const usesMap = ansLower.includes('map') || ansLower.includes('new map') || ansLower.includes('{}') || ansLower.includes('dict');
    const hasLoops = ansLower.includes('for') || ansLower.includes('while');
    
    if (usesMap && hasLoops) {
      score = 90;
      feedback = "Excellent! You implemented the optimal O(N) Hash Map solution. You are correctly matching target differences in constant time.";
    } else if (hasLoops) {
      score = 70;
      feedback = "You implemented a brute-force nested loop solution. This takes O(N^2) time. Try using a Hash Map to reduce search complexity to O(N).";
    } else {
      feedback = "Your solution contains loops but lacks hash map operations. Ensure you return indices of the two elements.";
    }
  } else if (question.title === 'Reverse Linked List') {
    const redirectsNext = ansLower.includes('.next = prev') || ansLower.includes('next = curr.next');
    const returnsPrev = ansLower.includes('return prev');
    
    if (redirectsNext && returnsPrev) {
      score = 95;
      feedback = "Perfect iteration list reversal! You correctly handle prev, curr, and next pointer redirections.";
    } else {
      score = 50;
      feedback = "Your pointer updates are incomplete. Remember to store the next node before modifying current.next, then advance the prev pointer.";
    }
  } else {
    // General DSA heuristic
    const hasReturn = ansLower.includes('return');
    const hasFunction = ansLower.includes('function') || ansLower.includes('=>') || ansLower.includes('def ');
    
    if (hasReturn && hasFunction) {
      score = 80;
      feedback = "Code structure looks complete. Double check edge cases like null input and boundary limits.";
    } else {
      score = 45;
      feedback = "Your code structure is missing return statements or function definitions. Ensure it compiles and returns a result.";
    }
  }

  return { score, feedback };
}

export default router;
