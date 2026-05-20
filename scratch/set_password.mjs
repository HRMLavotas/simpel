import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mauyygrbdopmpdpnwzra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const userId = '62057786-43e7-4949-9d90-9995052f6eda'; // ali.coolz30@gmail.com
  console.log('Setting password for user:', userId);
  
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: 'Password123!' }
  );
  
  if (error) {
    console.error('Error setting password:', error);
  } else {
    console.log('Success setting password. User updated:', data.user.email);
  }
}

run();
