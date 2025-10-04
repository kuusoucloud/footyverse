'use client';

import Link from "next/link";
import { Button } from "./ui/button";

export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link
          href="/"
          prefetch
          className="text-xl font-bold flex items-center gap-2"
        >
          <span className="text-2xl">⚽</span>
          <span>Football 3D</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Button>Watch Matches</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}