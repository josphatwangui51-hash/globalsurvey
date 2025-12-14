import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  Wallet, 
  PlayCircle, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  TrendingUp, 
  Award, 
  ChevronRight, 
  Activity, 
  Target, 
  Loader2, 
  MapPin, 
  ExternalLink, 
  History, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  Check, 
  Zap, 
  Lock, 
  Clock, 
  Sparkles, 
  CalendarClock, 
  Globe2, 
  CreditCard, 
  Unlock, 
  Timer, 
  PauseCircle, 
  Play, 
  Share2, 
  Copy, 
  MessageCircle, 
  Smartphone 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ProfileForm from './ProfileForm';
import SettingsView from './SettingsView';
import HelpView from './HelpView';
import { UserData, UserStats, EarningEntry } from '../App';

interface DashboardProps {
  onLogout: () => void;
  currentUser: UserData;
  onUpdateUser: (data: Partial<UserData>) => void;
}

type ViewState = 'home' | 'profile' | 'settings' | 'help' | 'history' | 'survey' | 'survey-list' | 'upgrade-limit' | 'invite';

interface MapLocation {
  title: string;
  uri: string;
}

interface SurveyQuestion {
  id: number;
  text: string;
  options: string[];
}

interface SurveyOption {
  id: string;
  title: string;
  category: string;
  timeMinutes: number;
  reward: number;
  description: string;
}

interface GlobalStats {
  date: string;
  count: number;
}

