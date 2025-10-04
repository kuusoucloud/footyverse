import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, CheckCircle2, Eye, Play, Trophy, Users, Zap, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Experience Football Like Never Before</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Immerse yourself in the beautiful game with our cutting-edge 3D match viewer and autonomous football universe.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Eye className="w-6 h-6" />, title: "3D Match Visualization", description: "Broadcast-style camera views with realistic player models and ball physics" },
              { icon: <Play className="w-6 h-6" />, title: "Live Match Streaming", description: "Real-time match data streaming with instant position updates" },
              { icon: <Trophy className="w-6 h-6" />, title: "Multi-Tier Leagues", description: "100 teams across 5 leagues with promotion and relegation" },
              { icon: <TrendingUp className="w-6 h-6" />, title: "ELO Ratings", description: "Advanced statistics and team performance tracking" }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-green-600 mb-2">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Match Experience Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The Complete Match Experience</h2>
            <p className="text-green-100 max-w-2xl mx-auto">From match selection to final whistle, every moment is crafted for the ultimate football viewing experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Leagues</h3>
              <p className="text-green-100">Explore matches across multiple divisions and competitions</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Watch Live</h3>
              <p className="text-green-100">Immersive 3D visualization with multiple camera angles</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Stats</h3>
              <p className="text-green-100">Live betting odds, team stats, and match analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The Football Universe</h2>
            <p className="text-gray-600">A complete autonomous ecosystem running 24/7</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 text-green-600">100</div>
              <div className="text-gray-600">Active Teams</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-green-600">5</div>
              <div className="text-gray-600">League Divisions</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-green-600">24/7</div>
              <div className="text-gray-600">Live Matches</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-green-600">∞</div>
              <div className="text-gray-600">Possibilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Powered by Three.js & Supabase</Badge>
            <h2 className="text-3xl font-bold mb-4">Built with Modern Technology</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our platform combines cutting-edge 3D rendering with real-time data streaming for an unparalleled experience.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">Real-time Match Simulation</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Server-side match simulation with realistic physics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Live data streaming via Supabase Realtime</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Dynamic camera angles and broadcast-style presentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Procedurally generated teams and player statistics</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">⚽</div>
              <h4 className="text-xl font-semibold mb-2">Live Match Viewer</h4>
              <p className="text-gray-600">Experience the future of football broadcasting</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enter the Stadium?</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">Join the revolution in football viewing. Watch live matches, explore leagues, and experience the beautiful game like never before.</p>
          <a href="/dashboard" className="inline-flex items-center px-8 py-4 text-green-600 bg-white rounded-lg hover:bg-gray-100 transition-colors font-semibold">
            Start Watching Now
            <ArrowUpRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}