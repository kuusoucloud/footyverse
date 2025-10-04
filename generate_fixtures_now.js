const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateFixturesDirectly() {
  console.log('🏆 Generating first season fixtures directly in database...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('generate_fixtures_direct.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute via raw query
      const { data: result, error: queryError } = await supabase
        .from('fixtures')
        .select('count(*)', { count: 'exact', head: true });
        
      if (queryError) {
        console.error('❌ Query error:', queryError);
        return;
      }
      
      console.log('Current fixture count:', result);
      return;
    }

    console.log('✅ SQL executed successfully!');
    
    // Check the results
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('league_id')
      .order('scheduled_at');

    if (fixturesError) {
      console.error('❌ Error checking fixtures:', fixturesError);
      return;
    }

    // Count fixtures by tier
    const fixturesByTier = {};
    fixtures.forEach(fixture => {
      const tierMatch = fixture.league_id?.match(/tier-(\d+)/);
      const tier = tierMatch ? tierMatch[1] : 'unknown';
      fixturesByTier[tier] = (fixturesByTier[tier] || 0) + 1;
    });

    console.log('✅ SUCCESS! First season fixtures generated!');
    console.log(`📊 Total fixtures: ${fixtures.length}`);
    console.log('📈 Fixtures by tier:');
    
    Object.entries(fixturesByTier).forEach(([tier, count]) => {
      console.log(`  Tier ${tier}: ${count} fixtures`);
    });
    
    console.log('\n🎮 Ready for 3D match simulation!');
    console.log('Matches will be played in rotation: Tier 1 → Tier 2 → Tier 3 → Tier 4 → Tier 5 → repeat');
    
  } catch (error) {
    console.error('❌ Failed to generate fixtures:', error);
  }
}

generateFixturesDirectly();