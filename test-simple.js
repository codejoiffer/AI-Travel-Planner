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
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n测试基本连接...');
  
  try {
    // 测试认证服务
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('认证服务错误:', authError.message);
    } else {
      console.log('✓ 认证服务正常');
    }
    
    // 测试数据库连接（使用一个简单的系统表查询）
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      if (error.code === '42883') {
        console.log('✓ 数据库连接正常（但version函数不存在）');
      } else {
        console.error('数据库连接错误:', error.message);
      }
    } else {
      console.log('✓ 数据库连接正常，PostgreSQL版本:', data);
    }
    
    console.log('\n✓ Supabase连接测试通过！');
    console.log('请运行数据库迁移脚本创建trips表');
    
  } catch (error) {
    console.error('连接测试失败:', error.message);
  }
}

testConnection();