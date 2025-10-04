'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayerDetails from '@/components/player-details';
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
  Eye,
  AlertTriangle
} from 'lucide-react';

const supabase = createClient();

// Generate random MALE player avatar based on nationality/ethnicity
const getPlayerAvatar = (nationality: string, name: string) => {
  const seed = name.toLowerCase().replace(/\s+/g, '');
  
  // Use male-only avatar styles
  const maleAvatarStyles = [
    'adventurer', 'adventurer-neutral', 'big-ears', 'big-ears-neutral', 
    'bottts', 'croodles', 'croodles-neutral', 'fun-emoji', 'identicon', 
    'initials', 'micah', 'miniavs', 'pixel-art', 'pixel-art-neutral'
  ];
  
  // Use different avatar styles based on nationality for variety
  const nationalityMap: { [key: string]: string } = {
    'England': 'adventurer',
    'Spain': 'big-ears',
    'France': 'micah',
    'Germany': 'adventurer-neutral',
    'Italy': 'big-ears-neutral',
    'Brazil': 'croodles',
    'Argentina': 'croodles-neutral',
    'Portugal': 'miniavs',
    'Netherlands': 'pixel-art',
    'Belgium': 'pixel-art-neutral'
  };
  
  const style = nationalityMap[nationality] || 'adventurer';
  // Add male-specific options to ensure male avatars
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&gender=male`;
};

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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('squad');

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
            home_team:teams!fixtures_home_team_id_fkey(name, primary_color, logo_url),
            away_team:teams!fixtures_away_team_id_fkey(name, primary_color, logo_url)
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
            home_team:teams!fixtures_home_team_id_fkey(name, primary_color, logo_url),
            away_team:teams!fixtures_away_team_id_fkey(name, primary_color, logo_url)
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
    if (rating >= 8) return { color: 'text-green-600', icon: <TrendingUp className="w-4 h-4" /> };
    if (rating >= 6) return { color: 'text-yellow-600', icon: <Activity className="w-4 h-4" /> };
    return { color: 'text-red-600', icon: <TrendingUp className="w-4 h-4 rotate-180" /> };
  };

  const getSkillRating = (skill: number) => {
    if (skill >= 80) return { color: 'text-green-600', icon: <Star className="w-4 h-4" />, label: 'Elite' };
    if (skill >= 70) return { color: 'text-blue-600', icon: <Zap className="w-4 h-4" />, label: 'Excellent' };
    if (skill >= 60) return { color: 'text-yellow-600', icon: <Shield className="w-4 h-4" />, label: 'Good' };
    if (skill >= 50) return { color: 'text-orange-600', icon: <Activity className="w-4 h-4" />, label: 'Average' };
    return { color: 'text-red-600', icon: <Activity className="w-4 h-4" />, label: 'Poor' };
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

  // If a player is selected, show the player details page
  if (selectedPlayerId) {
    return (
      <PlayerDetails 
        playerId={selectedPlayerId} 
        onBack={() => setSelectedPlayerId(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="glass-card p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-700 rounded w-1/3"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              <div className="grid grid-cols-4 gap-4 mt-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-300 mb-4">Team not found</h1>
          <Button onClick={onBack} className="glass-button">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  const totalWages = players.reduce((sum, player) => sum + (player.weekly_wage || 0), 0);
  const averageAge = players.length > 0 ? players.reduce((sum, player) => sum + player.age, 0) / players.length : 0;
  const squadValue = players.reduce((sum, player) => sum + (player.market_value || 0), 0);

  const leaguePosition = standings ? standings.points : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="glass-button px-4 py-2 rounded-lg text-slate-300 hover:text-white transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </button>
        </div>

        {loading ? (
          <div className="glass-card p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-700 rounded w-1/3"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              <div className="grid grid-cols-4 gap-4 mt-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : team ? (
          <div className="space-y-8">
            {/* Team Header */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-6">
                <img 
                  src={team.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${team.name}`}
                  alt={team.name}
                  className="w-24 h-24 rounded-lg"
                />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
                  <div className="flex items-center gap-4 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      Tier {team.tier}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      ELO: {team.elo_rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Budget: £{team.transfer_budget?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">League Position</h3>
                  <Trophy className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">{leaguePosition}</div>
                <p className="text-xs text-slate-400">in Tier {team.tier}</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Points</h3>
                  <Target className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">{standings?.points || 0}</div>
                <p className="text-xs text-slate-400">{standings?.matches_played || 0} matches played</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Goals</h3>
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {standings?.goals_for || 0} - {standings?.goals_against || 0}
                </div>
                <p className="text-xs text-slate-400">
                  GD: {(standings?.goals_for || 0) - (standings?.goals_against || 0)}
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Squad Size</h3>
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">{players.length}</div>
                <p className="text-xs text-slate-400">active players</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="glass-card p-1">
              <div className="grid grid-cols-4 gap-1">
                {['squad', 'matches', 'transfers', 'finances'].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'glass-primary text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'squad' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Squad ({players.length} players)
                </h3>
                
                {/* Position Groups */}
                {['GK', 'DF', 'MF', 'FW'].map(position => {
                  const positionPlayers = players.filter(p => p.position === position);
                  if (positionPlayers.length === 0) return null;
                  
                  return (
                    <div key={position} className="mb-8">
                      <h4 className="text-md font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          position === 'GK' ? 'bg-yellow-400' :
                          position === 'DF' ? 'bg-blue-400' :
                          position === 'MF' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        {position === 'GK' ? 'Goalkeepers' :
                         position === 'DF' ? 'Defenders' :
                         position === 'MF' ? 'Midfielders' : 'Forwards'} ({positionPlayers.length})
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {positionPlayers
                          .sort((a, b) => b.skill_rating - a.skill_rating)
                          .map((player, index) => {
                            const form = getFormRating(player.form_rating || 5);
                            const skill = getSkillRating(player.skill_rating);
                            
                            return (
                              <div 
                                key={player.id} 
                                className="glass-row p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/20"
                                onClick={() => setSelectedPlayerId(player.id)}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                                    <img 
                                      src={getPlayerAvatar(player.nationality || 'England', player.name)}
                                      alt={player.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-white text-sm">{player.name}</div>
                                    <div className="text-xs text-slate-400">Age {player.age} • #{player.jersey_number || (index + 1)}</div>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                                    {player.position}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="text-slate-400">Overall</div>
                                    <div className={`font-bold ${skill.color}`}>{player.skill_rating}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-slate-400">Form</div>
                                    <div className={`font-bold ${form.color} flex items-center justify-center gap-1`}>
                                      {form.icon}
                                      {(player.form_rating || 5).toFixed(1)}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-slate-400">Value</div>
                                    <div className="font-bold text-white">
                                      {formatCurrency(player.market_value || 0)}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Weekly Wage</span>
                                    <span className="text-white font-medium">
                                      £{player.weekly_wage?.toLocaleString()}/w
                                    </span>
                                  </div>
                                  {player.injury_status !== 'fit' && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <AlertTriangle className="h-3 w-3 text-red-400" />
                                      <span className="text-red-400 text-xs">Injured</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="space-y-6">
                {/* Upcoming Fixtures */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    Upcoming Fixtures
                  </h3>
                  <div className="space-y-4">
                    {upcomingMatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No upcoming fixtures</p>
                      </div>
                    ) : (
                      upcomingMatches.map((match) => (
                        <div key={match.id} className="glass-row p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-slate-400 min-w-[120px]">
                                {new Date(match.scheduled_at).toLocaleDateString('en-GB', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <img 
                                  src={match.home_team.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.home_team.name}`}
                                  alt={match.home_team.name}
                                  className="w-6 h-6 rounded"
                                />
                                <span className="text-white font-medium">
                                  {match.home_team.name}
                                </span>
                                <span className="text-slate-400 mx-2">vs</span>
                                <img 
                                  src={match.away_team.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.away_team.name}`}
                                  alt={match.away_team.name}
                                  className="w-6 h-6 rounded"
                                />
                                <span className="text-white font-medium">
                                  {match.away_team.name}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${ 
                                match.status === 'live' ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {match.status === 'live' ? 'LIVE' : 'Scheduled'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {match.home_team_id === teamId ? 'Home' : 'Away'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Matches */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Recent Results
                  </h3>
                  <div className="space-y-4">
                    {recentMatches.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No recent matches</p>
                      </div>
                    ) : (
                      recentMatches.map((match) => {
                        const isHome = match.home_team_id === teamId;
                        const teamScore = isHome ? match.home_score : match.away_score;
                        const opponentScore = isHome ? match.away_score : match.home_score;
                        const opponent = isHome ? match.away_team : match.home_team;
                        const result = teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';
                        
                        return (
                          <div key={match.id} className="glass-row p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-400 min-w-[100px]">
                                  {new Date(match.scheduled_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short'
                                  })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={opponent.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${opponent.name}`}
                                    alt={opponent.name}
                                    className="w-6 h-6 rounded"
                                  />
                                  <span className="text-white font-medium">
                                    {isHome ? 'vs' : '@'} {opponent.name}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div className="font-bold text-white">
                                  {teamScore} - {opponentScore}
                                </div>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  result === 'W' ? 'bg-green-500 text-white' :
                                  result === 'L' ? 'bg-red-500 text-white' :
                                  'bg-yellow-500 text-black'
                                }`}>
                                  {result}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transfers' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  Transfer Activity
                </h3>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No recent transfers</p>
                  <p className="text-sm text-slate-500 mt-2">Transfer activity will appear here</p>
                </div>
              </div>
            )}

            {activeTab === 'finances' && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Financial Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-row p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Transfer Budget</div>
                    <div className="text-2xl font-bold text-white">
                      £{team.transfer_budget?.toLocaleString()}
                    </div>
                  </div>
                  <div className="glass-row p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Weekly Wage Budget</div>
                    <div className="text-2xl font-bold text-white">
                      £{team.weekly_wage_budget?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400">Team not found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}