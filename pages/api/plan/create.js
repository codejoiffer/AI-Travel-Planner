// 规范化城市名称（去噪、别名、英文映射）
function normalizeCityName(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  // 去除前后缀与噪声词
  let city = s
    .replace(/^中国/, '')
    .replace(/[\s,，].*$/, '') // 逗号/空格后内容
    .replace(/(市|县|区|州)$/,'')
    .replace(/(旅游|旅行|度假|自由行)$/,'')
    .trim();

  // 常见英文别名映射到中文
  const aliases = {
    'tokyo': '东京', 'beijing': '北京', 'shanghai': '上海', 'nanjing': '南京',
    'guangzhou': '广州', 'shenzhen': '深圳', 'hangzhou': '杭州', 'chengdu': '成都',
    'chongqing': '重庆', 'xian': '西安', "xi'an": '西安', 'suzhou': '苏州',
    'wuhan': '武汉', 'tianjin': '天津', 'changsha': '长沙', 'zhengzhou': '郑州',
    'qingdao': '青岛', 'dalian': '大连', 'xiamen': '厦门', 'kunming': '昆明',
    'guilin': '桂林', 'lijiang': '丽江', 'sanya': '三亚', 'hong kong': '香港',
    'hongkong': '香港', 'macau': '澳门', 'macao': '澳门', 'taipei': '台北'
  };
  const lower = city.toLowerCase();
  if (aliases[lower]) return aliases[lower];
  return city;
}

// 根据目的地动态计算中心点
function getCityCenter(city) {
  const norm = normalizeCityName(city);
  const cityCenters = {
    '东京': [139.767125, 35.681236],
    '南京': [118.7969, 32.0603],
    '北京': [116.397428, 39.90923],
    '上海': [121.473701, 31.230416],
    '广州': [113.264385, 23.129112],
    '深圳': [114.057868, 22.543099],
    '杭州': [120.15507, 30.274085],
    '成都': [104.066541, 30.572269],
    '重庆': [106.551556, 29.563009],
    '西安': [108.940174, 34.341568],
    '苏州': [120.585315, 31.298886],
    '武汉': [114.305392, 30.593099],
    '天津': [117.190182, 39.125596],
    '长沙': [112.938814, 28.228209],
    '郑州': [113.625368, 34.746599],
    '青岛': [120.382639, 36.067082],
    '大连': [121.614682, 38.914003],
    '厦门': [118.089425, 24.479834],
    '昆明': [102.712251, 25.040609],
    '桂林': [110.290199, 25.273566],
    '丽江': [100.233026, 26.872108],
    '三亚': [109.511909, 18.252847],
    '香港': [114.169361, 22.319304],
    '澳门': [113.54909, 22.198951],
    '台北': [121.565418, 25.032969]
  };
  
  // 检查是否匹配已知城市
  // 优先检查精确匹配
  if (cityCenters[norm]) {
    return cityCenters[norm];
  }
  
  // 然后检查包含关系
  for (const [cityName, center] of Object.entries(cityCenters)) {
    if (norm.includes(cityName)) {
      return center;
    }
  }
  
  // 默认返回北京中心点（作为fallback）
  // 注意：后续逻辑会优先尝试通过地理编码解析真实中心点
  return [116.397428, 39.90923];
}

// 动态解析城市中心点（优先使用高德地理编码），失败则返回 null
async function resolveCityCenter(city, key) {
  try {
    const cityName = normalizeCityName(city || '').trim();
    if (!cityName || !key) return null;
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${encodeURIComponent(key)}&address=${encodeURIComponent(cityName)}`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (Array.isArray(json?.geocodes) && json.geocodes.length > 0) {
      const loc = json.geocodes[0]?.location || '';
      const [lng, lat] = loc.split(',').map(Number);
      if (lng && lat && lng >= 73 && lng <= 135 && lat >= 18 && lat <= 53) {
        return [lng, lat];
      }
    }
    // 回退：尝试通过 place/text 获取城市的第一个 POI 的位置
    const placeUrl = `https://restapi.amap.com/v3/place/text?key=${encodeURIComponent(key)}&keywords=${encodeURIComponent(cityName)}&citylimit=true&offset=1&page=1`;
    const placeResp = await fetch(placeUrl);
    const placeJson = await placeResp.json();
    if (Array.isArray(placeJson?.pois) && placeJson.pois.length > 0) {
      const [lng, lat] = (placeJson.pois[0]?.location || '').split(',').map(Number);
      if (lng && lat && lng >= 73 && lng <= 135 && lat >= 18 && lat <= 53) {
        return [lng, lat];
      }
    }
  } catch (e) {
    console.warn('解析城市中心失败:', e);
  }
  return null;
}

