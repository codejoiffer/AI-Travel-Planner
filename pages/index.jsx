import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import HeaderBar from '../components/HeaderBar';
import AuthModal from '../components/AuthModal';
import WelcomeSection from '../components/WelcomeSection';
import MapPanel from '../components/MapPanel';
import VoiceInputCard from '../components/VoiceInputCard';
import PlanSettingsCard from '../components/PlanSettingsCard';
import PlanResults from '../components/PlanResults';
import BudgetSummaryCard from '../components/BudgetSummaryCard';
import ExpensesListCard from '../components/ExpensesListCard';
import SavedTripsCard from '../components/SavedTripsCard';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { loadSavedTrips } from '../utils/trips';
import { loadAMap, lazyLoadPlugins } from '../utils/amap';

export default function Home() {
  console.log('Home component rendered');
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [destination, setDestination] = useState('南京');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState(10000);
  const [people, setPeople] = useState(2);
  const [preferences, setPreferences] = useState('美食, 动漫, 亲子');
  const [recognizedText, setRecognizedText] = useState('');
  const [plan, setPlan] = useState(null);
  const [budgetEstimate, setBudgetEstimate] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [activeTripId, setActiveTripId] = useState(null); // 当前行程ID（用于费用云同步）
  const [expenses, setExpenses] = useState([]); // 费用记录列表
  const [expenseDraft, setExpenseDraft] = useState({ amount: '', category: 'other', description: '', day: '', time: '' });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const scriptNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const pcmBuffersRef = useRef([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [autoLoadedFromQuery, setAutoLoadedFromQuery] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(null); // 存储展开的活动 {day: number, time: string}
  const [mapLoading, setMapLoading] = useState(true); // 地图加载状态
  const [recordingTime, setRecordingTime] = useState(0); // 录音计时
  const [isRecording, setIsRecording] = useState(false); // 录音状态
  const recordingTimerRef = useRef(null); // 录音计时器引用
  const [currentStep, setCurrentStep] = useState(1); // 递进式步骤：1语音→2设置→3结果→4预算→5费用→6保存
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const sidebarBodyRef = useRef(null);
  const navRailRef = useRef(null);
  const sidebarRef = useRef(null);
  const hoverCloseDelayRef = useRef(null);
  const stepStatus = (idx) => (idx < currentStep ? 'done' : (idx === currentStep ? 'active' : 'todo'));
  const stepStatusText = (idx) => (idx < currentStep ? '完成' : (idx === currentStep ? '进行中' : '待办'));
  const closeSidebar = () => setSidebarOpen(false);
  const scrollSidebarTop = () => { const el = sidebarBodyRef.current; if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleHoverEnter = () => {
    try { if (hoverCloseDelayRef.current) clearTimeout(hoverCloseDelayRef.current); } catch {}
    setSidebarOpen(true);
  };
  const handleHoverLeave = () => {
    try { if (hoverCloseDelayRef.current) clearTimeout(hoverCloseDelayRef.current); } catch {}
    hoverCloseDelayRef.current = setTimeout(() => {
      const railHovered = navRailRef.current && navRailRef.current.matches(':hover');
      const sidebarHovered = sidebarRef.current && sidebarRef.current.matches(':hover');
      if (!railHovered && !sidebarHovered) {
        setSidebarOpen(false);
      }
    }, 180);
  };
  const onResizerMouseDown = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const onMove = (ev) => {
      const delta = ev.clientX - startX;
      setSidebarWidth(clamp(startWidth + delta, 280, 560));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 路线相关状态与引用
  const [routeMode, setRouteMode] = useState('driving'); // driving|walking|transit
  const [showDailyRoutes, setShowDailyRoutes] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const dailyPolylinesRef = useRef([]); // [{day, polyline, arrow}]
  const markerMapRef = useRef(new Map()); // 名称 -> Marker 映射
  const routePalette = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#13c2c2', '#722ed1'];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        autoConfirmEmail: true, // 自动确认邮箱，跳过验证邮件
        detectSessionInUrl: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    }
  );

  // ---- Map interaction states ----
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showRoadNet, setShowRoadNet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const trafficLayerRef = useRef(null);
  const satelliteLayerRef = useRef(null);
  const roadNetLayerRef = useRef(null);
  const geolocationRef = useRef(null);
  const searchTimerRef = useRef(null);
  const defaultCenterRef = useRef([118.7969, 32.0603]); // 南京中心

  // ---- Helpers: parse Chinese numbers and extract fields from speech text ----
  const chineseNumberToInt = (str) => {
    if (!str) return NaN;
    const map = { '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    // Normalize
    str = str.replace(/\s+/g, '');
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    if (str === '十') return 10;
    // 十X => 10 + X
    if (str.startsWith('十') && str.length === 2 && map[str[1]] !== undefined) return 10 + map[str[1]];
    // X十 => X*10
    if (str.endsWith('十') && map[str[0]] !== undefined) return map[str[0]] * 10;
    // X十Y => X*10 + Y
    if (str.length === 3 && str[1] === '十' && map[str[0]] !== undefined && map[str[2]] !== undefined) {
      return map[str[0]] * 10 + map[str[2]];
    }
    // 单字映射
    if (map[str] !== undefined) return map[str];
    return NaN;
  };

  const unitToMultiplier = (u) => {
    switch (u) {
      case '万': return 10000;
      case '千': return 1000;
      case '百': return 100;
      default: return 1;
    }
  };

  const parseSpeechToForm = (text) => {
    if (!text || typeof text !== 'string') return;
    try {
      // 不在此处改变地图加载状态，避免误触发“加载中”显示
      const t = text.trim();

      // Destination
      let dest;
      const destMatch = t.match(/(?:我?(?:想|准备|打算)?(?:去|到)|目的地(?:是)?|去往)\s*([^，。,;；!！\s]+)/);
      if (destMatch && destMatch[1]) dest = destMatch[1].replace(/\s+/g, '');

      // Days
      let d;
      const d1 = t.match(/(\d+)\s*天/);
      if (d1) d = parseInt(d1[1], 10);
      if (!d) {
        const d2 = t.match(/([一二三四五六七八九十两]+)\s*天/);
        if (d2) d = chineseNumberToInt(d2[1]);
      }

      // Budget
      let b;
      let bm = t.match(/预算\s*([0-9]+(?:\.[0-9]+)?)\s*([万千百])?\s*(?:元|人民币)?/);
      if (!bm) bm = t.match(/预算\s*([一二三四五六七八九十两]+)\s*([万千百])?\s*(?:元|人民币)?/);
      if (!bm) bm = t.match(/([0-9]+(?:\.[0-9]+)?)\s*([万千百])?\s*元/);
      if (bm) {
        const valStr = bm[1];
        const unit = bm[2] || '';
        const num = /^\d/.test(valStr) ? parseFloat(valStr) : chineseNumberToInt(valStr);
        if (!isNaN(num)) b = Math.round(num * unitToMultiplier(unit));
      }

      // People
      let p;
      const p1 = t.match(/一家([一二三四五六七八九十两]+)口/);
      if (p1) p = chineseNumberToInt(p1[1]);
      if (!p) {
        const p2 = t.match(/(\d+)\s*人/);
        if (p2) p = parseInt(p2[1], 10);
      }
      if (!p) {
        const p3 = t.match(/([一二三四五六七八九十两]+)\s*人/);
        if (p3) p = chineseNumberToInt(p3[1]);
      }
      if (!p && /(亲子|带孩子)/.test(t)) p = Math.max(people || 0, 3);

      // Preferences
      let pref;
      const prefMatch = t.match(/(喜欢|偏好|爱好|兴趣|想体验|希望|想要)[：:\s]?([^。.!?\n]+)/);
      if (prefMatch && prefMatch[2]) {
        pref = prefMatch[2]
          .split(/、|，|,|和|以及|与/)
          .map(s => s.trim())
          .filter(Boolean)
          .join(', ');
      }

      if (dest) setDestination(dest);
      if (d && Number.isFinite(d) && d > 0) setDays(d);
      if (b && Number.isFinite(b) && b >= 0) setBudget(b);
      if (p && Number.isFinite(p) && p > 0) setPeople(p);
      if (pref) setPreferences(pref);
    } catch (e) {
      console.debug('parseSpeechToForm error', e);
    }
  };

  // 从语音/文本中提取消费记录
  const parseSpeechToExpense = (text) => {
    if (!text || typeof text !== 'string') return null;
    try {
      const t = text.trim();
      // 金额匹配: "200元"、"消费200"、中文数字+单位
      let amount;
      let am = t.match(/(\d+(?:\.\d+)?)\s*元/);
      if (!am) am = t.match(/([一二三四五六七八九十两]+)\s*([万千百])?\s*元/);
      if (!am) am = t.match(/(?:消费|花费|花了|花掉)(\d+(?:\.\d+)?)/);
      if (am) {
        const valStr = am[1];
        const unit = am[2] || '';
        const num = /^\d/.test(valStr) ? parseFloat(valStr) : chineseNumberToInt(valStr);
        if (!isNaN(num)) amount = Math.round(num * unitToMultiplier(unit));
      }

      // 类别推断
      let category = 'other';
      if (/(餐|吃|美食|晚餐|午餐|早餐|酒|咖啡|奶茶)/.test(t)) category = 'food';
      else if (/(住|酒店|宾馆|民宿|住宿)/.test(t)) category = 'accommodation';
      else if (/(地铁|公交|打车|出租|交通|火车|高铁|飞机|机票)/.test(t)) category = 'transport';
      else if (/(门票|票|入场|景点)/.test(t)) category = 'tickets';

      // 描述
      let description = '';
      const descMatch = t.match(/(?:在|于)?(.{0,20})(餐厅|酒店|地铁|公交|景点|门票|机票|民宿|咖啡|奶茶)(.{0,20})/);
      if (descMatch) description = `${descMatch[1] || ''}${descMatch[2]}${descMatch[3] || ''}`.trim();

      // 天数/时间
      let day = null;
      const dm1 = t.match(/第\s*(\d+)\s*天/);
      if (dm1) day = parseInt(dm1[1], 10);
      if (!day) {
        const dm2 = t.match(/第\s*([一二三四五六七八九十两]+)\s*天/);
        if (dm2) day = chineseNumberToInt(dm2[1]);
      }
      let time = '';
      const tm = t.match(/(上午|下午|晚上|中午|早上|傍晚)/);
      if (tm) time = tm[1];

      if (amount && Number.isFinite(amount)) {
        return { amount, category, description, day, time };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // ---- Route helpers ----
  const parsePolylineString = (polylineStr) => {
    if (!polylineStr || typeof polylineStr !== 'string') return [];
    return polylineStr.split(';')
      .map(pair => pair.split(',').map(Number))
      .filter(arr => arr.length === 2 && Number.isFinite(arr[0]) && Number.isFinite(arr[1]));
  };

  const extractPointsFromDirection = (mode, directionData) => {
    if (!directionData) return [];
    try {
      if (mode === 'driving' || mode === 'walking') {
        const paths = directionData?.route?.paths || [];
        const first = paths[0];
        if (!first) return [];
        const steps = first.steps || [];
        const points = [];
        steps.forEach(step => {
          const seg = parsePolylineString(step.polyline);
          seg.forEach(pt => points.push(pt));
        });
        return points;
      }
      if (mode === 'transit') {
        const transits = directionData?.route?.transits || [];
        const best = transits[0];
        if (!best) return [];
        const points = [];
        const segments = best.segments || [];
        segments.forEach(seg => {
          if (seg.walking?.steps?.length) {
            seg.walking.steps.forEach(step => {
              const segPts = parsePolylineString(step.polyline);
              segPts.forEach(pt => points.push(pt));
            });
          }
          if (seg.bus?.buslines?.length) {
            seg.bus.buslines.forEach(line => {
              const segPts = parsePolylineString(line.polyline);
              segPts.forEach(pt => points.push(pt));
            });
          }
        });
        return points;
      }
      return [];
    } catch (e) {
      console.warn('extractPointsFromDirection 解析失败:', e);
      return [];
    }
  };

  // 根据显示开关控制路线显隐
  useEffect(() => {
    try {
      const list = dailyPolylinesRef.current || [];
      list.forEach(({ polyline, arrow }) => {
        if (!polyline || !polyline.hide || !polyline.show) return;
        if (showDailyRoutes) {
          polyline.show();
          if (arrow?.show) arrow.show();
        } else {
          polyline.hide();
          if (arrow?.hide) arrow.hide();
        }
      });
    } catch (e) {
      // ignore
    }
  }, [showDailyRoutes]);

  const highlightDay = (dayNum) => {
    setSelectedDay(dayNum);
    try {
      const list = dailyPolylinesRef.current || [];
      list.forEach(({ day, polyline, arrow }) => {
        if (!polyline) return;
        const isTarget = day === dayNum;
        if (isTarget) {
          // 高亮目标路线：显示并加粗
          polyline.show();
          polyline.setOptions({
            strokeWeight: 7,
            strokeOpacity: 1.0,
            zIndex: 1000,
          });
          if (arrow && arrow.show) arrow.show();
        } else {
          // 隐藏非目标路线
          polyline.hide();
          if (arrow && arrow.hide) arrow.hide();
        }
      });
    } catch (e) {
      // ignore
    }
  };

  // 切换路线模式时，基于现有标记与行程数据重绘路线
  useEffect(() => {
    try {
      if (!mapInstanceRef.current) return;
      if (!plan?.itinerary || !Array.isArray(plan.itinerary) || plan.itinerary.length === 0) return;
      const nameToMarker = markerMapRef.current;
      if (!nameToMarker || nameToMarker.size === 0) return;
      // 当标注匹配失败时，回退用 POI 名称匹配取坐标
      const findPoiForItem = (item) => {
        if (!plan?.pois || !Array.isArray(plan.pois)) return null;
        const keys = [];
        if (item?.location) keys.push(item.location);
        if (item?.title) keys.push(item.title);
        for (const k of keys) {
          if (!k) continue;
          const kb = (k || '').toLowerCase();
          for (const p of plan.pois) {
            const pa = (p?.name || '').toLowerCase();
            if (!pa || !kb) continue;
            if (pa.includes(kb) || kb.includes(pa)) return p;
          }
        }
        return null;
      };

      const redraw = async () => {
        try {
          // 移除已有的每日路线覆盖物
          const existing = dailyPolylinesRef.current || [];
          existing.forEach(({ polyline, arrow }) => {
            try { mapInstanceRef.current.remove(polyline); } catch {}
            try { if (arrow) mapInstanceRef.current.remove(arrow); } catch {}
          });
          dailyPolylinesRef.current = [];

          const toArr = (pos) => Array.isArray(pos) ? pos : [pos?.lng ?? pos?.getLng?.(), pos?.lat ?? pos?.getLat?.()];
          const findMarkerForItem = (item) => {
            const keys = [];
            if (item && item.location) keys.push(item.location);
            if (item && item.title) keys.push(item.title);
            for (const k of keys) {
              if (k && nameToMarker.has(k)) return nameToMarker.get(k);
            }
            for (const [poiName, mk] of nameToMarker.entries()) {
              for (const k of keys) {
                if (!k) continue;
                const a = (poiName || '').toLowerCase();
                const b = (k || '').toLowerCase();
                if (!a || !b) continue;
                if (a.includes(b) || b.includes(a)) return mk;
              }
            }
            return null;
          };

          for (let i = 0; i < plan.itinerary.length; i++) {
            const day = plan.itinerary[i];
            const positions = [];
            for (const it of day.items) {
              const mk = findMarkerForItem(it);
              let pos = null;
              if (mk) {
                pos = mk.getPosition();
              } else {
                const poi = findPoiForItem(it);
                if (poi && typeof poi.lng === 'number' && typeof poi.lat === 'number') {
                  pos = [poi.lng, poi.lat];
                }
              }
              if (pos) {
                const last = positions[positions.length - 1];
                const lp = last ? (Array.isArray(last) ? last : [last?.lng ?? last?.getLng?.(), last?.lat ?? last?.getLat?.()]) : null;
                const pp = Array.isArray(pos) ? pos : [pos?.lng ?? pos?.getLng?.(), pos?.lat ?? pos?.getLat?.()];
                if (!lp || lp[0] !== pp[0] || lp[1] !== pp[1]) {
                  positions.push(pos);
                }
              }
            }
            if (positions.length > 1) {
              const color = routePalette[i % routePalette.length];
              const routePoints = [];
              for (let k = 1; k < positions.length; k++) {
                const [lng1, lat1] = toArr(positions[k - 1]);
                const [lng2, lat2] = toArr(positions[k]);
                const origin = `${lng1},${lat1}`;
                const destinationStr = `${lng2},${lat2}`;
                const endpoint = routeMode === 'walking' ? 'directionWalking' : (routeMode === 'transit' ? 'directionTransit' : 'directionDriving');
                const qs = new URLSearchParams({ origin, destination: destinationStr, ...(routeMode === 'transit' ? { city: destination } : {}) }).toString();
                try {
                  const resp = await fetch(`/api/amap/${endpoint}?${qs}`);
                  const json = await resp.json();
                  if (json.ok) {
                    const segPts = extractPointsFromDirection(routeMode, json.data);
                    if (segPts && segPts.length) {
                      segPts.forEach(pt => routePoints.push(pt));
                    } else {
                      routePoints.push([lng1, lat1], [lng2, lat2]);
                    }
                  } else {
                    routePoints.push([lng1, lat1], [lng2, lat2]);
                  }
                } catch (e) {
                  console.warn('路径规划失败，使用直线段作为退化:', e);
                  routePoints.push([lng1, lat1], [lng2, lat2]);
                }
              }
              const finalPoints = routePoints.length > 1 
                ? routePoints 
                : [toArr(positions[0]), toArr(positions[positions.length - 1])];
              if (finalPoints.length > 1) {
                const polyline = new window.AMap.Polyline({
                  path: finalPoints,
                  strokeColor: color,
                  strokeWeight: 5,
                  strokeOpacity: 0.9,
                  strokeStyle: 'solid',
                  lineJoin: 'round',
                  lineCap: 'round',
                  zIndex: 999
                });
                mapInstanceRef.current.add(polyline);
                const mid = finalPoints[Math.floor(finalPoints.length / 2)];
                const arrow = new window.AMap.Marker({
                  position: mid,
                  content: `<div style="color: ${color}; font-size: 18px;">➡️ 第${day.day}天</div>`,
                  offset: new window.AMap.Pixel(-10, -10)
                });
                mapInstanceRef.current.add(arrow);
                dailyPolylinesRef.current.push({ day: day.day, polyline, arrow });
              }
            }
          }
          if (selectedDay) highlightDay(selectedDay);
        } catch (e) {
          console.warn('重绘路线失败:', e);
        }
      };
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(redraw, { timeout: 800 });
      } else {
        setTimeout(redraw, 100);
      }
    } catch (e) {
      // ignore
    }
  }, [routeMode, plan, destination]);

  // Load Gaode Maps via official loader
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAPS_API_KEY;
    console.log('地图API密钥配置:', key ? '已配置' : '未配置');

    if (!key) {
      console.error('高德地图API密钥未配置，请检查NEXT_PUBLIC_MAPS_API_KEY环境变量');
      setMapLoading(false);
      return;
    }

    const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE || '';
    window._AMapSecurityConfig = { securityJsCode };
    console.log('地图安全代码配置:', securityJsCode ? '已配置' : '使用空安全代码');

    let cancelled = false;
    setMapLoading(true);
    loadAMap()
      .then(() => {
        // 无论容器是否已经就绪，都触发初始化；初始化内部会自行检查并重试
        if (!cancelled && !mapInstanceRef.current) {
          initializeMap();
        } else if (!cancelled && mapInstanceRef.current) {
          // 已有实例，确保取消加载状态
          setMapLoading(false);
        }
      })
      .catch((err) => {
        console.error('高德地图加载失败:', err);
        setMapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  
  // 初始化地图函数
  const initializeMap = () => {
    try {
      // 若地图已存在，直接结束加载状态
      if (mapInstanceRef.current) {
        setMapLoading(false);
        return;
      }
      const scheduleIdle = (fn) => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(fn, { timeout: 1000 });
        } else {
          setTimeout(fn, 300);
        }
      };
      // 检查容器元素是否在DOM中
      const checkContainer = () => {
        if (mapRef.current && window.AMap) {
          // 确保容器有尺寸
          if (mapRef.current.offsetWidth > 0 && mapRef.current.offsetHeight > 0) {
            console.log('开始初始化地图，容器:', mapRef.current);
            setMapLoading(true);
            mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
              zoom: 11,
              center: defaultCenterRef.current, // 南京市中心
              viewMode: '2D',
              mapStyle: 'amap://styles/normal',
            });
            console.log('地图初始化成功');
            setMapLoading(false); // 地图初始化完成，停止加载指示
            
            // 地图完成后，再延迟加载控件等插件，避免阻塞初始渲染
            mapInstanceRef.current.on('complete', () => {
              scheduleIdle(() => {
                // 先只加载必要的控件，避免资源不足错误
                  lazyLoadPlugins(['AMap.ToolBar'])
                  .then(() => {
                    try {
                      mapInstanceRef.current.addControl(new window.AMap.ToolBar());
                      // 其他控件按需延迟加载
                      setTimeout(() => {
                        lazyLoadPlugins(['AMap.Scale', 'AMap.Geolocation'])
                          .then(() => {
                            mapInstanceRef.current.addControl(new window.AMap.Scale());
                            try {
                              geolocationRef.current = new window.AMap.Geolocation({
                                enableHighAccuracy: true,
                                timeout: 5000,
                                showCircle: false,
                                zoomToAccuracy: true,
                                buttonOffset: new window.AMap.Pixel(10, 20),
                              });
                            } catch {}
                          })
                          .catch(() => {
                            console.warn('Scale控件加载失败');
                          });
                      }, 1000);
                    } catch (e) {
                      console.warn('添加控件失败:', e);
                    }
                  })
                  .catch((err) => {
                    console.warn('控件插件加载失败:', err);
                  });
              });
            });
            
            // 设置地图样式为更现代的外观
            mapInstanceRef.current.setMapStyle('amap://styles/light');
            
            // 初始化阶段不添加任何硬编码标注，标注将基于后端 API 返回的 POI 数据动态创建
            
            return true;
          } else {
            console.log('地图容器没有尺寸，等待渲染完成');
            return false;
          }
        } else {
          console.error('地图初始化失败: 容器或AMap对象不可用');
          console.log('mapRef.current:', mapRef.current);
          console.log('window.AMap:', window.AMap);
          return false;
        }
      };
      
      // 尝试立即初始化
      if (!checkContainer()) {
        // 如果容器不可用，等待一段时间再重试
        setTimeout(() => {
          if (!checkContainer()) {
            console.error('地图初始化失败: 容器或AMap对象仍然不可用');
            setMapLoading(false);
          }
        }, 1000);
      }
      
    } catch (e) {
      console.error('地图初始化错误:', e);
      setMapLoading(false); // 确保在初始化失败时也更新加载状态
    }
  };

  // ---- Map controls handlers ----
  const toggleTraffic = useCallback(() => {
    try {
      if (!mapInstanceRef.current) return;
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new window.AMap.TileLayer.Traffic({ zIndex: 10 });
      }
      const enable = !showTraffic;
      setShowTraffic(enable);
      if (enable) {
        try { trafficLayerRef.current.setMap(mapInstanceRef.current); } catch {}
      } else {
        try { trafficLayerRef.current.setMap(null); } catch {}
      }
    } catch (e) {
      console.warn('切换交通图层失败:', e);
    }
  }, [showTraffic]);

  const toggleSatellite = useCallback(() => {
    try {
      if (!mapInstanceRef.current) return;
      if (!satelliteLayerRef.current) {
        satelliteLayerRef.current = new window.AMap.TileLayer.Satellite({ zIndex: 5 });
      }
      const enable = !showSatellite;
      setShowSatellite(enable);
      if (enable) {
        try { satelliteLayerRef.current.setMap(mapInstanceRef.current); } catch {}
      } else {
        try { satelliteLayerRef.current.setMap(null); } catch {}
      }
    } catch (e) {
      console.warn('切换卫星图层失败:', e);
    }
  }, [showSatellite]);

  const toggleRoadNet = useCallback(() => {
    try {
      if (!mapInstanceRef.current) return;
      if (!roadNetLayerRef.current) {
        roadNetLayerRef.current = new window.AMap.TileLayer.RoadNet({ zIndex: 6 });
      }
      const enable = !showRoadNet;
      setShowRoadNet(enable);
      if (enable) {
        try { roadNetLayerRef.current.setMap(mapInstanceRef.current); } catch {}
      } else {
        try { roadNetLayerRef.current.setMap(null); } catch {}
      }
    } catch (e) {
      console.warn('切换路网图层失败:', e);
    }
  }, [showRoadNet]);

  const locateMe = useCallback(async () => {
    try {
      if (!mapInstanceRef.current) return;
      // 确保定位插件可用
      if (!geolocationRef.current) {
        await lazyLoadPlugins(['AMap.Geolocation']).catch(() => {});
        try {
          geolocationRef.current = new window.AMap.Geolocation({
            enableHighAccuracy: true,
            timeout: 5000,
            showCircle: false,
            zoomToAccuracy: true,
          });
        } catch {}
      }
      if (!geolocationRef.current) return;
      geolocationRef.current.getCurrentPosition((status, result) => {
        try {
          if (status === 'complete' && result && result.position) {
            const pos = result.position;
            mapInstanceRef.current.setCenter([pos.lng, pos.lat]);
            mapInstanceRef.current.setZoom(14);
          } else {
            console.warn('定位失败:', result);
            alert('定位失败或被拒绝');
          }
        } catch {}
      });
    } catch (e) {
      console.warn('定位异常:', e);
    }
  }, []);

  const resetView = useCallback(() => {
    try {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.setMapStyle('amap://styles/light');
      mapInstanceRef.current.setCenter(defaultCenterRef.current);
      mapInstanceRef.current.setZoom(11);
      // 关闭图层
      if (trafficLayerRef.current) try { trafficLayerRef.current.setMap(null); } catch {}
      if (satelliteLayerRef.current) try { satelliteLayerRef.current.setMap(null); } catch {}
      if (roadNetLayerRef.current) try { roadNetLayerRef.current.setMap(null); } catch {}
      setShowTraffic(false);
      setShowSatellite(false);
      setShowRoadNet(false);
    } catch (e) {
      console.warn('重置视图失败:', e);
    }
  }, []);

  const onSelectDay = useCallback((dayNum) => {
    if (dayNum === null) {
      setSelectedDay(null);
      // 恢复默认权重
      try {
        const list = dailyPolylinesRef.current || [];
        list.forEach(({ polyline }) => polyline?.setOptions?.({ strokeWeight: 5, strokeOpacity: 0.9, zIndex: 999 }));
      } catch {}
      return;
    }
    highlightDay(dayNum);
  }, [highlightDay]);

  // 搜索建议（防抖调用服务端代理 /api/amap/inputTips）
  useEffect(() => {
    try {
      const q = (searchQuery || '').trim();
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (!q) {
        setSearchSuggestions([]);
        return;
      }
      searchTimerRef.current = setTimeout(async () => {
        try {
          const url = `/api/amap/inputTips?keywords=${encodeURIComponent(q)}&city=${encodeURIComponent(destination || '')}`;
          const res = await fetch(url);
          const json = await res.json().catch(() => ({}));
          const list = json?.data?.tips || json?.data || [];
          setSearchSuggestions(Array.isArray(list) ? list : []);
        } catch (e) {
          console.warn('搜索建议失败:', e);
        }
      }, 250);
    } catch {}
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, destination]);

  const pickSuggestion = useCallback(async (sug) => {
    try {
      setSearchSuggestions([]);
      const name = sug?.name || sug?.address || sug?.id || '';
      let lnglat = null;
      // 优先使用提示包含的 location
      if (sug?.location) {
        const [lng, lat] = String(sug.location).split(',').map(Number);
        if (Number.isFinite(lng) && Number.isFinite(lat)) lnglat = [lng, lat];
      }
      if (!lnglat && name) {
        const url = `/api/amap/geocode?address=${encodeURIComponent(name)}&city=${encodeURIComponent(destination || '')}`;
        const res = await fetch(url);
        const json = await res.json().catch(() => ({}));
        const gs = json?.data?.geocodes || [];
        if (gs[0]?.location) {
          const [lng, lat] = String(gs[0].location).split(',').map(Number);
          if (Number.isFinite(lng) && Number.isFinite(lat)) lnglat = [lng, lat];
        }
      }
      if (lnglat && mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(lnglat);
        mapInstanceRef.current.setZoom(14);
      }
    } catch (e) {
      console.warn('选择建议失败:', e);
    }
  }, [destination]);

  // 信息窗更新调度：即便 requestIdleCallback 不触发也保证更新
  const scheduleInfoWindowUpdate = (fn) => {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      try { fn(); } catch (e) { console.warn('InfoWindow 更新失败:', e); }
    };
    if (typeof window.requestIdleCallback === 'function') {
      try {
        window.requestIdleCallback(run, { timeout: 800 });
      } catch {
        // ignore
      }
    }
    // 保底：200ms 后强制执行一次
    setTimeout(run, 200);
  };

  // Check user authentication status
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      // 同时保存access_token用于API调用
      if (session?.access_token) {
        localStorage.setItem('supabase_access_token', session.access_token);
      } else {
        localStorage.removeItem('supabase_access_token');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Authentication functions
  const handleSignUp = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      if (data.user) {
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      }
    } catch (error) {
      console.error('Sign up error:', error.message);
      alert('注册失败: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      console.error('Sign in error:', error.message);
      alert('登录失败: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.warn('Supabase signOut 失败或不支持 scope 参数，继续清理本地状态:', e?.message || e);
    }

    try {
      // 清除应用内使用的访问令牌
      localStorage.removeItem('supabase_access_token');
      // 清除所有 Supabase 会话相关键（以 sb- 开头）
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith('sb-')) localStorage.removeItem(k);
      });
    } catch (e) {
      console.warn('清理本地存储时出错:', e?.message || e);
    }

    // 重置本地状态并回到未登录视图
    setUser(null);
    setSavedTrips([]);
    setActiveTripId(null);
    setExpenses([]);
  };

  const downsampleBuffer = (buffer, sampleRate, outRate = 16000) => {
    if (outRate === sampleRate) return buffer;
    const sampleRateRatio = sampleRate / outRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  const floatTo16BitPCM = (float32Array) => {
    const output = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  };

  const startRecording = async () => {
    try {
      pcmBuffersRef.current = [];
      setRecordingTime(0);
      setIsRecording(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptNodeRef.current = scriptNode;
      scriptNode.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const down = downsampleBuffer(input, audioCtx.sampleRate, 16000);
        const pcm16 = floatTo16BitPCM(down);
        pcmBuffersRef.current.push(pcm16);
      };
      source.connect(scriptNode);
      scriptNode.connect(audioCtx.destination);
      
      // 启动计时器，每秒更新一次
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          // 如果超过60秒，自动停止录音
          if (newTime >= 60) {
            stopRecording();
            return 60;
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('开始录音失败:', error);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const stopRecording = async () => {
    // 清除计时器
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    setIsRecording(false);
    
    try {
      if (scriptNodeRef.current) scriptNodeRef.current.disconnect();
      if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
      if (audioCtxRef.current) await audioCtxRef.current.close();
    } catch {}
    // concatenate Int16Array
    const totalLength = pcmBuffersRef.current.reduce((sum, arr) => sum + arr.length, 0);
    const merged = new Int16Array(totalLength);
    let offset = 0;
    for (const arr of pcmBuffersRef.current) {
      merged.set(arr, offset);
      offset += arr.length;
    }
    const bytes = new Uint8Array(merged.buffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const res = await fetch('/api/speech/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pcmBase64: base64 })
    });
    const data = await res.json();
    setRecognizedText(data.text || '');
    // 自动根据识别文本填充表单（如果识别到了字段）
    if (data && data.text) {
      parseSpeechToForm(data.text);
      const exp = parseSpeechToExpense(data.text);
      if (exp) {
        setExpenseDraft(prev => ({
          amount: String(exp.amount),
          category: exp.category,
          description: exp.description || prev.description,
          day: exp.day ? String(exp.day) : prev.day,
          time: exp.time || prev.time,
        }));
      }
    }
  };

  const generatePlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, budget, people, preferences, text: recognizedText })
      });
      const data = await res.json();
      setPlan(data);
      const idle = (fn) => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(fn, { timeout: 800 });
        } else {
          setTimeout(fn, 100);
        }
      };

      // 确保地图实例已经初始化，如果没有则等待初始化完成
      const waitForMapInitialization = () => {
        return new Promise((resolve) => {
          if (mapInstanceRef.current) {
            resolve(true);
          } else {
            // 等待地图初始化完成
            const checkInterval = setInterval(() => {
              if (mapInstanceRef.current) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 100);
            // 超时保护
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve(false);
            }, 5000);
          }
        });
      };

      // 等待地图实例初始化完成
      const mapReady = await waitForMapInitialization();
      // 先行设置地图中心，避免后续渲染未命中时中心不更新
      if (mapReady && mapInstanceRef.current && data && data.center) {
        try {
          mapInstanceRef.current.setCenter(data.center);
          mapInstanceRef.current.setZoom(13);
        } catch {}
      }
      
      // Render markers on map with time annotations and routes
      if (mapReady && mapInstanceRef.current && data && Array.isArray(data.pois)) {
        // Clear existing markers and polylines
        mapInstanceRef.current.clearMap();
        
        // Create markers with time information
        const markers = [];
        const nameToMarker = new Map();
        data.pois.forEach(p => {
          // Find when this POI appears in the itinerary using exact matching
          let timeInfo = '';
          if (data.itinerary) {
            for (const day of data.itinerary) {
              for (const item of day.items) {
                // 使用更精确的匹配逻辑，避免部分匹配导致的错误
                const itemTitle = item.title || '';
                const poiName = p.name || '';
                
                // 精确匹配：POI名称完全包含在活动标题中，或者活动标题完全包含在POI名称中
                const isExactMatch = itemTitle.includes(poiName) || poiName.includes(itemTitle);
                
                // 或者检查是否是主要景点（避免匹配到泛泛的活动描述）
                const isMainAttraction = poiName.length > 2 && 
                  (itemTitle === poiName || 
                   itemTitle.startsWith(poiName) || 
                   itemTitle.endsWith(poiName));
                
                // 特殊处理最后一天：检查是否是最后一天的主要活动
                const isLastDayMainActivity = day.day === data.itinerary.length && 
                  item.time === '下午' && 
                  itemTitle.includes(poiName);
                
                if (isExactMatch || isMainAttraction || isLastDayMainActivity) {
                  timeInfo = `第${day.day}天 ${item.time}`;
                  break;
                }
              }
              if (timeInfo) break;
            }
          }
          
          // Determine marker color and icon based on POI type
          let markerColor = '#1890ff';
          let markerIcon = '📍';
          
          if (p.type) {
            if (p.type.includes('景点') || p.type.includes('attraction')) {
              markerColor = '#52c41a';
              markerIcon = '🏛️';
            } else if (p.type.includes('美食') || p.type.includes('food') || p.type.includes('restaurant')) {
              markerColor = '#fa541c';
              markerIcon = '🍜';
            } else if (p.type.includes('购物') || p.type.includes('shopping')) {
              markerColor = '#722ed1';
              markerIcon = '🛍️';
            } else if (p.type.includes('住宿') || p.type.includes('accommodation') || p.type.includes('hotel')) {
              markerColor = '#faad14';
              markerIcon = '🏨';
            } else if (p.type.includes('交通') || p.type.includes('transport')) {
              markerColor = '#13c2c2';
              markerIcon = '🚗';
            }
          }
          
          const marker = new window.AMap.Marker({
            position: [p.lng, p.lat],
            title: p.name,
            content: `<div style="background: white; padding: 8px; border-radius: 12px; border: 2px solid ${markerColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: markerPulse 2s infinite;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 16px; animation: iconBounce 1s infinite alternate;">${markerIcon}</span>
                <div style="font-weight: bold; color: ${markerColor};">${p.name}</div>
              </div>
              ${timeInfo ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">${timeInfo}</div>` : ''}
            </div>`,
            offset: new window.AMap.Pixel(-25, -25)
          });
          
          // Add hover effects
          marker.on('mouseover', () => {
            marker.setContent(`<div style="background: white; padding: 10px; border-radius: 12px; border: 3px solid ${markerColor}; box-shadow: 0 4px 20px rgba(0,0,0,0.3); animation: markerPulse 0.5s infinite; transform: scale(1.1);">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 18px; animation: iconBounce 0.5s infinite alternate;">${markerIcon}</span>
                <div style="font-weight: bold; color: ${markerColor};">${p.name}</div>
              </div>
              ${timeInfo ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${timeInfo}</div>` : ''}
            </div>`);
          });
          
          marker.on('mouseout', () => {
            marker.setContent(`<div style="background: white; padding: 8px; border-radius: 12px; border: 2px solid ${markerColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: markerPulse 2s infinite;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 16px; animation: iconBounce 1s infinite alternate;">${markerIcon}</span>
                <div style="font-weight: bold; color: ${markerColor};">${p.name}</div>
              </div>
              ${timeInfo ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">${timeInfo}</div>` : ''}
            </div>`);
          });
          
          // 点击后先展示骨架，再异步填充详细内容
          marker.on('click', () => {
            const skeleton = `<div style="padding: 12px; max-width: 280px; border-radius: 12px; background: white; box-shadow: 0 8px 24px rgba(0,0,0,0.15); border: 2px solid ${markerColor};">
              <h4 style="margin: 0 0 8px 0; color: ${markerColor}; font-size: 16px;">${p.name} ${markerIcon}</h4>
              ${timeInfo ? `<p style="margin: 0 8px 8px 0; color: #666; font-size: 13px;">🕐 ${timeInfo}</p>` : ''}
              <div style="color:#999; font-size:12px;">加载中...</div>
            </div>`;
            const infoWindow = new window.AMap.InfoWindow({
              content: skeleton,
              offset: new window.AMap.Pixel(0, -35),
              closeWhenClickMap: true
            });
            infoWindow.open(mapInstanceRef.current, marker.getPosition());
            scheduleInfoWindowUpdate(() => {
              const full = `<div style="padding: 16px; max-width: 280px; border-radius: 12px; background: white; box-shadow: 0 8px 32px rgba(0,0,0,0.2); border: 2px solid ${markerColor};">
                <h4 style="margin: 0 0 12px 0; color: ${markerColor}; font-size: 18px;">${p.name}</h4>
                ${timeInfo ? `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>🕐 时间:</strong> ${timeInfo}</p>` : ''}
                ${p.description ? `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.4;">${p.description}</p>` : ''}
                ${p.type ? `<p style="margin: 0; color: #888; font-size: 13px;"><strong>📍 类型:</strong> ${p.type}</p>` : ''}
              </div>`;
              infoWindow.setContent(full);
            });
          });
          
          markers.push(marker);
          if (p.name) {
            try { nameToMarker.set(p.name, marker); } catch {}
          }
        });
        
        // 按需加载聚合插件，根据数量决定是否聚合
        const useCluster = markers.length > 30;
        if (useCluster) {
          lazyLoadPlugins(['AMap.MarkerClusterer'])
            .then(() => {
              try {
                new window.AMap.MarkerClusterer(mapInstanceRef.current, markers, { gridSize: 80, minClusterSize: 2 });
              } catch (e) {
                console.warn('启用聚合失败:', e);
                markers.forEach(m => mapInstanceRef.current.add(m));
              }
            })
            .catch((err) => {
              console.warn('聚合插件加载失败:', err);
              markers.forEach(m => mapInstanceRef.current.add(m));
            });
        } else {
          markers.forEach(m => mapInstanceRef.current.add(m));
        }
        // 保存标记映射供后续重绘路线
        markerMapRef.current = nameToMarker;
        // 保存最新的标记映射，便于模式切换或显隐时重绘路线
        markerMapRef.current = nameToMarker;
        
        // 延迟按“每日行程”绘制路线，降低主线程占用
        if (data.itinerary && markers.length > 1) {
          idle(() => {
            try {
              const palette = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#13c2c2', '#722ed1'];
              const findMarkerForItem = (item) => {
                const keys = [];
                if (item && item.location) keys.push(item.location);
                if (item && item.title) keys.push(item.title);
                for (const k of keys) {
                  if (k && nameToMarker.has(k)) return nameToMarker.get(k);
                }
                // 退化为模糊匹配
                for (const [poiName, mk] of nameToMarker.entries()) {
                  for (const k of keys) {
                    if (!k) continue;
                    const a = (poiName || '').toLowerCase();
                    const b = (k || '').toLowerCase();
                    if (!a || !b) continue;
                    if (a.includes(b) || b.includes(a)) return mk;
                  }
                }
                return null;
              };
              // 标注找不到时，基于 POI 名称回退匹配坐标
              const findPoiForItem = (item) => {
                const keys = [];
                if (item?.location) keys.push(item.location);
                if (item?.title) keys.push(item.title);
                for (const k of keys) {
                  if (!k) continue;
                  const kb = (k || '').toLowerCase();
                  for (const p of (data.pois || [])) {
                    const pa = (p?.name || '').toLowerCase();
                    if (!pa || !kb) continue;
                    if (pa.includes(kb) || kb.includes(pa)) return p;
                  }
                }
                return null;
              };

              const toArr = (pos) => Array.isArray(pos) ? pos : [pos?.lng ?? pos?.getLng?.(), pos?.lat ?? pos?.getLat?.()];
              const draw = async () => {
                try {
                  dailyPolylinesRef.current = [];
                  for (let i = 0; i < data.itinerary.length; i++) {
                    const day = data.itinerary[i];
                    const positions = [];
                    for (const it of day.items) {
                      const mk = findMarkerForItem(it);
                      let pos = null;
                      if (mk) {
                        pos = mk.getPosition();
                      } else {
                        const poi = findPoiForItem(it);
                        if (poi && typeof poi.lng === 'number' && typeof poi.lat === 'number') {
                          pos = [poi.lng, poi.lat];
                        }
                      }
                      if (pos) {
                        const last = positions[positions.length - 1];
                        const lp = last ? (Array.isArray(last) ? last : [last?.lng ?? last?.getLng?.(), last?.lat ?? last?.getLat?.()]) : null;
                        const pp = Array.isArray(pos) ? pos : [pos?.lng ?? pos?.getLng?.(), pos?.lat ?? pos?.getLat?.()];
                        if (!lp || lp[0] !== pp[0] || lp[1] !== pp[1]) {
                          positions.push(pos);
                        }
                      }
                    }
                    if (positions.length > 1) {
                      const color = palette[i % palette.length];
                      const routePoints = [];
                      for (let k = 1; k < positions.length; k++) {
                        const [lng1, lat1] = toArr(positions[k - 1]);
                        const [lng2, lat2] = toArr(positions[k]);
                        const origin = `${lng1},${lat1}`;
                        const destinationStr = `${lng2},${lat2}`;
                        const endpoint = routeMode === 'walking' ? 'directionWalking' : (routeMode === 'transit' ? 'directionTransit' : 'directionDriving');
                        const qs = new URLSearchParams({ origin, destination: destinationStr, ...(routeMode === 'transit' ? { city: destination } : {}) }).toString();
                        try {
                          const resp = await fetch(`/api/amap/${endpoint}?${qs}`);
                          const json = await resp.json();
                          if (json.ok) {
                            const segPts = extractPointsFromDirection(routeMode, json.data);
                            if (segPts && segPts.length) {
                              segPts.forEach(pt => routePoints.push(pt));
                            } else {
                              routePoints.push([lng1, lat1], [lng2, lat2]);
                            }
                          } else {
                            routePoints.push([lng1, lat1], [lng2, lat2]);
                          }
                        } catch (e) {
                          console.warn('路径规划失败，使用直线段作为退化:', e);
                          routePoints.push([lng1, lat1], [lng2, lat2]);
                        }
                      }
                      const finalPoints = routePoints.length > 1 
                        ? routePoints 
                        : [toArr(positions[0]), toArr(positions[positions.length - 1])];
                      if (finalPoints.length > 1) {
                        const polyline = new window.AMap.Polyline({
                          path: finalPoints,
                          strokeColor: color,
                          strokeWeight: 5,
                          strokeOpacity: 0.9,
                          strokeStyle: 'solid',
                          lineJoin: 'round',
                          lineCap: 'round',
                          zIndex: 999
                        });
                        mapInstanceRef.current.add(polyline);
                        const mid = finalPoints[Math.floor(finalPoints.length / 2)];
                        const arrow = new window.AMap.Marker({
                          position: mid,
                          content: `<div style="color: ${color}; font-size: 18px;">➡️ 第${day.day}天</div>`,
                          offset: new window.AMap.Pixel(-10, -10)
                        });
                        mapInstanceRef.current.add(arrow);
                        dailyPolylinesRef.current.push({ day: day.day, polyline, arrow });
                      }
                    }
                  }
                  if (selectedDay) highlightDay(selectedDay);
                } catch (err) {
                  console.warn('绘制每日日路线（贴路网）失败:', err);
                }
              };
              draw();
            } catch (err) {
              console.warn('绘制每日行程路线失败:', err);
            }
          });
        }
        
        if (data.center) {
          mapInstanceRef.current.setCenter(data.center);
          mapInstanceRef.current.setZoom(13);
        }
      }

      // Get budget estimate
      const resBudget = await fetch('/api/budget/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: data })
      });
      const budgetData = await resBudget.json();
      setBudgetEstimate(budgetData);
      setCurrentStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('supabase_access_token');
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({ 
          plan, 
          name: `${destination}-${new Date().toISOString().slice(0,10)}`
        })
      });
      
      if (!res.ok) {
        throw new Error(`保存失败: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // 直接更新本地状态，避免重新加载所有行程
      setSavedTrips(prev => [data, ...prev]);
      setActiveTripId(data.id);
      setCurrentStep(budgetEstimate ? 4 : 3);
      
    } catch (error) {
      console.error('保存行程失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 加载已保存的行程
  const loadTrip = async (trip) => {
    try {
      setDestination(trip.plan.destination || '南京');
      setDays(trip.plan.days || 5);
      setBudget(trip.plan.budget || 10000);
      setPeople(trip.plan.people || 2);
      setPreferences(trip.plan.preferences || '美食, 文化, 历史');
      setPlan(trip.plan);
      setActiveTripId(trip.id || null);
      
      // 如果有预算信息也加载
      if (trip.plan.budgetEstimate) {
        setBudgetEstimate(trip.plan.budgetEstimate);
      }
      setCurrentStep(trip.plan?.budgetEstimate ? 4 : 3);

      // 加载该行程的费用记录
      if (user && trip.id) {
        try {
          const accessToken = localStorage.getItem('supabase_access_token');
          const res = await fetch(`/api/expenses?trip_id=${encodeURIComponent(trip.id)}`, {
            headers: { 'Authorization': accessToken ? `Bearer ${accessToken}` : '' },
          });
          if (res.ok) {
            const list = await res.json();
            setExpenses(Array.isArray(list) ? list : []);
          } else {
            setExpenses([]);
          }
        } catch (e) {
          console.warn('加载费用记录失败:', e);
          setExpenses([]);
        }
      } else {
        setExpenses([]);
      }
      
      // 更新地图标注
      if (mapInstanceRef.current && trip.plan && Array.isArray(trip.plan.pois)) {
        // 清除现有标记和路线
        mapInstanceRef.current.clearMap();
        dailyPolylinesRef.current = [];
        
        // 创建标记并添加时间信息（先过滤越界POI）
        const haversineKm = (lng1, lat1, lng2, lat2) => {
          const toRad = d => (d * Math.PI) / 180;
          const R = 6371; // km
          const dLat = toRad(lat2 - lat1);
          const dLng = toRad(lng2 - lng1);
          const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };
        const cityCenter = Array.isArray(trip.plan.center) && trip.plan.center.length === 2
          ? trip.plan.center
          : (mapInstanceRef.current.getCenter() ? [mapInstanceRef.current.getCenter().lng, mapInstanceRef.current.getCenter().lat] : [118.7969, 32.0603]);
        const radiusByCity = (dest) => {
          if (!dest) return 50;
          if (/北京|上海|广州|深圳/.test(dest)) return 60;
          if (/重庆|成都|杭州|南京|西安|天津/.test(dest)) return 50;
          return 40; // 其他城市更严格
        };
        const cityRadiusKm = radiusByCity(trip.plan.destination || destination);
        const filteredPois = (trip.plan.pois || []).filter(p => {
          const lng = Number(p.lng), lat = Number(p.lat);
          if (!lng || !lat) return false;
          const d = haversineKm(lng, lat, cityCenter[0], cityCenter[1]);
          return d <= cityRadiusKm;
        });
        const poisToRender = filteredPois.length ? filteredPois : (trip.plan.pois || []);
        const markers = [];
        const nameToMarker = new Map();
        poisToRender.forEach(p => {
          // 查找POI在行程中出现的时间
          let timeInfo = '';
          if (trip.plan.itinerary) {
            for (const day of trip.plan.itinerary) {
              for (const item of day.items) {
                // 使用精确匹配逻辑
                const itemTitle = item.title || '';
                const poiName = p.name || '';
                
                const isExactMatch = itemTitle.includes(poiName) || poiName.includes(itemTitle);
                if (isExactMatch) {
                  timeInfo = `第${day.day}天 ${item.time}`;
                  break;
                }
              }
              if (timeInfo) break;
            }
          }
          
          // 根据类型设置标记颜色和图标
          let markerColor = '#1890ff';
          let markerIcon = '📍';
          if (p.type) {
            if (p.type.includes('美食') || p.type.includes('food')) {
              markerColor = '#f56c6c';
              markerIcon = '🍜';
            } else if (p.type.includes('购物') || p.type.includes('shopping')) {
              markerColor = '#e6a23c';
              markerIcon = '🛍️';
            } else if (p.type.includes('景点') || p.type.includes('attraction')) {
              markerColor = '#67c23a';
              markerIcon = '🏛️';
            } else if (p.type.includes('文化') || p.type.includes('culture')) {
              markerColor = '#909399';
              markerIcon = '🎭';
            } else if (p.type.includes('住宿') || p.type.includes('hotel')) {
              markerColor = '#faad14';
              markerIcon = '🏨';
            } else if (p.type.includes('交通') || p.type.includes('transport')) {
              markerColor = '#13c2c2';
              markerIcon = '🚗';
            }
          }
          
          const marker = new window.AMap.Marker({
            position: [p.lng, p.lat],
            title: p.name,
            content: `<div style="background: white; padding: 8px; border-radius: 12px; border: 2px solid ${markerColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 16px;">${markerIcon}</span>
                <div style="font-weight: bold; color: ${markerColor};">${p.name}</div>
              </div>
              ${timeInfo ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">${timeInfo}</div>` : ''}
            </div>`,
            offset: new window.AMap.Pixel(-25, -25)
          });
          
          // 信息窗分步渲染：先骨架，再填充详情
          marker.on('click', () => {
            const skeleton = `<div style="padding: 12px; max-width: 250px;">
              <h4 style="margin: 0 0 8px 0; color: ${markerColor};">${p.name}</h4>
              ${timeInfo ? `<p style=\"margin: 0 0 8px 0; color: #666;\"><strong>时间:</strong> ${timeInfo}</p>` : ''}
              <div style="color:#999; font-size:12px;">加载中...</div>
            </div>`;
            const infoWindow = new window.AMap.InfoWindow({ content: skeleton, offset: new window.AMap.Pixel(0, -30) });
            infoWindow.open(mapInstanceRef.current, marker.getPosition());
            scheduleInfoWindowUpdate(() => {
              const full = `<div style="padding: 12px; max-width: 250px;">
                <h4 style="margin: 0 0 8px 0; color: ${markerColor};">${p.name}</h4>
                ${timeInfo ? `<p style=\"margin: 0 0 8px 0; color: #666;\"><strong>时间:</strong> ${timeInfo}</p>` : ''}
                ${p.description ? `<p style=\"margin: 0 0 8px 0; color: #666;\">${p.description}</p>` : ''}
                ${p.type ? `<p style=\"margin: 0; color: #888;\"><strong>类型:</strong> ${p.type}</p>` : ''}
              </div>`;
              infoWindow.setContent(full);
            });
          });
          
          markers.push(marker);
          if (p.name) {
            try { nameToMarker.set(p.name, marker); } catch {}
          }
        });
        
        // 按需加载聚合
        const useCluster = markers.length > 30;
        if (useCluster) {
          lazyLoadPlugins(['AMap.MarkerClusterer'])
            .then(() => {
              try {
                new window.AMap.MarkerClusterer(mapInstanceRef.current, markers, { gridSize: 80, minClusterSize: 2 });
              } catch (e) {
                console.warn('启用聚合失败:', e);
                markers.forEach(m => mapInstanceRef.current.add(m));
              }
            })
            .catch((err) => {
              console.warn('聚合插件加载失败:', err);
              markers.forEach(m => mapInstanceRef.current.add(m));
            });
        } else {
          markers.forEach(m => mapInstanceRef.current.add(m));
        }
        
        // 延迟按“每日行程”绘制路线（贴路网）
        if (trip.plan.itinerary && markers.length > 1) {
          const drawDayRoutes = async () => {
            try {
              const toArr = (pos) => Array.isArray(pos) ? pos : [pos?.lng ?? pos?.getLng?.(), pos?.lat ?? pos?.getLat?.()];
              dailyPolylinesRef.current = [];
              const findMarkerForItem = (item) => {
                const keys = [];
                if (item && item.location) keys.push(item.location);
                if (item && item.title) keys.push(item.title);
                for (const k of keys) {
                  if (k && nameToMarker.has(k)) return nameToMarker.get(k);
                }
                for (const [poiName, mk] of nameToMarker.entries()) {
                  for (const k of keys) {
                    if (!k) continue;
                    const a = (poiName || '').toLowerCase();
                    const b = (k || '').toLowerCase();
                    if (!a || !b) continue;
                    if (a.includes(b) || b.includes(a)) return mk;
                  }
                }
                return null;
              };
              const findPoiForItem = (item) => {
                const keys = [];
                if (item?.location) keys.push(item.location);
                if (item?.title) keys.push(item.title);
                for (const k of keys) {
                  if (!k) continue;
                  const kb = (k || '').toLowerCase();
                  for (const p of (poisToRender || [])) {
                    const pa = (p?.name || '').toLowerCase();
                    if (!pa || !kb) continue;
                    if (pa.includes(kb) || kb.includes(pa)) return p;
                  }
                }
                return null;
              };
              for (let i = 0; i < trip.plan.itinerary.length; i++) {
                const day = trip.plan.itinerary[i];
                const positions = [];
                for (const it of day.items) {
                  const mk = findMarkerForItem(it);
                  let pos = null;
                  if (mk) {
                    pos = mk.getPosition();
                  } else {
                    const poi = findPoiForItem(it);
                    if (poi && typeof poi.lng === 'number' && typeof poi.lat === 'number') {
                      pos = [poi.lng, poi.lat];
                    }
                  }
                  if (pos) {
                    const last = positions[positions.length - 1];
                    const lp = last ? (Array.isArray(last) ? last : [last?.lng ?? last?.getLng?.(), last?.lat ?? last?.getLat?.()]) : null;
                    const pp = Array.isArray(pos) ? pos : [pos?.lng ?? pos?.getLng?.(), pos?.lat ?? pos?.getLat?.()];
                    if (!lp || lp[0] !== pp[0] || lp[1] !== pp[1]) {
                      positions.push(pos);
                    }
                  }
                }
                if (positions.length > 1) {
                  const color = routePalette[i % routePalette.length];
                  const routePoints = [];
                  for (let k = 1; k < positions.length; k++) {
                    const [lng1, lat1] = toArr(positions[k - 1]);
                    const [lng2, lat2] = toArr(positions[k]);
                    const origin = `${lng1},${lat1}`;
                    const destinationStr = `${lng2},${lat2}`;
                    const endpoint = routeMode === 'walking' ? 'directionWalking' : (routeMode === 'transit' ? 'directionTransit' : 'directionDriving');
                    const qs = new URLSearchParams({ origin, destination: destinationStr, ...(routeMode === 'transit' ? { city: trip.plan.destination } : {}) }).toString();
                    try {
                      const resp = await fetch(`/api/amap/${endpoint}?${qs}`);
                      const json = await resp.json();
                      if (json.ok) {
                        const segPts = extractPointsFromDirection(routeMode, json.data);
                        if (segPts && segPts.length) {
                          segPts.forEach(pt => routePoints.push(pt));
                        } else {
                          routePoints.push([lng1, lat1], [lng2, lat2]);
                        }
                      } else {
                        routePoints.push([lng1, lat1], [lng2, lat2]);
                      }
                    } catch (e) {
                      console.warn('路径规划失败，使用直线段作为退化:', e);
                      routePoints.push([lng1, lat1], [lng2, lat2]);
                    }
                  }
                  const finalPoints = routePoints.length > 1 
                    ? routePoints 
                    : [toArr(positions[0]), toArr(positions[positions.length - 1])];
                  if (finalPoints.length > 1) {
                    const polyline = new window.AMap.Polyline({
                      path: finalPoints,
                      strokeColor: color,
                      strokeWeight: 5,
                      strokeOpacity: 0.9,
                      strokeStyle: 'solid',
                      lineJoin: 'round',
                      lineCap: 'round',
                      zIndex: 999
                    });
                    mapInstanceRef.current.add(polyline);
                    const mid = finalPoints[Math.floor(finalPoints.length / 2)];
                    const arrow = new window.AMap.Marker({
                      position: mid,
                      content: `<div style="color: ${color}; font-size: 18px;">➡️ 第${day.day}天</div>`,
                      offset: new window.AMap.Pixel(-10, -10)
                    });
                    mapInstanceRef.current.add(arrow);
                    dailyPolylinesRef.current.push({ day: day.day, polyline, arrow });
                  }
                }
              }
              if (selectedDay) highlightDay(selectedDay);
            } catch (err) {
              console.warn('绘制每日行程路线（贴路网）失败:', err);
            }
          };
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(drawDayRoutes, { timeout: 800 });
          } else {
            setTimeout(drawDayRoutes, 100);
          }
        }
        
        // 设置地图中心点和缩放级别
        if (trip.plan.center) {
          mapInstanceRef.current.setCenter(trip.plan.center);
          mapInstanceRef.current.setZoom(13);
        } else if (markers.length > 0) {
          mapInstanceRef.current.setCenter(markers[0].getPosition());
          mapInstanceRef.current.setZoom(13);
        }
      }
      
      alert(`已加载行程: ${trip.name}`);
    } catch (error) {
      console.error('加载行程失败:', error);
      alert('加载行程失败');
    }
  };

  // 删除已保存的行程
  const deleteTrip = async (tripId) => {
    if (!confirm('确定要删除这个行程吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const accessToken = localStorage.getItem('supabase_access_token');
      const res = await fetch(`/api/trips?id=${tripId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (res.ok) {
        // 从本地状态中移除已删除的行程
        setSavedTrips(prev => prev.filter(trip => trip.id !== tripId));
        if (activeTripId === tripId) {
          setActiveTripId(null);
          setExpenses([]);
        }
        alert('行程删除成功');
      } else {
        throw new Error(`删除失败: ${res.status}`);
      }
    } catch (error) {
      console.error('删除行程失败:', error);
      alert('删除行程失败');
    }
  };

  useEffect(() => {
    if (user) {
      loadSavedTrips()
        .then(data => {
          if (data) {
            setSavedTrips(data);
          }
        })
        .catch(error => {
          console.error("加载行程失败:", error);
        });
    }
  }, [user]);

  // 通过URL中的trip_id自动加载指定行程
  useEffect(() => {
    if (!router.isReady) return;
    const { trip_id } = router.query || {};
    if (!trip_id || autoLoadedFromQuery) return;
    if (!user) {
      // 未登录则提示并打开登录框
      setShowAuthModal(true);
      return;
    }
    const tryLoad = async () => {
      // 优先从已加载的列表中查找
      const found = savedTrips.find(t => String(t.id) === String(trip_id));
      if (found) {
        await loadTrip(found);
        setAutoLoadedFromQuery(true);
        return;
      }
      // 如果未找到，则主动拉取一次
      try {
        const list = await loadSavedTrips();
        setSavedTrips(list);
        const t = list.find(x => String(x.id) === String(trip_id));
        if (t) {
          await loadTrip(t);
          setAutoLoadedFromQuery(true);
        }
      } catch (e) {
        console.warn('根据URL加载指定行程失败:', e);
      }
    };
    tryLoad();
  }, [router.isReady, router.query, user, savedTrips, autoLoadedFromQuery]);

  // 当识别文本手动编辑或更新时，也自动尝试填充
  useEffect(() => {
    if (recognizedText && recognizedText.trim()) {
      parseSpeechToForm(recognizedText);
      const exp = parseSpeechToExpense(recognizedText);
      if (exp) {
        setExpenseDraft(prev => ({
          amount: String(exp.amount),
          category: exp.category,
          description: exp.description || prev.description,
          day: exp.day ? String(exp.day) : prev.day,
          time: exp.time || prev.time,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognizedText]);

  // 保存一条费用记录（优先云端，失败回退本地）
  const saveExpense = async () => {
    const amt = parseFloat(expenseDraft.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('请输入有效的金额');
      return;
    }
    const payload = {
      amount: Math.round(amt),
      category: expenseDraft.category || 'other',
      description: expenseDraft.description || '',
      day: expenseDraft.day ? parseInt(expenseDraft.day, 10) : null,
      time: expenseDraft.time || '',
      trip_id: activeTripId || null,
    };
    if (user && activeTripId) {
      try {
        const accessToken = localStorage.getItem('supabase_access_token');
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : '' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const saved = await res.json();
          setExpenses(prev => [saved, ...prev]);
          setExpenseDraft({ amount: '', category: 'other', description: '', day: '', time: '' });
          return;
        }
      } catch (e) {
        console.warn('云端保存费用失败，采用本地保存:', e);
      }
    }
    // 本地保存
    const localItem = { id: String(Date.now()), created_at: new Date().toISOString(), user_id: user?.id || 'local', ...payload };
    setExpenses(prev => [localItem, ...prev]);
    setExpenseDraft({ amount: '', category: 'other', description: '', day: '', time: '' });
  };

  const deleteExpense = async (id) => {
    if (!id) return;
    if (user && activeTripId) {
      try {
        const accessToken = localStorage.getItem('supabase_access_token');
        const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': accessToken ? `Bearer ${accessToken}` : '' },
        });
        if (res.ok) {
          setExpenses(prev => prev.filter(e => e.id !== id));
          return;
        }
      } catch (e) {
        console.warn('云端删除费用失败，采用本地删除:', e);
      }
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="container-fluid">
      <HeaderBar 
        user={user}
        onSignOut={handleSignOut}
        onShowAuth={() => setShowAuthModal(true)}
        pathname={router.pathname}
      />

      <main className="main-content main-content--fullscreen">
        {!user ? (
          <WelcomeSection onGetStarted={() => setShowAuthModal(true)} />
        ) : (
          <div className="logged-in-content">
            {/* 网格布局分离地图和工具区 */}
            <div className="map-fullscreen">
              {/* 左侧地图区域 */}
              <MapPanel 
                mapRef={mapRef} 
                loading={mapLoading}
                controlsProps={{
                  disabled: mapLoading || !mapInstanceRef.current,
                  showTraffic,
                  showSatellite,
                  showRoadNet,
                  onToggleTraffic: toggleTraffic,
                  onToggleSatellite: toggleSatellite,
                  onToggleRoadNet: toggleRoadNet,
                  onLocate: locateMe,
                  onResetView: resetView,
                  onToggleSidebar: () => setSidebarOpen(v => !v),
                  sidebarOpen,
                  routeMode,
                  setRouteMode,
                  showDailyRoutes,
                  setShowDailyRoutes,
                  daysCount: Array.isArray(plan?.itinerary) ? plan.itinerary.length : days,
                  selectedDay,
                  onSelectDay,
                  searchQuery,
                  setSearchQuery,
                  suggestions: searchSuggestions,
                  onPickSuggestion: pickSuggestion,
                }}
              />

              {/* 左侧窄导航栏（点击展开侧边栏） */}
              <div
                className="nav-rail"
                style={{ ['--nav-rail-width']: '56px' }}
                ref={navRailRef}
                onMouseEnter={handleHoverEnter}
                onMouseLeave={handleHoverLeave}
              >
                <div
                  className={`nav-item ${stepStatus(1)}`}
                  onClick={() => { setCurrentStep(1); setSidebarOpen(true); }}
                  title="语音"
                >
                  <span className="nav-icon">🎙️</span>
                  <div className="nav-tooltip">
                    <span className="nav-tip-label">语音</span>
                    <span className="nav-tip-status">{stepStatusText(1)}</span>
                  </div>
                </div>
                <div
                  className={`nav-item ${stepStatus(2)}`}
                  onClick={() => { setCurrentStep(2); setSidebarOpen(true); }}
                  title="设置"
                >
                  <span className="nav-icon">⚙️</span>
                  <div className="nav-tooltip">
                    <span className="nav-tip-label">设置</span>
                    <span className="nav-tip-status">{stepStatusText(2)}</span>
                  </div>
                </div>
                <div
                  className={`nav-item ${stepStatus(3)}`}
                  onClick={() => { setCurrentStep(3); setSidebarOpen(true); }}
                  title="结果"
                >
                  <span className="nav-icon">📄</span>
                  <div className="nav-tooltip">
                    <span className="nav-tip-label">结果</span>
                    <span className="nav-tip-status">{stepStatusText(3)}</span>
                  </div>
                </div>
                <div
                  className={`nav-item ${stepStatus(4)}`}
                  onClick={() => { setCurrentStep(4); setSidebarOpen(true); }}
                  title="预算"
                >
                  <span className="nav-icon">💰</span>
                  <div className="nav-tooltip">
                    <span className="nav-tip-label">预算</span>
                    <span className="nav-tip-status">{stepStatusText(4)}</span>
                  </div>
                </div>
                <div
                  className={`nav-item ${stepStatus(5)}`}
                  onClick={() => { setCurrentStep(5); setSidebarOpen(true); }}
                  title="费用"
                >
                  <span className="nav-icon">🧾</span>
                  <div className="nav-tooltip">
                    <span className="nav-tip-label">费用</span>
                    <span className="nav-tip-status">{stepStatusText(5)}</span>
                  </div>
                </div>
                <div
                  className={`nav-item ${stepStatus(6)}`}
                  onClick={() => { setCurrentStep(6); setSidebarOpen(true); }}
                  title="保存"
                >
                  <span className="nav-icon">💾</span>
                  <div className="nav-tooltip">
                    <span className="nav-tip-label">保存</span>
                    <span className="nav-tip-status">{stepStatusText(6)}</span>
                  </div>
                </div>
              </div>

              {/* 侧边栏工具面板（折叠） */}
              <aside
                className={`sidebar-panel ${sidebarOpen ? 'open' : ''}`}
                style={{ ['--sidebar-width']: `${sidebarWidth}px` }}
                ref={sidebarRef}
                onMouseEnter={handleHoverEnter}
                onMouseLeave={handleHoverLeave}
              >
                <div className="sidebar-content">
                <div className="sidebar-header"></div>

                <div className="sidebar-body" ref={sidebarBodyRef}>

                {currentStep === 1 && (
                  <VoiceInputCard
                    recognizedText={recognizedText}
                    setRecognizedText={setRecognizedText}
                    isRecording={isRecording}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                    recordingTime={recordingTime}
                    onNext={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <PlanSettingsCard
                    destination={destination}
                    setDestination={setDestination}
                    days={days}
                    setDays={setDays}
                    budget={budget}
                    setBudget={setBudget}
                    people={people}
                    setPeople={setPeople}
                    preferences={preferences}
                    setPreferences={setPreferences}
                    routeMode={routeMode}
                    setRouteMode={setRouteMode}
                    showDailyRoutes={showDailyRoutes}
                    setShowDailyRoutes={setShowDailyRoutes}
                    generatePlan={generatePlan}
                    loadingPlan={loadingPlan}
                    plan={plan}
                    savePlan={savePlan}
                    onPrev={() => setCurrentStep(1)}
                    onNext={() => setCurrentStep(3)}
                  />
                )}

                {currentStep === 3 && (
                  <PlanResults
                    plan={plan}
                    expandedActivity={expandedActivity}
                    setExpandedActivity={setExpandedActivity}
                    routePalette={routePalette}
                    highlightDay={highlightDay}
                    onPrev={() => setCurrentStep(2)}
                    onNext={() => setCurrentStep(4)}
                  />
                )}

                {currentStep === 4 && (
                  budgetEstimate ? (
                    <BudgetSummaryCard
                      budgetEstimate={budgetEstimate}
                      expenses={expenses}
                      onPrev={() => setCurrentStep(3)}
                      onNext={() => setCurrentStep(5)}
                    />
                  ) : (
                    <div className="card">
                      <div className="empty-hint">尚无预算估算，请先生成行程。</div>
                    </div>
                  )
                )}

                {currentStep === 5 && (
                  <ExpensesListCard
                    expenseDraft={expenseDraft}
                    setExpenseDraft={setExpenseDraft}
                    recognizedText={recognizedText}
                    parseSpeechToExpense={parseSpeechToExpense}
                    saveExpense={saveExpense}
                    expenses={expenses}
                    deleteExpense={deleteExpense}
                    onPrev={() => setCurrentStep(4)}
                    onNext={() => setCurrentStep(6)}
                  />
                )}

                {currentStep === 6 && (
                  <SavedTripsCard
                    savedTrips={savedTrips}
                    loadTrip={loadTrip}
                    deleteTrip={deleteTrip}
                    canSave={!!plan}
                    onSavePlan={savePlan}
                    onPrev={() => setCurrentStep(5)}
                  />
                )}
                </div>
                <div className="sidebar-footer">
                  <button className="btn btn-secondary" onClick={closeSidebar}>关闭</button>
                  <button className="btn btn-primary" onClick={scrollSidebarTop}>返回顶部</button>
                </div>
                <div className="sidebar-resizer" onMouseDown={onResizerMouseDown}></div>
                </div>
              </aside>
            </div>
            </div>
        )}
      </main>

      <AuthModal
        visible={showAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
