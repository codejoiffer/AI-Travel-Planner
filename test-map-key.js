// 测试高德地图API密钥是否有效
const MAPS_API_KEY = '0f7f4c52f812d5751764195d19045d1b';

// 测试地理编码API
async function testGeocoding() {
  try {
    const response = await fetch(`https://restapi.amap.com/v3/geocode/geo?key=${MAPS_API_KEY}&address=北京市朝阳区`);
    const data = await response.json();
    console.log('地理编码测试结果:', data);
    
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      console.log('✅ 地图API密钥有效');
      return true;
    } else {
      console.log('❌ 地图API密钥无效或请求失败');
      console.log('错误信息:', data.info || data.infocode);
      return false;
    }
  } catch (error) {
    console.log('❌ 地图API请求失败:', error.message);
    return false;
  }
}

// 测试地点搜索API
async function testPlaceSearch() {
  try {
    const response = await fetch(`https://restapi.amap.com/v3/place/text?key=${MAPS_API_KEY}&keywords=天安门&offset=1&page=1`);
    const data = await response.json();
    console.log('地点搜索测试结果:', data);
    
    if (data.status === '1') {
      console.log('✅ 地点搜索API正常');
      return true;
    } else {
      console.log('❌ 地点搜索API异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 地点搜索API请求失败:', error.message);
    return false;
  }
}

async function testMapAPI() {
  console.log('正在测试高德地图API密钥...');
  
  const geocodingResult = await testGeocoding();
  const placeSearchResult = await testPlaceSearch();
  
  if (geocodingResult && placeSearchResult) {
    console.log('🎉 所有地图API测试通过！');
  } else {
    console.log('⚠️ 部分地图API测试失败，请检查API密钥配置');
  }
}

testMapAPI();