import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminAccess() {
  console.log('Testing admin access to announcements...\n');

  // Test 1: Fetch all announcements (like useAllAnnouncements)
  console.log('Test 1: Fetch all announcements');
  const { data: announcements, error: announcementsError } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (announcementsError) {
    console.error('❌ Error fetching announcements:', announcementsError);
    return;
  }

  console.log(`✅ Found ${announcements.length} announcements`);
  
  if (announcements.length > 0) {
    console.log('\nAnnouncements:');
    announcements.forEach((ann, idx) => {
      console.log(`${idx + 1}. ${ann.title}`);
      console.log(`   ID: ${ann.id}`);
      console.log(`   Type: ${ann.type}`);
      console.log(`   Priority: ${ann.priority}`);
      console.log(`   Is Active: ${ann.is_active}`);
      console.log(`   Created By: ${ann.created_by}`);
      console.log('');
    });

    // Test 2: Fetch profiles for created_by users
    console.log('Test 2: Fetch profiles for creators');
    const userIds = [...new Set(announcements.map(a => a.created_by))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
      profiles.forEach(p => {
        console.log(`   ${p.id}: ${p.full_name}`);
      });
    }

    // Test 3: Map profiles to announcements
    console.log('\nTest 3: Mapped announcements with profiles');
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const mappedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      profiles: profileMap.get(announcement.created_by) || null,
    }));

    mappedAnnouncements.forEach((ann, idx) => {
      console.log(`${idx + 1}. ${ann.title}`);
      console.log(`   Created by: ${ann.profiles?.full_name || 'Unknown'}`);
    });
  }
}

testAdminAccess().catch(console.error);
