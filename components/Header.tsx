import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-900 text-white py-10 px-4 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center z-10 relative">
        <div className="bg-white/10 p-3 rounded-2xl mb-4 backdrop-blur-sm border border-white/10">
          <BarChart3 className="text-emerald-400" size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Global Online Survey Market
        </h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
          Access premium global surveys and earn rewards. Login to your dashboard to get started.
        </p>
      </div>
    </header>
  );
}