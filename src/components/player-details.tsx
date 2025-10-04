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
  History
} from 'lucide-react';

const supabase = createClient();

interface PlayerDetailsProps {
  playerId: string;
  onBack: () => void;
}

export default function PlayerDetails({ playerId = "sample-player-id", onBack = () => {} }: PlayerDetailsProps) {
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
        // Fetch player details with current team
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

  // Mock data for demo purposes when no real data is available
  const mockPlayer = {
    id: 'mock-player-1',
    name: 'Marcus Rodriguez',
    position: 'MF',
    age: 24,
    nationality: 'Spain',
    height_cm: 178,
    weight_kg: 72,
    foot: 'R',
    overall_rating: 78,
    market_value: 15000000,
    weekly_wage: 45000,
    contract_end: '2026-06-30',
    injury_status: 'fit',
    form_rating: 8,
    goals: 12,
    assists: 8,
    appearances: 28,
    attributes: {
      pace: 82,
      accel: 85,
      stamina: 78,
      strength: 70,
      passing: 88,
      vision: 85,
      finishing: 75,
      heading: 65,
      marking: 72,
      tackling: 74,
      reflexes: 45,
      handling: 40,
      positioning: 80,
      composure: 83
    }
  };

  const mockTeam = {
    name: 'Barcelona FC',
    logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&q=80',
    tier: 1,
    primary_color: '#004D98'
  };

  const mockHistory = [
    {
      id: 1,
      transfer_date: '2023-07-01',
      transfer_fee: 12000000,
      from_team: { name: 'Valencia CF', logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=50&q=80', tier: 1 },
      to_team: mockTeam,
      transfer_type: 'permanent'
    },
    {
      id: 2,
      transfer_date: '2021-08-15',
      transfer_fee: 3500000,
      from_team: { name: 'Real Betis', logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=50&q=80', tier: 2 },
      to_team: { name: 'Valencia CF', logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=50&q=80', tier: 1 },
      transfer_type: 'permanent'
    }
  ];

  // Use real data from database, fallback to mock only if no data exists
  const displayPlayer = player || mockPlayer;
  const displayTeam = currentTeam || mockTeam;
  const displayHistory = playerHistory.length > 0 ? playerHistory : mockHistory;

  // Use real attributes from database or generate based on skill rating
  const attributes = player?.attributes || {
    pace: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    accel: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    stamina: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    strength: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    passing: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    vision: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    finishing: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    heading: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    marking: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    tackling: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    positioning: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    composure: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    reflexes: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10))),
    handling: Math.max(30, Math.min(99, (player?.skill_rating || 50) + (Math.random() * 20 - 10)))
  };

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

  const form = getFormRating(displayPlayer.form_rating || 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Players
          </Button>
          
          <div className="flex items-center gap-6">
            {/* Player Avatar */}
            <div className="relative">
              <img 
                src={getPlayerAvatar(displayPlayer.nationality || 'England', displayPlayer.name)}
                alt={`${displayPlayer.name} avatar`}
                className="w-24 h-24 rounded-full border-4 border-white shadow-xl bg-white"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold"
                   style={{ backgroundColor: displayTeam?.primary_color || '#004D98', color: 'white' }}>
                {displayPlayer.shirt_number || '?'}
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{displayPlayer.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getPositionColor(displayPlayer.position)}>
                  {getPositionName(displayPlayer.position)}
                </Badge>
                <Badge variant="outline">Age {displayPlayer.age}</Badge>
                <Badge variant="secondary">{displayPlayer.nationality}</Badge>
                <Badge variant="outline">Overall: {displayPlayer.skill_rating || 'N/A'}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Current Club:</span>
                <div className="flex items-center gap-2">
                  {displayTeam?.logo_url && (
                    <img 
                      src={displayTeam.logo_url} 
                      alt={`${displayTeam.name} logo`}
                      className="w-6 h-6 rounded border border-gray-200"
                    />
                  )}
                  <span className="font-medium">{displayTeam?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(displayPlayer.market_value || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Current valuation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Wage</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(displayPlayer.weekly_wage || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Per week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Form Rating</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${form.color}`}>
                {displayPlayer.form_rating || 5}/10
              </div>
              <p className="text-xs text-muted-foreground">
                {form.label}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayPlayer.goals || 0}</div>
              <p className="text-xs text-muted-foreground">
                This season
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assists</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayPlayer.assists || 0}</div>
              <p className="text-xs text-muted-foreground">
                This season
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="history">Career</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Player Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Height:</span>
                        <span className="font-medium ml-2">{displayPlayer.height_cm || 180}cm</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium ml-2">{displayPlayer.weight_kg || 75}kg</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Preferred Foot:</span>
                        <span className="font-medium ml-2">{displayPlayer.foot === 'L' ? 'Left' : 'Right'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Nationality:</span>
                        <span className="font-medium ml-2">{displayPlayer.nationality}</span>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-gray-600">Injury Status:</span>
                      <Badge 
                        variant={displayPlayer.injury_status === 'fit' ? 'secondary' : 'destructive'}
                        className="ml-2"
                      >
                        {displayPlayer.injury_status || 'fit'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Season Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{displayPlayer.goals || 0}</div>
                        <div className="text-sm text-gray-500">Goals</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{displayPlayer.assists || 0}</div>
                        <div className="text-sm text-gray-500">Assists</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{displayPlayer.appearances || 0}</div>
                        <div className="text-sm text-gray-500">Apps</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Form Rating:</span>
                        <div className={`flex items-center gap-1 ${form.color}`}>
                          {form.icon}
                          <span className="font-medium">{displayPlayer.form_rating || 5}/10</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Rating:</span>
                        <span className="font-medium">{displayPlayer.skill_rating || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Player Attributes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Physical Attributes */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Physical
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Pace', value: attributes.pace || 50 },
                        { name: 'Acceleration', value: attributes.accel || 50 },
                        { name: 'Stamina', value: attributes.stamina || 50 },
                        { name: 'Strength', value: attributes.strength || 50 }
                      ].map((attr) => (
                        <div key={attr.name} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{attr.name}</span>
                            <span className={`text-sm font-bold ${getSkillColor(attr.value)}`}>
                              {attr.value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getSkillBarColor(attr.value)}`}
                              style={{ width: `${attr.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Attributes */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Technical
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Passing', value: attributes.passing || 50 },
                        { name: 'Vision', value: attributes.vision || 50 },
                        { name: 'Finishing', value: attributes.finishing || 50 },
                        { name: 'Heading', value: attributes.heading || 50 }
                      ].map((attr) => (
                        <div key={attr.name} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{attr.name}</span>
                            <span className={`text-sm font-bold ${getSkillColor(attr.value)}`}>
                              {attr.value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getSkillBarColor(attr.value)}`}
                              style={{ width: `${attr.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mental/Defensive Attributes */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-500" />
                      Mental & Defensive
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Positioning', value: attributes.positioning || 50 },
                        { name: 'Composure', value: attributes.composure || 50 },
                        { name: 'Marking', value: attributes.marking || 50 },
                        { name: 'Tackling', value: attributes.tackling || 50 }
                      ].map((attr) => (
                        <div key={attr.name} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{attr.name}</span>
                            <span className={`text-sm font-bold ${getSkillColor(attr.value)}`}>
                              {attr.value}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getSkillBarColor(attr.value)}`}
                              style={{ width: `${attr.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goalkeeper Attributes (if applicable) */}
                  {displayPlayer.position === 'GK' && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-yellow-500" />
                        Goalkeeping
                      </h3>
                      <div className="space-y-3">
                        {[
                          { name: 'Reflexes', value: attributes.reflexes || 50 },
                          { name: 'Handling', value: attributes.handling || 50 }
                        ].map((attr) => (
                          <div key={attr.name} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{attr.name}</span>
                              <span className={`text-sm font-bold ${getSkillColor(attr.value)}`}>
                                {attr.value}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getSkillBarColor(attr.value)}`}
                                style={{ width: `${attr.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Match Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchStats.length > 0 ? (
                  <div className="space-y-4">
                    {matchStats.map((stat) => (
                      <div key={stat.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {stat.match?.fixture?.home_team?.name} vs {stat.match?.fixture?.away_team?.name}
                            </span>
                            <Badge variant="outline">
                              {new Date(stat.match?.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="text-sm font-bold">
                            Rating: {stat.rating}/10
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Goals:</span>
                            <span className="font-medium ml-1">{stat.goals}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Assists:</span>
                            <span className="font-medium ml-1">{stat.assists}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Minutes:</span>
                            <span className="font-medium ml-1">{stat.minutes}'</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Shots:</span>
                            <span className="font-medium ml-1">{stat.shots}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No match statistics available</p>
                    <p className="text-sm text-gray-400 mt-2">Statistics will appear here after matches are played</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Career History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayHistory.map((transfer, index) => (
                    <div key={transfer.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {transfer.from_team?.logo_url && (
                          <img 
                            src={transfer.from_team.logo_url} 
                            alt={`${transfer.from_team.name} logo`}
                            className="w-8 h-8 rounded border border-gray-200"
                          />
                        )}
                        <div className="text-center">
                          <div className="text-sm font-medium">{transfer.from_team?.name}</div>
                          <div className="text-xs text-gray-500">
                            Tier {transfer.from_team?.tier}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(transfer.transfer_fee || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transfer.transfer_date).toLocaleDateString()}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {transfer.transfer_type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-medium">{transfer.to_team?.name}</div>
                          <div className="text-xs text-gray-500">
                            Tier {transfer.to_team?.tier}
                          </div>
                        </div>
                        {transfer.to_team?.logo_url && (
                          <img 
                            src={transfer.to_team.logo_url} 
                            alt={`${transfer.to_team.name} logo`}
                            className="w-8 h-8 rounded border border-gray-200"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {displayHistory.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No transfer history available</p>
                      <p className="text-sm text-gray-400 mt-2">This player's career moves will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contract" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Contract Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Weekly Wage:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(displayPlayer.weekly_wage || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Contract End:</span>
                      <span className="font-medium">
                        {displayPlayer.contract_end ? new Date(displayPlayer.contract_end).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Market Value:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(displayPlayer.market_value || 0)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Club:</span>
                      <div className="flex items-center gap-2">
                        {displayTeam?.logo_url && (
                          <img 
                            src={displayTeam.logo_url} 
                            alt={`${displayTeam.name} logo`}
                            className="w-6 h-6 rounded border border-gray-200"
                          />
                        )}
                        <span className="font-medium">{displayTeam?.name}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Contract Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {displayPlayer.contract_end ? 
                          Math.max(0, Math.ceil((new Date(displayPlayer.contract_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365.25))) 
                          : 'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-500">Years Remaining</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={
                          displayPlayer.contract_end && new Date(displayPlayer.contract_end) < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
                            ? 'destructive' 
                            : 'secondary'
                        }>
                          {displayPlayer.contract_end && new Date(displayPlayer.contract_end) < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
                            ? 'Expiring Soon' 
                            : 'Secure'
                          }
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shirt Number:</span>
                        <span className="font-medium">#{displayPlayer.shirt_number || 'TBD'}</span>
                      </div>
                    </div>
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