import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="glass-card p-12 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              <span className="text-blue-400">⚽</span> Football Universe
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Experience the most advanced autonomous football ecosystem. 
              Watch live matches, track player transfers, and follow your favorite teams 
              in a completely server-driven universe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="glass-primary px-8 py-4 rounded-lg font-semibold text-white hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Enter Universe
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/matches"
                className="glass-button px-8 py-4 rounded-lg font-semibold text-slate-300 hover:text-white transition-all duration-300"
              >
                Watch Live Matches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}