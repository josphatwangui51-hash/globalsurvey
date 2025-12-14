import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  Lock, 
  Globe, 
  ChevronRight, 
  Shield, 
  FileText, 
  Trash2, 
  Smartphone,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserData, UserSettings } from '../App';

interface SettingsViewProps {
  onBack: () => void;
  currentUser: UserData;
  onUpdateUser: (data: Partial<UserData>) => void;
}

export default function SettingsView({ onBack, currentUser, onUpdateUser }: SettingsViewProps) {
  // Initialize from props or default
  const [notifications, setNotifications] = useState(currentUser.settings?.notifications || {
    email: true,
    sms: true,
    marketing: false
  });

  const [language, setLanguage] = useState(currentUser.settings?.language || 'en');
  const [activeView, setActiveView] = useState<'privacy' | 'terms' | 'password' | null>(null);

  // Auto-save whenever settings change
  const updateSettings = (newNotifs = notifications, newLang = language) => {
    onUpdateUser({
        settings: {
            notifications: newNotifs,
            language: newLang
        }
    });
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const newNotifs = { ...notifications, [key]: value };
    setNotifications(newNotifs);
    updateSettings(newNotifs, language);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    updateSettings(notifications, newLang);
  };

  if (activeView === 'password') {
    return (
      <ChangePasswordView 
        onBack={() => setActiveView(null)} 
        currentUser={currentUser} 
        onUpdateUser={onUpdateUser} 
      />
    );
  }

  if (activeView === 'privacy' || activeView === 'terms') {
    return <LegalDocumentView type={activeView} onBack={() => setActiveView(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Notifications Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                <Bell size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-slate-800">Notifications</h2>
            </div>
            <div className="p-6 space-y-5">
                <Toggle 
                    icon={<Mail size={16} className="text-slate-400" />}
                    label="Email Notifications" 
                    desc="Receive new survey invitations via email"
                    checked={notifications.email} 
                    onChange={(v) => handleNotificationChange('email', v)} 
                />
                <Toggle 
                    icon={<Smartphone size={16} className="text-slate-400" />}
                    label="SMS Alerts" 
                    desc="Get instant alerts for high-paying surveys (KES 100+)"
                    checked={notifications.sms} 
                    onChange={(v) => handleNotificationChange('sms', v)} 
                />
                 <Toggle 
                    label="Marketing & Tips" 
                    desc="Receive tips on how to earn more"
                    checked={notifications.marketing} 
                    onChange={(v) => handleNotificationChange('marketing', v)} 
                />
            </div>
        </section>

        {/* Account & Security Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                <Shield size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-slate-800">Security & Account</h2>
            </div>
            <div className="divide-y divide-slate-100">
                <button 
                  onClick={() => setActiveView('password')}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors"><Lock size={18} /></div>
                        <div>
                            <span className="font-medium text-slate-700 block">Change Password</span>
                            <span className="text-xs text-slate-400">Secure your account</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </button>
                 <div className="w-full flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Globe size={18} /></div>
                        <span className="font-medium text-slate-700">Language</span>
                    </div>
                    <select 
                        value={language}
                        onChange={handleLanguageChange}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none"
                    >
                        <option value="en">English (UK)</option>
                        <option value="sw">Swahili</option>
                    </select>
                </div>
            </div>
        </section>

        {/* Legal Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-slate-800">Legal & About</h2>
            </div>
            <div className="divide-y divide-slate-100">
                <button 
                    onClick={() => setActiveView('privacy')}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                     <span className="font-medium text-slate-700">Privacy Policy</span>
                     <ChevronRight size={18} className="text-slate-300" />
                </button>
                <button 
                    onClick={() => setActiveView('terms')}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                     <span className="font-medium text-slate-700">Terms of Service</span>
                     <ChevronRight size={18} className="text-slate-300" />
                </button>
            </div>
             <div className="bg-slate-50 px-6 py-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-400">App Version 1.2.0 (Build 2025)</p>
            </div>
        </section>

        {/* Danger Zone */}
        <div className="pt-2">
            <button 
                onClick={() => {
                    if(confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        alert('Account deletion request submitted.');
                    }
                }}
                className="w-full bg-white border border-red-100 text-red-600 font-medium py-4 rounded-xl shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
                <Trash2 size={18} />
                Delete Account
            </button>
        </div>

      </main>
    </div>
  );
}

interface ToggleProps {
    label: string;
    desc?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    icon?: React.ReactNode;
}

function Toggle({ label, desc, checked, onChange, icon }: ToggleProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="pr-4 flex items-start gap-3">
                {icon && <div className="mt-1">{icon}</div>}
                <div>
                    <p className="font-medium text-slate-800">{label}</p>
                    {desc && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>}
                </div>
            </div>
             <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
                aria-pressed={checked}
            >
                <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    )
}

function ChangePasswordView({ onBack, currentUser, onUpdateUser }: { onBack: () => void, currentUser: UserData, onUpdateUser: (data: Partial<UserData>) => void }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return "Password must be at least 8 characters.";
        if (pwd.includes('_')) return "Password cannot contain underscores.";
        if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter.";
        if (!/[a-z]/.test(pwd)) return "Password must contain a lowercase letter.";
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Verify current password
        if (formData.currentPassword !== currentUser.password) {
            setError("Current password is incorrect.");
            return;
        }

        // Validate new password
        const pwdError = validatePassword(formData.newPassword);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        // Confirm match
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (formData.newPassword === formData.currentPassword) {
             setError("New password cannot be the same as the old one.");
             return;
        }

        // Update
        onUpdateUser({ password: formData.newPassword });
        setSuccess(true);
        
        // Go back after delay
        setTimeout(() => {
            onBack();
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
             <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Change Password</h1>
                </div>
            </header>
            <main className="max-w-lg mx-auto px-4 py-6">
                {success ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                         <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} />
                         </div>
                         <h2 className="text-xl font-bold text-slate-800 mb-2">Password Updated!</h2>
                         <p className="text-slate-500">Your account is now secured with your new password.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                         {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                             <input 
                                type="password" 
                                value={formData.currentPassword}
                                onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                             <input 
                                type="password" 
                                value={formData.newPassword}
                                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                             />
                             <p className="text-[10px] text-slate-400 mt-1">8+ chars, Upper & Lower case, no underscores.</p>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                             <input 
                                type="password" 
                                value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                             />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Lock size={18} />
                            Update Password
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}

function LegalDocumentView({ type, onBack }: { type: 'privacy' | 'terms', onBack: () => void }) {
    const isPrivacy = type === 'privacy';
    const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

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
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="prose prose-slate prose-sm max-w-none">
                        {isPrivacy ? (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">1. Information Collection</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    We collect information that you provide directly to us, including your name, email address, phone number, and payment information (M-Pesa transaction codes). We may also collect demographic data to match you with suitable surveys.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">2. Use of Information</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    We use the information we collect to operate, maintain, and provide the features of the Global Online Survey Market. This includes verifying payments, processing withdrawals, and sending you survey invitations.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">3. Data Sharing</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    We do not sell your personal contact information. We may share anonymized demographic data with our survey partners to check for eligibility.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">4. Security</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">5. Cookies</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    We use cookies to enhance your experience, analyze traffic, and personalize content. By using our website, you consent to our use of cookies.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">1. Acceptance of Terms</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    By accessing or using the Global Online Survey Market, you agree to be bound by these Terms of Service. If you do not agree, you may not access the service.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">2. Registration & Fees</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    Access to the platform requires a one-time registration fee of KES 49. This fee is non-refundable and covers administrative costs for account verification.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">3. User Conduct</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    You agree to provide accurate and truthful answers in all surveys. Fraudulent activity, including the use of automated bots or providing false information, will result in immediate account termination and forfeiture of earnings.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">4. Earnings & Withdrawals</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    Earnings are credited to your wallet upon successful completion of surveys. Withdrawals are processed via M-Pesa. Minimum withdrawal thresholds may apply.
                                </p>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">5. Termination</h3>
                                <p className="text-slate-600 mb-4 leading-relaxed">
                                    We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}