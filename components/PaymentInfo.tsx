import React, { useState, useEffect } from 'react';
import { Smartphone, AlertCircle, Zap, Loader2, CreditCard } from 'lucide-react';

export default function PaymentInfo() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'timeout'>('input');

  const handleStkPush = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Kenyan Mobile Validation: Starts with 07 or 01, followed by 8 digits
    const kenyanPhoneRegex = /^0(7|1)\d{8}$/;
    
    if (!kenyanPhoneRegex.test(phoneNumber)) {
        alert("Please enter a valid Safaricom number (e.g., 0712345678)");
        return;
    }
    
    setIsLoading(true);
    
    // 1. Simulate API Call Initiation
    setTimeout(() => {
        setIsLoading(false);
        setStep('processing'); // Show "Check your phone" UI
        
        // 2. Wait 12 seconds then show the manual payment fallback message
        setTimeout(() => {
            setStep('timeout');
        }, 12000);
        
    }, 2000);
  };

  const reset = () => {
      setStep('input');
      setPhoneNumber('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-sm">
      <div className="bg-emerald-600 p-4 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard size={64} />
        </div>
        <h2 className="font-bold text-lg flex items-center justify-center gap-2 relative z-10">
          <CreditCard size={20} />
          Account Activation Fee
        </h2>
        <p className="text-emerald-100 text-sm relative z-10">One-time payment of <span className="font-bold text-white">KES 49</span></p>
      </div>
      
      <div className="p-5">
        {/* Express Option */}
        <div className="mb-6 bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
                <div className="bg-emerald-200 p-1.5 rounded-full text-emerald-800">
                    <Zap size={16} fill="currentColor" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Express Payment</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-white px-2 py-0.5 rounded border border-emerald-100">Recommended</span>
          </div>
          
          {step === 'input' && (
            <form onSubmit={handleStkPush} className="flex flex-col gap-3 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">M-Pesa Phone Number</label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g,''))}
                  placeholder="07..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-medium placeholder:text-slate-300 bg-white"
                  maxLength={10}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Initiating...
                    </>
                ) : (
                    'Pay Now (KES 49)'
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400">
                You will receive a prompt on your phone to enter your PIN.
              </p>
            </form>
          )}

          {(step === 'processing' || step === 'timeout') && (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300 relative z-10">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-md border-4 border-emerald-100 relative">
                <Smartphone size={32} className="animate-[pulse_2s_infinite]" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce"></div>
              </div>
              
              <h4 className="font-bold text-slate-800 mb-2">Check your phone</h4>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed px-4">
                A payment prompt of <strong className="text-emerald-700">KES 49</strong> has been sent to <br/><span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-900">{phoneNumber}</span>
              </p>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 py-2 px-4 rounded-full inline-flex mb-4">
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                  Waiting for confirmation...
              </div>
              
              {step === 'timeout' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 mt-2 px-4">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-xs text-amber-800 mb-3">
                        <p className="font-bold mb-1 flex items-center justify-center gap-1">
                            <AlertCircle size={12} /> Problem with the prompt?
                        </p>
                        If the problem persists, please <strong>pay manually</strong> to 0796 335 209 and enter the transaction code below.
                    </div>
                    <button onClick={reset} className="text-xs text-slate-400 underline hover:text-emerald-600">
                       Retry Express Payment
                   </button>
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Option Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or Pay Manually</span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Manual Option */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div>
                 <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Send Money To</p>
                 <p className="font-bold text-slate-800 font-mono text-lg">0796 335 209</p>
            </div>
            <div className="text-right">
                 <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Amount</p>
                 <p className="font-bold text-emerald-600">KES 49</p>
            </div>
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-md border border-slate-100">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <span><strong>Important:</strong> Please ensure you enter the M-Pesa transaction code above (or from your SMS) into the registration form below.</span>
        </div>
      </div>
    </div>
  );
}