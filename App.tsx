import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PaymentInfo from './components/PaymentInfo';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';

export interface UserStats {
  earnings: number;
  performance: number;
  eligibility: number;
  surveysCompleted: number;
  dailyCount?: number;
  lastSurveyDate?: string;
  dailyEarnings?: number;
  dailyLimit?: number;
}

export interface EarningEntry {
  id: number;
  date: string;
  amount: number;
  title: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };
  language: string;
}

export interface UserData {
  username: string;
  password?: string; // Stored for mock auth
  mpesaCode?: string;
  profile?: any;
  stats?: UserStats;
  earningsHistory?: EarningEntry[];
  settings?: UserSettings;
}

export default function App() {
  // Load registered users from LocalStorage
  const [registeredUsers, setRegisteredUsers] = useState<UserData[]>(() => {
    try {
      const saved = localStorage.getItem('global_survey_users');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load users", e);
      return [];
    }
  });

  // Load current user session from LocalStorage
  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem('global_survey_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Capture referral code from URL on mount
  const [referralCode, setReferralCode] = useState<string | null>(() => {
      const params = new URLSearchParams(window.location.search);
      return params.get('ref');
  });

  // Determine initial view based on auth state AND referral
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>(() => {
    // Priority 1: If logged in, go to dashboard
    if (localStorage.getItem('global_survey_current_user')) return 'dashboard';
    
    // Priority 2: If referral link used, go to register
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) return 'register';
    
    // Priority 3: Default to login
    return 'login';
  });

  // Clean up URL if ref exists to keep the address bar clean (optional UX preference)
  useEffect(() => {
      if (referralCode) {
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          window.history.replaceState({}, '', url.toString());
      }
  }, [referralCode]);

  // Persist registered users whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('global_survey_users', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error("Failed to save users database:", e);
      // If it's a quota error, we might want to alert the user
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          alert("Storage Limit Reached: Your profile changes (like images) may not be saved permanently. Please try a smaller image.");
      }
    }
  }, [registeredUsers]);

  // Persist current user session whenever it changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('global_survey_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('global_survey_current_user');
      }
    } catch (e) {
       console.error("Failed to save session:", e);
       if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          // Alert handled in the registeredUsers effect usually, but good to be safe
       }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserData) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleRegisterSuccess = (newUser: UserData) => {
    // Initialize defaults for new user
    const userWithDefaults: UserData = {
        ...newUser,
        stats: { 
            earnings: 0, 
            performance: 65, 
            eligibility: 40, 
            surveysCompleted: 0,
            dailyCount: 0,
            lastSurveyDate: new Date().toDateString(),
            dailyEarnings: 0,
            dailyLimit: 250 // Default daily earnings limit
        },
        earningsHistory: [],
        settings: {
            notifications: { email: true, sms: true, marketing: false },
            language: 'en'
        }
    };

    let updatedUserList = [...registeredUsers, userWithDefaults];

    // Handle Referral Logic
    if (referralCode && referralCode !== newUser.username) {
        // Find referrer in the database
        const referrerIndex = updatedUserList.findIndex(u => u.username === referralCode);
        
        if (referrerIndex !== -1) {
            const referrer = updatedUserList[referrerIndex];
            
            // Calculate new stats for referrer
            const currentStats = referrer.stats || { 
                earnings: 0, performance: 65, eligibility: 40, surveysCompleted: 0, dailyCount: 0, lastSurveyDate: new Date().toDateString(), dailyEarnings: 0, dailyLimit: 250 
            };
            
            // Credit KES 50
            const bonus = 50;
            const newStats = {
                ...currentStats,
                earnings: currentStats.earnings + bonus,
            };

            const newEntry: EarningEntry = {
                id: Date.now(),
                date: new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                amount: bonus,
                title: `Referral Bonus: ${newUser.username}`
            };

            // Update referrer object in the list
            updatedUserList[referrerIndex] = {
                ...referrer,
                stats: newStats,
                earningsHistory: [newEntry, ...(referrer.earningsHistory || [])]
            };
            
            // Edge case: If the referrer happens to be logged in on this same browser
            if (currentUser && currentUser.username === referralCode) {
                 setCurrentUser(updatedUserList[referrerIndex]);
            }
        }
    }

    setRegisteredUsers(updatedUserList);
    setCurrentUser(userWithDefaults);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedData: Partial<UserData>) => {
    if (!currentUser) return;

    // Merge new data into current user
    const updatedUser = { ...currentUser, ...updatedData };
    
    // Update active session immediately
    setCurrentUser(updatedUser);

    // Update the master list of users so data persists on next login
    setRegisteredUsers(prev => 
      prev.map(u => u.username === currentUser.username ? updatedUser : u)
    );
  };

  const handlePasswordReset = (username: string, newPass: string) => {
    setRegisteredUsers(prev => 
        prev.map(user => 
            user.username.toLowerCase() === username.toLowerCase() 
            ? { ...user, password: newPass }
            : user
        )
    );
  };

  // If logged in/dashboard view
  if (currentView === 'dashboard' && currentUser) {
    return (
      <Dashboard 
        onLogout={handleLogout} 
        currentUser={currentUser} 
        onUpdateUser={handleUpdateUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-start sm:justify-center">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              {/* Only show Payment Info on Register screen */}
              {currentView === 'register' && <PaymentInfo />}
              
              {currentView === 'login' ? (
                <LoginForm 
                  onLoginSuccess={handleLoginSuccess}
                  onRegisterClick={() => setCurrentView('register')}
                  registeredUsers={registeredUsers}
                  onPasswordReset={handlePasswordReset}
                />
              ) : (
                <RegisterForm 
                  onRegisterSuccess={handleRegisterSuccess}
                  onLoginClick={() => setCurrentView('login')}
                  registeredUsers={registeredUsers}
                />
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 text-center border-t border-slate-100">
               <p className="text-sm text-slate-500">
                 Need help? Email <a href="mailto:josphatwangui51@gmail.com" className="text-emerald-600 font-medium hover:underline">josphatwangui51@gmail.com</a>
               </p>
            </div>
          </div>
          
          <div className="mt-8 text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Global Online Survey Market. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
}