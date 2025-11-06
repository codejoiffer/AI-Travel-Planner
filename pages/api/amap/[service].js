import { 
  geocode,
  regeo,
  placeText,
  placeAround,
  placePolygon,
  placeDetail,
  inputTips,
  directionDriving,
  directionWalking,
  directionTransit,
  coordinateConvert,
  districtQuery,
  ipLocation,
  weather,
  trafficRectangle,
  trafficCircle,
  trafficRoad,
  staticMapUrl,
} from '../../../utils/amap';
import { createRateLimiter } from '../../../utils/rate-limit';

const rateLimiter = createRateLimiter({ limit: 60, windowMs: 60 * 1000 }); // 60 req / min / IP

function badRequest(res, message, details = {}) {
  res.status(400).json({ ok: false, error: message, details });
}

function methodNotAllowed(res) {
  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}

function coerceBool(val) {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'boolean') return val;
  const s = String(val).toLowerCase();
  return s === '1' || s === 'true';
}

function coerceInt(val) {
  if (val === undefined || val === null) return undefined;
  const n = parseInt(String(val), 10);
  return Number.isNaN(n) ? undefined : n;
}

function pick(obj, keys) {
  const out = {};
  keys.forEach(k => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

export default async function handler(req, res) {
  if (!rateLimiter(req, res)) {
    res.status(429).json({ ok: false, error: 'Too Many Requests' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  const service = req.query.service;
  const params = req.method === 'POST' ? (req.body || {}) : req.query;

  try {
    let data;
    switch (service) {
      case 'geocode': {
        const { address, city } = params;
        if (!address) return badRequest(res, 'address 必填');
        data = await geocode(String(address), { city });
        break;
      }
      case 'regeo': {
        const { location, extensions, radius, batch } = params;
        if (!location) return badRequest(res, 'location 必填');
        data = await regeo(String(location), { extensions, radius: coerceInt(radius), batch: coerceBool(batch) });
        break;
      }
      case 'placeText': {
        const { keywords } = params;
        if (!keywords) return badRequest(res, 'keywords 必填');
        const options = pick(params, ['city', 'types', 'offset', 'page', 'children', 'extensions']);
        if (options.offset) options.offset = coerceInt(options.offset);
        if (options.page) options.page = coerceInt(options.page);
        if (options.children) options.children = coerceInt(options.children);
        if (params.citylimit !== undefined) options.citylimit = coerceBool(params.citylimit);
        data = await placeText(String(keywords), options);
        break;
      }
      case 'placeAround': {
        const { location } = params;
        if (!location) return badRequest(res, 'location 必填');
        const options = pick(params, ['keywords', 'types', 'radius', 'sortrule', 'offset', 'page', 'extensions']);
        if (options.radius) options.radius = coerceInt(options.radius);
        if (options.offset) options.offset = coerceInt(options.offset);
        if (options.page) options.page = coerceInt(options.page);
        data = await placeAround({ location: String(location), ...options });
        break;
      }
      case 'placePolygon': {
        const { polygon } = params;
        if (!polygon) return badRequest(res, 'polygon 必填');
        const options = pick(params, ['keywords', 'types', 'offset', 'page', 'extensions']);
        if (options.offset) options.offset = coerceInt(options.offset);
        if (options.page) options.page = coerceInt(options.page);
        data = await placePolygon({ polygon: String(polygon), ...options });
        break;
      }
      case 'placeDetail': {
        const { id, extensions } = params;
        if (!id) return badRequest(res, 'id 必填');
        data = await placeDetail(String(id), { extensions });
        break;
      }
      case 'inputTips': {
        const { keywords } = params;
        if (!keywords) return badRequest(res, 'keywords 必填');
        const options = pick(params, ['city', 'datatype', 'type']);
        data = await inputTips(String(keywords), options);
        break;
      }
      case 'directionDriving': {
        const { origin, destination } = params;
        if (!origin || !destination) return badRequest(res, 'origin 与 destination 必填');
        const options = pick(params, ['waypoints', 'strategy', 'extensions', 'ferry']);
        data = await directionDriving({ origin: String(origin), destination: String(destination), ...options });
        break;
      }
      case 'directionWalking': {
        const { origin, destination } = params;
        if (!origin || !destination) return badRequest(res, 'origin 与 destination 必填');
        data = await directionWalking({ origin: String(origin), destination: String(destination) });
        break;
      }
      case 'directionTransit': {
        const { origin, destination } = params;
        if (!origin || !destination) return badRequest(res, 'origin 与 destination 必填');
        const options = pick(params, ['city', 'city1', 'city2', 'strategy', 'nightflag']);
        data = await directionTransit({ origin: String(origin), destination: String(destination), ...options });
        break;
      }
      case 'coordinateConvert': {
        const { locations, coordsys } = params;
        if (!locations) return badRequest(res, 'locations 必填');
        data = await coordinateConvert(String(locations), { coordsys });
        break;
      }
      case 'districtQuery': {
        const { keywords } = params;
        if (!keywords) return badRequest(res, 'keywords 必填');
        const options = pick(params, ['subdistrict', 'extensions', 'level']);
        if (options.subdistrict) options.subdistrict = coerceInt(options.subdistrict);
        data = await districtQuery(options.level ? { keywords, ...options } : { keywords, ...options });
        break;
      }
      case 'ipLocation': {
        let { ip } = params;
        if (!ip) {
          // 若未提供 ip 参数，使用客户端 IP
          const xf = req.headers['x-forwarded-for'];
          ip = Array.isArray(xf) ? xf[0] : (typeof xf === 'string' ? xf.split(',')[0].trim() : req.socket?.remoteAddress);
        }
        data = await ipLocation(ip);
        break;
      }
      case 'weather': {
        const { city, extensions } = params;
        if (!city) return badRequest(res, 'city 必填（城市编码或名称）');
        data = await weather(String(city), { extensions });
        break;
      }
      case 'trafficRectangle': {
        const { rectangle, level } = params;
        if (!rectangle) return badRequest(res, 'rectangle 必填');
        data = await trafficRectangle(String(rectangle), { level });
        break;
      }
      case 'trafficCircle': {
        const { center, radius, level } = params;
        if (!center) return badRequest(res, 'center 必填');
        const opts = { radius: radius ? coerceInt(radius) : undefined, level };
        data = await trafficCircle(String(center), opts);
        break;
      }
      case 'trafficRoad': {
        const { name, city, level } = params;
        if (!name) return badRequest(res, 'name 必填');
        data = await trafficRoad(String(name), { city, level });
        break;
      }
      case 'staticMap': {
        const options = pick(params, ['size', 'zoom', 'center', 'markers', 'labels', 'paths']);
        if (!options.center && !options.markers) {
          return badRequest(res, '至少提供 center 或 markers');
        }
        const url = staticMapUrl(options);
        // 代理获取图片并以 base64 形式返回，避免暴露密钥
        const respImg = await fetch(url);
        if (!respImg.ok) throw new Error(`静态地图获取失败: ${respImg.status}`);
        const buf = Buffer.from(await respImg.arrayBuffer());
        const b64 = buf.toString('base64');
        data = { image: `data:image/png;base64,${b64}` };
        break;
      }
      default:
        return badRequest(res, '未知服务', { service });
    }

    res.status(200).json({ ok: true, data });
  } catch (err) {
    const message = err?.message || 'AMap 服务调用失败';
    res.status(500).json({ ok: false, error: message });
  }
}
