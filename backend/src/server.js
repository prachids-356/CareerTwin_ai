import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db/database.js';
import { seedDatabase } from './db/seed_data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

import trackerRoutes from './routes/tracker.js';
import recommendRoutes from './routes/recommend.js';
import chatRoutes from './routes/chat.js';
import interviewRoutes from './routes/interview.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Register routes
app.use('/api/tracker', trackerRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/interview', interviewRoutes);

// Get User Profile Route
app.get('/api/user/profile', async (req, res) => {
  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update User Settings Route
app.post('/api/user/settings', async (req, res) => {
  const { goal, target_months, apiKey } = req.body;

  try {
    const user = await db.users.findOne({});
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const updates = {};
    if (goal) updates.goal = goal;
    if (target_months) updates.target_months = target_months;

    // Reset roadmap if goal or duration changes
    if (goal !== user.goal || target_months !== user.target_months) {
      await db.roadmaps.deleteOne({ userId: user._id });
    }

    const updateResult = await db.users.updateOne({ _id: user._id }, { $set: updates });
    
    // Save API key in memory for this session
    if (apiKey) {
      process.env.GEMINI_API_KEY = apiKey;
    }

    res.json({
      message: 'Settings updated successfully',
      user: updateResult.doc
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static assets from frontend build if it exists
if (fs.existsSync(frontendDistPath)) {
  console.log(`Serving static frontend assets from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  
  // Wildcard fallback to serve index.html (client-side routing support)
  app.get('*', (req, res, next) => {
    // Only intercept requests that don't start with /api
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start server after seeding DB
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`CareerTwin Express Backend running on port ${PORT}`);
    console.log(`===========================================`);
  });
}).catch(err => {
  console.error('Database seeding failed:', err);
  process.exit(1);
});
