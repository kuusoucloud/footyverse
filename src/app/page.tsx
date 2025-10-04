import Hero from "@/components/hero";
import FootballApp from "@/components/football-app";

export default async function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <FootballApp />
    </div>
  );
}