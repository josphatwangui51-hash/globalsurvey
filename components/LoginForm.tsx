import React, { useState } from 'react';
import { User, Lock, ArrowRight, MessageCircle, Loader2, ShieldCheck, Mail, Smartphone, RefreshCw, X, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserData } from '../App';

interface LoginFormProps {
  onLoginSuccess: (user: UserData) => void;
  onRegisterClick: () => void;
  registeredUsers: UserData[];
  onPasswordReset: (username: string, newPass: string) => void;
}

export default function LoginForm({ onLoginSuccess, onRegisterClick, registeredUsers, onPasswordReset }: LoginFormProps) {
  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot-request' | 'forgot-verify' | 'forgot-reset'>('credentials');
  
  // Login Data
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  // Validation & UI State
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [matchedUser, setMatchedUser] = useState<UserData | null>(null);

  // Forgot Password State
  const [forgotUsername, setForgotUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification Simulation State
  const [notification, setNotification] = useState<{title: string, message: string, code: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on change
  };

  const validatePassword = (pwd: string) => {
    // 8 characters, no underscore, uppercase and lowercase
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (pwd.includes('_')) return "Password cannot contain underscores.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain a lowercase letter.";
    return null;
  };

  const generateOtpWithAi = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("AI Timeout")), 5000)
      );

      const aiPromise = (async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Generate a random 5-digit numeric One-Time Password (OTP). Return ONLY the 5 digits.',
        });
        const text = response.text?.trim().replace(/\D/g, '').substring(0, 5);
        if (text && text.length === 5) return text;
        throw new Error("Invalid format");
      })();

      // Race the AI against the timeout
      return await Promise.race([aiPromise, timeoutPromise]);

    } catch (error) {
      console.warn("AI OTP gen failed or timed out, using fallback", error);
      return Math.floor(10000 + Math.random() * 90000).toString();
    }
  };

  const generateMessageContent = async (type: 'email' | 'sms', code: string, username: string, context: 'login' | 'reset' = 'login') => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Timeout promise
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("AI Timeout")), 4000)
      );
      
      let prompt = '';
      if (context === 'reset') {
        prompt = type === 'sms'
        ? `Generate a secure password reset SMS for Global Survey Market. Code: ${code}. Max 15 words.`
        : `Generate a password reset email for Global Online Survey Market. User: ${username}. Code: ${code}. Max 25 words.`;
      } else {
        prompt = type === 'sms'
        ? `Generate a friendly, concise SMS verification message for Global Survey Market. Code: ${code}. Max 15 words.`
        : `Generate a professional short email verification message for Global Online Survey Market. User: ${username}. Code: ${code}. Max 25 words.`;
      }

      const aiPromise = (async () => {
         const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text?.trim();
      })();

      return await Promise.race([aiPromise, timeoutPromise]);
    } catch (e) {
      return context === 'reset' 
        ? `Your password reset code is ${code}`
        : `Your Global Surveys verification code is ${code}`;
    }
  };

  const showOtpNotification = (channelName: string, message: string, code: string) => {
    setNotification({
      title: `New ${channelName}`,
      message: message,
      code: code
    });
    // Auto hide after 10 seconds if not interacting
    setTimeout(() => {
        // Optional: auto-dismiss logic could go here
    }, 10000);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setIsLoading(true);
    setError('');
    setNotification(null); // Clear previous notifications
    
    // Check if user exists (client side check)
    const user = registeredUsers.find(u => 
      u.username.toLowerCase() === formData.username.toLowerCase()
    );

    if (!user) {
      setIsLoading(false);
      setError('Account not found. Please register first.');
      return;
    }

    if (user.password !== formData.password) {
      setIsLoading(false);
      setError('Invalid password.');
      return;
    }

    // Generate OTP via AI immediately
    setMatchedUser(user);
    const otpCode = await generateOtpWithAi();
    setGeneratedOtp(otpCode);
    
    const isEmail = user.username.includes('@');
    const channelName = isEmail ? 'Email' : 'Message';
    const type = isEmail ? 'email' : 'sms';

    // Generate AI Message
    const message = await generateMessageContent(type, otpCode, user.username, 'login');
    
    console.log(`[Mock Service] Login OTP ${otpCode} for ${user.username}`);
    
    // Show visual notification instead of alert
    showOtpNotification(channelName, message || `Your verification code is ${otpCode}`, otpCode);

    setIsLoading(false);
    setStep('otp');
  };

  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setNotification(null);

      const user = registeredUsers.find(u => u.username.toLowerCase() === forgotUsername.toLowerCase());
      if (!user) {
          setIsLoading(false);
          setError("Account not found.");
          return;
      }

      setMatchedUser(user);
      const otpCode = await generateOtpWithAi();
      setGeneratedOtp(otpCode);
      
      const isEmail = user.username.includes('@');
      const channel = isEmail ? 'Email' : 'SMS';
      const type = isEmail ? 'email' : 'sms';

      const message = await generateMessageContent(type, otpCode, user.username, 'reset');
      
      showOtpNotification(channel, message || `Reset code: ${otpCode}`, otpCode);
      setIsLoading(false);
      setStep('forgot-verify');
      setOtp(['', '', '', '', '']); // Clear OTP input
  };

  const handleForgotVerifySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const enteredOtp = otp.join('');
      if (enteredOtp === generatedOtp) {
          setStep('forgot-reset');
      } else {
          setError('Invalid OTP code.');
      }
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      const pwdError = validatePassword(newPassword);
      if (pwdError) {
          setError(pwdError);
          return;
      }

      if (newPassword !== confirmPassword) {
          setError("Passwords do not match.");
          return;
      }

      onPasswordReset(forgotUsername, newPassword);
      
      alert("Password reset successfully. Please login.");
      
      // Reset state and go back to login
      setStep('credentials');
      setFormData(prev => ({ ...prev, username: forgotUsername, password: '' }));
      setForgotUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp(['', '', '', '', '']);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`login-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const enteredOtp = otp.join('');
    
    // Verify instantly without delay
    if (enteredOtp === generatedOtp && matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setIsLoading(false);
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    const otpCode = await generateOtpWithAi();
    setGeneratedOtp(otpCode);
    
    const isEmail = formData.username.includes('@');
    const channelName = isEmail ? 'Email' : 'Message';
    const type = isEmail ? 'email' : 'sms';

    // Determine context based on step
    const context = (step === 'forgot-verify') ? 'reset' : 'login';
    const userToUse = (step === 'forgot-verify') ? forgotUsername : formData.username;

    const message = await generateMessageContent(type, otpCode, userToUse, context);
    
    showOtpNotification(channelName, message || `Your verification code is ${otpCode}`, otpCode);
    setIsLoading(false);
  };

  // --- Render OTP Verification (Shared for Login and Forgot) ---
  if (step === 'otp' || step === 'forgot-verify') {
    const isLogin = step === 'otp';
    const usernameDisplay = isLogin ? formData.username : forgotUsername;
    const isEmail = usernameDisplay.includes('@');
    const submitHandler = isLogin ? handleOtpSubmit : handleForgotVerifySubmit;
    const title = isLogin ? "Two-Step Verification" : "Verify Identity";

    return (
      <div className="text-center relative">
        {/* Simulated Push Notification */}
        {notification && (
            <div className="absolute -top-24 left-0 w-full animate-bounce-in z-50">
                <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-left flex items-start gap-3 border border-slate-700">
                    <div className="bg-emerald-500 p-2 rounded-full">
                        {isEmail ? <Mail size={16} /> : <MessageCircle size={16} />}
                    </div>
                    <div className="flex-grow">
                        <p className="font-bold text-xs text-emerald-400 uppercase">{notification.title} • Now</p>
                        <p className="text-sm font-medium leading-snug">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">Code: <span className="font-mono bg-slate-700 px-1 rounded text-white">{notification.code}</span></p>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
                        <X size={14} />
                    </button>
                </div>
            </div>
        )}

        <div className="flex justify-center mb-4 pt-4">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 relative">
            <ShieldCheck size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Enter the 5-digit code sent to your {isEmail ? 'email' : 'mobile number'}:<br/>
          <strong>{usernameDisplay}</strong>
        </p>

        <form onSubmit={submitHandler}>
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`login-otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-12 text-center text-xl font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={otp.join('').length !== 5 || isLoading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Verify & Login' : 'Verify & Continue')}
          </button>

          <div className="mt-6 flex flex-col items-center gap-3">
             <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-slate-500 text-sm hover:text-emerald-600 transition-colors disabled:opacity-50"
             >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Resend Code
             </button>
             
             <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp(['', '', '', '', '']);
                  setError('');
                  setNotification(null);
                }}
                className="text-emerald-600 text-sm hover:underline"
             >
                Cancel
             </button>
          </div>
        </form>
      </div>
    );
  }

  // --- Render Forgot Password Request ---
  if (step === 'forgot-request') {
      return (
          <div className="relative">
             <div className="mb-6 text-center">
                 <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-600">
                     <KeyRound size={24} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
                 <p className="text-slate-500 text-sm">Enter your username to receive a reset code</p>
             </div>

             <form onSubmit={handleForgotRequestSubmit} className="space-y-5">
                 {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                 <div className="space-y-1">
                    <label htmlFor="forgot-username" className="block text-sm font-medium text-slate-700">
                        Username / Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User size={18} />
                        </div>
                        <input
                        type="text"
                        id="forgot-username"
                        required
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors sm:text-sm"
                        placeholder="Enter your username"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !forgotUsername}
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Code'}
                </button>

                <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="w-full flex items-center justify-center gap-2 text-slate-500 text-sm hover:text-slate-800 transition-colors mt-4"
                >
                    <ArrowLeft size={16} /> Back to Login
                </button>
             </form>
          </div>
      )
  }

  // --- Render Set New Password ---
  if (step === 'forgot-reset') {
      return (
          <div className="relative">
              <div className="mb-6 text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 text-emerald-600">
                     <CheckCircle2 size={24} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">New Password</h2>
                 <p className="text-slate-500 text-sm">Create a secure password for your account</p>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={18} />
                        </div>
                        <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors sm:text-sm"
                        placeholder="New password"
                        />
                    </div>
                     <p className="text-[10px] text-slate-400 mt-1">
                        Must be 8+ chars, contain Upper & Lower case, no underscores.
                     </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={18} />
                        </div>
                        <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors sm:text-sm"
                        placeholder="Confirm password"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 mt-2"
                >
                    Reset Password
                </button>
              </form>
          </div>
      )
  }

  // --- Render Login Credentials View ---
  return (
    <div className="relative">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Login</h2>
        <p className="text-slate-500 text-sm">Access your survey dashboard</p>
      </div>

      <form onSubmit={handleCredentialsSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="username" className="block text-sm font-medium text-slate-700">
            Username / Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User size={18} />
            </div>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors sm:text-sm bg-slate-50 focus:bg-white"
              placeholder="Enter your username"
            />
          </div>
        </div>

        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                </label>
                <button 
                    type="button" 
                    onClick={() => setStep('forgot-request')}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                >
                    Forgot Password?
                </button>
            </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors sm:text-sm bg-slate-50 focus:bg-white"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="relative flex items-start pt-2">
            <div className="flex h-6 items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer accent-emerald-600"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor="terms" className="font-medium text-slate-900 cursor-pointer select-none">
                I agree to the Rules and Guidelines
              </label>
            </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !agreed}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Verifying...
            </>
          ) : (
            <>
              Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center space-y-4">
        <p className="text-sm text-slate-500">
          Don't have an account?{' '}
          <button 
            onClick={onRegisterClick}
            className="font-medium text-emerald-600 hover:text-emerald-500 underline decoration-emerald-200 underline-offset-2 transition-colors bg-transparent border-none cursor-pointer"
          >
            Register here
          </button>
        </p>

        <a
          href="https://wa.me/254796335209?text=Hello%2C%20I%20need%20help%20with%20Global%20Online%20Survey%20Market"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full font-bold shadow-md transition-all hover:shadow-lg group"
        >
          <MessageCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
          Chat with us on WhatsApp
        </a>
      </div>
    </div>
  );
}