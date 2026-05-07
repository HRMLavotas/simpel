import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ';

// Test with anon key (like frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAccess() {
  console.log('Testing announcements access with anon key (like frontend)...\n');

  // Test 1: Direct query to announcements table
  console.log('Test 1: Direct query to announcements table');
  const { data: directData, error: directError } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (directError) {
    console.error('❌ Error:', directError);
  } else {
    console.log(`✅ Success: Found ${directData.length} announcements`);
    if (directData.length > 0) {
      console.log('First announcement:', directData[0].title);
    }
  }

  // Test 2: Query with profiles join (like useAllAnnouncements)
  console.log('\nTest 2: Query with profiles join');
  const { data: joinData, error: joinError } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles:created_by (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (joinError) {
    console.error('❌ Error:', joinError);
  } else {
    console.log(`✅ Success: Found ${joinData.length} announcements with profiles`);
    if (joinData.length > 0) {
      console.log('First announcement:', joinData[0].title);
      console.log('Created by:', joinData[0].profiles);
    }
  }

  // Test 3: RPC function
  console.log('\nTest 3: RPC function get_active_announcements()');
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_active_announcements');

  if (rpcError) {
    console.error('❌ Error:', rpcError);
  } else {
    console.log(`✅ Success: Found ${rpcData.length} active announcements`);
    if (rpcData.length > 0) {
      console.log('First announcement:', rpcData[0].title);
    }
  }
}

testAccess().catch(console.error);