export default function Dashboard({ onLogout, currentUser, onUpdateUser }: DashboardProps) {
  const [view, setView] = useState<ViewState>('home');
  const MIN_WITHDRAWAL = 5000;
  
  const GLOBAL_DAILY_CAP = 100000;
  
  // Global Survey Counter State (Simulated Server State)
  const [globalStats, setGlobalStats] = useState<GlobalStats>(() => {
    const today = new Date().toDateString();
    try {
      const saved = localStorage.getItem('global_survey_market_daily');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset if date changed
        if (parsed.date !== today) {
          return { date: today, count: 0 };
        }
        return parsed;
      }
    } catch (e) {}
    return { date: today, count: 0 };
  });

  // Initialize state from persisted user data or defaults
  const [stats, setStats] = useState<UserStats>(() => {
    const today = new Date().toDateString();
    const current = currentUser.stats || {
      earnings: 0,
      performance: 65,
      eligibility: 40,
      surveysCompleted: 0,
      dailyCount: 0,
      lastSurveyDate: today,
      dailyEarnings: 0,
      dailyLimit: 250
    };

    // Reset daily count if date changed or if undefined
    if (current.lastSurveyDate !== today) {
      return {
        ...current,
        dailyCount: 0,
        dailyEarnings: 0,
        lastSurveyDate: today,
        dailyLimit: current.dailyLimit || 250 // Preserve limit setting
      };
    }
    
    // Ensure dailyCount/earnings/limit exists for old records
    return {
       ...current,
       dailyCount: current.dailyCount ?? 0,
       dailyEarnings: current.dailyEarnings ?? 0,
       lastSurveyDate: today,
       dailyLimit: current.dailyLimit || 250
    };
  });
  
  // Dynamic Daily Cap
  const currentDailyCap = stats.dailyLimit || 250;

  // Calculate dynamic limit based on activity
  // "Active client" is defined as performance > 75
  const isHighPerformer = stats.performance >= 75;
  const DAILY_LIMIT = isHighPerformer ? 7 : 3;

  const [earningsHistory, setEarningsHistory] = useState<EarningEntry[]>(() => 
    currentUser.earningsHistory || []
  );

  const [isSurveying, setIsSurveying] = useState(false);
  const [lastEarned, setLastEarned] = useState<number | null>(null);
  
  // Survey Content State
  const [activeQuestions, setActiveQuestions] = useState<SurveyQuestion[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyOption | null>(null);

  // Maps Grounding State
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyHotspots, setNearbyHotspots] = useState<{text: string, locations: MapLocation[]} | null>(null);

  // Onboarding Tour State
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    // Persist global stats whenever they change
    localStorage.setItem('global_survey_market_daily', JSON.stringify(globalStats));
  }, [globalStats]);

  useEffect(() => {
    // Check for onboarding status
    const hasSeenTour = localStorage.getItem('global_survey_onboarding_completed');
    if (!hasSeenTour) {
       // Small delay to ensure rendering is stable before starting tour
       const timer = setTimeout(() => setTourStep(1), 1500);
       return () => clearTimeout(timer);
    }
  }, []);

  const handleTourNext = () => {
    if (tourStep >= 3) {
        localStorage.setItem('global_survey_onboarding_completed', 'true');
        setTourStep(0);
    } else {
        setTourStep(prev => prev + 1);
    }
  };

  const handleTourSkip = () => {
    localStorage.setItem('global_survey_onboarding_completed', 'true');
    setTourStep(0);
  };

  const availableSurveys: SurveyOption[] = [
    {
      id: 'tech-trends',
      title: 'Digital Trends 2025',
      category: 'Technology',
      timeMinutes: 5,
      reward: 75,
      description: 'Share your thoughts on AI, smart devices, and the future of tech.'
    },
    {
      id: 'consumer-habits',
      title: 'Global Shopping Preferences',
      category: 'Retail',
      timeMinutes: 8,
      reward: 120,
      description: 'How do you shop? Compare online vs in-store experiences.'
    },
    {
      id: 'lifestyle-wellness',
      title: 'Modern Lifestyle & Wellness',
      category: 'Health',
      timeMinutes: 4,
      reward: 55,
      description: 'Quick questions about diet, exercise, and daily routines.'
    },
    {
      id: 'finance-banking',
      title: 'Mobile Banking Usage',
      category: 'Finance',
      timeMinutes: 6,
      reward: 90,
      description: 'Your experience with digital payments and mobile money.'
    }
  ];

  const handleSurveySelect = async (survey: SurveyOption) => {
    if (isSurveying) return;
    
    // 1. Check Global Limit (First come first serve)
    if (globalStats.count >= GLOBAL_DAILY_CAP) {
       alert("Global daily survey limit of 100,000 has been reached. Please try again tomorrow.");
       return;
    }

    // 2. Check Daily Earnings Cap
    if ((stats.dailyEarnings || 0) >= currentDailyCap) {
       if (confirm(`You have reached your daily earnings limit of KES ${currentDailyCap}. Would you like to upgrade your limit?`)) {
           setView('upgrade-limit');
       }
       return;
    }

    // 3. Check User Survey Count Limit
    if ((stats.dailyCount || 0) >= DAILY_LIMIT) {
        if (!isHighPerformer) {
           alert("You have reached your daily limit of 3 surveys. Increase your performance to unlock up to 7 surveys!");
        } else {
           alert(`You have reached your extended limit of ${DAILY_LIMIT} surveys.`);
        }
        return;
    }
    
    setSelectedSurvey(survey);
    setIsSurveying(true);
    setLastEarned(null);
    
    // Optimistic global increment
    setGlobalStats(prev => ({ ...prev, count: prev.count + 1 }));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Generate questions based on the selected survey topic
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a JSON array of 5 to 10 interesting multiple-choice survey questions about "${survey.title}" - ${survey.description}. 
        Each object in the array must have:
        - "id" (number)
        - "text" (the question string)
        - "options" (an array of 4 distinct string options)
        Return ONLY the raw JSON array, no markdown formatting.`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "[]";
      // Ensure we get clean JSON
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(jsonStr);

      if (Array.isArray(questions) && questions.length > 0) {
        setActiveQuestions(questions);
        setView('survey');
      } else {
        throw new Error("Invalid survey format received");
      }
    } catch (e) {
      console.error("Survey generation failed", e);
      // Fallback questions if AI fails
      setActiveQuestions([
        { id: 1, text: "How often do you use this service?", options: ["Daily", "Weekly", "Monthly", "Rarely"] },
        { id: 2, text: "How satisfied are you with current options?", options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"] },
        { id: 3, text: "What factor matters most to you?", options: ["Price", "Quality", "Convenience", "Brand"] },
        { id: 4, text: "Would you recommend this to a friend?", options: ["Definitely", "Probably", "Unlikely", "Never"] },
        { id: 5, text: "How much do you spend on this monthly?", options: ["< KES 1000", "KES 1000-5000", "KES 5000+", "Prefer not to say"] }
      ]);
      setView('survey');
    } finally {
      setIsSurveying(false);
    }
  };

  const handleProcessRewards = (): number => {
    const today = new Date().toDateString();

    // Base reward on the selected survey, or default to 50
    const baseReward = selectedSurvey ? selectedSurvey.reward : 50;
    
    // Add small variance (-5 to +10)
    const variance = Math.floor(Math.random() * 16) - 5;
    let earnedAmount = Math.max(10, baseReward + variance);

    // Enforce daily earnings cap hard limit if close to it
    const currentDaily = stats.dailyEarnings || 0;
    const effectiveLimit = stats.dailyLimit || 250;
    
    if (currentDaily + earnedAmount > effectiveLimit) {
       earnedAmount = Math.max(0, effectiveLimit - currentDaily);
    }

    const perfBoost = Math.floor(Math.random() * 8) + 2; 
    const eligBoost = Math.floor(Math.random() * 12) + 5; 

    const newStats: UserStats = {
      earnings: stats.earnings + earnedAmount,
      performance: Math.min(100, stats.performance + perfBoost),
      eligibility: Math.min(100, stats.eligibility + eligBoost),
      surveysCompleted: stats.surveysCompleted + 1,
      dailyCount: (stats.dailyCount || 0) + 1,
      dailyEarnings: currentDaily + earnedAmount,
      lastSurveyDate: today,
      dailyLimit: effectiveLimit
    };

    const newEntry: EarningEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-KE', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
      }),
      amount: earnedAmount,
      title: selectedSurvey ? selectedSurvey.title : `Premium Survey #${newStats.surveysCompleted}`
    };
    
    const newHistory = [newEntry, ...earningsHistory];

    setStats(newStats);
    setEarningsHistory(newHistory);
    setLastEarned(earnedAmount);
    
    // Persist
    onUpdateUser({
      stats: newStats,
      earningsHistory: newHistory
    });

    return earnedAmount;
  };

  const handleUpgradeLimit = (newLimit: number) => {
      const newStats = { ...stats, dailyLimit: newLimit };
      setStats(newStats);
      onUpdateUser({ stats: newStats });
      setView('home');
      alert(`Successfully upgraded! Your new daily earning limit is KES ${newLimit}.`);
  };

  const handleFindNearbyHotspots = async () => {
    setIsLocating(true);
    setNearbyHotspots(null);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Find 3 nearby internet cafes, libraries, or co-working spaces suitable for doing online survey work. Briefly list them.",
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                }
              }
            }
          },
        });

        // Extract Maps URLs from grounding chunks
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const locations: MapLocation[] = [];
        
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
             locations.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });

        setNearbyHotspots({
          text: response.text || "Here are some locations found nearby.",
          locations: locations
        });

      } catch (error) {
        console.error("Error fetching map data:", error);
        alert("Could not find nearby locations at this time.");
      } finally {
        setIsLocating(false);
      }
    }, (error) => {
       console.error("Geo error:", error);
       alert("Please enable location services to use this feature.");
       setIsLocating(false);
    });
  };

  if (view === 'profile') {
    return (
      <ProfileForm 
        onBack={() => setView('home')} 
        onHelp={() => setView('help')}
        initialData={currentUser} 
        onUpdateUser={onUpdateUser}
      />
    );
  }

  if (view === 'settings') {
    return (
      <SettingsView 
        onBack={() => setView('home')} 
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
      />
    );
  }

  if (view === 'help') {
    return <HelpView onBack={() => setView('home')} />;
  }

  if (view === 'history') {
    return <HistoryView onBack={() => setView('home')} history={earningsHistory} />;
  }

  if (view === 'survey-list') {
    return (
      <SurveySelectionView 
        onBack={() => setView('home')} 
        surveys={availableSurveys}
        onSelect={handleSurveySelect}
        isLoading={isSurveying}
      />
    );
  }

  if (view === 'upgrade-limit') {
    return (
        <LimitUpgradeView 
            onBack={() => setView('home')}
            currentLimit={stats.dailyLimit || 250}
            onUpgrade={handleUpgradeLimit}
        />
    )
  }

  if (view === 'invite') {
    return (
      <InviteView 
        onBack={() => setView('home')}
        username={currentUser.username}
      />
    )
  }

  if (view === 'survey') {
    return (
      <ActiveSurveyView 
        questions={activeQuestions} 
        onComplete={() => setView('home')} 
        onCancel={() => setView('home')} 
        onReward={handleProcessRewards}
        title={selectedSurvey?.title}
      />
    );
  }

  const menuItems = [
    { 
      id: 'profile',
      title: 'My Profile', 
      icon: <User size={24} />, 
      desc: 'Manage account details',
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      id: 'history',
      title: 'Survey History', 
      icon: <History size={24} />, 
      desc: 'View full activity log',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      id: 'invite',
      title: 'Invite a Friend',
      icon: <Share2 size={24} />,
      desc: 'Share & earn rewards',
      color: 'bg-pink-100 text-pink-600'
    },
    { 
      id: 'settings',
      title: 'Settings', 
      icon: <Settings size={24} />, 
      desc: 'App preferences',
      color: 'bg-slate-100 text-slate-600'
    },
    { 
      id: 'help',
      title: 'Help & Feedback', 
      icon: <HelpCircle size={24} />, 
      desc: 'FAQs and support',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  // Only show first 3 items in the dashboard widget
  const recentHistory = earningsHistory.slice(0, 3);
  
  // Calculate remaining stats
  const remainingSurveys = Math.max(0, DAILY_LIMIT - (stats.dailyCount || 0));
  const remainingGlobal = Math.max(0, GLOBAL_DAILY_CAP - globalStats.count);
  const remainingEarnings = Math.max(0, currentDailyCap - (stats.dailyEarnings || 0));

  // Determine block state
  const isGlobalLimitReached = remainingGlobal === 0;
  const isUserLimitReached = remainingSurveys === 0;
  const isEarningsLimitReached = remainingEarnings < 10; // Less than min survey reward
  
  const isBlocked = isGlobalLimitReached || isUserLimitReached || isEarningsLimitReached;

  let blockReason = "";
  if (isGlobalLimitReached) blockReason = "Global 100k Limit Reached";
  else if (isUserLimitReached) blockReason = "Daily Survey Limit Reached";
  else if (isEarningsLimitReached) blockReason = "Daily Earnings Cap Reached";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Dashboard Header */}
      <header className="bg-slate-900 text-white pt-10 pb-24 px-6 relative overflow-hidden rounded-b-[2.5rem] shadow-lg">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
        <div className="relative z-10 flex justify-between items-center max-w-lg mx-auto">
          <div className="flex items-center gap-4">
             {currentUser.profile?.avatar ? (
                <div className="w-12 h-12 rounded-full border-2 border-white/20 shadow-lg overflow-hidden flex-shrink-0">
                    <img src={currentUser.profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
             ) : (
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/10 flex-shrink-0">
                    <User size={24} className="text-emerald-300" />
                </div>
             )}
             <div>
               <p className="text-slate-400 text-xs font-medium mb-0.5 uppercase tracking-wide">Welcome back,</p>
               <h1 className="text-xl font-bold text-white leading-tight">{currentUser.username}</h1>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
            aria-label="Logout"
          >
            <LogOut size={20} className="text-slate-200" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 -mt-16 space-y-6">
        
        {/* Global Stats Ticker */}
        <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300 border border-slate-700 shadow-md">
             <div className="flex items-center gap-2">
                 <Globe2 size={14} className="text-emerald-400" />
                 <span>Global Daily Surveys</span>
             </div>
             <div className="font-mono text-emerald-400 font-bold">
                 {remainingGlobal.toLocaleString()} <span className="text-slate-500">/ {GLOBAL_DAILY_CAP.toLocaleString()} left</span>
             </div>
        </div>

        {/* Earnings Card */}
        <div id="tour-earnings" className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-slate-500 text-sm font-medium uppercase tracking-wider">
                <Wallet size={16} className="text-emerald-500" />
                <span>Total Earnings</span>
              </div>
              {lastEarned && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse">
                  + KES {lastEarned}
                </span>
              )}
            </div>
           
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-slate-400 font-semibold">KES</span>
              <span className="text-4xl font-bold text-slate-800 tabular-nums">
                {stats.earnings.toFixed(2)}
              </span>
            </div>

            {/* Withdrawal Progress */}
            <div className="mt-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="flex justify-between text-xs mb-2 font-medium">
                  <div className="flex items-center gap-1.5">
                     <span className={stats.earnings >= MIN_WITHDRAWAL ? "text-emerald-600 font-bold" : "text-slate-500"}>
                        {stats.earnings >= MIN_WITHDRAWAL ? "Funds Unlocked" : `${((stats.earnings/MIN_WITHDRAWAL)*100).toFixed(0)}% to payout`}
                     </span>
                  </div>
                  <span className="text-slate-400 flex items-center gap-1">
                      Cap: KES {currentDailyCap}
                      <button onClick={() => setView('upgrade-limit')} className="text-emerald-600 hover:bg-emerald-50 rounded-full p-0.5"><Unlock size={12} /></button>
                  </span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${stats.earnings >= MIN_WITHDRAWAL ? "bg-emerald-500" : "bg-blue-400"}`}
                    style={{ width: `${Math.min(100, (stats.earnings / MIN_WITHDRAWAL) * 100)}%` }}
                  ></div>
               </div>
               <div className="flex gap-2">
                   <button 
                      disabled={stats.earnings < MIN_WITHDRAWAL}
                      onClick={() => alert(`Withdrawal request for KES ${stats.earnings.toFixed(2)} received! Processing to M-Pesa.`)}
                      className={`flex-grow py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        stats.earnings >= MIN_WITHDRAWAL 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 cursor-pointer' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                   >
                      {stats.earnings >= MIN_WITHDRAWAL ? <Wallet size={16} /> : <Lock size={16} />}
                      {stats.earnings >= MIN_WITHDRAWAL ? "Withdraw Funds" : `Locked (Min KES ${MIN_WITHDRAWAL.toLocaleString()})`}
                   </button>
                   {currentDailyCap < 1000 && (
                        <button 
                            onClick={() => setView('upgrade-limit')}
                            className="px-3 py-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 font-bold text-xs hover:bg-amber-100 transition-colors"
                        >
                            Upgrade
                        </button>
                   )}
               </div>
            </div>
            
            <div className="flex gap-3 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-xs font-medium text-emerald-700">
                <TrendingUp size={14} />
                <span>+{stats.surveysCompleted > 0 ? '12' : '0'}% this week</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${isHighPerformer ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-600'}`}>
                <Award size={14} />
                <span>{isHighPerformer ? 'Pro Active' : 'Basic Tier'}</span>
              </div>
            </div>

            {/* Performance & Eligibility Bars */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {/* Active Performance */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Activity size={14} className="text-emerald-500" />
                    <span>Active Performance</span>
                  </div>
                  <span className={`text-xs font-bold ${isHighPerformer ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {stats.performance}% {isHighPerformer && '(Boosted)'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${isHighPerformer ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                    style={{ width: `${stats.performance}%` }}
                  ></div>
                </div>
                {!isHighPerformer && (
                    <p className="text-[10px] text-slate-400 mt-1">Reach 75% to unlock 7 surveys/day!</p>
                )}
              </div>

              {/* Survey Eligibility */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Target size={14} className="text-blue-500" />
                    <span>Survey Eligibility</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600">{stats.eligibility}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${stats.eligibility}%` }}
                  ></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Start Survey Action - Navigates to Selection View */}
        <button 
          id="tour-start-survey"
          onClick={() => {
             // If specifically blocked by earnings, redirect to upgrade
             if (isEarningsLimitReached && currentDailyCap < 1000) {
                 setView('upgrade-limit');
                 return;
             }
             if (isBlocked) return;
             setView('survey-list');
          }}
          disabled={isBlocked && !(isEarningsLimitReached && currentDailyCap < 1000)}
          className={`w-full text-left rounded-2xl p-6 shadow-lg text-white relative overflow-hidden group transition-transform transform ${
             isBlocked && !(isEarningsLimitReached && currentDailyCap < 1000)
             ? 'bg-slate-400 cursor-not-allowed' 
             : 'bg-gradient-to-br from-emerald-600 to-green-600 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
          }`}
        >
          {isBlocked ? (
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 bg-white/10 rounded-full p-8">
                {isEarningsLimitReached ? (
                    <Unlock size={64} className="text-white/30" />
                ) : (
                    <CalendarClock size={64} className="text-white/30" />
                )}
            </div>
          ) : (
             <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 bg-white/10 rounded-full p-8 group-hover:scale-110 transition-transform duration-500">
                 <PlayCircle size={64} className="text-white/30" />
             </div>
          )}
          
          <h2 className="text-xl font-bold mb-1 relative z-10">
            {isBlocked 
                ? (isEarningsLimitReached && currentDailyCap < 1000 ? "Increase Daily Limit" : blockReason) 
                : "Start New Survey"}
          </h2>
          <p className="text-emerald-100 text-sm mb-4 relative z-10 max-w-[70%]">
            {isBlocked 
                ? (isEarningsLimitReached 
                    ? `You've hit the daily earnings cap of KES ${currentDailyCap}.` 
                    : `You've used your ${DAILY_LIMIT} daily survey slots.`)
                : `${availableSurveys.length} premium surveys are available for your profile.`}
          </p>
          
          <div className={`relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-colors ${
              isBlocked && !(isEarningsLimitReached && currentDailyCap < 1000) ? 'bg-slate-500 text-slate-200' : 'bg-white text-emerald-700 hover:bg-emerald-50'
          }`}>
               {isBlocked ? (
                   isEarningsLimitReached && currentDailyCap < 1000 ? (
                       <>
                         Upgrade Now
                         <ArrowRight size={16} />
                       </>
                   ) : (
                       <>
                        <Lock size={16} />
                        Locked until tomorrow
                       </>
                   )
               ) : (
                   <>
                    Select Survey
                    <ChevronRight size={16} />
                   </>
               )}
          </div>
          
          {!isBlocked && (
              <div className="absolute top-4 right-4 bg-emerald-800/40 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 flex flex-col items-end">
                  <span>{remainingSurveys} left today</span>
                  <span className="text-[10px] text-emerald-200">KES {remainingEarnings.toFixed(0)} cap left</span>
              </div>
          )}
        </button>
        
        {/* Earnings History Widget */}
        {earningsHistory.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Recent Activity</h3>
                    <p className="text-xs text-slate-500">Latest surveys</p>
                  </div>
                </div>
                {earningsHistory.length > 3 && (
                  <button 
                    onClick={() => setView('history')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    View All
                  </button>
                )}
             </div>
             
             <div className="space-y-3">
               {recentHistory.map((item) => (
                 <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm text-emerald-500">
                       <CheckCircle2 size={16} />
                     </div>
                     <div>
                       <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                       <p className="text-xs text-slate-400">{item.date}</p>
                     </div>
                   </div>
                   <span className="font-bold text-emerald-600 text-sm bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                     + KES {item.amount}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Location Grounding Feature */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Survey Hotspots</h3>
                  <p className="text-xs text-slate-500">Find internet cafes nearby</p>
                </div>
             </div>
             <button 
               onClick={handleFindNearbyHotspots}
               disabled={isLocating}
               className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-semibold hover:bg-orange-100 transition-colors"
             >
               {isLocating ? 'Locating...' : 'Find Nearby'}
             </button>
          </div>
          
          {nearbyHotspots && (
            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <p className="text-sm text-slate-600 mb-3 leading-relaxed">{nearbyHotspots.text}</p>
               {nearbyHotspots.locations.length > 0 && (
                 <div className="space-y-2">
                   {nearbyHotspots.locations.map((loc, idx) => (
                     <a 
                       key={idx}
                       href={loc.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all"
                     >
                       <span className="font-medium text-slate-700 truncate mr-2">{loc.title}</span>
                       <ExternalLink size={12} className="text-emerald-500 flex-shrink-0" />
                     </a>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div id="tour-menu" className="grid gap-4">
          <h3 className="text-slate-800 font-bold text-lg px-1">Menu</h3>
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'profile') setView('profile');
                if (item.id === 'settings') setView('settings');
                if (item.id === 'help') setView('help');
                if (item.id === 'history') setView('history');
                if (item.id === 'invite') setView('invite');
              }}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left group"
            >
              <div className={`p-3 rounded-full ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-slate-800">{item.title}</h4>
                <p className="text-slate-400 text-xs">{item.desc}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Tour Overlay */}
      {tourStep > 0 && (
         <OnboardingTour
             step={tourStep}
             onNext={handleTourNext}
             onSkip={handleTourSkip}
         />
      )}
    </div>
  );
}

function OnboardingTour({ step, onNext, onSkip }: { step: number, onNext: () => void, onSkip: () => void }) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = [
    {
      id: 'tour-earnings',
      title: 'Track Your Cash',
      description: 'See your total balance here. Once you hit KES 5,000, you can withdraw instantly to M-Pesa.',
      position: 'bottom'
    },
    {
      id: 'tour-start-survey',
      title: 'Start Earning',
      description: 'Tap this button to see available surveys. New opportunities are added daily based on your profile.',
      position: 'top'
    },
    {
      id: 'tour-menu',
      title: 'Your Toolkit',
      description: 'Access your profile, settings, history, and referral links from this menu.',
      position: 'top'
    }
  ];

  const currentStep = steps[step - 1];

  useLayoutEffect(() => {
    const updatePosition = () => {
      const element = document.getElementById(currentStep.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Give a little time for scroll to finish
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
        }, 500); 
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step, currentStep.id]);

  if (!targetRect) return null;

  const isTop = currentStep.position === 'top';
  const tooltipStyle: React.CSSProperties = isTop 
    ? { bottom: window.innerHeight - targetRect.top + 20, left: targetRect.left + (targetRect.width / 2) - 150 } 
    : { top: targetRect.bottom + 20, left: targetRect.left + (targetRect.width / 2) - 150 };

  // Mobile adjustment: clamp left
  if (typeof window !== 'undefined') {
      const leftVal = parseFloat((tooltipStyle.left || 0).toString());
      if (leftVal < 10) tooltipStyle.left = 10;
      if (leftVal > window.innerWidth - 310) tooltipStyle.left = window.innerWidth - 310;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
       {/* Spotlight Border */}
       <div 
         className="absolute transition-all duration-500 ease-in-out border-emerald-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] rounded-xl pointer-events-none"
         style={{
           top: targetRect.top - 5,
           left: targetRect.left - 5,
           width: targetRect.width + 10,
           height: targetRect.height + 10,
           borderWidth: '2px',
           zIndex: 50
         }}
       />

       {/* Tooltip Card */}
       <div 
         className="absolute w-[300px] max-w-[90vw] bg-white p-5 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in duration-300 flex flex-col gap-3"
         style={tooltipStyle}
       >
         <div className="flex justify-between items-start">
             <h3 className="font-bold text-slate-800 text-lg">{currentStep.title}</h3>
             <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                 {step} / {steps.length}
             </span>
         </div>
         <p className="text-slate-600 text-sm leading-relaxed">
             {currentStep.description}
         </p>
         <div className="flex gap-3 mt-2">
             <button 
                onClick={onSkip}
                className="flex-1 py-2 text-slate-500 font-medium text-sm hover:bg-slate-50 rounded-lg"
             >
                Skip
             </button>
             <button 
                onClick={onNext}
                className="flex-1 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-100"
             >
                {step === steps.length ? 'Finish' : 'Next'}
             </button>
         </div>
         
         {/* Arrow pointing to element */}
         <div 
            className={`absolute w-4 h-4 bg-white transform rotate-45 ${isTop ? '-bottom-2' : '-top-2'} left-1/2 -ml-2`}
         ></div>
       </div>
    </div>
  );
}

interface LimitUpgradeViewProps {
  onBack: () => void;
  currentLimit: number;
  onUpgrade: (limit: number) => void;
}

function LimitUpgradeView({ onBack, currentLimit, onUpgrade }: LimitUpgradeViewProps) {
    const [selectedTier, setSelectedTier] = useState<number | null>(null);
    const [mpesaCode, setMpesaCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter available options based on current limit
    const options = [
        { limit: 800, cost: 100, label: 'Plus Tier' },
        { limit: 1000, cost: 200, label: 'Pro Tier' },
    ].filter(opt => opt.limit > currentLimit);

    const handleUpgradeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTier) return;
        
        setIsProcessing(true);
        // Simulate payment check
        setTimeout(() => {
            setIsProcessing(false);
            onUpgrade(selectedTier);
        }, 2000);
    };

    const selectedOption = options.find(o => o.limit === selectedTier);

    // Validate M-Pesa Code (Strict 10 Alphanumeric chars)
    const isValidMpesa = /^[A-Za-z0-9]{10}$/.test(mpesaCode);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
             <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Increase Daily Limit</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                {options.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Max Level Reached!</h2>
                        <p className="text-slate-500">You are already at the highest daily earnings tier.</p>
                        <button onClick={onBack} className="mt-6 text-emerald-600 font-bold">Go Back</button>
                    </div>
                ) : (
                    <>
                        <p className="text-slate-600 mb-6 text-sm">
                            Your current daily earnings limit is <strong className="text-slate-900">KES {currentLimit}</strong>. 
                            Upgrade to unlock higher earning potential.
                        </p>

                        <div className="space-y-4 mb-8">
                            {options.map((opt) => (
                                <button
                                    key={opt.limit}
                                    onClick={() => setSelectedTier(opt.limit)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group ${
                                        selectedTier === opt.limit 
                                        ? 'border-emerald-500 bg-emerald-50' 
                                        : 'border-slate-200 bg-white hover:border-emerald-200'
                                    }`}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <div>
                                            <h3 className={`font-bold ${selectedTier === opt.limit ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                {opt.label} (KES {opt.limit} Limit)
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                One-time fee of <strong>KES {opt.cost}</strong>
                                            </p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedTier === opt.limit ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                                            {selectedTier === opt.limit && <Check size={14} />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedOption && (
                            <form onSubmit={handleUpgradeSubmit} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <CreditCard size={18} className="text-emerald-600" />
                                    Payment Details
                                </h3>
                                
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 text-sm">
                                    <p className="text-emerald-800 font-medium mb-1">Pay to M-Pesa Number:</p>
                                    <p className="text-2xl font-bold text-slate-800 mb-2">0796 335 209</p>
                                    <p className="text-emerald-700">Amount: <strong>KES {selectedOption.cost}</strong></p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        M-Pesa Transaction Code
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={mpesaCode}
                                        onChange={(e) => setMpesaCode(e.target.value)}
                                        placeholder="e.g. QK89..."
                                        maxLength={10}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isProcessing || !isValidMpesa}
                                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Verify Payment & Upgrade'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

interface SurveySelectionViewProps {
  onBack: () => void;
  surveys: SurveyOption[];
  onSelect: (survey: SurveyOption) => void;
  isLoading: boolean;
}

function SurveySelectionView({ onBack, surveys, onSelect, isLoading }: SurveySelectionViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
       <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-20">
         <div className="max-w-lg mx-auto flex items-center gap-4">
           <button 
             onClick={onBack}
             disabled={isLoading}
             className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 disabled:opacity-50"
           >
             <ArrowLeft size={20} />
           </button>
           <h1 className="text-xl font-bold text-slate-800">Select a Survey</h1>
         </div>
       </header>
       
       {isLoading && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
            <Loader2 size={48} className="animate-spin mb-4 text-emerald-400" />
            <p className="font-bold text-lg">Preparing Survey...</p>
            <p className="text-slate-300 text-sm">Generating custom questions</p>
         </div>
       )}

       <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <p className="text-slate-500 text-sm mb-2">
            The following surveys match your profile. Complete them to earn rewards.
          </p>
          
          {surveys.map((survey) => (
             <div key={survey.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-green-600"></div>
                
                <div className="flex justify-between items-start mb-2">
                   <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {survey.category}
                   </div>
                   <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                      <Clock size={12} />
                      <span>{survey.timeMinutes} min</span>
                   </div>
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-1">{survey.title}</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{survey.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-50 p-1.5 rounded-full text-yellow-600">
                           <Sparkles size={14} className="fill-yellow-500" />
                        </div>
                        <span className="font-bold text-slate-800">KES {survey.reward}</span>
                        <span className="text-xs text-slate-400">potential</span>
                    </div>
                    
                    <button 
                       onClick={() => onSelect(survey)}
                       className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                       Start
                       <ChevronRight size={14} />
                    </button>
                </div>
             </div>
          ))}
       </main>
    </div>
  )
}

interface HistoryViewProps {
  onBack: () => void;
  history: EarningEntry[];
}

function HistoryView({ onBack, history }: HistoryViewProps) {
  // Calculate totals
  const totalEarned = history.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Survey History</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg mb-6">
             <p className="text-emerald-100 text-sm mb-1">Total Earned</p>
             <p className="text-3xl font-bold">KES {totalEarned.toFixed(2)}</p>
             <p className="text-emerald-100 text-xs mt-2">{history.length} surveys completed</p>
        </div>

        <div className="space-y-3">
             {history.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">
                     <History size={48} className="mx-auto mb-3 opacity-20" />
                     <p>No surveys completed yet.</p>
                 </div>
             ) : (
                 history.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.date}</span>
                            </div>
                        </div>
                        <span className="font-bold text-emerald-600">+ KES {item.amount}</span>
                    </div>
                 ))
             )}
        </div>
      </main>
    </div>
  );
}

interface ActiveSurveyViewProps {
  questions: SurveyQuestion[];
  onComplete: () => void;
  onCancel: () => void;
  onReward: () => number;
  title?: string;
}

function ActiveSurveyView({ questions, onComplete, onCancel, onReward, title }: ActiveSurveyViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(45);
  const [isPaused, setIsPaused] = useState(false);

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;
  const hasAnswered = !!answers[question.id];

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(45);
    setIsPaused(false);
  }, [currentIndex]);

  // Timer Countdown Logic
  useEffect(() => {
    if (isSubmitting || earnedAmount !== null || isPaused) return;

    if (timeLeft === 0) {
      setIsPaused(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isPaused, isSubmitting, earnedAmount]);

  const handleResume = () => {
    setTimeLeft(45);
    setIsPaused(false);
  };

  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
      const amount = onReward();
      setEarnedAmount(amount);
      setIsSubmitting(false);
    }, 1500);
  };

  if (earnedAmount !== null) {
      return (
        <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-500">
             <div className="bg-white/10 p-8 rounded-full mb-6 backdrop-blur-md border border-white/20 animate-bounce">
                <Zap size={64} className="text-yellow-300 fill-yellow-300" />
             </div>
             
             <h1 className="text-3xl font-bold mb-2">Survey Completed!</h1>
             <p className="text-emerald-100 mb-8">Great job, your earnings have been calculated.</p>
             
             <div className="bg-white text-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">You Earned</p>
                <div className="text-5xl font-bold text-emerald-600 mb-2">
                    KES {earnedAmount}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium">
                    <CheckCircle2 size={16} />
                    Added to Wallet
                </div>
             </div>

             <button 
                onClick={onComplete}
                className="w-full max-w-sm bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
             >
                Continue to Dashboard
                <ArrowRight size={18} />
             </button>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col relative">
       {/* Survey Header */}
       <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
         <div className="max-w-lg mx-auto flex flex-col gap-2">
           <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {title || 'Active Survey'}
              </span>
              <span className="text-sm font-semibold text-slate-800">
                Question {currentIndex + 1} of {total}
              </span>
            </div>
             
            <div className="flex items-center gap-3">
                 {/* Timer Widget */}
                 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                     timeLeft <= 10 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 
                     timeLeft <= 20 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                     'bg-slate-50 text-slate-600 border-slate-100'
                 }`}>
                     <Timer size={14} />
                     <span className="tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                 </div>

                 <button 
                   onClick={() => {
                     if(confirm("Are you sure you want to exit? Your progress will be lost.")) {
                       onCancel();
                     }
                   }}
                   className="text-slate-400 hover:text-red-500 transition-colors"
                 >
                   <X size={20} />
                 </button>
            </div>
           </div>
           {/* Progress Bar */}
           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
           </div>
         </div>
       </header>

       <main className="flex-grow max-w-lg mx-auto w-full px-4 py-8 flex flex-col relative">
          {/* Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-50 bg-slate-50/90 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-300 border border-slate-100">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 shadow-inner">
                        <PauseCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Survey Paused</h2>
                    <p className="text-slate-500 mb-6 text-sm">Time ran out for this question. Are you still there?</p>
                    <button 
                        onClick={handleResume}
                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <Play size={18} fill="currentColor" /> Resume Survey
                    </button>
                </div>
            </div>
          )}

          {isSubmitting ? (
             <div className="flex-grow flex flex-col items-center justify-center text-center animate-in fade-in">
                <div className="bg-emerald-50 p-6 rounded-full mb-6">
                   <Loader2 size={48} className="text-emerald-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Submitting Answers</h2>
                <p className="text-slate-500">Verifying your responses and calculating rewards...</p>
             </div>
          ) : (
            <>
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                  {question.text}
                </h2>

                <div className="space-y-3">
                  {question.options.map((option, idx) => {
                    const isSelected = answers[question.id] === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(option)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                            : 'border-slate-100 bg-white hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-medium">{option}</span>
                        {isSelected && (
                          <div className="bg-emerald-500 text-white p-1 rounded-full">
                             <Check size={14} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-8">
                 <button
                    onClick={handleNext}
                    disabled={!hasAnswered}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                    {currentIndex === total - 1 ? 'Finish Survey' : 'Next Question'}
                    {currentIndex < total - 1 && <ChevronRight size={18} />}
                 </button>
              </div>
            </>
          )}
       </main>
    </div>
  );
}

interface InviteViewProps {
  onBack: () => void;
  username: string;
}

function InviteView({ onBack, username }: InviteViewProps) {
    // Generate dynamic link based on current domain/origin
    // We prefer window.location.origin + pathname to avoid stacking query parameters
    const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}${window.location.pathname}` 
        : 'https://globalsurveys.co.ke';
        
    const link = `${baseUrl}?ref=${username}`;
    
    const message = `Join me on Global Online Survey Market! Register using my link to start earning: ${link}`;
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleSMS = () => {
        // iOS uses & body=, Android uses ?body=
        const ua = navigator.userAgent.toLowerCase();
        const separator = (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1) ? '&' : '?';
        const url = `sms:${separator}body=${encodeURIComponent(message)}`;
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Invite Friends</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                <div className="text-center mb-8">
                     <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                         <Share2 size={40} />
                     </div>
                     <h2 className="text-2xl font-bold text-slate-800 mb-2">Invite & Earn</h2>
                     <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        Share your unique link with friends. Earn KES 50 for every friend who joins and completes their first survey!
                     </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                    {/* Copy Link Section */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Referral Link</label>
                        <div className="flex gap-2">
                            <div className="flex-grow bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 truncate font-mono select-all">
                                {link}
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center shadow-sm"
                            >
                                {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                            </button>
                        </div>
                        {copied && (
                             <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1 justify-center animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 size={12} /> Link copied to clipboard!
                             </p>
                        )}
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold uppercase tracking-wider">Or Share Via</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    {/* Share Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleWhatsApp}
                            className="flex flex-col items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 py-4 rounded-xl transition-colors group"
                        >
                            <MessageCircle size={32} className="text-[#25D366] group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-[#25D366] darken-10">WhatsApp</span>
                        </button>

                        <button 
                            onClick={handleSMS}
                            className="flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 py-4 rounded-xl transition-colors group"
                        >
                            <Smartphone size={32} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-blue-600">SMS Message</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 bg-slate-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Friends must verify their account to qualify. Terms and conditions apply.
                    </p>
                </div>
            </main>
        </div>
    )
}