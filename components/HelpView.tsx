import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface HelpViewProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Why do I need to pay a registration fee?",
    answer: "The KES 49 fee is a one-time verification charge. It ensures that all our members are real, active users, which allows us to negotiate higher payout rates with our global survey partners. This fee is non-refundable."
  },
  {
    question: "I paid but can't login. What should I do?",
    answer: "Please ensure you are entering the correct M-Pesa transaction code (10 characters, e.g., QK54...) in the login form. If the issue persists, please click the 'Chat on WhatsApp' button above to contact our support team immediately with your payment details."
  },
  {
    question: "How do I withdraw my earnings?",
    answer: "Once you reach the minimum withdrawal threshold (KES 5,000), a 'Withdraw' button will become active in your wallet section. Funds are sent instantly to the M-Pesa number registered to your account."
  },
  {
    question: "How often do new surveys appear?",
    answer: "Surveys are matched to your specific profile (age, location, gender, etc.). On average, active members receive 3-5 premium surveys per week. Make sure your profile is 100% complete to qualify for more opportunities."
  },
  {
    question: "How much can I earn per survey?",
    answer: "Earnings vary based on the length and complexity of the survey. Short surveys typically pay between KES 20 and KES 100, while longer, specialized surveys can pay up to KES 500."
  },
  {
    question: "Why was I disqualified from a survey?",
    answer: "Some surveys look for very specific demographics (e.g., 'people who own a car' or 'mothers with infants'). If your answers indicate you don't fit the target group, the survey may end early. This is normal, and you will still be eligible for future surveys."
  },
  {
    question: "Is my personal data safe?",
    answer: "Yes. We take data privacy seriously. Your personal contact information is never sold to third parties. We only share anonymized demographic data with survey partners to determine eligibility."
  }
];

export default function HelpView({ onBack }: HelpViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
          <h1 className="text-xl font-bold text-slate-800">Help & Support</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Support CTA */}
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-lg font-bold mb-2">Need immediate help?</h2>
                <p className="text-emerald-100 text-sm mb-4">Our support team is available on WhatsApp to assist with payment verification or account issues.</p>
                <a 
                    href="https://wa.me/254796335209?text=Hello%2C%20I%20need%20help%20with%20Global%20Online%20Survey%20Market"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors shadow-sm"
                >
                    <MessageCircle size={16} />
                    Chat on WhatsApp
                </a>
            </div>
            <HelpCircle size={120} className="absolute -bottom-6 -right-6 text-emerald-500/30" />
        </div>

        {/* FAQs */}
        <div>
            <h3 className="text-slate-800 font-bold text-lg mb-4 px-1">Frequently Asked Questions</h3>
            <div className="space-y-3">
                {faqs.map((faq, index) => (
                    <div key={index} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                        <button 
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                        >
                            <span className="font-medium text-slate-700 pr-4 text-sm">{faq.question}</span>
                            {openIndex === index ? (
                                <ChevronUp size={20} className="text-emerald-600 flex-shrink-0" />
                            ) : (
                                <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                            )}
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-4 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-50 mt-2 pt-2">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="text-center pt-4">
            <p className="text-xs text-slate-400">
                Can't find what you're looking for? <br/>
                Email us at <a href="mailto:josphatwangui51@gmail.com" className="text-emerald-600 hover:underline font-medium">josphatwangui51@gmail.com</a>
            </p>
        </div>
      </main>
    </div>
  );
}