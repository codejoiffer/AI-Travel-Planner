async function geocodePlace(name, city, key) {
  try {
    // 确保只搜索中国境内的地点，并限制在对应城市
    // 从目的地中提取城市名称（去除'中国'前缀和可能的其他描述）
    let cityName = city || '';
    
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
    
    const url = `https://restapi.amap.com/v3/place/text?key=${encodeURIComponent(key)}&keywords=${encodeURIComponent(name)}${cityName ? `&city=${encodeURIComponent(cityName)}` : ''}&offset=1&page=1&citylimit=true`; 
    const resp = await fetch(url);
    const json = await resp.json();
    if (json.pois && json.pois.length) {
      const p = json.pois[0];
      const [lng, lat] = (p.location || '').split(',').map(Number);
      
      // 验证坐标是否在中国境内（经度73-135，纬度18-53）
      if (lng && lat && lng >= 73 && lng <= 135 && lat >= 18 && lat <= 53) {
        return { name: p.name || name, lng, lat, type: p.type || '' };
      } else {
        console.warn(`地点"${name}"的坐标(${lng},${lat})超出中国范围，使用默认坐标`);
      }
    }
    
    // 返回默认坐标（北京天安门）
    return { name, lng: 116.397428, lat: 39.90923, type: '' };
  } catch {
    // 出错时返回默认坐标
    return { name, lng: 116.397428, lat: 39.90923, type: '' };
  }
}

function samplePlan(destination, days, budget, people, preferences) {
  const isTokyo = destination.includes('东京');
  const isNanjing = destination.includes('南京');
  const center = isTokyo ? [139.767125, 35.681236] : (isNanjing ? [118.7969, 32.0603] : [116.397428, 39.90923]);
  
  // 根据目的地生成不同的POI
  const pois = isTokyo ? [
    { name: '浅草寺', lng: 139.794, lat: 35.7148, type: '景点', description: '东京最古老的寺庙' },
    { name: '秋叶原', lng: 139.7745, lat: 35.6984, type: '购物', description: '电子产品与动漫文化中心' },
    { name: '东京塔', lng: 139.7454, lat: 35.6586, type: '景点', description: '东京地标性建筑' },
    { name: '筑地市场', lng: 139.771, lat: 35.665, type: '美食', description: '新鲜海鲜与寿司' },
    { name: '新宿御苑', lng: 139.710, lat: 35.685, type: '景点', description: '美丽的日式庭园' },
    { name: '涩谷十字路口', lng: 139.700, lat: 35.659, type: '景点', description: '世界最繁忙的十字路口' },
    { name: '一兰拉面', lng: 139.734, lat: 35.669, type: '美食', description: '著名拉面连锁店' },
    { name: '银座', lng: 139.767, lat: 35.672, type: '购物', description: '高端购物区' }
  ] : (isNanjing ? [
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
  ] : [
    { name: '故宫', lng: 116.397, lat: 39.918, type: '景点', description: '明清两代皇宫' },
    { name: '天安门广场', lng: 116.398, lat: 39.908, type: '景点', description: '世界上最大的城市广场' },
    { name: '颐和园', lng: 116.275, lat: 39.999, type: '景点', description: '皇家园林' },
    { name: '王府井', lng: 116.417, lat: 39.917, type: '购物', description: '著名商业街' },
    { name: '南锣鼓巷', lng: 116.404, lat: 39.939, type: '美食', description: '胡同文化与小吃' },
    { name: '全聚德烤鸭', lng: 116.417, lat: 39.917, type: '美食', description: '北京烤鸭老字号' },
    { name: '三里屯', lng: 116.455, lat: 39.938, type: '购物', description: '时尚购物区' },
    { name: '798艺术区', lng: 116.495, lat: 39.984, type: '景点', description: '现代艺术聚集地' }
  ]);

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
    const center = pois.length ? [pois[0].lng, pois[0].lat] : (destination.includes('东京') ? [139.767125, 35.681236] : [116.397428, 39.90923]);
    return res.status(200).json({ center, pois, itinerary, meta });
  } catch (e) {
    const plan = samplePlan(destination, days);
    return res.status(200).json({ ...plan, meta, error: 'LLM or geocoding failed, using sample plan' });
  }
}
