import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadSavedTrips } from '../utils/trips';
import { loadAMap, lazyLoadPlugins } from '../utils/amap';

export default function Home() {
  console.log('Home component rendered');
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
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const scriptNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const pcmBuffersRef = useRef([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [expandedActivity, setExpandedActivity] = useState(null); // 存储展开的活动 {day: number, time: string}
  const [mapLoading, setMapLoading] = useState(true); // 地图加载状态
  const [recordingTime, setRecordingTime] = useState(0); // 录音计时
  const [isRecording, setIsRecording] = useState(false); // 录音状态
  const recordingTimerRef = useRef(null); // 录音计时器引用

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
        if (!cancelled && mapRef.current && !mapInstanceRef.current) {
          initializeMap();
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
              center: [118.7969, 32.0603], // 南京市中心
              viewMode: '2D',
              mapStyle: 'amap://styles/normal',
            });
            console.log('地图初始化成功');
            setMapLoading(false); // 地图初始化完成，停止加载指示
            
            // 地图完成后，再延迟加载控件等插件，避免阻塞初始渲染
            mapInstanceRef.current.on('complete', () => {
              scheduleIdle(() => {
                lazyLoadPlugins(['AMap.ToolBar', 'AMap.Scale', 'AMap.OverView'])
                  .then(() => {
                    try {
                      mapInstanceRef.current.addControl(new window.AMap.ToolBar());
                      mapInstanceRef.current.addControl(new window.AMap.Scale());
                      mapInstanceRef.current.addControl(new window.AMap.OverView());
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
            
            // 添加一个默认标记点用于测试
            const marker = new window.AMap.Marker({
              position: [118.7969, 32.0603],
              title: '南京市中心',
              icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
              offset: new window.AMap.Pixel(-13, -30)
            });
            mapInstanceRef.current.add(marker);
            
            // 初始化阶段不打开信息窗，改为按需在交互中创建
            
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
    console.log('退出按钮被点击');
    try {
      console.log('开始退出登录...');
      const result = await supabase.auth.signOut();
      console.log('退出登录结果:', result);
      setUser(null);
      console.log('用户状态已设置为null');
      
      // 检查localStorage中的认证状态
      const authState = localStorage.getItem('sb-cnchlpalunuslihbtvzr-auth-token');
      console.log('LocalStorage认证状态:', authState);
      
      // 强制刷新页面以确保状态更新
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error.message);
    }
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

      // Render markers on map with time annotations and routes
      if (mapInstanceRef.current && data && Array.isArray(data.pois)) {
        // Clear existing markers and polylines
        mapInstanceRef.current.clearMap();
        
        // Create markers with time information
        const markers = [];
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
            idle(() => {
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
        
        // 延迟绘制路线，降低主线程占用
        if (data.itinerary && markers.length > 1) {
          idle(() => {
            const path = markers.map(marker => marker.getPosition());
            const polyline = new window.AMap.Polyline({
              path: path,
              strokeColor: '#1890ff',
              strokeWeight: 4,
              strokeOpacity: 0.8,
              strokeStyle: 'solid',
              strokeDasharray: [10, 5],
              lineJoin: 'round',
              lineCap: 'round'
            });
            mapInstanceRef.current.add(polyline);
            let offset = 0;
            const animateLine = () => {
              offset -= 1;
              if (offset < -15) offset = 0;
              polyline.setOptions({ strokeDasharray: [10, 5], lineDash: offset });
              requestAnimationFrame(animateLine);
            };
            animateLine();
            const arrow = new window.AMap.Marker({
              position: path[Math.floor(path.length / 2)],
              content: '<div style="color: #1890ff; font-size: 20px;">➡️</div>',
              offset: new window.AMap.Pixel(-10, -10)
            });
            mapInstanceRef.current.add(arrow);
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
      
      // 如果有预算信息也加载
      if (trip.plan.budgetEstimate) {
        setBudgetEstimate(trip.plan.budgetEstimate);
      }
      
      // 更新地图标注
      if (mapInstanceRef.current && trip.plan && Array.isArray(trip.plan.pois)) {
        // 清除现有标记和路线
        mapInstanceRef.current.clearMap();
        
        // 创建标记并添加时间信息
        const markers = [];
        trip.plan.pois.forEach(p => {
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
            if (typeof window.requestIdleCallback === 'function') {
              window.requestIdleCallback(() => {
                const full = `<div style="padding: 12px; max-width: 250px;">
                  <h4 style="margin: 0 0 8px 0; color: ${markerColor};">${p.name}</h4>
                  ${timeInfo ? `<p style=\"margin: 0 0 8px 0; color: #666;\"><strong>时间:</strong> ${timeInfo}</p>` : ''}
                  ${p.description ? `<p style=\"margin: 0 0 8px 0; color: #666;\">${p.description}</p>` : ''}
                  ${p.type ? `<p style=\"margin: 0; color: #888;\"><strong>类型:</strong> ${p.type}</p>` : ''}
                </div>`;
                infoWindow.setContent(full);
              }, { timeout: 1000 });
            } else {
              setTimeout(() => {
                const full = `<div style="padding: 12px; max-width: 250px;">
                  <h4 style="margin: 0 0 8px 0; color: ${markerColor};">${p.name}</h4>
                  ${timeInfo ? `<p style=\"margin: 0 0 8px 0; color: #666;\"><strong>时间:</strong> ${timeInfo}</p>` : ''}
                  ${p.description ? `<p style=\"margin: 0 0 8px 0; color: #666;\">${p.description}</p>` : ''}
                  ${p.type ? `<p style=\"margin: 0; color: #888;\"><strong>类型:</strong> ${p.type}</p>` : ''}
                </div>`;
                infoWindow.setContent(full);
              }, 100);
            }
          });
          
          markers.push(marker);
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
        
        // 延迟绘制路线
        if (trip.plan.itinerary && markers.length > 1) {
          const drawRoute = () => {
            const path = markers.map(marker => marker.getPosition());
            const polyline = new window.AMap.Polyline({
              path: path,
              strokeColor: '#1890ff',
              strokeWeight: 3,
              strokeOpacity: 0.6,
              strokeStyle: 'solid'
            });
            mapInstanceRef.current.add(polyline);
            const arrow = new window.AMap.Marker({
              position: path[Math.floor(path.length / 2)],
              content: '<div style="color: #1890ff; font-size: 20px;">➡️</div>',
              offset: new window.AMap.Pixel(-10, -10)
            });
            mapInstanceRef.current.add(arrow);
          };
          if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(drawRoute, { timeout: 800 });
          } else {
            setTimeout(drawRoute, 100);
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

  // 当识别文本手动编辑或更新时，也自动尝试填充
  useEffect(() => {
    if (recognizedText && recognizedText.trim()) {
      parseSpeechToForm(recognizedText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognizedText]);

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">✈️ AI 旅行规划师</h1>
          <div className="header-actions">
            {user ? (
              <div className="user-info">
                <span className="welcome-text">欢迎, {user.email}</span>
                <button className="btn btn-secondary" onClick={handleSignOut}>退出</button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
                登录/注册
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!user ? (
          <div className="welcome-section">
            <div className="hero">
              <h2>开启您的智能旅行规划之旅</h2>
              <p>AI 驱动的个性化旅行规划，为您量身定制完美行程</p>
              <button 
                className="btn btn-primary btn-large" 
                onClick={() => setShowAuthModal(true)}
              >
                立即开始
              </button>
            </div>
            
            <div className="features">
              <div className="feature-card">
                <div className="feature-icon">🗺️</div>
                <h3>智能行程规划</h3>
                <p>基于AI算法为您生成个性化的旅行路线</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>预算管理</h3>
                <p>智能预算分配，让旅行更经济实惠</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💾</div>
                <h3>行程保存</h3>
                <p>登录后可保存和管理多个旅行计划</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="tool-section">
              <div className="card">
                <h3>语音输入</h3>
                <label>识别文本</label>
                <textarea 
                  rows={3} 
                  value={recognizedText} 
                  onChange={(e) => setRecognizedText(e.target.value)} 
                  placeholder="例如：我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子" 
                />
                <div className="voice-controls">
                  <button 
                    className={`btn btn-secondary ${isRecording ? 'recording' : ''}`} 
                    onClick={startRecording}
                    disabled={isRecording}
                  >
                    🎤 {isRecording ? '录音中...' : '开始语音'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={stopRecording}
                    disabled={!isRecording}
                  >
                    ⏹️ 停止语音
                  </button>
                  {isRecording && (
                    <div className="recording-timer">
                      <span className="timer-text">⏱️ {recordingTime}秒</span>
                      <div className="timer-progress">
                        <div 
                          className="timer-progress-bar" 
                          style={{ width: `${(recordingTime / 60) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>行程设置</h3>
                <div className="row">
                  <div className="input-group">
                    <label>目的地</label>
                    <input value={destination} onChange={(e) => setDestination(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>天数</label>
                    <input type="number" min={1} value={days} onChange={(e) => setDays(parseInt(e.target.value || '1', 10))} />
                  </div>
                </div>
                <div className="row">
                  <div className="input-group">
                    <label>预算（元）</label>
                    <input type="number" min={0} value={budget} onChange={(e) => setBudget(parseInt(e.target.value || '0', 10))} />
                  </div>
                  <div className="input-group">
                    <label>人数</label>
                    <input type="number" min={1} value={people} onChange={(e) => setPeople(parseInt(e.target.value || '1', 10))} />
                  </div>
                </div>
                <div className="input-group">
                  <label>偏好</label>
                  <input value={preferences} onChange={(e) => setPreferences(e.target.value)} />
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary" 
                    onClick={generatePlan} 
                    disabled={loadingPlan}
                  >
                    {loadingPlan ? '🔄 生成中…' : '🚀 生成行程'}
                  </button>
                  {plan && (
                    <button 
                      className="btn btn-success" 
                      onClick={savePlan} 
                      disabled={!plan}
                    >
                      💾 保存行程
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="results-section">
              {plan && (
                <div className="card plan-card">
                  <h3>📋 详细行程安排</h3>
                  {plan.itinerary.map(day => (
                    <div key={day.day} className="day-plan">
                      <div className="day-header">
                        <strong>第 {day.day} 天</strong>
                        {day.transportation && (
                          <span className="transport-info">🚗 {day.transportation}</span>
                        )}
                        {day.accommodation && (
                          <span className="accommodation-info">🏨 {day.accommodation}</span>
                        )}
                      </div>
                      <ul className="itinerary-items">
                        {day.items.map((it, idx) => {
                          const isExpanded = expandedActivity?.day === day.day && expandedActivity?.time === it.time;
                          return (
                            <li 
                              key={idx} 
                              className={`itinerary-item ${isExpanded ? 'expanded' : ''}`}
                              onClick={() => setExpandedActivity(isExpanded ? null : { day: day.day, time: it.time })}
                              style={{ cursor: 'pointer' }}
                            >
                              <span className="time-badge">{it.time}</span>
                              <div className="activity-details">
                                <strong>{it.title}</strong>
                                {it.description && <span className="activity-desc"> - {it.description}</span>}
                                {it.type && <span className="activity-type">{it.type}</span>}
                                {isExpanded && it.details && (
                                  <div className="activity-details-expanded">
                                    <p>{it.details}</p>
                                    {it.location && <p><strong>📍 地点：</strong>{it.location}</p>}
                                    {it.duration && <p><strong>⏱️ 时长：</strong>{it.duration}</p>}
                                    {it.tips && <p><strong>💡 小贴士：</strong>{it.tips}</p>}
                                  </div>
                                )}
                              </div>
                              <span className="cost-estimate">¥{(typeof it.costEstimate === 'number' && !isNaN(it.costEstimate)) ? it.costEstimate : '--'}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {budgetEstimate && (
                <div className="card budget-card">
                  <h3>💰 费用预算</h3>
                  <ul>
                    <li>交通：¥{budgetEstimate.transport}</li>
                    <li>住宿：¥{budgetEstimate.accommodation}</li>
                    <li>餐饮：¥{budgetEstimate.food}</li>
                    <li>门票：¥{budgetEstimate.tickets}</li>
                    <li><strong>合计：¥{budgetEstimate.total}</strong></li>
                  </ul>
                </div>
              )}

              {/* 始终渲染地图容器，加载时覆盖展示 */}
              <div ref={mapRef} className="map map-container">
                {mapLoading && (
                  <div className="map-overlay">
                    <div className="loading-spinner"></div>
                    <span>地图加载中...</span>
                  </div>
                )}
              </div>

              {!!savedTrips?.length && (
                <div className="card saved-trips-card">
                  <h3>📁 已保存行程</h3>
                  <div className="trips-list">
                    {savedTrips.map((t) => (
                      <div key={t.id} className="trip-item">
                        <div className="trip-info">
                          <strong>{t.name}</strong>
                          <span className="trip-date">{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="trip-actions">
                          <button 
                            className="btn btn-small" 
                            onClick={() => loadTrip(t)}
                          >
                            📂 加载
                          </button>
                          <button 
                            className="btn btn-small btn-danger" 
                            onClick={() => deleteTrip(t.id)}
                          >
                            🗑️ 删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '300px'
          }}>
            <h3>{authMode === 'login' ? '登录' : '注册'}</h3>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                placeholder="邮箱"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              />
              <input
                type="password"
                placeholder="密码"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <button 
                onClick={authMode === 'login' ? handleSignIn : handleSignUp}
                disabled={authLoading}
              >
                {authLoading ? '处理中...' : (authMode === 'login' ? '登录' : '注册')}
              </button>
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', color: '#666' }}
              >
                {authMode === 'login' ? '没有账号？注册' : '已有账号？登录'}
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'none', border: 'none', color: '#666' }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
