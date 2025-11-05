const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从.env文件读取环境变量
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
      return envVars;
    }
  } catch (error) {
    console.error('读取.env文件失败:', error.message);
  }
  return {};
}

const envVars = loadEnv();
const supabaseUrl = envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少Supabase环境变量');
  console.log('请确保在.env文件中设置了SUPABASE_URL和SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('测试Supabase连接...');
  
  try {
    // 测试基本连接
    const { data, error } = await supabase.from('trips').select('count').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('✓ Supabase连接成功，但trips表不存在');
        console.log('请运行数据库迁移脚本创建表');
      } else {
        console.error('✗ Supabase连接错误:', error.message);
      }
    } else {
      console.log('✓ Supabase连接成功，trips表存在');
    }
    
    // 测试认证功能
    console.log('\n测试用户认证功能...');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    // 注册测试用户
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('✗ 用户注册失败:', signUpError.message);
    } else {
      console.log('✓ 测试用户注册成功');
      
      // 登录测试用户
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.error('✗ 用户登录失败:', signInError.message);
      } else {
        console.log('✓ 测试用户登录成功');
        console.log('用户ID:', signInData.user.id);
        
        // 测试行程保存
        const testTrip = {
          name: '测试行程',
          plan: { destination: '测试目的地', days: 3 }
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('trips')
          .insert([{ 
            ...testTrip, 
            user_id: signInData.user.id 
          }])
          .select();
        
        if (insertError) {
          if (insertError.code === '42P01') {
            console.log('✗ trips表不存在，请运行迁移脚本');
          } else {
            console.error('✗ 行程保存失败:', insertError.message);
          }
        } else {
          console.log('✓ 行程保存成功:', insertData[0].id);
          
          // 测试行程查询
          const { data: queryData, error: queryError } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', signInData.user.id);
          
          if (queryError) {
            console.error('✗ 行程查询失败:', queryError.message);
          } else {
            console.log('✓ 行程查询成功，找到', queryData.length, '个行程');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

testSupabaseConnection();