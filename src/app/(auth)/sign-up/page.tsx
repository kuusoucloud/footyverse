import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Signup(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl">⚽</span>
            <span className="text-2xl font-bold text-white">Football Universe</span>
          </div>
          <FormMessage message={searchParams} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">⚽</span>
            <span className="text-2xl font-bold text-white">Football Universe</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Create your account</h1>
          <p className="text-slate-400 text-sm">
            Join the autonomous football ecosystem
          </p>
        </div>

        <form className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="glass-input mt-1 text-white placeholder-slate-400"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              minLength={6}
              required
              className="glass-input mt-1 text-white placeholder-slate-400"
            />
          </div>
          <SubmitButton 
            pendingText="Signing up..." 
            formAction={signUpAction}
            className="w-full glass-primary text-white font-medium py-2 px-4 rounded-lg hover:scale-105 transition-all duration-300"
          >
            Sign up
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}