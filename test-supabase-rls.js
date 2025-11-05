const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseRLS() {
  console.log('Testing Supabase RLS policies...');
  
  // Check if environment variables are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables not set');
    return;
  }
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  // Test with a valid UUID from our debug
  const validUserId = '6532e7f0-48dd-4a18-be82-09c681e1ad85';
  
  console.log('Testing insert with valid user ID:', validUserId);
  
  // Test data
  const testData = {
    name: '测试行程',
    plan: { days: [{ activities: ['测试活动'] }] },
    user_id: validUserId
  };
  
  try {
    const { data, error } = await supabase
      .from('trips')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', error.details);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503') {
        console.log('This appears to be a foreign key constraint error.');
        console.log('The user ID might not exist in the auth.users table.');
      }
    } else {
      console.log('Insert successful! Data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSupabaseRLS();