'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Users, 
  Trophy, 
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Activity,
  Star,
  Zap,
  Shield,
  Eye
} from 'lucide-react';

const supabase = createClient();

interface TeamDetailsProps {
  teamId: string;
  onBack: () => void;
}

export default function TeamDetails({ teamId, onBack }: TeamDetailsProps) {
  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch team details
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        // Fetch team players
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', teamId)
          .order('position', { ascending: true });

        // Fetch team standings
        const { data: standingsData } = await supabase
          .from('team_standings')
          .select(`
            *,
            team:teams(name, tier, elo, primary_color, secondary_color)
          `)
          .eq('team_id', teamId)
          .single();

        // Fetch recent matches (completed)
        const { data: recentMatchesData } = await supabase
          .from('fixtures')
          .select(`
            *,
            home_team:teams!fixtures_home_team_id_fkey(name, primary_color),
            away_team:teams!fixtures_away_team_id_fkey(name, primary_color)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(5);

        // Fetch upcoming matches
        const { data: upcomingMatchesData } = await supabase
          .from('fixtures')
          .select(`
            *,
            home_team:teams!fixtures_home_team_id_fkey(name, primary_color),
            away_team:teams!fixtures_away_team_id_fkey(name, primary_color)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .in('status', ['scheduled', 'live'])
          .order('scheduled_at', { ascending: true })
          .limit(5);

        setTeam(teamData);
        setPlayers(playersData || []);
        setStandings(standingsData);
        setRecentMatches(recentMatchesData || []);
        setUpcomingMatches(upcomingMatchesData || []);
        setLoading(false);

      } catch (error) {
        console.error('Error fetching team data:', error);
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(0)}K`;
    }
    return `£${amount}`;
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return 'bg-yellow-100 text-yellow-800';
      case 'DF': return 'bg-blue-100 text-blue-800';
      case 'MF': return 'bg-green-100 text-green-800';
      case 'FW': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormRating = (rating: number) => {
    if (rating >= 8) return { color: 'text-green-600', icon: <Star className="w-4 h-4" /> };
    if (rating >= 6) return { color: 'text-yellow-600', icon: <Zap className="w-4 h-4" /> };
    return { color: 'text-red-600', icon: <Activity className="w-4 h-4" /> };
  };

  const getWealthColor = (category: string) => {
    switch (category) {
      case 'mega_rich': return 'bg-purple-100 text-purple-800';
      case 'rich': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'very_poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Team not found</h1>
          <Button onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  const totalWages = players.reduce((sum, player) => sum + (player.wage || 0), 0);
  const averageAge = players.length > 0 ? players.reduce((sum, player) => sum + player.age, 0) / players.length : 0;
  const squadValue = players.reduce((sum, player) => sum + (player.market_value || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
          
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              style={{ backgroundColor: team.primary_color }}
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{team.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">Tier {team.tier}</Badge>
                <Badge className={getWealthColor(team.wealth_category)}>
                  {team.wealth_category?.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary">ELO: {Math.round(team.elo)}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Team Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Squad Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.length}</div>
              <p className="text-xs text-muted-foreground">
                Avg Age: {averageAge.toFixed(1)} years
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Squad Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(squadValue)}</div>
              <p className="text-xs text-muted-foreground">
                Total market value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Wages</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalWages)}</div>
              <p className="text-xs text-muted-foreground">
                Per week total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">League Position</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {standings ? `${standings.points} pts` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {standings ? `${standings.won}W ${standings.drawn}D ${standings.lost}L` : 'No data'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="squad" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="squad">Squad</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>
          
          <TabsContent value="squad" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Squad Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['GK', 'DF', 'MF', 'FW'].map((position) => {
                    const positionPlayers = players.filter(p => p.position === position);
                    return (
                      <div key={position}>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Badge className={getPositionColor(position)}>
                            {position}
                          </Badge>
                          {position === 'GK' ? 'Goalkeepers' : 
                           position === 'DF' ? 'Defenders' :
                           position === 'MF' ? 'Midfielders' : 'Forwards'}
                          <span className="text-sm text-gray-500">({positionPlayers.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {positionPlayers.map((player) => {
                            const form = getFormRating(player.form_rating || 5);
                            return (
                              <div key={player.id} className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold">{player.name}</h4>
                                    <p className="text-sm text-gray-600">Age: {player.age}</p>
                                  </div>
                                  <div className={`flex items-center gap-1 ${form.color}`}>
                                    {form.icon}
                                    <span className="text-sm font-medium">{player.form_rating || 5}</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-500">Value:</span>
                                    <span className="font-medium ml-1">{formatCurrency(player.market_value || 0)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Wage:</span>
                                    <span className="font-medium ml-1">{formatCurrency(player.wage || 0)}/w</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Goals:</span>
                                    <span className="font-medium ml-1">{player.goals || 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Assists:</span>
                                    <span className="font-medium ml-1">{player.assists || 0}</span>
                                  </div>
                                </div>

                                {player.injury_status !== 'fit' && (
                                  <Badge variant="destructive" className="mt-2">
                                    {player.injury_status}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {position !== 'FW' && <Separator className="mt-6" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fixtures" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMatches.length > 0 ? (
                    <div className="space-y-3">
                      {recentMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {match.home_team.name}
                              </div>
                              <div className="text-xs text-gray-500">vs</div>
                              <div className="text-sm font-medium">
                                {match.away_team.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {match.home_score || 0} - {match.away_score || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(match.scheduled_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent matches</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Upcoming Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingMatches.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMatches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {match.home_team.name}
                              </div>
                              <div className="text-xs text-gray-500">vs</div>
                              <div className="text-sm font-medium">
                                {match.away_team.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <Badge variant={match.status === 'live' ? 'destructive' : 'secondary'}>
                              {match.status}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(match.scheduled_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming matches</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Season Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {standings ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{standings.won}</div>
                      <div className="text-sm text-gray-500">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">{standings.drawn}</div>
                      <div className="text-sm text-gray-500">Draws</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{standings.lost}</div>
                      <div className="text-sm text-gray-500">Losses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{standings.points}</div>
                      <div className="text-sm text-gray-500">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{standings.gf}</div>
                      <div className="text-sm text-gray-500">Goals For</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{standings.ga}</div>
                      <div className="text-sm text-gray-500">Goals Against</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${standings.gd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {standings.gd >= 0 ? '+' : ''}{standings.gd}
                      </div>
                      <div className="text-sm text-gray-500">Goal Difference</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{standings.played}</div>
                      <div className="text-sm text-gray-500">Played</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="finances" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Transfer Budget:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(team.transfer_budget || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Weekly Wages:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(totalWages)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Squad Value:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(squadValue)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Wealth Category:</span>
                      <Badge className={getWealthColor(team.wealth_category)}>
                        {team.wealth_category?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Top Earners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {players
                      .sort((a, b) => (b.wage || 0) - (a.wage || 0))
                      .slice(0, 5)
                      .map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.position}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(player.wage || 0)}</div>
                            <div className="text-xs text-gray-500">per week</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}