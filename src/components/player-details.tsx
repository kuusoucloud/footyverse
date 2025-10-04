'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  User, 
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
  Heart,
  Clock,
  MapPin,
  Shirt,
  BarChart3,
  History,
  Banknote,
  FileText,
  AlertTriangle
} from 'lucide-react';

const supabase = createClient();

interface PlayerDetailsProps {
  playerId: string;
  onBack: () => void;
}

export default function PlayerDetails({ playerId, onBack }: PlayerDetailsProps) {
  const [player, setPlayer] = useState<any>(null);
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [playerHistory, setPlayerHistory] = useState<any[]>([]);
  const [matchStats, setMatchStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        // Fetch player details with current team - get ALL fields from database
        const { data: playerData } = await supabase
          .from('players')
          .select(`
            *,
            team:teams(*)
          `)
          .eq('id', playerId)
          .single();

        // Fetch player transfer history
        const { data: historyData } = await supabase
          .from('transfers')
          .select(`
            *,
            from_team:teams!transfers_from_team_id_fkey(name, logo_url, tier),
            to_team:teams!transfers_to_team_id_fkey(name, logo_url, tier)
          `)
          .eq('player_id', playerId)
          .order('transfer_date', { ascending: false });

        // Fetch recent match stats
        const { data: statsData } = await supabase
          .from('player_match_stats')
          .select(`
            *,
            match:matches(
              *,
              fixture:fixtures(
                *,
                home_team:teams!fixtures_home_team_id_fkey(name, logo_url),
                away_team:teams!fixtures_away_team_id_fkey(name, logo_url)
              )
            )
          `)
          .eq('player_id', playerId)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log('Player data from database:', playerData);
        
        setPlayer(playerData);
        setCurrentTeam(playerData?.team);
        setPlayerHistory(historyData || []);
        setMatchStats(statsData || []);
        setLoading(false);

      } catch (error) {
        console.error('Error fetching player data:', error);
        setLoading(false);
      }
    };

    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  // Use real data from database only
  const displayPlayer = player;
  const displayTeam = currentTeam;
  const displayHistory = playerHistory;

  // Use real attributes from database with null check
  const attributes = player?.attributes || {};

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

  const getPositionName = (position: string) => {
    switch (position) {
      case 'GK': return 'Goalkeeper';
      case 'DF': return 'Defender';
      case 'MF': return 'Midfielder';
      case 'FW': return 'Forward';
      default: return position;
    }
  };

  const getSkillColor = (skill: number) => {
    if (skill >= 90) return 'text-purple-600';
    if (skill >= 80) return 'text-green-600';
    if (skill >= 70) return 'text-blue-600';
    if (skill >= 60) return 'text-yellow-600';
    if (skill >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSkillBarColor = (skill: number) => {
    if (skill >= 90) return 'bg-purple-500';
    if (skill >= 80) return 'bg-green-500';
    if (skill >= 70) return 'bg-blue-500';
    if (skill >= 60) return 'bg-yellow-500';
    if (skill >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getFormRating = (rating: number) => {
    if (rating >= 8) return { color: 'text-green-600', icon: <TrendingUp className="w-4 h-4" />, label: 'Excellent' };
    if (rating >= 6) return { color: 'text-yellow-600', icon: <Activity className="w-4 h-4" />, label: 'Good' };
    return { color: 'text-red-600', icon: <TrendingUp className="w-4 h-4 rotate-180" />, label: 'Poor' };
  };

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

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="glass-card p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400">Player not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const form = getFormRating(displayPlayer.form_rating || 5);

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
            Back to Team
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
        ) : player ? (
          <div className="space-y-8">
            {/* Player Header */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{player.name}</h1>
                  <div className="flex items-center gap-4 text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {player.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Age {player.age}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Overall: {player.overall_rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Market Value</h3>
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  £{player.market_value?.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">Current valuation</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Weekly Wage</h3>
                  <Banknote className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  £{player.weekly_wage?.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">per week</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Contract</h3>
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {player.contract_years_remaining}
                </div>
                <p className="text-xs text-slate-400">years remaining</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">Status</h3>
                  <Activity className="h-4 w-4 text-slate-400" />
                </div>
                <div className={`text-2xl font-bold ${
                  player.injury_status === 'fit' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {player.injury_status === 'fit' ? 'Fit' : 'Injured'}
                </div>
                <p className="text-xs text-slate-400">
                  {player.injury_status === 'fit' ? 'Ready to play' : 'Recovering'}
                </p>
              </div>
            </div>

            {/* Player Attributes */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                Player Attributes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Pace', value: player.pace || 0 },
                  { name: 'Shooting', value: player.shooting || 0 },
                  { name: 'Passing', value: player.passing || 0 },
                  { name: 'Dribbling', value: player.dribbling || 0 },
                  { name: 'Defending', value: player.defending || 0 },
                  { name: 'Physical', value: player.physical || 0 }
                ].map((attr) => (
                  <div key={attr.name} className="glass-row p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-300">{attr.name}</span>
                      <span className="text-sm font-bold text-white">{attr.value}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${attr.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Information */}
            {team && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Team Information
                </h3>
                <div className="flex items-center gap-4">
                  <img 
                    src={team.logo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${team.name}`}
                    alt={team.name}
                    className="w-16 h-16 rounded-lg"
                  />
                  <div>
                    <div className="text-xl font-bold text-white">{team.name}</div>
                    <div className="text-slate-400">Tier {team.tier} • ELO: {team.elo_rating}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400">Player not found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}