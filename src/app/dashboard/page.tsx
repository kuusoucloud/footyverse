import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AutomatedFootballApp from "@/components/automated-football-app";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AutomatedFootballApp />
    </div>
  );
}