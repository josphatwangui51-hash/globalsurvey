import React, { useState, useEffect } from 'react';
import { User, Lock, CreditCard, ArrowRight, Loader2, CheckCircle2, ShieldCheck, RefreshCw, Mail, Smartphone, MessageCircle, X, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserData } from '../App';

interface RegisterFormProps {
  onRegisterSuccess: (user: UserData) => void;
  onLoginClick: () => void;
  registeredUsers: UserData[];
}

export default function RegisterForm({ onRegisterSuccess, onLoginClick, registeredUsers }: RegisterFormProps) {
  const [step, setStep] = useState<'details' | 'otp' | 'confirmation'>('details');
  
  // Form Data
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    mpesaCode: ''
  });
  
  // Validation States
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP Logic
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  // Notification Simulation State
  const [notification, setNotification] = useState<{title: string, message: string, code: string} | null>(null);

  const validatePassword = (pwd: string) => {
    // 8 characters, no underscore, uppercase and lowercase
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (pwd.includes('_')) return "Password cannot contain underscores.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain a lowercase letter.";
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  const generateMessageContent = async (type: 'email' | 'sms', code: string, username: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Timeout promise
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("AI Timeout")), 4000)
      );
      
      const prompt = type === 'sms'
        ? `Generate a warm welcome SMS for Global Survey Market with verification code: ${code}. Max 15 words.`
        : `Generate a professional welcome email for Global Online Survey Market. User: ${username}. Verification Code: ${code}. Max 25 words.`;

      const aiPromise = (async () => {
         const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return response.text?.trim();
      })();

      return await Promise.race([aiPromise, timeoutPromise]);
    } catch (e) {
      return `Welcome to Global Surveys. Your verification code is ${code}`;
    }
  };
  
  const showOtpNotification = (channelName: string, message: string, code: string) => {
    setNotification({
      title: `New ${channelName}`,
      message: message,
      code: code
    });
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    setNotification(null);

    const cleanUsername = formData.username.trim();

    // Check duplicates: Ensure if client registered previously, they must log in
    const exists = registeredUsers.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      setErrors({ username: "Account already exists." });
      setIsLoading(false);
      return;
    }

    // Validate Password
    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setErrors({ password: pwdError });
      setIsLoading(false);
      return;
    }

    // Validate M-Pesa Code (Strict 10 Alphanumeric chars)
    const mpesaRegex = /^[A-Za-z0-9]{10}$/;
    if (!formData.mpesaCode || !mpesaRegex.test(formData.mpesaCode)) {
      setErrors({ mpesaCode: "Transaction code must be exactly 10 alphanumeric characters." });
      setIsLoading(false);
      return;
    }

    // Generate OTP via AI
    const otpCode = await generateOtpWithAi();
    setGeneratedOtp(otpCode);
    
    // Detect delivery channel
    const isEmail = cleanUsername.includes('@');
    const channelName = isEmail ? 'Email' : 'Message';
    const type = isEmail ? 'email' : 'sms';

    // Generate Message
    const message = await generateMessageContent(type, otpCode, cleanUsername);

    console.log(`[Mock Service] Sending OTP ${otpCode} to ${channelName}: ${cleanUsername}`); 
    
    // Show notification instead of alert
    showOtpNotification(channelName, message || `Your verification code is ${otpCode}`, otpCode);
    
    setIsLoading(false);
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const enteredOtp = otp.join('');
    
    // Check instantly
    if (enteredOtp === generatedOtp) {
      setIsLoading(false);
      // Proceed to confirmation step instead of immediate success
      setStep('confirmation');
    } else {
      setErrors({ otp: 'Invalid OTP. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    const otpCode = await generateOtpWithAi();
    setGeneratedOtp(otpCode);
    const isEmail = formData.username.includes('@');
    const channelName = isEmail ? 'Email' : 'Message';
    const type = isEmail ? 'email' : 'sms';

    const message = await generateMessageContent(type, otpCode, formData.username);
    
    showOtpNotification(channelName, message || `Your verification code is ${otpCode}`, otpCode);
    setIsLoading(false);
  };

  if (step === 'confirmation') {
    return (
      <div className="relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 text-emerald-600">
             <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Confirm Registration</h2>
          <p className="text-slate-500 text-sm mt-1">Please verify your details before proceeding.</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 space-y-4">
           <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-400"><User size={18} /></div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account ID</p>
                 <p className="font-medium text-slate-800 break-all">{formData.username}</p>
              </div>
           </div>
           
           <div className="h-px bg-slate-200"></div>

           <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-400"><CreditCard size={18} /></div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">M-Pesa Code</p>
                 <p className="font-medium text-slate-800 font-mono tracking-wide">{formData.mpesaCode}</p>
              </div>
           </div>

            <div className="h-px bg-slate-200"></div>

           <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-400"><ShieldCheck size={18} /></div>
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Status</p>
                 <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm mt-0.5">
                    <CheckCircle2 size={14} />
                    <span>OTP Verified</span>
                 </div>
              </div>
           </div>
        </div>

        <button
          onClick={() => onRegisterSuccess({
            username: formData.username,
            password: formData.password,
            mpesaCode: formData.mpesaCode
          })}
          className="w-full bg-emerald-600 text-white py-3.5 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 mb-3 flex items-center justify-center gap-2"
        >
          Confirm & Go to Dashboard
          <ArrowRight size={18} />
        </button>

        <button
           onClick={() => setStep('details')}
           className="w-full bg-white border border-slate-200 text-slate-600 py-3.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
           Cancel / Edit Details
        </button>
      </div>
    );
  }

  if (step === 'otp') {
    const isEmail = formData.username.includes('@');

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
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                {isEmail ? <Mail size={14} className="text-blue-500" /> : <Smartphone size={14} className="text-slate-600" />}
             </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Enter the 5-digit code sent to your {isEmail ? 'email' : 'mobile number'}:<br/>
          <strong>{formData.username}</strong>
        </p>

        <form onSubmit={handleOtpSubmit}>
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
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

          {errors.otp && (
            <p className="text-red-500 text-sm mb-4">{errors.otp}</p>
          )}

          <button
            type="submit"
            disabled={otp.join('').length !== 5 || isLoading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Continue'}
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
                   setStep('details');
                   setNotification(null);
                }}
                className="text-emerald-600 text-sm hover:underline"
             >
                Change {isEmail ? 'email' : 'number'}
             </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
        <p className="text-slate-500 text-sm">Register to access premium surveys</p>
      </div>

      <form onSubmit={handleDetailsSubmit} className="space-y-4">
        
        {/* Username/Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email or Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User size={18} />
            </div>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors sm:text-sm ${errors.username ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50 focus:bg-white'}`}
              placeholder="e.g. 0712345678 or john@email.com"
            />
          </div>
          {errors.username && (
             <div className={`mt-2 flex items-start gap-2 text-xs rounded-md p-2 ${errors.username.includes('exists') ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'text-red-500'}`}>
                {errors.username.includes('exists') && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                <div className="flex-grow">
                   <p>{errors.username}</p>
                   {errors.username.includes('exists') && (
                       <button 
                           type="button"
                           onClick={onLoginClick}
                           className="font-bold underline mt-1 hover:text-amber-900"
                       >
                           Click here to Login
                       </button>
                   )}
                </div>
             </div>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors sm:text-sm ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50 focus:bg-white'}`}
              placeholder="Create a password"
            />
          </div>
          {errors.password ? (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          ) : (
             <p className="text-[10px] text-slate-400 mt-1">
                Must be 8+ chars, contain Upper & Lower case, no underscores.
             </p>
          )}
        </div>

        {/* M-Pesa Code */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            M-Pesa Transaction Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <CreditCard size={18} />
            </div>
            <input
              type="text"
              name="mpesaCode"
              required
              maxLength={10}
              value={formData.mpesaCode}
              onChange={handleInputChange}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors sm:text-sm uppercase font-mono tracking-wider ${errors.mpesaCode ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50 focus:bg-white'}`}
              placeholder="e.g. QK54..."
            />
          </div>
           {errors.mpesaCode && <p className="text-xs text-red-500 mt-1">{errors.mpesaCode}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Processing...
            </>
          ) : (
            <>
              Register & Verify
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <button 
            onClick={onLoginClick}
            className="font-medium text-emerald-600 hover:text-emerald-500 underline decoration-emerald-200 underline-offset-2 bg-transparent border-none cursor-pointer"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}