export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string | null
          id: number
          password_hash: string
          role: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          password_hash: string
          role?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: number
          password_hash?: string
          role?: string | null
          username?: string
        }
        Relationships: []
      }
      cup_fixtures: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string | null
          cup_id: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          round: string
          scheduled_at: string | null
          status: string | null
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          cup_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          round: string
          scheduled_at?: string | null
          status?: string | null
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string | null
          cup_id?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          round?: string
          scheduled_at?: string | null
          status?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cup_fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_fixtures_cup_id_fkey"
            columns: ["cup_id"]
            isOneToOne: false
            referencedRelation: "cups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_fixtures_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      cups: {
        Row: {
          created_at: string | null
          current_round: string | null
          id: string
          name: string
          season_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_round?: string | null
          id?: string
          name: string
          season_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_round?: string | null
          id?: string
          name?: string
          season_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_history: {
        Row: {
          after_elo: number
          before_elo: number
          created_at: string | null
          delta: number
          entity_id: string
          entity_type: string
          id: string
          match_id: string | null
          reason: string | null
        }
        Insert: {
          after_elo: number
          before_elo: number
          created_at?: string | null
          delta: number
          entity_id: string
          entity_type: string
          id?: string
          match_id?: string | null
          reason?: string | null
        }
        Update: {
          after_elo?: number
          before_elo?: number
          created_at?: string | null
          delta?: number
          entity_id?: string
          entity_type?: string
          id?: string
          match_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elo_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          minute: number
          payload: Json
          second: number
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          minute: number
          payload?: Json
          second?: number
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          minute?: number
          payload?: Json
          second?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_team_id: string | null
          created_at: string | null
          home_team_id: string | null
          id: string
          league_id: string | null
          match_channel: string | null
          odds: Json | null
          round: number
          scheduled_at: string
          season_id: string | null
          status: string
        }
        Insert: {
          away_team_id?: string | null
          created_at?: string | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          match_channel?: string | null
          odds?: Json | null
          round: number
          scheduled_at: string
          season_id?: string | null
          status?: string
        }
        Update: {
          away_team_id?: string | null
          created_at?: string | null
          home_team_id?: string | null
          id?: string
          league_id?: string | null
          match_channel?: string | null
          odds?: Json | null
          round?: number
          scheduled_at?: string
          season_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          id: string
          name: string
          season_id: string | null
          tier: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          season_id?: string | null
          tier: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          season_id?: string | null
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "leagues_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_goals: number | null
          created_at: string | null
          ended_at: string | null
          fixture_id: string | null
          home_goals: number | null
          id: string
          started_at: string | null
          state_blob: Json | null
        }
        Insert: {
          away_goals?: number | null
          created_at?: string | null
          ended_at?: string | null
          fixture_id?: string | null
          home_goals?: number | null
          id?: string
          started_at?: string | null
          state_blob?: Json | null
        }
        Update: {
          away_goals?: number | null
          created_at?: string | null
          ended_at?: string | null
          fixture_id?: string | null
          home_goals?: number | null
          id?: string
          started_at?: string | null
          state_blob?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
        ]
      }
      player_injuries: {
        Row: {
          actual_return: string | null
          created_at: string | null
          expected_return: string | null
          id: string
          injury_type: string
          occurred_at: string | null
          player_id: string | null
          severity: string
        }
        Insert: {
          actual_return?: string | null
          created_at?: string | null
          expected_return?: string | null
          id?: string
          injury_type: string
          occurred_at?: string | null
          player_id?: string | null
          severity: string
        }
        Update: {
          actual_return?: string | null
          created_at?: string | null
          expected_return?: string | null
          id?: string
          injury_type?: string
          occurred_at?: string | null
          player_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_injuries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_level: number | null
          max_bid_amount: number | null
          player_id: string | null
          position_need: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_level?: number | null
          max_bid_amount?: number | null
          player_id?: string | null
          position_need?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_level?: number | null
          max_bid_amount?: number | null
          player_id?: string | null
          position_need?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_interests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_interests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          assists: number
          created_at: string | null
          cs: boolean
          goals: number
          id: string
          interceptions: number
          key_passes: number
          match_id: string | null
          minutes: number
          player_id: string | null
          rating: number
          saves: number
          shots: number
          tackles: number
          xg: number
        }
        Insert: {
          assists?: number
          created_at?: string | null
          cs?: boolean
          goals?: number
          id?: string
          interceptions?: number
          key_passes?: number
          match_id?: string | null
          minutes?: number
          player_id?: string | null
          rating?: number
          saves?: number
          shots?: number
          tackles?: number
          xg?: number
        }
        Update: {
          assists?: number
          created_at?: string | null
          cs?: boolean
          goals?: number
          id?: string
          interceptions?: number
          key_passes?: number
          match_id?: string | null
          minutes?: number
          player_id?: string | null
          rating?: number
          saves?: number
          shots?: number
          tackles?: number
          xg?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_retirements: {
        Row: {
          created_at: string | null
          final_team_id: string | null
          id: string
          player_id: string | null
          reason: string | null
          retirement_date: string | null
        }
        Insert: {
          created_at?: string | null
          final_team_id?: string | null
          id?: string
          player_id?: string | null
          reason?: string | null
          retirement_date?: string | null
        }
        Update: {
          created_at?: string | null
          final_team_id?: string | null
          id?: string
          player_id?: string | null
          reason?: string | null
          retirement_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_retirements_final_team_id_fkey"
            columns: ["final_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_retirements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number
          attributes: Json
          base_elo: number
          contract_expires: string | null
          contract_length: number | null
          created_at: string | null
          current_elo: number
          foot: string
          form_rating: number | null
          height_cm: number
          id: string
          injury_status: string | null
          injury_until: string | null
          international_caps: number | null
          loyalty: number | null
          market_value: number | null
          name: string
          position: string
          team_id: string | null
          transfer_listed: boolean | null
          weekly_wage: number | null
          weight_kg: number
        }
        Insert: {
          age: number
          attributes?: Json
          base_elo?: number
          contract_expires?: string | null
          contract_length?: number | null
          created_at?: string | null
          current_elo?: number
          foot?: string
          form_rating?: number | null
          height_cm: number
          id?: string
          injury_status?: string | null
          injury_until?: string | null
          international_caps?: number | null
          loyalty?: number | null
          market_value?: number | null
          name: string
          position: string
          team_id?: string | null
          transfer_listed?: boolean | null
          weekly_wage?: number | null
          weight_kg: number
        }
        Update: {
          age?: number
          attributes?: Json
          base_elo?: number
          contract_expires?: string | null
          contract_length?: number | null
          created_at?: string | null
          current_elo?: number
          foot?: string
          form_rating?: number | null
          height_cm?: number
          id?: string
          injury_status?: string | null
          injury_until?: string | null
          international_caps?: number | null
          loyalty?: number | null
          market_value?: number | null
          name?: string
          position?: string
          team_id?: string | null
          transfer_listed?: boolean | null
          weekly_wage?: number | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_relegation: {
        Row: {
          created_at: string | null
          from_tier: number | null
          id: string
          season_id: string | null
          team_id: string | null
          to_tier: number | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          from_tier?: number | null
          id?: string
          season_id?: string | null
          team_id?: string | null
          to_tier?: number | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          from_tier?: number | null
          id?: string
          season_id?: string | null
          team_id?: string | null
          to_tier?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_relegation_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_relegation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          started_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          started_at?: string | null
          year?: number
        }
        Relationships: []
      }
      team_standings: {
        Row: {
          created_at: string | null
          drawn: number
          form_last5: string | null
          ga: number
          gd: number | null
          gf: number
          id: string
          league_id: string | null
          lost: number
          played: number
          points: number | null
          season_id: string | null
          team_id: string | null
          won: number
        }
        Insert: {
          created_at?: string | null
          drawn?: number
          form_last5?: string | null
          ga?: number
          gd?: number | null
          gf?: number
          id?: string
          league_id?: string | null
          lost?: number
          played?: number
          points?: number | null
          season_id?: string | null
          team_id?: string | null
          won?: number
        }
        Update: {
          created_at?: string | null
          drawn?: number
          form_last5?: string | null
          ga?: number
          gd?: number | null
          gf?: number
          id?: string
          league_id?: string | null
          lost?: number
          played?: number
          points?: number | null
          season_id?: string | null
          team_id?: string | null
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_standings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          crest_url: string | null
          current_wages: number | null
          elo: number
          id: string
          name: string
          primary_color: string
          secondary_color: string
          tier: number
          transfer_budget: number | null
          wage_budget: number | null
        }
        Insert: {
          created_at?: string | null
          crest_url?: string | null
          current_wages?: number | null
          elo?: number
          id?: string
          name: string
          primary_color?: string
          secondary_color?: string
          tier: number
          transfer_budget?: number | null
          wage_budget?: number | null
        }
        Update: {
          created_at?: string | null
          crest_url?: string | null
          current_wages?: number | null
          elo?: number
          id?: string
          name?: string
          primary_color?: string
          secondary_color?: string
          tier?: number
          transfer_budget?: number | null
          wage_budget?: number | null
        }
        Relationships: []
      }
      transfer_bids: {
        Row: {
          bid_amount: number
          bid_date: string | null
          bidding_team_id: string | null
          contract_length: number | null
          created_at: string | null
          id: string
          player_id: string | null
          response_date: string | null
          selling_team_id: string | null
          status: string | null
          weekly_wage_offer: number
        }
        Insert: {
          bid_amount: number
          bid_date?: string | null
          bidding_team_id?: string | null
          contract_length?: number | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          response_date?: string | null
          selling_team_id?: string | null
          status?: string | null
          weekly_wage_offer: number
        }
        Update: {
          bid_amount?: number
          bid_date?: string | null
          bidding_team_id?: string | null
          contract_length?: number | null
          created_at?: string | null
          id?: string
          player_id?: string | null
          response_date?: string | null
          selling_team_id?: string | null
          status?: string | null
          weekly_wage_offer?: number
        }
        Relationships: [
          {
            foreignKeyName: "transfer_bids_bidding_team_id_fkey"
            columns: ["bidding_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_bids_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_bids_selling_team_id_fkey"
            columns: ["selling_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_windows: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          season_id: string | null
          start_date: string
          window_type: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          season_id?: string | null
          start_date: string
          window_type: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          season_id?: string | null
          start_date?: string
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_windows_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          agent_fee: number | null
          contract_length: number | null
          created_at: string | null
          from_team_id: string | null
          id: string
          player_id: string | null
          season_id: string | null
          to_team_id: string | null
          transfer_date: string | null
          transfer_fee: number | null
          transfer_type: string | null
          transfer_window_id: string | null
          weekly_wage: number | null
        }
        Insert: {
          agent_fee?: number | null
          contract_length?: number | null
          created_at?: string | null
          from_team_id?: string | null
          id?: string
          player_id?: string | null
          season_id?: string | null
          to_team_id?: string | null
          transfer_date?: string | null
          transfer_fee?: number | null
          transfer_type?: string | null
          transfer_window_id?: string | null
          weekly_wage?: number | null
        }
        Update: {
          agent_fee?: number | null
          contract_length?: number | null
          created_at?: string | null
          from_team_id?: string | null
          id?: string
          player_id?: string | null
          season_id?: string | null
          to_team_id?: string | null
          transfer_date?: string | null
          transfer_fee?: number | null
          transfer_type?: string | null
          transfer_window_id?: string | null
          weekly_wage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_transfer_window_id_fkey"
            columns: ["transfer_window_id"]
            isOneToOne: false
            referencedRelation: "transfer_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          token_identifier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          token_identifier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          token_identifier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      youth_academy: {
        Row: {
          age: number | null
          created_at: string | null
          current_rating: number | null
          graduation_date: string | null
          id: string
          player_name: string
          position: string
          potential_rating: number | null
          ready_for_first_team: boolean | null
          team_id: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          current_rating?: number | null
          graduation_date?: string | null
          id?: string
          player_name: string
          position: string
          potential_rating?: number | null
          ready_for_first_team?: boolean | null
          team_id?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          current_rating?: number | null
          graduation_date?: string | null
          id?: string
          player_name?: string
          position?: string
          potential_rating?: number | null
          ready_for_first_team?: boolean | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "youth_academy_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_market_value: {
        Args: { player_age: number; player_attributes: Json; team_tier: number }
        Returns: number
      }
      generate_season_fixtures: {
        Args: { p_season_id: string }
        Returns: number
      }
      start_continuous_matches: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_team_standings: {
        Args:
          | {
              p_drawn: number
              p_goals_against: number
              p_goals_for: number
              p_league_id: string
              p_lost: number
              p_season_id: string
              p_team_id: string
              p_won: number
            }
          | {
              p_goals_against: number
              p_goals_for: number
              p_league_id: string
              p_result: string
              p_season_id: string
              p_team_id: string
            }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
