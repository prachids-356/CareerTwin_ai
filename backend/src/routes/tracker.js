import express from 'express';
import db from '../db/database.js';

const router = express.Router();
const ML_URL = 'http://localhost:5005';

// Helper to query the Python ML engine
async function callMLEngine(endpoint, body) {
  try {
    const response = await fetch(`${ML_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`ML engine returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error calling ML Engine at ${endpoint}:`, error.message);
    return null;
  }
}

// Log a quiz/practice attempt
router.post('/attempt', async (req, res) => {
  const { topic, questions_attempted, accuracy, time_taken, difficulty } = req.body;

  if (!topic || questions_attempted === undefined || accuracy === undefined || time_taken === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Save attempt in DB
    const newAttempt = await db.attempts.insertOne({
      topic,
      questions_attempted: Number(questions_attempted),
      accuracy: Number(accuracy),
      time_taken: Number(time_taken),
      difficulty: difficulty || 'Medium'
    });

    // 2. Fetch the user profile (assume default user for local single-user sandbox)
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    // 3. Update learning logs in user profile
    const logs = user.learning_logs || { time_spent_theory: 0, time_spent_practice: 0, time_spent_videos: 0, time_spent_examples: 0, accuracy: 0 };
    logs.time_spent_practice += Number(time_taken);
    
    // Recalculate rolling accuracy
    const allAttempts = await db.attempts.find({});
    const totalAccuracy = allAttempts.reduce((acc, curr) => acc + curr.accuracy, 0);
    logs.accuracy = Math.round(totalAccuracy / allAttempts.length);

    // 4. Request updated skill gap analysis from ML Engine
    const mlGaps = await callMLEngine('/predict_gaps', {
      attempts: allAttempts,
      current_skills: user.current_skills
    });

    // 5. Request learning style classification from ML Engine
    const mlStyle = await callMLEngine('/classify_learning_style', {
      learning_logs: logs
    });

    // 6. Update user profile in DB
    const updatedSkills = mlGaps ? mlGaps.mastery : user.current_skills;
    const updatedStyle = mlStyle ? mlStyle.learning_style : user.learning_style;
    const styleDistribution = mlStyle ? mlStyle.distribution : {};

    await db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          learning_logs: logs,
          current_skills: updatedSkills,
          learning_style: updatedStyle,
          style_distribution: styleDistribution,
          active_weak_areas: mlGaps ? mlGaps.active_weak_areas : [],
          predicted_gaps: mlGaps ? mlGaps.predicted_gaps : []
        }
      }
    );

    res.json({
      message: 'Attempt logged successfully',
      attempt: newAttempt,
      analysis: {
        mastery: updatedSkills,
        learning_style: updatedStyle,
        style_distribution: styleDistribution,
        active_weak_areas: mlGaps ? mlGaps.active_weak_areas : [],
        predicted_gaps: mlGaps ? mlGaps.predicted_gaps : []
      }
    });
  } catch (error) {
    console.error('Error logging attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log resource interaction (increases reading/watching time counters)
router.post('/resource-view', async (req, res) => {
  const { type, time_spent } = req.body; // type: video, blog, notes

  if (!type || !time_spent) {
    return res.status(400).json({ error: 'Missing type or time_spent' });
  }

  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    const logs = user.learning_logs || { time_spent_theory: 0, time_spent_practice: 0, time_spent_videos: 0, time_spent_examples: 0, accuracy: 0 };
    
    if (type === 'video') {
      logs.time_spent_videos += Number(time_spent);
    } else if (type === 'notes') {
      logs.time_spent_theory += Number(time_spent);
    } else if (type === 'blog') {
      // split between theory and example reading
      logs.time_spent_theory += Math.round(Number(time_spent) * 0.4);
      logs.time_spent_examples += Math.round(Number(time_spent) * 0.6);
    }

    // Recalculate learning style
    const mlStyle = await callMLEngine('/classify_learning_style', {
      learning_logs: logs
    });

    const updatedStyle = mlStyle ? mlStyle.learning_style : user.learning_style;
    const styleDistribution = mlStyle ? mlStyle.distribution : {};

    await db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          learning_logs: logs,
          learning_style: updatedStyle,
          style_distribution: styleDistribution
        }
      }
    );

    res.json({
      message: 'Resource interaction logged successfully',
      learning_style: updatedStyle,
      style_distribution: styleDistribution,
      learning_logs: logs
    });
  } catch (error) {
    console.error('Error logging resource view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