async function geocodePlace(name, city, key) {
  try {
    // 确保只搜索中国境内的地点，并限制在对应城市
    // 从目的地中提取城市名称（去除'中国'前缀和可能的其他描述）
    let cityName = normalizeCityName(city || '');
    
    // 智能城市名称提取：处理各种格式的目的地输入
    if (cityName.includes('中国')) {
      cityName = cityName.replace('中国', '').trim();
    }
    
    // 处理常见的目的地格式："城市, 省份" 或 "城市 省份"
    const cityPatterns = [
      /^([^,，\s]+)[,，\s].+$/,  // 取逗号/空格前的部分
      /^(.+?)(?:市|县|区)$/,     // 去除市/县/区后缀
      /^(.+?)(?:旅游|旅行|度假|自由行)/, // 去除旅游相关词汇
    ];
    
    for (const pattern of cityPatterns) {
      const match = cityName.match(pattern);
      if (match && match[1]) {
        cityName = match[1].trim();
        break;
      }
    }
    
    // 如果城市名包含多个部分，取第一个有效部分
    if (cityName.includes(' ') || cityName.includes('，') || cityName.includes(',')) {
      const parts = cityName.split(/[\s，,]/).filter(part => 
        part && !['旅游', '旅行', '度假', '自由行', '省', '自治区'].includes(part)
      );
      if (parts.length > 0) {
        cityName = parts[0].trim();
      }
    }
    
    const url = `https://restapi.amap.com/v3/place/text?key=${encodeURIComponent(key)}&keywords=${encodeURIComponent(name)}${cityName ? `&city=${encodeURIComponent(cityName)}` : ''}&offset=5&page=1&citylimit=true`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (json.pois && json.pois.length) {
      const cityNameLower = (cityName || '').toLowerCase();
      // 优先选择与城市名匹配的POI
      let chosen = null;
      for (const cand of json.pois) {
        const metaCity = (cand.cityname || cand.adname || '').toLowerCase();
        if (metaCity && cityNameLower && (metaCity.includes(cityNameLower) || cityNameLower.includes(metaCity))) {
          chosen = cand;
          break;
        }
      }
      const p = chosen || json.pois[0];
      const [lng, lat] = (p.location || '').split(',').map(Number);
      // 验证坐标是否在中国境内（经度73-135，纬度18-53）
      if (lng && lat && lng >= 73 && lng <= 135 && lat >= 18 && lat <= 53) {
        return { name: p.name || name, lng, lat, type: p.type || '' };
      } else {
        console.warn(`地点"${name}"的坐标(${lng},${lat})超出中国范围，回退为目的地城市中心`);
      }
    }
    // 返回目的地城市中心作为回退：优先动态解析，其次静态映射
    const keyCenter = await resolveCityCenter(cityName || city, key);
    if (keyCenter) {
      return { name, lng: keyCenter[0], lat: keyCenter[1], type: '' };
    }
    const [clng, clat] = getCityCenter(city);
    return { name, lng: clng, lat: clat, type: '' };
  } catch {
    // 出错时返回目的地城市中心：优先动态解析，其次静态映射
    const keyCenter = await resolveCityCenter(city, key);
    if (keyCenter) {
      return { name, lng: keyCenter[0], lat: keyCenter[1], type: '' };
    }
    const [clng, clat] = getCityCenter(city);
    return { name, lng: clng, lat: clat, type: '' };
  }
}

