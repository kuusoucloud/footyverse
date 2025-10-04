import { createClient } from '@supabase/supabase-js';
import { Fixture } from './football-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class FootballAPI {
  static async getFixtures(status?: string): Promise<Fixture[]> {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-fixtures', {
        method: 'GET',
        body: status ? { status } : undefined
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      throw error;
    }
  }

  static async seedData(): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        method: 'POST'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }

  static async generateFixtures(leagueId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-fixtures', {
        method: 'POST',
        body: { action: 'generate', league_id: leagueId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating fixtures:', error);
      throw error;
    }
  }

  static async simulateMatch(fixtureId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-simulate-match', {
        method: 'POST',
        body: { fixture_id: fixtureId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error simulating match:', error);
      throw error;
    }
  }

  static subscribeToMatch(matchId: string, callbacks: {
    onMatchTick?: (state: any) => void;
    onMatchEvent?: (event: any) => void;
    onMatchFinal?: (result: any) => void;
  }) {
    const channel = supabase
      .channel(`match_${matchId}`)
      .on('broadcast', { event: 'match_tick' }, (payload) => {
        callbacks.onMatchTick?.(payload.payload);
      })
      .on('broadcast', { event: 'match_event' }, (payload) => {
        callbacks.onMatchEvent?.(payload.payload);
      })
      .on('broadcast', { event: 'match_final' }, (payload) => {
        callbacks.onMatchFinal?.(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}