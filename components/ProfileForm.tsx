import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, User, MapPin, Mail, CreditCard, Smartphone, Camera, Landmark, ImagePlus, Lock, Info } from 'lucide-react';
import { UserData } from '../App';

interface ProfileFormProps {
  onBack: () => void;
  onHelp?: () => void;
  initialData?: UserData;
  onUpdateUser: (data: Partial<UserData>) => void;
}

export default function ProfileForm({ onBack, onHelp, initialData, onUpdateUser }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    dob: '',
    gender: '',
    email: '',
    country: '',
    city: '',
    paymentMethod: '',
    mpesaNumber: '',
    airtelNumber: '',
    paypalEmail: '',
    bankName: '',
    bankAccountNumber: '',
    avatar: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Populate form if profile data already exists
    if (initialData?.profile) {
       setFormData(prev => ({ ...prev, ...initialData.profile }));
    } else if (initialData?.username) {
        // Fallback: If username looks like email, set email field
        if (initialData.username.includes('@')) {
            setFormData(prev => ({ ...prev, email: initialData.username }));
        }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Limit size to 500KB to prevent LocalStorage issues
        if (file.size > 512000) {
            alert("Image size is too large. Please upload an image smaller than 500KB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to global state (and LocalStorage via App component)
    onUpdateUser({ profile: formData });
    
    alert("Profile saved successfully!");
    onBack();
  };

  // Helper to check if a field was already set in initial data (and thus should be locked)
  const isLocked = (field: keyof typeof formData) => {
      // Always allow updating avatar
      if (field === 'avatar') return false;
      
      // Check if value existed in profile
      if (initialData?.profile?.[field]) return true;
      
      // Special case for email if it was the username
      if (field === 'email' && initialData?.username && initialData.username.includes('@') && !initialData.profile?.email) {
          return true;
      }
      
      return false;
  };

  const LockedInputIndicator = () => (
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <Lock size={14} />
      </div>
  );

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
          <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed">
                <span className="font-bold">Security Notice:</span> To prevent unauthorized modifications, verified fields are locked. Please contact support to update your personal information.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            
            {/* Profile Picture Upload Section */}
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative group" onClick={() => fileInputRef.current?.click()}>
                    {/* Main Avatar Container */}
                    <div className="w-36 h-36 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative ring-1 ring-slate-200 cursor-pointer">
                        {formData.avatar ? (
                            <>
                                <img 
                                    src={formData.avatar} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Camera className="text-white w-10 h-10 opacity-90 drop-shadow-md" />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300 w-full h-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
                                <User size={64} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>
                    
                    {/* Floating Action Button */}
                    <button 
                        type="button"
                        className="absolute bottom-1 right-1 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-all transform hover:scale-110 border-4 border-white z-20 group-hover:rotate-12"
                        aria-label="Upload Photo"
                    >
                        <Camera size={20} />
                    </button>
                </div>
                
                {/* Hidden Input */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
                
                {/* Text Button */}
                <div className="mt-4 flex flex-col items-center gap-1">
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                        <ImagePlus size={16} />
                        {formData.avatar ? 'Change Picture' : 'Upload Picture'}
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium">Supports JPG, PNG (Max 500KB)</p>
                </div>
            </div>

            {/* Personal Details Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                    <User size={16} /> Personal Details
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                        <div className="relative">
                            <input 
                                type="text" name="firstName" required 
                                value={formData.firstName} onChange={handleChange}
                                disabled={isLocked('firstName')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Enter first name"
                            />
                            {isLocked('firstName') && <LockedInputIndicator />}
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                            <input 
                                type="text" name="middleName"
                                value={formData.middleName} onChange={handleChange}
                                disabled={isLocked('middleName')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Enter middle name"
                            />
                            {isLocked('middleName') && <LockedInputIndicator />}
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                        <div className="relative">
                            <input 
                                type="text" name="surname" required
                                value={formData.surname} onChange={handleChange}
                                disabled={isLocked('surname')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Enter surname"
                            />
                            {isLocked('surname') && <LockedInputIndicator />}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <div className="relative">
                            <input 
                                type="date" name="dob" required
                                value={formData.dob} onChange={handleChange}
                                disabled={isLocked('dob')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                            />
                            {isLocked('dob') && <LockedInputIndicator />}
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <div className="relative">
                            <select 
                                name="gender" required
                                value={formData.gender} onChange={handleChange}
                                disabled={isLocked('gender')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500"
                            >
                                <option value="" disabled>Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            {isLocked('gender') && <LockedInputIndicator />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Contact Section */}
            <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MapPin size={16} /> Location & Contact
                </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                        <div className="relative">
                            <input 
                                type="text" name="country" required
                                value={formData.country} onChange={handleChange}
                                disabled={isLocked('country')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Country"
                            />
                             {isLocked('country') && <LockedInputIndicator />}
                        </div>
                    </div>
                    <div className="relative">
                         <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                         <div className="relative">
                            <input 
                                type="text" name="city" required
                                value={formData.city} onChange={handleChange}
                                disabled={isLocked('city')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="City"
                            />
                            {isLocked('city') && <LockedInputIndicator />}
                         </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                           <Mail size={18} />
                        </div>
                        <input 
                            type="email" name="email" required
                            value={formData.email} onChange={handleChange}
                            disabled={isLocked('email')}
                            className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="john@example.com"
                        />
                         {isLocked('email') && <LockedInputIndicator />}
                    </div>
                </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                    <CreditCard size={16} /> Payment Preferences
                </h3>
                 <div className="grid grid-cols-1 gap-4">
                     <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Payment Method</label>
                        <div className="relative">
                            <select 
                                name="paymentMethod" required
                                value={formData.paymentMethod} onChange={handleChange}
                                disabled={isLocked('paymentMethod')}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500"
                            >
                                <option value="" disabled>Select Method</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="airtel">Airtel Money</option>
                                <option value="paypal">PayPal</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                             {isLocked('paymentMethod') && <LockedInputIndicator />}
                        </div>
                    </div>

                    {formData.paymentMethod === 'mpesa' && (
                     <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                        <label className="block text-sm font-medium text-slate-700 mb-1">M-Pesa Registered Number</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Smartphone size={18} />
                           </div>
                           <input 
                              type="tel" name="mpesaNumber" required
                              value={formData.mpesaNumber} onChange={handleChange}
                              disabled={isLocked('mpesaNumber')}
                              className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                              placeholder="07..."
                           />
                            {isLocked('mpesaNumber') && <LockedInputIndicator />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Used for instant withdrawals.</p>
                     </div>
                    )}

                    {formData.paymentMethod === 'airtel' && (
                     <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Airtel Money Number</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Smartphone size={18} />
                           </div>
                           <input 
                              type="tel" name="airtelNumber" required
                              value={formData.airtelNumber} onChange={handleChange}
                              disabled={isLocked('airtelNumber')}
                              className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                              placeholder="07..."
                           />
                            {isLocked('airtelNumber') && <LockedInputIndicator />}
                        </div>
                     </div>
                    )}

                    {formData.paymentMethod === 'paypal' && (
                     <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                        <label className="block text-sm font-medium text-slate-700 mb-1">PayPal Email Address</label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Mail size={18} />
                           </div>
                           <input 
                              type="email" name="paypalEmail" required
                              value={formData.paypalEmail} onChange={handleChange}
                              disabled={isLocked('paypalEmail')}
                              className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                              placeholder="you@example.com"
                           />
                            {isLocked('paypalEmail') && <LockedInputIndicator />}
                        </div>
                     </div>
                    )}

                    {formData.paymentMethod === 'bank' && (
                     <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                             <div className="relative">
                               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <Landmark size={18} />
                               </div>
                                <input 
                                    type="text" name="bankName" required
                                    value={formData.bankName} onChange={handleChange}
                                    disabled={isLocked('bankName')}
                                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                    placeholder="e.g. KCB, Equity"
                                />
                                 {isLocked('bankName') && <LockedInputIndicator />}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                            <div className="relative">
                               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                  <CreditCard size={18} />
                               </div>
                                <input 
                                    type="text" name="bankAccountNumber" required
                                    value={formData.bankAccountNumber} onChange={handleChange}
                                    disabled={isLocked('bankAccountNumber')}
                                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                    placeholder="Account No."
                                />
                                 {isLocked('bankAccountNumber') && <LockedInputIndicator />}
                            </div>
                        </div>
                     </div>
                    )}
                </div>
            </div>

            <button 
                type="submit" 
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
                <Save size={20} />
                Save Profile
            </button>

            {onHelp && (
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={onHelp}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                    >
                        Need help with your profile?
                    </button>
                </div>
            )}
        </form>
      </main>
    </div>
  );
}