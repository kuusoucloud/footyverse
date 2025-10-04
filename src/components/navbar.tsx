'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { signOutAction } from "@/app/actions";
import { ThemeSwitcher } from "./theme-switcher";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚽</span>
              <span className="text-xl font-bold text-white">Football Universe</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Dashboard
              </Link>
              <Link
                href="/matches"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300"
              >
                Matches
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-300">
                  Hey, {user.email}!
                </span>
                <form action={signOutAction}>
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="glass-button border-white/20 text-slate-300 hover:text-white hover:bg-white/20"
                  >
                    Sign out
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" className="glass-button border-white/20 text-slate-300 hover:text-white hover:bg-white/20">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild className="glass-primary text-white">
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}