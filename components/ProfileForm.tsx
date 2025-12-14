import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, MapPin, Mail, CreditCard, Calendar } from 'lucide-react';
import { UserData } from '../App';

interface ProfileFormProps {
  onBack: () => void;
  initialData?: UserData;
  onUpdateUser: (data: Partial<UserData>) => void;
}

export default function ProfileForm({ onBack, initialData, onUpdateUser }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    dob: '',
    gender: '',
    email: '',
    country: '',
    city: '',
    paymentMethod: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to global state (and LocalStorage via App component)
    onUpdateUser({ profile: formData });
    
    alert("Profile saved successfully!");
    onBack();
  };

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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                    <User size={16} /> Personal Details
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                        <input 
                            type="text" name="firstName" required 
                            value={formData.firstName} onChange={handleChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Enter first name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <input 
                            type="text" name="middleName"
                            value={formData.middleName} onChange={handleChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Enter middle name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Surname</label>
                        <input 
                            type="text" name="surname" required
                            value={formData.surname} onChange={handleChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Enter surname"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <div className="relative">
                            <input 
                                type="date" name="dob" required
                                value={formData.dob} onChange={handleChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select 
                            name="gender" required
                            value={formData.gender} onChange={handleChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-all"
                        >
                            <option value="" disabled>Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Location & Contact Section */}
            <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MapPin size={16} /> Location & Contact
                </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                        <input 
                            type="text" name="country" required
                            value={formData.country} onChange={handleChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Country"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                        <input 
                            type="text" name="city" required
                            value={formData.city} onChange={handleChange}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="City"
                        />
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
                            className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                    <CreditCard size={16} /> Payment Preferences
                </h3>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Method of Payment</label>
                    <select 
                        name="paymentMethod" required
                        value={formData.paymentMethod} onChange={handleChange}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white transition-all"
                    >
                        <option value="" disabled>Select Method</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="paypal">PayPal</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="airtel">Airtel Money</option>
                    </select>
                </div>
            </div>

            <button 
                type="submit" 
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
                <Save size={20} />
                Save Profile
            </button>
        </form>
      </main>
    </div>
  );
}