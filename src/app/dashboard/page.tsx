import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Trophy, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Football 3D Viewer</h1>
          <p className="text-gray-600">Watch live matches and explore the football universe</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-gray-600">Live Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600">Scheduled Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-gray-600">Active Leagues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100</p>
                  <p className="text-sm text-gray-600">Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Matches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Live Matches</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { home: "Crimson Eagles", away: "Azure Wolves", homeScore: 2, awayScore: 1 },
              { home: "Golden Lions", away: "Silver Hawks", homeScore: 0, awayScore: 3 },
              { home: "Thunder Bolts", away: "Storm Riders", homeScore: 1, awayScore: 1 }
            ].map((match, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">LIVE</Badge>
                    <span className="text-sm text-gray-600">45' + 2</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                        <span className="font-medium">{match.home}</span>
                      </div>
                      <span className="text-2xl font-bold">{match.homeScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{match.away}</span>
                      </div>
                      <span className="text-2xl font-bold">{match.awayScore}</span>
                    </div>
                    <Button className="w-full mt-4">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Live
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { home: "Phoenix United", away: "Dragon Force", time: "15:00" },
              { home: "Titan Rovers", away: "Nova Stars", time: "17:30" },
              { home: "Viper City", away: "Falcon Athletic", time: "20:00" },
              { home: "Lightning FC", away: "Meteor United", time: "15:00" },
              { home: "Blaze Warriors", away: "Frost Giants", time: "17:30" },
              { home: "Shadow Hunters", away: "Crystal Palace", time: "20:00" }
            ].map((match, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">SCHEDULED</Badge>
                    <span className="text-sm text-gray-600">{match.time}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{match.home}</span>
                      </div>
                      <span className="text-sm text-gray-500">vs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">{match.away}</span>
                      </div>
                      <span className="text-sm text-gray-500">Premier Division</span>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      <Clock className="w-4 h-4 mr-2" />
                      Set Reminder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* League Standings Preview */}
        <div>
          <h2 className="text-2xl font-bold mb-4">League Standings</h2>
          <Card>
            <CardHeader>
              <CardTitle>Premier Division</CardTitle>
              <CardDescription>Current season standings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { team: "Quantum City", played: 15, points: 42 },
                  { team: "Phoenix United", played: 15, points: 39 },
                  { team: "Thunder Bolts", played: 15, points: 37 },
                  { team: "Azure Wolves", played: 15, points: 31 },
                  { team: "Golden Lions", played: 15, points: 28 }
                ].map((team, index) => (
                  <div key={team.team} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-medium">{index + 1}</span>
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span className="font-medium">{team.team}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>{team.played} played</span>
                      <span className="font-bold text-black">{team.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}