function samplePlan(destination, days, budget, people, preferences) {
  console.log('目的地:', destination);
  const normDest = normalizeCityName(destination);
  const center = getCityCenter(normDest);
  console.log('计算的中心点:', center);
  
  // 根据目的地生成不同的POI
  const isTokyo = normDest.includes('东京');
  const isNanjing = normDest.includes('南京');
  const isShanghai = normDest.includes('上海');
  const isGuangzhou = normDest.includes('广州');
  const isShenzhen = normDest.includes('深圳');
  const isHangzhou = normDest.includes('杭州');
  const isChengdu = normDest.includes('成都');
  const isXian = normDest.includes('西安');
  const isChongqing = normDest.includes('重庆');
  
  const pois = isTokyo ? [
    { name: '浅草寺', lng: 139.794, lat: 35.7148, type: '景点', description: '东京最古老的寺庙' },
    { name: '秋叶原', lng: 139.7745, lat: 35.6984, type: '购物', description: '电子产品与动漫文化中心' },
    { name: '东京塔', lng: 139.7454, lat: 35.6586, type: '景点', description: '东京地标性建筑' },
    { name: '筑地市场', lng: 139.771, lat: 35.665, type: '美食', description: '新鲜海鲜与寿司' },
    { name: '新宿御苑', lng: 139.710, lat: 35.685, type: '景点', description: '美丽的日式庭园' },
    { name: '涩谷十字路口', lng: 139.700, lat: 35.659, type: '景点', description: '世界最繁忙的十字路口' },
    { name: '一兰拉面', lng: 139.734, lat: 35.669, type: '美食', description: '著名拉面连锁店' },
    { name: '银座', lng: 139.767, lat: 35.672, type: '购物', description: '高端购物区' }
  ] : isNanjing ? [
    { name: '中山陵', lng: 118.853, lat: 32.058, type: '景点', description: '孙中山先生陵墓，著名革命纪念地' },
    { name: '夫子庙', lng: 118.790, lat: 32.023, type: '景点', description: '南京历史文化街区，秦淮河畔' },
    { name: '玄武湖', lng: 118.796, lat: 32.070, type: '景点', description: '中国最大的皇家园林湖泊' },
    { name: '南京博物院', lng: 118.823, lat: 32.042, type: '文化', description: '中国三大博物馆之一' },
    { name: '总统府', lng: 118.797, lat: 32.046, type: '景点', description: '中国近代历史重要遗址' },
    { name: '老门东', lng: 118.788, lat: 32.022, type: '美食', description: '传统美食文化街区' },
    { name: '南京大牌档', lng: 118.790, lat: 32.023, type: '美食', description: '南京特色餐饮连锁' },
    { name: '新街口', lng: 118.784, lat: 32.042, type: '购物', description: '南京核心商业区' },
    { name: '鸡鸣寺', lng: 118.800, lat: 32.064, type: '景点', description: '南京最古老的梵刹之一' },
    { name: '南京眼', lng: 118.712, lat: 31.983, type: '景点', description: '长江上的标志性建筑' }
  ] : isShanghai ? [
    { name: '外滩', lng: 121.490, lat: 31.239, type: '景点', description: '上海标志性滨江景观大道' },
    { name: '豫园', lng: 121.487, lat: 31.227, type: '景点', description: '明代古典园林' },
    { name: '东方明珠塔', lng: 121.500, lat: 31.240, type: '景点', description: '上海地标性电视塔' },
    { name: '南京路步行街', lng: 121.475, lat: 31.238, type: '购物', description: '中国第一商业街' },
    { name: '田子坊', lng: 121.463, lat: 31.210, type: '景点', description: '石库门改造的艺术创意园区' },
    { name: '上海博物馆', lng: 121.469, lat: 31.228, type: '文化', description: '中国古代艺术博物馆' },
    { name: '新天地', lng: 121.475, lat: 31.222, type: '购物', description: '时尚休闲商业区' },
    { name: '陆家嘴', lng: 121.505, lat: 31.240, type: '景点', description: '上海金融中心' },
    { name: '城隍庙', lng: 121.487, lat: 31.227, type: '美食', description: '上海传统小吃聚集地' },
    { name: '上海迪士尼乐园', lng: 121.658, lat: 31.144, type: '景点', description: '中国大陆首座迪士尼主题公园' }
  ] : isGuangzhou ? [
    { name: '广州塔', lng: 113.324, lat: 23.106, type: '景点', description: '广州地标性建筑，昵称小蛮腰' },
    { name: '沙面', lng: 113.241, lat: 23.107, type: '景点', description: '欧陆风情建筑群' },
    { name: '上下九步行街', lng: 113.248, lat: 23.116, type: '购物', description: '广州传统商业街' },
    { name: '北京路', lng: 113.267, lat: 23.125, type: '购物', description: '千年古道商业街' },
    { name: '陈家祠', lng: 113.246, lat: 23.131, type: '文化', description: '广东民间工艺博物馆' },
    { name: '白云山', lng: 113.295, lat: 23.158, type: '景点', description: '广州名山，城市绿肺' },
    { name: '珠江夜游', lng: 113.267, lat: 23.116, type: '景点', description: '观赏珠江两岸夜景' },
    { name: '点都德', lng: 113.267, lat: 23.125, type: '美食', description: '广式早茶老字号' },
    { name: '长隆旅游度假区', lng: 113.315, lat: 22.994, type: '景点', description: '大型主题公园度假区' }
  ] : isShenzhen ? [
    { name: '世界之窗', lng: 113.973, lat: 22.536, type: '景点', description: '微缩世界著名景观主题公园' },
    { name: '欢乐谷', lng: 113.979, lat: 22.540, type: '景点', description: '大型主题游乐园' },
    { name: '深圳湾公园', lng: 113.943, lat: 22.497, type: '景点', description: '海滨休闲公园' },
    { name: '东部华侨城', lng: 114.297, lat: 22.632, type: '景点', description: '大型生态旅游度假区' },
    { name: '大梅沙', lng: 114.308, lat: 22.596, type: '景点', description: '海滨浴场' },
    { name: '华强北', lng: 114.085, lat: 22.544, type: '购物', description: '电子产品集散地' },
    { name: '海上世界', lng: 113.917, lat: 22.482, type: '景点', description: '海滨休闲文化区' },
    { name: '深圳博物馆', lng: 114.062, lat: 22.540, type: '文化', description: '深圳历史文化展示' }
  ] : isHangzhou ? [
    { name: '西湖', lng: 120.155, lat: 30.274, type: '景点', description: '中国著名风景名胜区' },
    { name: '雷峰塔', lng: 120.149, lat: 30.233, type: '景点', description: '西湖标志性古塔' },
    { name: '灵隐寺', lng: 120.095, lat: 30.240, type: '景点', description: '千年古刹' },
    { name: '宋城', lng: 120.095, lat: 30.176, type: '景点', description: '宋代文化主题公园' },
    { name: '河坊街', lng: 120.168, lat: 30.241, type: '购物', description: '古色古香商业街' },
    { name: '西溪湿地', lng: 120.050, lat: 30.275, type: '景点', description: '城市湿地公园' },
    { name: '龙井村', lng: 120.107, lat: 30.223, type: '景点', description: '龙井茶产地' },
    { name: '杭州酒家', lng: 120.168, lat: 30.241, type: '美食', description: '杭帮菜老字号' }
  ] : isChengdu ? [
    { name: '宽窄巷子', lng: 104.064, lat: 30.663, type: '景点', description: '成都历史文化街区' },
    { name: '锦里', lng: 104.066, lat: 30.655, type: '景点', description: '三国文化商业街' },
    { name: '武侯祠', lng: 104.051, lat: 30.647, type: '景点', description: '纪念诸葛亮的祠庙' },
    { name: '大熊猫繁育研究基地', lng: 104.147, lat: 30.739, type: '景点', description: '大熊猫保护与研究机构' },
    { name: '杜甫草堂', lng: 104.031, lat: 30.659, type: '景点', description: '唐代诗人杜甫故居' },
    { name: '春熙路', lng: 104.080, lat: 30.657, type: '购物', description: '成都时尚商业街' },
    { name: '人民公园', lng: 104.066, lat: 30.659, type: '景点', description: '成都休闲文化地标' },
    { name: '小龙坎火锅', lng: 104.080, lat: 30.657, type: '美食', description: '四川火锅连锁品牌' }
  ] : isXian ? [
    { name: '兵马俑', lng: 109.273, lat: 34.385, type: '景点', description: '秦始皇陵兵马俑坑' },
    { name: '大雁塔', lng: 108.964, lat: 34.219, type: '景点', description: '唐代佛教塔楼' },
    { name: '钟楼', lng: 108.942, lat: 34.261, type: '景点', description: '西安城市中心地标' },
    { name: '回民街', lng: 108.942, lat: 34.264, type: '美食', description: '西安穆斯林美食街' },
    { name: '城墙', lng: 108.942, lat: 34.261, type: '景点', description: '明代古城墙' },
    { name: '华清宫', lng: 109.213, lat: 34.362, type: '景点', description: '唐代皇家温泉宫殿' },
    { name: '大唐不夜城', lng: 108.964, lat: 34.219, type: '景点', description: '唐代文化主题街区' },
    { name: '陕西历史博物馆', lng: 108.956, lat: 34.225, type: '文化', description: '中国重要历史博物馆' }
  ] : isChongqing ? [
    { name: '洪崖洞', lng: 106.577, lat: 29.563, type: '景点', description: '重庆标志性吊脚楼建筑群' },
    { name: '解放碑', lng: 106.577, lat: 29.558, type: '景点', description: '重庆商业中心地标' },
    { name: '磁器口古镇', lng: 106.449, lat: 29.578, type: '景点', description: '重庆历史文化古镇' },
    { name: '长江索道', lng: 106.587, lat: 29.563, type: '景点', description: '横跨长江的空中缆车' },
    { name: '李子坝轻轨站', lng: 106.540, lat: 29.554, type: '景点', description: '轻轨穿楼奇观' },
    { name: '南山一棵树', lng: 106.600, lat: 29.556, type: '景点', description: '重庆夜景最佳观赏点' },
    { name: '朝天门', lng: 106.587, lat: 29.567, type: '景点', description: '长江与嘉陵江交汇处' },
    { name: '重庆火锅', lng: 106.577, lat: 29.558, type: '美食', description: '重庆特色麻辣火锅' }
  ] : [
    { name: '故宫', lng: 116.397, lat: 39.918, type: '景点', description: '明清两代皇宫' },
    { name: '天安门广场', lng: 116.398, lat: 39.908, type: '景点', description: '世界上最大的城市广场' },
    { name: '颐和园', lng: 116.275, lat: 39.999, type: '景点', description: '皇家园林' },
    { name: '王府井', lng: 116.417, lat: 39.917, type: '购物', description: '著名商业街' },
    { name: '南锣鼓巷', lng: 116.404, lat: 39.939, type: '美食', description: '胡同文化与小吃' },
    { name: '全聚德烤鸭', lng: 116.417, lat: 39.917, type: '美食', description: '北京烤鸭老字号' },
    { name: '三里屯', lng: 116.455, lat: 39.938, type: '购物', description: '时尚购物区' },
    { name: '798艺术区', lng: 116.495, lat: 39.984, type: '景点', description: '现代艺术聚集地' }
  ];

  // 根据偏好调整行程内容
  const hasFood = preferences.includes('美食');
  const hasShopping = preferences.includes('购物') || preferences.includes('动漫');
  const hasCulture = preferences.includes('文化') || !hasFood && !hasShopping;
  
  const itinerary = Array.from({ length: days }).map((_, dayIdx) => {
    const dayNumber = dayIdx + 1;
    
    // 根据偏好选择不同类型的活动
    let morningActivity, afternoonActivity, eveningActivity;
    
    if (hasFood) {
      morningActivity = { 
        time: '上午', 
        title: '当地特色早餐体验', 
        type: '美食', 
        description: '品尝地道早餐',
        details: '体验当地最具特色的早餐文化，感受地道的美食风味',
        location: '当地知名早餐店或市场',
        duration: '1-2小时',
        tips: '建议早起前往，避开用餐高峰，可以尝试多种小吃',
        costEstimate: 50 
      };
      afternoonActivity = { 
        time: '下午', 
        title: '美食街区探索', 
        type: '美食', 
        description: '探索美食聚集地',
        details: '漫步美食街区，品尝各种特色小吃和当地美食',
        location: '知名美食街或市场',
        duration: '2-3小时',
        tips: '可以边走边吃，尝试不同摊位的美食，注意卫生条件',
        costEstimate: 150 
      };
      eveningActivity = { 
        time: '晚上', 
        title: '特色餐厅晚餐', 
        type: '美食', 
        description: '享受正式晚餐',
        details: '在特色餐厅享用正式的当地美食晚餐，体验完整的餐饮文化',
        location: '推荐餐厅或老字号',
        duration: '1.5-2小时',
        tips: '建议提前预订，尝试餐厅的招牌菜，注意用餐礼仪',
        costEstimate: 200 
      };
    } else if (hasShopping) {
      morningActivity = { 
        time: '上午', 
        title: '购物中心游览', 
        type: '购物', 
        description: '大型购物中心购物',
        details: '参观当地知名的大型购物中心，购买品牌商品和特色产品',
        location: '主要购物中心',
        duration: '2-3小时',
        tips: '关注商场促销活动，可以办理退税手续，保留购物小票',
        costEstimate: 300 
      };
      afternoonActivity = { 
        time: '下午', 
        title: '特色商店街', 
        type: '购物', 
        description: '特色商业街购物',
        details: '逛特色商店街，购买当地特色商品、手工艺品和纪念品',
        location: '特色商业街区',
        duration: '2-3小时',
        tips: '可以讨价还价，比较不同店铺的价格，购买有当地特色的物品',
        costEstimate: 200 
      };
      eveningActivity = { 
        time: '晚上', 
        title: '夜市或商业区', 
        type: '购物', 
        description: '夜市购物体验',
        details: '体验热闹的夜市文化，购买小吃、小商品和特色物品',
        location: '知名夜市或商业区',
        duration: '1-2小时',
        tips: '注意保管好随身物品，尝试当地夜市小吃，感受夜间氛围',
        costEstimate: 100 
      };
    } else {
      morningActivity = { 
        time: '上午', 
        title: '历史文化景点', 
        type: '景点', 
        description: '参观历史遗迹',
        details: '参观重要的历史文化景点，了解当地的历史发展和文化传承',
        location: '著名历史景点',
        duration: '2-3小时',
        tips: '建议请导游讲解，提前了解历史背景，注意文物保护',
        costEstimate: 100 
      };
      afternoonActivity = { 
        time: '下午', 
        title: '博物馆或艺术馆', 
        type: '文化', 
        description: '文化艺术参观',
        details: '参观博物馆或艺术馆，欣赏珍贵的文物藏品和艺术作品',
        location: '主要博物馆/美术馆',
        duration: '2-3小时',
        tips: '可以租用语音导览，关注特展信息，避免使用闪光灯拍照',
        costEstimate: 80 
      };
      eveningActivity = { 
        time: '晚上', 
        title: '文化表演或夜景', 
        type: '娱乐', 
        description: '文化娱乐活动',
        details: '观看当地的文化表演或欣赏美丽的城市夜景，体验夜间娱乐',
        location: '剧院或观景台',
        duration: '1.5-2小时',
        tips: '提前购票，注意表演时间，夜景拍摄时使用三脚架',
        costEstimate: 150 
      };
    }
    
    // 插入具体的目的地POI
    const specificPOI = pois[dayIdx % pois.length];
    if (specificPOI) {
      afternoonActivity = { 
        time: '下午', 
        title: specificPOI.name, 
        type: specificPOI.type, 
        description: specificPOI.description,
        details: `详细参观${specificPOI.name}，${specificPOI.description}，深入了解其历史文化和特色`,
        location: specificPOI.name,
        duration: '2-3小时',
        tips: '建议提前了解开放时间，穿着舒适的鞋子，带上相机记录美好瞬间',
        costEstimate: specificPOI.type === '美食' ? 120 : 80
      };
    }
    
    return {
      day: dayNumber,
      items: [morningActivity, afternoonActivity, eveningActivity],
      // 添加交通和住宿建议
      transportation: dayNumber === 1 ? 
        `从机场到市区的交通建议：${isTokyo ? '成田特快或京成电铁' : '机场快轨或出租车'}，费用约${isTokyo ? '3000' : '80'}元` :
        `市内交通：${isTokyo ? '地铁一日券' : '地铁或公交'}，费用约${isTokyo ? '800' : '30'}元`,
      accommodation: `推荐住宿：${isTokyo ? '新宿/银座区域商务酒店' : '王府井/前门附近酒店'}，每晚约${isTokyo ? '800' : '500'}元`
    };
  });
  
  return { center, pois, itinerary, meta: { destination, days, budget, people, preferences } };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { destination = '东京', days = 5, budget = 10000, people = 2, preferences = '', text = '' } = req.body || {};
  const meta = { destination, days, budget, people, preferences, text };

  const useLLM = process.env.LLM_PROVIDER === 'aliyun' && process.env.LLM_API_KEY;
  const amapKey = process.env.MAPS_API_KEY || process.env.NEXT_PUBLIC_MAPS_API_KEY;

  if (!useLLM) {
    const plan = samplePlan(destination, days, budget, people, preferences);
    return res.status(200).json({ ...plan, meta });
  }

  // Aliyun DashScope (Qwen) via OpenAI-compatible chat/completions to ensure JSON-only output
  const prompt = `你是旅行规划助手。请仅返回 JSON（不要包含任何非 JSON 的文字或代码块）。
需求：目的地=${destination}，天数=${days}，预算=${budget} 元，人数=${people}，偏好=${preferences}。语音文本=${text}。
JSON 结构如下：{"itinerary": [{"day": 1, "items": [{"time": "上午", "title": "景点或活动名称", "description": "简短描述", "details": "详细的活动介绍和建议", "location": "具体地点", "duration": "建议时长", "tips": "实用小贴士"}, {"time": "下午", "title": "..."}, {"time": "晚上", "title": "..."}]}]}
要求：
1）必须有 ${days} 天，每天包含 上午/下午/晚上 三项；
2）title 用中文，尽量具体到地点或活动；
3）为每个活动提供详细的描述、地点、时长建议和小贴士；
4）仅输出 JSON 对象。`;

  try {
    const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: '你是旅行规划助手。请仅返回JSON。' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await resp.json();
    let itineraryJson = null;
    if (Array.isArray(data?.choices) && data.choices[0]?.message?.content) {
      itineraryJson = JSON.parse(data.choices[0].message.content);
    }

    const itinerary = itineraryJson?.itinerary || samplePlan(destination, days).itinerary;
    
    // 确保所有行程项都有 costEstimate 字段
    for (const day of itinerary) {
      for (const it of day.items) {
        if (typeof it.costEstimate !== 'number' || isNaN(it.costEstimate)) {
          // 设置默认费用估算
          if (it.time === '上午') it.costEstimate = 200;
          else if (it.time === '下午') it.costEstimate = 300;
          else if (it.time === '晚上') it.costEstimate = 150;
          else it.costEstimate = 200; // 默认值
        }
      }
    }
    
    // Geocode POIs
    const poiSet = new Map();
    for (const day of itinerary) {
      for (const it of day.items) {
        const key = it.title;
        if (!poiSet.has(key) && amapKey) {
          // eslint-disable-next-line no-await-in-loop
          const poi = await geocodePlace(key, destination, amapKey);
          poiSet.set(key, poi);
        }
      }
    }
    const pois = Array.from(poiSet.values());
    // 统一使用目的地城市中心作为地图中心：优先动态解析，其次静态映射，最后用 POI 平均值
    let center = await resolveCityCenter(destination, amapKey);
    if (!center) {
      const mapped = getCityCenter(destination);
      if (Array.isArray(mapped) && mapped.length === 2) {
        center = mapped;
      } else if (pois.length > 0) {
        const avg = pois.reduce((acc, p) => {
          const lng = Number(p.lng), lat = Number(p.lat);
          if (lng && lat) {
            acc.lng += lng; acc.lat += lat; acc.count += 1;
          }
          return acc;
        }, { lng: 0, lat: 0, count: 0 });
        if (avg.count > 0) center = [avg.lng / avg.count, avg.lat / avg.count];
      }
    }
    return res.status(200).json({ center, pois, itinerary, meta });
  } catch (e) {
    const plan = samplePlan(destination, days);
    return res.status(200).json({ ...plan, meta, error: 'LLM or geocoding failed, using sample plan' });
  }
}
