import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="glass-card min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-green-900/20"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Football Universe
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">
                Live 3D Matches
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Experience the future of football simulation with real-time 3D matches, 
              autonomous leagues, and immersive broadcast-style viewing.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl mb-3">⚽</div>
              <h3 className="text-lg font-semibold text-white mb-2">Live 3D Matches</h3>
              <p className="text-slate-400 text-sm">Watch matches unfold in real-time with cinematic camera angles</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-semibold text-white mb-2">Autonomous Leagues</h3>
              <p className="text-slate-400 text-sm">100 teams across 5 tiers with promotion and relegation</p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Statistics</h3>
              <p className="text-slate-400 text-sm">Real-time stats, betting odds, and match analytics</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="glass-primary px-8 py-4 rounded-lg font-semibold text-white flex items-center gap-2 hover:scale-105 transition-all duration-300"
            >
              Watch Live Matches
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/sign-up"
              className="glass-button border-white/20 text-slate-300 hover:text-white hover:bg-white/20 px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300"
            >
              Join the Universe
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">100</div>
              <div className="text-sm text-slate-400">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">2,200+</div>
              <div className="text-sm text-slate-400">Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-slate-400">Live Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">5</div>
              <div className="text-sm text-slate-400">League Tiers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}