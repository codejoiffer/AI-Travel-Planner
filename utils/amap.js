export function loadAMap() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window._amapPromise) return window._amapPromise;

  const key = process.env.NEXT_PUBLIC_MAPS_API_KEY;
  const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE || '';
  window._AMapSecurityConfig = { securityJsCode };

  window._amapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://webapi.amap.com/loader.js';
    script.async = true;
    script.onload = async () => {
      try {
        const AMap = await window.AMapLoader.load({
          key,
          version: '2.0',
          // 不在初始阶段加载任何插件，后续按需加载
        });
        resolve(AMap);
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error('AMap loader.js 加载失败'));
    document.body.appendChild(script);
  });

  return window._amapPromise;
}

export function lazyLoadPlugins(pluginNames = []) {
  return new Promise((resolve, reject) => {
    try {
      if (!window.AMap || !window.AMap.plugin) {
        reject(new Error('AMap 未初始化或不支持插件加载'));
        return;
      }
      if (!pluginNames || pluginNames.length === 0) {
        resolve();
        return;
      }
      window.AMap.plugin(pluginNames, () => {
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

// --------------------
// AMap Web Service REST 封装（仅服务端使用）
// --------------------

const AMAP_API_BASE = 'https://restapi.amap.com';

function ensureServer() {
  if (typeof window !== 'undefined') {
    throw new Error('AMap REST API 只能在服务端调用');
  }
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      usp.append(k, v.join('|'));
    } else {
      usp.append(k, String(v));
    }
  });
  return usp.toString();
}

async function amapFetch(path, params = {}) {
  ensureServer();
  const key = process.env.MAPS_API_KEY;
  if (!key) throw new Error('缺少 MAPS_API_KEY，无法调用 AMap REST API');
  const url = `${AMAP_API_BASE}${path}?${buildQuery({ key, ...params })}`;
  const resp = await fetch(url);
  const json = await resp.json();
  // AMap 通常以 status==='1' 表示成功
  if (json.status && String(json.status) !== '1') {
    const info = json.info || 'AMap API 调用失败';
    const infocode = json.infocode || '';
    throw new Error(`${info}${infocode ? ` (code: ${infocode})` : ''}`);
  }
  return json;
}

// 地理编码
export async function geocode(address, { city, batch = false } = {}) {
  return amapFetch('/v3/geocode/geo', { address, city, batch });
}

// 逆地理编码（经纬度 -> 地址）
export async function regeo(location, { extensions = 'base', radius, batch = false } = {}) {
  return amapFetch('/v3/geocode/regeo', { location, extensions, radius, batch });
}

// 关键字搜索（POI）
export async function placeText(keywords, {
  city,
  types,
  citylimit = true,
  offset = 20,
  page = 1,
  children = 0,
  extensions = 'base',
} = {}) {
  return amapFetch('/v3/place/text', { keywords, city, types, citylimit, offset, page, children, extensions });
}

// 周边搜索
export async function placeAround({
  location,
  keywords,
  types,
  radius = 3000,
  sortrule = 'distance',
  offset = 20,
  page = 1,
  extensions = 'base',
} = {}) {
  return amapFetch('/v3/place/around', { location, keywords, types, radius, sortrule, offset, page, extensions });
}

// 多边形搜索
export async function placePolygon({ polygon, keywords, types, offset = 20, page = 1, extensions = 'base' } = {}) {
  return amapFetch('/v3/place/polygon', { polygon, keywords, types, offset, page, extensions });
}

// POI ID 查询
export async function placeDetail(id, { extensions = 'all' } = {}) {
  return amapFetch('/v3/place/detail', { id, extensions });
}

// 输入提示
export async function inputTips(keywords, { city, datatype, type } = {}) {
  return amapFetch('/v3/assistant/inputtips', { keywords, city, datatype, type });
}

// 路径规划（驾车）
export async function directionDriving({
  origin,
  destination,
  waypoints,
  strategy,
  extensions = 'base',
  ferry = 0,
} = {}) {
  return amapFetch('/v3/direction/driving', { origin, destination, waypoints, strategy, extensions, ferry });
}

// 路径规划（步行）
export async function directionWalking({ origin, destination } = {}) {
  return amapFetch('/v3/direction/walking', { origin, destination });
}

// 路径规划（公交综合）
export async function directionTransit({ origin, destination, city, city1, city2, strategy, nightflag } = {}) {
  return amapFetch('/v3/direction/transit/integrated', { origin, destination, city, city1, city2, strategy, nightflag });
}

// 坐标转换（GPS/百度/谷歌 -> 高德）
export async function coordinateConvert(locations, { coordsys = 'gps' } = {}) {
  return amapFetch('/v3/assistant/coordinate/convert', { locations, coordsys });
}

// 行政区划查询
export async function districtQuery({ keywords, subdistrict = 1, extensions = 'base', level } = {}) {
  return amapFetch('/v3/config/district', { keywords, subdistrict, extensions, level });
}

// IP 定位
export async function ipLocation(ip) {
  return amapFetch('/v3/ip', { ip });
}

// 天气查询
export async function weather(city, { extensions = 'base' } = {}) {
  return amapFetch('/v3/weather/weatherInfo', { city, extensions });
}

// 交通态势：矩形区域
export async function trafficRectangle(rectangle, { level } = {}) {
  return amapFetch('/v3/traffic/status/rectangle', { rectangle, level });
}

// 交通态势：圆形区域
export async function trafficCircle(center, { radius = 1000, level } = {}) {
  return amapFetch('/v3/traffic/status/circle', { center, radius, level });
}

// 交通态势：指定道路
export async function trafficRoad(name, { city, level } = {}) {
  return amapFetch('/v3/traffic/status/road', { name, city, level });
}

// 静态地图（返回图片 URL）
export function staticMapUrl({
  size = '600*300',
  zoom = 12,
  center,
  markers,
  labels,
  paths,
} = {}) {
  ensureServer();
  const key = process.env.MAPS_API_KEY;
  if (!key) throw new Error('缺少 MAPS_API_KEY，无法生成静态地图 URL');
  const params = buildQuery({ size, zoom, center, markers, labels, paths, key });
  return `${AMAP_API_BASE}/v3/staticmap?${params}`;
}

// 以下服务通常需要额外凭证或独立域名（如 猎鹰/GeoHUB），仅占位：
export async function falconService() {
  throw new Error('猎鹰服务 API 需单独服务端配置与凭证（未配置）');
}

export async function geoHubService() {
  throw new Error('GeoHUB 服务 API 需单独服务端配置与凭证（未配置）');
}
