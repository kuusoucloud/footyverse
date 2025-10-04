import Link from "next/link";
import { ArrowUpRight, Check, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 opacity-70" />

      {/* Football field pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-64 border-2 border-green-600 rounded-lg">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-600"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-green-600 rounded-full"></div>
        </div>
      </div>

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm font-medium">
              🏆 Football Manager Meets 3D Visualization
            </Badge>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Experience{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                Football
              </span>{" "}
              in Full 3D
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Watch live football matches in stunning 3D visualization. Browse
              leagues, follow teams, and experience the beautiful game like
              never before with our autonomous football universe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium shadow-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Live Matches
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                Explore Features
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>100 Teams • 5 Leagues</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Real-time 3D Matches</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Live Statistics & Odds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
