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

  // Determine initial view based on auth state
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>(() => {
    return localStorage.getItem('global_survey_current_user') ? 'dashboard' : 'login';
  });

  // Persist registered users whenever they change
  useEffect(() => {
    localStorage.setItem('global_survey_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Persist current user session whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('global_survey_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('global_survey_current_user');
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
    setRegisteredUsers(prev => [...prev, userWithDefaults]);
    setCurrentUser(userWithDefaults);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedData: Partial<UserData>) => {
    if (!currentUser) return;

    // Merge new data into current user
    const updatedUser = { ...currentUser, ...updatedData };
    
    // Update active session
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