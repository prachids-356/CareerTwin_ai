import express from 'express';
import db from '../db/database.js';

const router = express.Router();
const ML_URL = (() => {
  let url = process.env.ML_URL || 'http://localhost:5005';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }
  try {
    const urlObj = new URL(url);
    if (!urlObj.port && (urlObj.hostname === 'careertwin-ml-engine' || urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      url = `${url}:5005`;
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }
  return url;
})();

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

// Fetch general learning path recommendations
router.get('/path', async (req, res) => {
  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    const recs = await callMLEngine('/recommend', {
      user_skills: user.current_skills || {},
      goal: user.goal || 'Amazon SDE Intern',
      learning_style: user.learning_style || 'Practice-Oriented'
    });

    if (!recs) {
      return res.json({
        similarity_to_goal: 45.0,
        gap_analysis: {},
        primary_recommendation: 'Linked List',
        style_recommendation: 'Solve 10 Linked List traversal questions',
        collaborative_recommendation: 'Practice 8 Binary Tree Questions',
        priority_list: ['Linked List', 'Trees', 'Recursion']
      });
    }

    res.json(recs);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch and rank resources for a specific topic (standard ranker)
router.get('/resources/:topic', async (req, res) => {
  const { topic } = req.params;

  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    const resources = await db.resources.find({ topic });
    
    const colorRanked = await callMLEngine('/rank_resources', {
      resources,
      learning_style: user.learning_style || 'Practice-Oriented',
      success_rates: {}
    });

    if (!colorRanked) {
      return res.json(resources);
    }

    res.json(colorRanked);
  } catch (error) {
    console.error('Error ranking resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advanced Feature: Semantic search resources (dense vector or TF-IDF matching)
router.get('/search', async (req, res) => {
  const { topic, q } = req.query;
  
  if (!topic || q === undefined) {
    return res.status(400).json({ error: 'Missing topic or query (q) parameters.' });
  }

  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    // Get all resources for this topic
    const resources = await db.resources.find({ topic });
    
    // Call Python Semantic Search model
    const searchResults = await callMLEngine('/semantic_search', {
      resources,
      query: q,
      api_key: process.env.GEMINI_API_KEY || null
    });

    if (!searchResults) {
      // Fallback: simple text match if server is offline
      const qLower = q.toLowerCase();
      const fallbackMatches = resources.map(r => {
        const score = r.title.toLowerCase().includes(qLower) ? 90.0 : 10.0;
        return { resource: r, score };
      }).sort((a,b) => b.score - a.score);
      return res.json(fallbackMatches);
    }

    res.json(searchResults);
  } catch (error) {
    console.error('Error in semantic search route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advanced Feature: K-Means student peer cohort clustering
router.get('/cohort', async (req, res) => {
  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    const logs = user.learning_logs || { time_spent_theory: 0, time_spent_practice: 0, time_spent_videos: 0, time_spent_examples: 0, accuracy: 65 };
    const totalTime = (logs.time_spent_theory || 0) + (logs.time_spent_practice || 0) + (logs.time_spent_videos || 0) + (logs.time_spent_examples || 0);
    
    const practiceRatio = totalTime > 0 ? (logs.time_spent_practice / totalTime) : 0.5;
    const theoryRatio = totalTime > 0 ? ((logs.time_spent_theory + logs.time_spent_videos) / totalTime) : 0.3;
    const accuracy = logs.accuracy || 65;

    const cohortData = await callMLEngine('/cluster_cohort', {
      accuracy,
      practice_ratio: practiceRatio,
      theory_ratio: theoryRatio
    });

    if (!cohortData) {
      return res.json({ error: 'Clustering model offline.' });
    }

    // Sync cohort data back into user profile
    await db.users.updateOne(
      { _id: user._id },
      {
        $set: {
          cohort_id: cohortData.cohort_id,
          cohort_name: cohortData.cohort_name
        }
      }
    );

    res.json(cohortData);
  } catch (error) {
    console.error('Error fetching cohort clustering:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Advanced Feature: Mastery learning curve regression & forecasting
router.get('/curve', async (req, res) => {
  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    // Fetch user practice attempts
    const attempts = await db.attempts.find({});
    
    const curveData = await callMLEngine('/fit_learning_curve', {
      attempts
    });

    if (!curveData) {
      return res.json({ error: 'Curve fitting regression engine offline.' });
    }

    res.json(curveData);
  } catch (error) {
    console.error('Error fitting learning curve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate or fetch the dynamic roadmap
router.get('/roadmap', async (req, res) => {
  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    let roadmap = await db.roadmaps.findOne({ userId: user._id });
    
    if (!roadmap) {
      const syllabus = [
        { topic: 'Arrays', duration: 'Week 1-2' },
        { topic: 'Strings', duration: 'Week 3' },
        { topic: 'Hashing', duration: 'Week 4' },
        { topic: 'Linked List', duration: 'Week 5-6' },
        { topic: 'Recursion', duration: 'Week 7-8' },
        { topic: 'Trees', duration: 'Week 9-10' },
        { topic: 'Graphs', duration: 'Week 11' },
        { topic: 'Dynamic Programming', duration: 'Week 12' }
      ];

      const weeks = [];
      syllabus.forEach((item, idx) => {
        const mastery = user.current_skills[item.topic] || 0;
        let status = 'Not Started';
        if (mastery >= 75) status = 'Completed';
        else if (mastery > 25) status = 'In Progress';

        weeks.push({
          week: idx + 1,
          topic: item.topic,
          duration: item.duration,
          status,
          mastery,
          focusDescription: mastery >= 75 
            ? 'Maintain and practice hard problems' 
            : `Strengthen core concepts and practice ${user.learning_style === 'Practice-Oriented' ? 'coding challenges' : 'theory/notes'}`
        });
      });

      roadmap = await db.roadmaps.insertOne({
        userId: user._id,
        goal: user.goal,
        target_months: user.target_months,
        timeline: weeks
      });
    } else {
      let updatedTimeline = roadmap.timeline.map(item => {
        const mastery = user.current_skills[item.topic] || 0;
        let status = item.status;
        if (mastery >= 75) status = 'Completed';
        else if (mastery > 25) status = 'In Progress';
        
        return {
          ...item,
          status,
          mastery
        };
      });
      
      const updateResult = await db.roadmaps.updateOne(
        { _id: roadmap._id },
        { $set: { timeline: updatedTimeline } }
      );
      roadmap = updateResult.doc || roadmap;
    }

    res.json(roadmap);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate/Reset roadmap
router.post('/roadmap/regenerate', async (req, res) => {
  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(500).json({ error: 'Default user not initialized' });
    }

    await db.roadmaps.deleteOne({ userId: user._id });
    res.redirect(307, '/api/recommendations/roadmap');
  } catch (error) {
    console.error('Error resetting roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
