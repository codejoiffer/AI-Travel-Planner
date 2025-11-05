const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseInsert() {
  console.log('Testing Supabase insert operation...');
  
  // Check if environment variables are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables not set');
    return;
  }
  
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY present:', !!process.env.SUPABASE_ANON_KEY);
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  // Test data
  const testData = {
    name: '测试行程',
    plan: { days: [{ activities: ['测试活动'] }] },
    user_id: 'test-user-id-12345' // 使用测试用户ID
  };
  
  console.log('Inserting test data:', testData);
  
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
    } else {
      console.log('Insert successful! Data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSupabaseInsert();