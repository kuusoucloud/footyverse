export default function Footer() {
  return (
    <footer className="glass-card border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">⚽</span>
              <span className="text-xl font-bold text-white">Football Universe</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              The most advanced autonomous football ecosystem. Experience live matches, 
              player transfers, and league progression in real-time.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Live Match Simulation</li>
              <li>Transfer Market</li>
              <li>League Standings</li>
              <li>Player Statistics</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">System</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Server-Driven</li>
              <li>Real-time Updates</li>
              <li>Global Sync</li>
              <li>Autonomous AI</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2024 Football Universe. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}