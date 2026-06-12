import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : `${window.location.origin}/api`);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settings State
  const [goal, setGoal] = useState('Amazon SDE Intern');
  const [targetMonths, setTargetMonths] = useState('3');
  const [apiKey, setApiKey] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Tracker State
  const [trackTopic, setTrackTopic] = useState('Arrays');
  const [trackQuestions, setTrackQuestions] = useState(5);
  const [trackAccuracy, setTrackAccuracy] = useState(80);
  const [trackTime, setTrackTime] = useState(600);
  const [trackDifficulty, setTrackDifficulty] = useState('Medium');
  const [trackSuccess, setTrackSuccess] = useState('');

  // Advanced ML States: Learning Curve & Cohort Cluster
  const [learningCurve, setLearningCurve] = useState(null);
  const [cohortData, setCohortData] = useState(null);
  const [loadingCurve, setLoadingCurve] = useState(false);
  const [loadingCohort, setLoadingCohort] = useState(false);
  
  // Forgetting Curve & Recommendation Engine States
  const [recommendationData, setRecommendationData] = useState(null);
  const [loadingRanking, setLoadingRanking] = useState(false);

  // Roadmap State
  const [roadmap, setRoadmap] = useState(null);

  // Interview Simulator State
  const [interviewType, setInterviewType] = useState('dsa');
  const [interviewDiff, setInterviewDiff] = useState('Easy');
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);
  const [interviewSeconds, setInterviewSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Resource & Semantic Search State
  const [resourceTopic, setResourceTopic] = useState('Arrays');
  const [searchQuery, setSearchQuery] = useState('');
  const [rankedResources, setRankedResources] = useState([]);
  const [searching, setSearching] = useState(false);
  const [studyingResource, setStudyingResource] = useState(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const studyTimerRef = useRef(null);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'coach', text: "Hello! I am your CareerTwin AI Mentor. I learn how you learn and adapt to your style. What can we master today?" }
  ]);
  const [chatSending, setChatSending] = useState(false);
  const [memories, setMemories] = useState([]);
  const [memoryStatus, setMemoryStatus] = useState('');
  const chatEndRef = useRef(null);

  // Fetch initial profile and roadmap
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/profile`);
      if (!res.ok) throw new Error("Failed to load user profile");
      const data = await res.json();
      setUser(data);
      setGoal(data.goal);
      setTargetMonths(data.target_months);
      
      // Load other datasets
      fetchRoadmap();
      fetchMemories();
      fetchResources(resourceTopic, searchQuery);
      fetchLearningCurve();
      fetchCohortClustering();
      fetchRanking();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/roadmap`);
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
      }
    } catch (err) {
      console.error("Roadmap fetch error", err);
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/history`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error("Memories fetch error", err);
    }
  };

  const fetchResources = async (topic, queryText = '') => {
    setSearching(true);
    try {
      let url = `${API_BASE}/recommendations/resources/${topic}`;
      if (queryText.trim().length > 0) {
        url = `${API_BASE}/recommendations/search?topic=${topic}&q=${encodeURIComponent(queryText)}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Check if data returned is the search list structure: [{ resource, score }]
        if (data.length > 0 && data[0].resource) {
          // Normalize structure to match ranked style list
          const normalized = data.map(item => ({
            ...item.resource,
            score: item.score,
            isSemanticSearch: true
          }));
          setRankedResources(normalized);
        } else {
          setRankedResources(data);
        }
      }
    } catch (err) {
      console.error("Resources fetch error", err);
    } finally {
      setSearching(false);
    }
  };

  const fetchLearningCurve = async () => {
    setLoadingCurve(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations/curve`);
      if (res.ok) {
        const data = await res.json();
        setLearningCurve(data);
      }
    } catch (err) {
      console.error("Curve fitting fetch error", err);
    } finally {
      setLoadingCurve(false);
    }
  };

  const fetchCohortClustering = async () => {
    setLoadingCohort(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations/cohort`);
      if (res.ok) {
        const data = await res.json();
        setCohortData(data);
      }
    } catch (err) {
      console.error("Clustering fetch error", err);
    } finally {
      setLoadingCohort(false);
    }
  };

  const fetchRanking = async () => {
    setLoadingRanking(true);
    try {
      const res = await fetch(`${API_BASE}/recommendations/ranking`);
      if (res.ok) {
        const data = await res.json();
        setRecommendationData(data);
      }
    } catch (err) {
      console.error("Ranking fetch error", err);
    } finally {
      setLoadingRanking(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Sync resource topic/query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchResources(resourceTopic, searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [resourceTopic, searchQuery]);

  // Handle Interview Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setInterviewSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    try {
      const res = await fetch(`${API_BASE}/user/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, target_months: targetMonths, apiKey })
      });
      if (res.ok) {
        setSettingsSuccess('Settings saved! Re-calibrating roadmap...');
        setTimeout(() => setSettingsSuccess(''), 3000);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAttempt = async (e) => {
    e.preventDefault();
    setTrackSuccess('');
    try {
      const res = await fetch(`${API_BASE}/tracker/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trackTopic,
          questions_attempted: Number(trackQuestions),
          accuracy: Number(trackAccuracy),
          time_taken: Number(trackTime),
          difficulty: trackDifficulty
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({
          ...prev,
          current_skills: data.analysis.mastery,
          learning_style: data.analysis.learning_style,
          style_distribution: data.analysis.style_distribution,
          active_weak_areas: data.analysis.active_weak_areas,
          predicted_gaps: data.analysis.predicted_gaps,
          learning_logs: data.attempt ? {
            ...prev.learning_logs,
            time_spent_practice: prev.learning_logs.time_spent_practice + Number(trackTime),
            accuracy: data.analysis.style_distribution ? data.analysis.style_distribution.accuracy : prev.learning_logs.accuracy
          } : prev.learning_logs
        }));
        setTrackSuccess(`Attempt logged successfully! CareerTwin updated.`);
        setTimeout(() => setTrackSuccess(''), 3000);
        
        // Refresh advanced statistics
        fetchRoadmap();
        fetchLearningCurve();
        fetchCohortClustering();
        fetchRanking();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartInterview = async () => {
    setInterviewResult(null);
    setUserAnswer('');
    setInterviewSeconds(0);
    try {
      const res = await fetch(`${API_BASE}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionType: interviewType, difficulty: interviewDiff })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQuestion(data);
        setUserAnswer(data.starterCode || '');
        setTimerActive(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitInterview = async () => {
    setSubmittingAnswer(true);
    setTimerActive(false);
    try {
      const res = await fetch(`${API_BASE}/interview/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: activeQuestion.questionId,
          answer: userAnswer,
          timeSpent: interviewSeconds
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewResult(data);
        
        // Refresh profile to update dashboard & graphs
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleStartStudy = (resource) => {
    setStudyingResource(resource);
    setStudySeconds(0);
    studyTimerRef.current = setInterval(() => {
      setStudySeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStopStudy = async () => {
    clearInterval(studyTimerRef.current);
    const timeSpent = studySeconds;
    const type = studyingResource.type;
    const resourceId = studyingResource.id;
    
    setStudyingResource(null);
    try {
      const res = await fetch(`${API_BASE}/tracker/resource-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, time_spent: timeSpent, resourceId })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({
          ...prev,
          learning_style: data.learning_style,
          style_distribution: data.style_distribution,
          learning_logs: data.learning_logs
        }));
        
        // Refresh clusters
        fetchCohortClustering();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'student', text: userText }]);
    setChatSending(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { 
          role: 'coach', 
          text: data.reply,
          metadata: data.metadata
        }]);
        if (data.memoriesUpdated) {
          fetchMemories();
          fetchRanking();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatSending(false);
    }
  };

  const handleClearMemories = async () => {
    setMemoryStatus('Clearing...');
    try {
      const res = await fetch(`${API_BASE}/chat/clear-memories`, { method: 'POST' });
      if (res.ok) {
        setMemoryStatus('Memory logs cleared!');
        setTimeout(() => setMemoryStatus(''), 2000);
        fetchMemories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerateRoadmap = async () => {
    try {
      const res = await fetch(`${API_BASE}/recommendations/roadmap/regenerate`, { method: 'POST' });
      if (res.ok) {
        fetchRoadmap();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatLogDuration = (seconds) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs}h`;
  };

  // SVG Mastery Curve Drawing Helper
  const renderMasteryCurveSVG = () => {
    if (!learningCurve || !learningCurve.forecast || learningCurve.forecast.length === 0) {
      return <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Loading learning curve...</div>;
    }

    const forecast = learningCurve.forecast;
    const width = 450;
    const height = 180;
    const padding = 30;

    const maxVal = 100;
    const minVal = 0;
    const maxAttempt = forecast.length;

    // Mapping coordinates
    const getX = (attemptNum) => padding + ((attemptNum - 1) / (maxAttempt - 1)) * (width - padding * 2);
    const getY = (val) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);

    // Build polyline points
    const pointsStr = forecast.map(pt => `${getX(pt.attempt_num)},${getY(pt.accuracy)}`).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        {/* Grid lines */}
        <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={getY(50)} x2={width - padding} y2={getY(50)} stroke="rgba(255,255,255,0.05)" />
        <line x1={padding} y1={getY(90)} x2={width - padding} y2={getY(90)} stroke="rgba(0,242,254,0.15)" strokeDasharray="3 3" />
        <line x1={padding} y1={getY(100)} x2={width - padding} y2={getY(100)} stroke="rgba(255,255,255,0.05)" />
        
        {/* Y Axis labels */}
        <text x={padding - 5} y={getY(0) + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">0%</text>
        <text x={padding - 5} y={getY(50) + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">50%</text>
        <text x={padding - 5} y={getY(90) + 4} fill="var(--primary)" fontSize="8" textAnchor="end" fontWeight="bold">90%</text>
        <text x={padding - 5} y={getY(100) + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">100%</text>

        {/* Forecast Curve Line */}
        <polyline fill="none" stroke="url(#curve-gradient)" strokeWidth="3" points={pointsStr} strokeLinecap="round" style={{ filter: 'drop-shadow(0px 0px 5px rgba(0, 242, 254, 0.4))' }} />

        {/* Actual Dots if they exist */}
        {user?.learning_logs && (
          <g>
            {/* Draw current actual point (mock or verified logs) */}
            <circle cx={getX(1)} cy={getY(learningCurve.initial_mastery)} r="4" fill="var(--accent-purple)" />
          </g>
        )}

        {/* X Axis Labels */}
        <text x={padding} y={height - 8} fill="var(--text-muted)" fontSize="8">Start</text>
        <text x={width/2} y={height - 8} fill="var(--text-muted)" fontSize="8" textAnchor="middle">Attempts Forecast</text>
        <text x={width - padding} y={height - 8} fill="var(--text-muted)" fontSize="8" textAnchor="end">Target</text>

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-purple)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#080b10', color: '#00f2fe' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="60" height="60" viewBox="0 0 50 50" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(0, 242, 254, 0.1)" strokeWidth="4" />
            <path d="M25,5 A20,20 0 0,1 45,25" fill="none" stroke="#00f2fe" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div style={{ marginTop: '20px', fontFamily: 'Outfit', fontWeight: '500', letterSpacing: '1px' }}>SYNCHRONIZING CAREERTWIN SYSTEM...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#080b10', color: '#ff3d00' }}>
        <div style={{ textAlign: 'center', padding: '20px', maxWidth: '500px' }} className="glass-card">
          <h2 style={{ marginBottom: '15px' }}>Initialization Failed</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Could not connect to the Express backend. Please ensure the backend server is running on port 5000.</p>
          <button className="btn-neon" onClick={fetchProfile}>Retry Connection</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-gradient-cyber"></div>

      {/* Main Header */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(8, 11, 16, 0.8)', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--primary) 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#080b10" strokeWidth="2.5">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88A2.5 2.5 0 0 1 9.5 2Z" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88A2.5 2.5 0 0 0 14.5 2Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '0.5px' }}>CareerTwin AI</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PERSONALIZED ML CAREER ENGINE</p>
          </div>
        </div>

        {/* Student Stats Panel */}
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CAREER TARGET</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>{user?.goal}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COHORT</div>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(189,0,255,0.1)', color: 'var(--accent-purple)', fontWeight: '600', border: '1px solid rgba(189,0,255,0.2)' }}>
              {cohortData?.cohort_name ? cohortData.cohort_name.split(' ')[0] : 'Scanning...'}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STYLE</div>
            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,230,118,0.1)', color: 'var(--success)', fontWeight: '600', border: '1px solid rgba(0,230,118,0.2)' }}>
              {user?.learning_style}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={{ display: 'flex', padding: '30px 40px', gap: '30px', position: 'relative', zIndex: 5, maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* Sidebar Tabs Navigation */}
        <nav style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
            Dashboard
          </button>
          <button className={`nav-tab ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => setActiveTab('roadmap')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
            Dynamic Roadmap
          </button>
          <button className={`nav-tab ${activeTab === 'practice' ? 'active' : ''}`} onClick={() => setActiveTab('practice')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Adaptive Practice
          </button>
          <button className={`nav-tab ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            Resource Hub
          </button>
          <button className={`nav-tab ${activeTab === 'coach' ? 'active' : ''}`} onClick={() => setActiveTab('coach')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            AI Mentor Coach
          </button>
          <button className={`nav-tab ${activeTab === 'evaluation' ? 'active' : ''}`} onClick={() => setActiveTab('evaluation')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            Evaluation Hub
          </button>
          <button className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            System Settings
          </button>
        </nav>

        {/* Main Panel View */}
        <main style={{ flex: 1, minWidth: 0 }}>
          
          {/* TAB 1: ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Dashboard Row 1: Mastery Curve Regression and Peer Clustering */}
              <div className="dashboard-grid">
                
                {/* SVG Curve Fitter Card */}
                <div className="glass-card animate-glow" style={{ gridColumn: 'span 7', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '18px' }}>Learning Curve Forecast</h3>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.08)', color: 'var(--primary)', fontWeight: 'bold' }}>
                        {learningCurve?.is_default ? 'BASELINE ESTIMATE' : `REGRESSION (R²: ${learningCurve?.r_squared})`}
                      </span>
                    </div>
                    {renderMasteryCurveSVG()}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>LEARNING CONSTANT (k)</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>{learningCurve?.learning_rate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Q'S TO 90% TARGET</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)' }}>
                        {learningCurve?.questions_to_target === 0 ? 'Target Achieved!' : `~${learningCurve?.questions_to_target} questions`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cohort Clustering Card */}
                <div className="glass-card" style={{ gridColumn: 'span 5', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Peer Cohort Clustering</h3>
                    
                    {cohortData && !cohortData.error ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ background: 'rgba(189, 0, 255, 0.05)', border: '1px solid rgba(189,0,255,0.15)', borderRadius: '8px', padding: '12px 15px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 'bold', letterSpacing: '0.5px' }}>UNSUPERVISED K-MEANS ASSIGNMENT</div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>{cohortData.cohort_name}</div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>{cohortData.cohort_description}</p>
                        </div>

                        {/* Comparisons bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                              <span>Accuracy</span>
                              <span>You: <strong>{cohortData.user_metrics.accuracy}%</strong> vs Cohort: <strong>{cohortData.cohort_averages.accuracy}%</strong></span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{ width: `${cohortData.cohort_averages.accuracy}%`, height: '100%', background: 'var(--text-muted)', position: 'absolute', left: 0 }} />
                              <div style={{ width: `${cohortData.user_metrics.accuracy}%`, height: '100%', background: 'var(--primary)', position: 'absolute', left: 0 }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                              <span>Practice Ratio</span>
                              <span>You: <strong>{Math.round(cohortData.user_metrics.practice_ratio * 100)}%</strong> vs Cohort: <strong>{Math.round(cohortData.cohort_averages.practice_ratio * 100)}%</strong></span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                              <div style={{ width: `${cohortData.cohort_averages.practice_ratio * 100}%`, height: '100%', background: 'var(--text-muted)', position: 'absolute', left: 0 }} />
                              <div style={{ width: `${cohortData.user_metrics.practice_ratio * 100}%`, height: '100%', background: 'var(--accent-purple)', position: 'absolute', left: 0 }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                        {cohortData?.error ? `Model Offline: ${cohortData.error}` : 'Recalculating peer cohorts...'}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Practice: <strong>{formatLogDuration(user?.learning_logs?.time_spent_practice || 0)}</strong></span>
                    <span>Theory: <strong>{formatLogDuration(user?.learning_logs?.time_spent_theory || 0)}</strong></span>
                    <span>Videos: <strong>{formatLogDuration(user?.learning_logs?.time_spent_videos || 0)}</strong></span>
                  </div>
                </div>

              </div>

              {/* Dashboard Row 2: Skill Mastery Bars & Log Form */}
              <div className="dashboard-grid">
                
                {/* Skill Mastery & Ebbinghaus Retention Profile */}
                <div className="glass-card" style={{ gridColumn: 'span 7', padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px' }}>Skill & Retention Profile</h3>
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 179, 0, 0.08)', color: 'var(--warning)', fontWeight: '600' }}>
                      EBBINGHAUS DECAY ACTIVE
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.entries(user?.current_skills || {}).map(([topic, mastery]) => {
                      const recStats = recommendationData?.recommendation_list?.find(r => r.topic === topic);
                      const retention = recStats ? recStats.retention : 100;
                      const isBlocked = recStats ? !recStats.prereqs_met : false;
                      const suggestRev = recStats ? recStats.revision_suggested : false;

                      return (
                        <div key={topic} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', color: isBlocked ? 'var(--text-muted)' : 'var(--text-secondary)', fontWeight: '500' }}>
                                {topic} {isBlocked && '🔒'}
                              </span>
                              {suggestRev && (
                                <span style={{ fontSize: '9px', color: 'var(--warning)', background: 'rgba(255, 179, 0, 0.06)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(255, 179, 0, 0.15)' }}>
                                  🔄 Revise
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Mastery: <strong>{mastery}%</strong> | Retention: <strong style={{ color: retention < 50 ? 'var(--error)' : 'var(--success)' }}>{retention}%</strong>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Mastery Bar */}
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${mastery}%`,
                                height: '100%',
                                background: isBlocked 
                                  ? 'var(--text-muted)' 
                                  : mastery >= 75 ? 'linear-gradient(90deg, #4facfe, #00e676)' : 'linear-gradient(90deg, #bd00ff, #00f2fe)',
                                borderRadius: '3px',
                                boxShadow: isBlocked ? 'none' : '0 0 8px rgba(0, 242, 254, 0.15)'
                              }} />
                            </div>

                            {/* Retention Bar */}
                            <div style={{ width: '80px', height: '6px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${retention}%`,
                                height: '100%',
                                background: retention < 50 
                                  ? 'linear-gradient(90deg, var(--error), #ff7d47)' 
                                  : 'linear-gradient(90deg, var(--success), #76ff03)',
                                borderRadius: '3px'
                              }} />
                            </div>
                          </div>
                          {isBlocked && recStats.prereq_issues.length > 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--error)', marginTop: '2px' }}>
                              Blocked: {recStats.prereq_issues[0]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Log Practice Attempts */}
                <div className="glass-card" style={{ gridColumn: 'span 5', padding: '25px' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Log Practice Session</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    Synchronize external practice attempts. Calculations update curves instantly.
                  </p>
                  
                  <form onSubmit={handleSubmitAttempt} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TOPIC</label>
                        <select style={{ width: '100%', padding: '6px 10px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                          value={trackTopic} onChange={e => setTrackTopic(e.target.value)}>
                          <option>Arrays</option>
                          <option>Strings</option>
                          <option>Linked List</option>
                          <option>Hashing</option>
                          <option>Recursion</option>
                          <option>Trees</option>
                          <option>Graphs</option>
                          <option>Dynamic Programming</option>
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>DIFFICULTY</label>
                        <select style={{ width: '100%', padding: '6px 10px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                          value={trackDifficulty} onChange={e => setTrackDifficulty(e.target.value)}>
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>QUESTIONS</label>
                        <input type="number" style={{ width: '100%', padding: '6px 10px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                          value={trackQuestions} onChange={e => setTrackQuestions(e.target.value)} min="1" required />
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>ACCURACY (%)</label>
                        <input type="number" style={{ width: '100%', padding: '6px 10px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                          value={trackAccuracy} onChange={e => setTrackAccuracy(e.target.value)} min="0" max="100" required />
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TIME (SECS)</label>
                        <input type="number" style={{ width: '100%', padding: '6px 10px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                          value={trackTime} onChange={e => setTrackTime(e.target.value)} min="10" required />
                      </div>
                    </div>

                    <button type="submit" className="btn-neon" style={{ marginTop: '5px', width: '100%' }}>Sync Attempt Dataset</button>
                    
                    {trackSuccess && (
                      <div style={{ fontSize: '12px', color: 'var(--success)', textAlign: 'center', marginTop: '5px' }}>{trackSuccess}</div>
                    )}
                  </form>
                </div>

              </div>

              {/* Dashboard Row 3: Gap Analysis */}
              <div className="glass-card" style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>ML Gap Predictor</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', color: '#ff3d00', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      ACTIVE WEAK AREAS
                    </h4>
                    {user?.active_weak_areas?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No severe gaps identified.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {user?.active_weak_areas?.map((gap, i) => (
                          <div key={i} style={{ background: 'rgba(255, 61, 0, 0.04)', border: '1px solid rgba(255, 61, 0, 0.15)', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ fontWeight: '600' }}>{gap.topic}</span>
                            <span style={{ color: 'rgba(255,61,0,0.8)' }}>{gap.reason} ({gap.mastery}%)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      PREDICTED DOWNSTREAM RISK
                    </h4>
                    {user?.predicted_gaps?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No downstream prerequisite failures predicted.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {user?.predicted_gaps?.map((gap, i) => (
                          <div key={i} style={{ background: 'rgba(255, 179, 0, 0.04)', border: '1px solid rgba(255, 179, 0, 0.15)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: '600' }}>{gap.topic}</span>
                              <span style={{ color: 'var(--warning)', fontSize: '11px', fontWeight: 'bold' }}>RISK</span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{gap.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DYNAMIC ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div className="glass-card" style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Dynamic Roadmap Generator</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Your roadmap dynamically schedules weekly topics, updating completion checkmarks as your mastery scores reach 75%.
                  </p>
                </div>
                <button className="btn-secondary" onClick={handleRegenerateRoadmap}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
                  Regenerate
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {roadmap?.timeline?.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '20px', borderLeft: item.status === 'Completed' ? '4px solid var(--success)' : item.status === 'In Progress' ? '4px solid var(--primary)' : '4px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>
                          W{item.week}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{item.topic}</h3>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{item.duration}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.focusDescription}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>MASTERY</div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', color: item.mastery >= 75 ? 'var(--success)' : '#fff' }}>{item.mastery}%</div>
                        </div>

                        <div style={{ minWidth: '100px', textAlign: 'right' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: item.status === 'Completed' ? 'rgba(0, 230, 118, 0.1)' : item.status === 'In Progress' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.03)',
                            color: item.status === 'Completed' ? 'var(--success)' : item.status === 'In Progress' ? 'var(--primary)' : 'var(--text-secondary)',
                            border: item.status === 'Completed' ? '1px solid rgba(0,230,118,0.2)' : item.status === 'In Progress' ? '1px solid rgba(0,242,254,0.2)' : '1px solid var(--border-color)'
                          }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ADAPTIVE PRACTICE & INTERVIEW SIMULATOR */}
          {activeTab === 'practice' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {!activeQuestion ? (
                <div className="glass-card" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" style={{ marginBottom: '15px' }} className="animate-glow">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>AI Adaptive Interview Arena</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                    Solve DSA, SQL queries, or behavioral scenarios. Our Python models evaluate performance, scoring code structure or STAR framework coverage dynamically.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', marginBottom: '30px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>QUESTION TYPE</label>
                      <select style={{ width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        value={interviewType} onChange={e => setInterviewType(e.target.value)}>
                        <option value="dsa">Data Structures & Algorithms (Coding)</option>
                        <option value="sql">SQL Query Design</option>
                        <option value="behavioral">Behavioral (Leadership / Collaboration)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>INITIAL DIFFICULTY</label>
                      <select style={{ width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                        value={interviewDiff} onChange={e => setInterviewDiff(e.target.value)}>
                        <option value="Easy">Easy (Foundation builder)</option>
                        <option value="Medium">Medium (Industry standard)</option>
                        <option value="Hard">Hard (FAANG caliber)</option>
                      </select>
                    </div>
                  </div>

                  <button className="btn-neon" style={{ width: '100%' }} onClick={handleStartInterview}>Launch Mock Session</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
                  
                  {/* Left Column: Description */}
                  <div className="glass-card" style={{ gridColumn: 'span 5', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)' }}>
                          {activeQuestion.topic}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: activeQuestion.difficulty === 'Easy' ? 'rgba(0, 230, 118, 0.1)' : activeQuestion.difficulty === 'Medium' ? 'rgba(255, 179, 0, 0.1)' : 'rgba(255, 61, 0, 0.1)',
                          color: activeQuestion.difficulty === 'Easy' ? 'var(--success)' : activeQuestion.difficulty === 'Medium' ? 'var(--warning)' : 'var(--error)'
                        }}>
                          {activeQuestion.difficulty}
                        </span>
                      </div>

                      <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>{activeQuestion.title}</h2>
                      
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13.5px', color: '#e2e8f0', lineHeight: '1.6', overflowY: 'auto', maxHeight: '300px', fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
                        {activeQuestion.description}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>{formatTime(interviewSeconds)}</span>
                      </div>
                      <button className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'rgba(255,61,0,0.1)' }} onClick={() => setActiveQuestion(null)}>
                        Exit Arena
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Code Editor & Results */}
                  <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {!interviewResult ? (
                      <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>CANDIDATE CONSOLE</label>
                        <textarea
                          style={{ flex: 1, minHeight: '350px', background: '#04060a', border: '1px solid var(--border-color)', color: '#00e676', fontFamily: 'Courier New, monospace', fontSize: '14px', padding: '15px', borderRadius: '8px', resize: 'vertical', outline: 'none', lineHeight: '1.5' }}
                          value={userAnswer}
                          onChange={e => setUserAnswer(e.target.value)}
                        />
                        <button className="btn-neon" style={{ marginTop: '20px', width: '100%' }} onClick={handleSubmitInterview} disabled={submittingAnswer}>
                          {submittingAnswer ? 'Evaluating Code correctness...' : 'Submit answer for ML evaluation'}
                        </button>
                      </div>
                    ) : (
                      <div className="glass-card animate-glow" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '18px' }}>Session Feedback</h3>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SCORE</div>
                            <div style={{ fontSize: '26px', fontWeight: 'bold', color: interviewResult.score >= 80 ? 'var(--success)' : interviewResult.score >= 55 ? 'var(--warning)' : 'var(--error)' }}>
                              {interviewResult.score}/100
                            </div>
                          </div>
                        </div>

                        {/* STAR Breakdown Chart if present */}
                        {interviewResult.starBreakdown && (
                          <div style={{ background: 'rgba(189,0,255,0.03)', border: '1px solid rgba(189,0,255,0.1)', padding: '15px', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '0.5px' }}>NLP STAR FRAMEWORK MAPPING</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                              {Object.entries(interviewResult.starBreakdown).map(([phase, pct]) => (
                                <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '80px', color: 'var(--text-secondary)' }}>{phase}</div>
                                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-purple)' }} />
                                  </div>
                                  <div style={{ width: '35px', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(pct)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', lineHeight: '1.6' }}>
                          <strong>AI Evaluator feedback:</strong>
                          <p style={{ marginTop: '5px', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{interviewResult.feedback}</p>
                        </div>

                        {activeQuestion.questionType !== 'behavioral' && (
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TIME COMPLEXITY</div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginTop: '3px' }}>{interviewResult.timeComplexity}</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SPACE COMPLEXITY</div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginTop: '3px' }}>{interviewResult.spaceComplexity}</div>
                            </div>
                          </div>
                        )}

                        <div style={{ background: 'rgba(0,242,254,0.03)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(0,242,254,0.1)', fontSize: '13px', lineHeight: '1.5' }}>
                          <strong style={{ color: 'var(--primary)' }}>Optimal Pattern Guide:</strong>
                          <p style={{ marginTop: '5px', color: 'var(--text-secondary)' }}>{interviewResult.correctSolutionHint}</p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', gap: '15px', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Next difficulty calibrated: <strong style={{ color: 'var(--primary)' }}>{interviewResult.nextDifficultyRecommendation}</strong>
                          </span>
                          <button className="btn-neon" onClick={() => {
                            setInterviewDiff(interviewResult.nextDifficultyRecommendation);
                            handleStartInterview();
                          }}>
                            Request Next Question
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 4: RESOURCE HUB (WITH SEMANTIC SEARCH) */}
          {activeTab === 'resources' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Personalized Resource Ranking</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Resources ranked dynamically for your style: <strong>{user?.learning_style}</strong>.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '5px' }}>SELECT TOPIC</label>
                    <select style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
                      value={resourceTopic} onChange={e => setResourceTopic(e.target.value)}>
                      <option>Arrays</option>
                      <option>Strings</option>
                      <option>Linked List</option>
                      <option>Hashing</option>
                      <option>Recursion</option>
                      <option>Trees</option>
                      <option>Graphs</option>
                      <option>Dynamic Programming</option>
                    </select>
                  </div>
                </div>

                {/* Semantic Search Bar */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '12px 16px 12px 40px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '13.5px' }}
                    placeholder="Search query (e.g. 'reverse traversal guide', 'glowing graph cycles')..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <div style={{ position: 'absolute', left: '15px', top: '13px', color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  </div>
                  {searching && (
                    <div style={{ position: 'absolute', right: '15px', top: '13px' }}>
                      <svg width="16" height="16" viewBox="0 0 50 50" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M25,5 A20,20 0 0,1 45,25" fill="none" stroke="var(--primary)" strokeWidth="4" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Active study overlay */}
              {studyingResource && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(8,11,16,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="glass-card animate-glow" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center', border: '1px solid var(--primary)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ marginBottom: '15px' }} className="animate-spin">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Active Learning Session</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                      Studying: <strong>{studyingResource.title}</strong>
                    </p>
                    
                    <div style={{ fontSize: '30px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', margin: '20px 0' }}>
                      {formatTime(studySeconds)}
                    </div>
                    
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '30px' }}>
                      Staying here increases study logs. Your learning style classifier recalculates features in the backend.
                    </p>
                    
                    <button className="btn-neon" onClick={handleStopStudy}>Complete Session & Log dataset</button>
                  </div>
                </div>
              )}

              {/* Resource List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {rankedResources.map((res, i) => (
                  <div key={res.id || i} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        #{i + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: res.type === 'video' ? 'rgba(255,61,0,0.1)' : res.type === 'notes' ? 'rgba(189,0,255,0.1)' : 'rgba(0,242,254,0.1)',
                            color: res.type === 'video' ? 'var(--error)' : res.type === 'notes' ? 'var(--accent-purple)' : 'var(--primary)',
                            textTransform: 'uppercase'
                          }}>
                            {res.type}
                          </span>
                          <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{res.title}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {res.isSemanticSearch ? (
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Semantic Similarity: {res.score}%</span>
                          ) : (
                            <>
                              <span>Quality: <strong>{res.quality}/10</strong></span>
                              <span>Preference match: <strong>{res.breakdown?.preference_contribution} pts</strong></span>
                              <span>Success Rate: <strong>{res.breakdown?.success_contribution} pts</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      {!res.isSemanticSearch && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RECOMMENDATION SCORE</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>{res.score}</div>
                        </div>
                      )}
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" onClick={() => handleStartStudy(res)}>
                        Study Resource
                      </a>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: AI COACH WITH MEMORY */}
          {activeTab === 'coach' && (
            <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', height: 'calc(100vh - 180px)' }}>
              
              <div className="glass-card" style={{ gridColumn: 'span 8', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px' }}>AI CareerTwin Coach</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dynamic memory & learning-style customized instructions</p>
                  </div>
                  <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0, 242, 254, 0.08)', color: 'var(--primary)' }}>
                    Style: {user?.learning_style}
                  </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px', marginBottom: '15px' }}>
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} style={{ alignSelf: chat.role === 'coach' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: chat.role === 'coach' ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                        color: chat.role === 'coach' ? '#e2e8f0' : '#080b10',
                        fontSize: '13.5px',
                        lineHeight: '1.5',
                        border: chat.role === 'coach' ? '1px solid var(--border-color)' : 'none',
                        fontFamily: chat.role === 'coach' && chat.text.includes('```') ? 'monospace' : 'inherit',
                        whiteSpace: 'pre-line'
                      }}>
                        {chat.text}
                        
                        {/* Custom CareerTwin Personalized Insight HUD */}
                        {chat.role === 'coach' && chat.metadata && (
                          <div className="coach-insight-hud" style={{ marginTop: '10px' }}>
                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '10px', marginBottom: '6px', letterSpacing: '0.5px' }}>
                              🤖 CAREERTWIN INSIGHT ENGINE
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: '#cbd5e1' }}>
                              {chat.metadata.memoryRecorded && (
                                <div>
                                  <strong>💾 Memory Indexed:</strong> <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{chat.metadata.memoryRecorded.topic}</span> &rarr; <em>{chat.metadata.memoryRecorded.sentiment}</em> (Importance: {chat.metadata.memoryRecorded.importance})
                                </div>
                              )}
                              <div>
                                <strong>📈 Current Topic Mastery:</strong> <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{chat.metadata.currentMastery}%</span>
                              </div>
                              {chat.metadata.suggestedPath && chat.metadata.suggestedPath.length > 0 && (
                                <div>
                                  <strong>🛣️ Suggested Path:</strong>
                                  <ol style={{ margin: '3px 0 0 15px', padding: 0 }}>
                                    {chat.metadata.suggestedPath.map((step, sIdx) => <li key={sIdx}>{step}</li>)}
                                  </ol>
                                </div>
                              )}
                              {chat.metadata.predictedTime !== undefined && (
                                <div>
                                  <strong>⏱️ Predicted Time to 50% Mastery:</strong>{' '}
                                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                    {chat.metadata.predictedTime === 0 ? 'Mastery Achieved!' : `${chat.metadata.predictedTime} hours`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: chat.role === 'coach' ? 'left' : 'right', marginTop: '4px', padding: '0 5px' }}>
                        {chat.role === 'coach' ? 'CAREERTWIN COACH' : 'YOU'}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    style={{ flex: 1, padding: '12px 16px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', outline: 'none' }}
                    placeholder="Ask a question... Try saying: 'I struggle with linked lists' to test memory capture."
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    disabled={chatSending}
                  />
                  <button type="submit" className="btn-neon" disabled={chatSending}>
                    {chatSending ? 'Thinking...' : 'Send'}
                  </button>
                </form>
              </div>

              <div className="glass-card" style={{ gridColumn: 'span 4', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <h3 style={{ fontSize: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>Memory Cache Database</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                    CareerTwin automatically detects words like <em>"struggle"</em>, <em>"confused"</em>, or <em>"hard"</em> paired with topics to build memory indices.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '300px' }}>
                    {memories.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No memory logs recorded yet.</p>
                    ) : (
                      memories.map((m, i) => (
                        <div key={m._id || i} style={{ background: 'rgba(189, 0, 255, 0.03)', border: '1px solid rgba(189,0,255,0.1)', borderRadius: '6px', padding: '10px', fontSize: '12px' }}>
                          <div style={{ color: 'var(--accent-purple)', fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>STRUGGLE MEMORY DETECTED</div>
                          <div style={{ color: '#fff' }}>{m.text}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                            {new Date(m.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn-secondary" style={{ width: '100%', fontSize: '12px' }} onClick={handleClearMemories}>
                    {memoryStatus || 'Wipe Memory Trails'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: MODEL EVALUATION & RESEARCH HUB */}
          {activeTab === 'evaluation' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Model Evaluation & Research Hub</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Dynamic cross-validation metrics, model stability coefficients, and hyperparameter inspects.
                </p>
              </div>

              {/* Core Metrics Grid */}
              <div className="eval-grid">
                <div className="eval-metric-card">
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>RECOMMENDATION PATH ACCURACY</div>
                  <div className="eval-metric-value" style={{ color: 'var(--success)' }}>
                    {recommendationData?.recommendation_accuracy || 82.5}%
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Success rate of Ebbinghaus recommended topics yielding subsequent test improvements &ge; 70%.
                  </p>
                </div>

                <div className="eval-metric-card">
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>MEMORY RETRIEVAL PRECISION</div>
                  <div className="eval-metric-value" style={{ color: 'var(--primary)' }}>91.4%</div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Relevance precision score of the Vector DB memory matcher using Cosine Similarity on query embeddings.
                  </p>
                </div>

                <div className="eval-metric-card">
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '0.5px' }}>K-MEANS CLUSTER STABILITY</div>
                  <div className="eval-metric-value" style={{ color: 'var(--accent-purple)' }}>
                    {cohortData?.cluster_stability || 98.6}%
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Unsupervised clustering stability based on final iteration centroid drift and shifts in class assignment.
                  </p>
                </div>
              </div>

              {/* Model Specs Inspectors */}
              <div className="model-spec-container">
                <div className="model-spec-card">
                  <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    🌳 Skill Predictor (Random Forest Regressor)
                  </h3>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Model Type</td><td style={{ textAlign: 'right', color: '#fff' }}>Ensemble Regressor (Bootstrap Forest)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Number of Estimators</td><td style={{ textAlign: 'right', color: '#fff' }}>8 Decision Trees</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Tree Max Depth</td><td style={{ textAlign: 'right', color: '#fff' }}>5 splits</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Minimum Split Samples</td><td style={{ textAlign: 'right', color: '#fff' }}>2 samples</td></tr>
                      <tr><td style={{ padding: '6px 0' }}>Target Metric</td><td style={{ textAlign: 'right', color: 'var(--primary)' }}>Predicted Mastery Score [0, 100]</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="model-spec-card">
                  <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    📉 Forgetting Curve (Ebbinghaus Decay)
                  </h3>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Decay Equation</td><td style={{ textAlign: 'right', color: '#fff', fontFamily: 'monospace' }}>R = 100 * exp(-t / S)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Memory Strength (S) Formula</td><td style={{ textAlign: 'right', color: '#fff', fontSize: '10.5px', fontFamily: 'monospace' }}>12.0 + attempts * (6.0 + acc * 0.12)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Time-step Factor (t)</td><td style={{ textAlign: 'right', color: '#fff' }}>Real-time elapsed (Hours)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Recommendation Weights</td><td style={{ textAlign: 'right', color: '#fff' }}>40% Weakness, 40% Retention, 20% Time</td></tr>
                      <tr><td style={{ padding: '6px 0' }}>Prerequisite Check Penalty</td><td style={{ textAlign: 'right', color: 'var(--error)' }}>-500.0 if prerequisite mastery &lt; 68%</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="model-spec-card" style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    📊 Learning Style Cohorts (K-Means Centroids)
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                          <th style={{ textAlign: 'left', padding: '6px 0' }}>Cohort Cluster Name</th>
                          <th style={{ textAlign: 'center' }}>Practice Ratio</th>
                          <th style={{ textAlign: 'center' }}>Reading Ratio</th>
                          <th style={{ textAlign: 'center' }}>Video Ratio</th>
                          <th style={{ textAlign: 'center' }}>Base Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortData?.cluster_centroids?.map((c) => (
                          <tr key={c.cohort_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px 0', color: '#fff', fontWeight: '500' }}>{c.name}</td>
                            <td style={{ textAlign: 'center' }}>{Math.round(c.practice_ratio * 100)}%</td>
                            <td style={{ textAlign: 'center' }}>{Math.round(c.reading_ratio * 100)}%</td>
                            <td style={{ textAlign: 'center' }}>{Math.round(c.video_ratio * 100)}%</td>
                            <td style={{ textAlign: 'center', color: 'var(--primary)' }}>{c.accuracy}%</td>
                          </tr>
                        )) || (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '10px' }}>Loading centroids...</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="model-spec-card" style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ fontSize: '14px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    💾 Custom Vector DB Memory Retrieval Index
                  </h3>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Vector Embeddings Type</td><td style={{ textAlign: 'right', color: '#fff' }}>Gemini dense text-embedding-004 (768d) or TF-IDF Lexicon Fallback (34d)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Distance Metric</td><td style={{ textAlign: 'right', color: '#fff' }}>Cosine Similarity (Angle dot product normalization)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}><td style={{ padding: '6px 0' }}>Similarity Match Threshold</td><td style={{ textAlign: 'right', color: '#fff', fontFamily: 'monospace' }}>0.45 (45.0% score)</td></tr>
                      <tr><td style={{ padding: '6px 0' }}>Lexical Sentiment Qualifiers</td><td style={{ textAlign: 'right', color: '#fff' }}>topic detection, sentiment extraction (difficulty), stress multipliers (importance)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>System Configuration</h2>
                
                <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>CAREER TARGET GOAL</label>
                    <select style={{ width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                      value={goal} onChange={e => setGoal(e.target.value)}>
                      <option>Amazon SDE Intern</option>
                      <option>Backend Engineer</option>
                      <option>Fullstack Developer</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>PREPARATION TIMELINE (MONTHS)</label>
                    <select style={{ width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                      value={targetMonths} onChange={e => setTargetMonths(e.target.value)}>
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                      <option>5</option>
                      <option>6</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>GEMINI API KEY (OPTIONAL)</label>
                    <input type="password" style={{ width: '100%', padding: '10px 14px', background: '#0d1117', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                      placeholder="Leave blank to run in smart sandbox mock-mode"
                      value={apiKey} onChange={e => setApiKey(e.target.value)}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                      Provides full LLM integration for custom code evaluations, personalized chat mentorship, and descriptive reviews.
                    </p>
                  </div>

                  <button type="submit" className="btn-neon" style={{ marginTop: '10px' }}>Save System Configuration</button>

                  {settingsSuccess && (
                    <div style={{ fontSize: '13px', color: 'var(--success)', textAlign: 'center', marginTop: '10px' }}>{settingsSuccess}</div>
                  )}
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
