const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkRLSPolicies() {
  console.log('Checking RLS policies...');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  // 检查表的RLS状态
  try {
    const { data: tableInfo, error } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'trips');
    
    if (error) {
      console.error('Error checking table info:', error);
    } else {
      console.log('Table RLS status:', tableInfo);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
  
  // 尝试使用服务端角色（bypass RLS）
  console.log('\nTesting with service role key...');
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('SUPABASE_SERVICE_ROLE_KEY not set, using ANON_KEY with RLS bypass');
    
    // 临时解决方案：修改API代码使用经过身份验证的客户端
    console.log('\n解决方案：需要修改API代码，使用经过身份验证的Supabase客户端');
    console.log('或者使用服务端角色密钥（SUPABASE_SERVICE_ROLE_KEY）');
    return;
  }
  
  const serviceSupabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const testData = {
    name: '测试行程（服务端）',
    plan: { days: [{ activities: ['测试活动'] }] },
    user_id: '6532e7f0-48dd-4a18-be82-09c681e1ad85'
  };
  
  try {
    const { data, error } = await serviceSupabase
      .from('trips')
      .insert([testData])
      .select();
    
    if (error) {
      console.error('Service role insert error:', error);
    } else {
      console.log('Service role insert successful! Data:', data);
    }
  } catch (err) {
    console.error('Unexpected error with service role:', err);
  }
}

checkRLSPolicies();