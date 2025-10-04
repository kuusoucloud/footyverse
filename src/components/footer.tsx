import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Matches Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Matches</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-green-600"
                >
                  Live Matches
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Scheduled
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Results
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Highlights
                </Link>
              </li>
            </ul>
          </div>

          {/* Leagues Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Leagues</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Premier Division
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Championship
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  League One
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  All Leagues
                </Link>
              </li>
            </ul>
          </div>

          {/* Features Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  3D Viewer
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Live Stats
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Team Analytics
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Betting Odds
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-green-600">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
          <div className="text-gray-600 mb-4 md:mb-0 flex items-center gap-2">
            <span className="text-lg">⚽</span>© {currentYear} Football 3D. All
            rights reserved.
          </div>

          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
