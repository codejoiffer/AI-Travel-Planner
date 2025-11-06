import { useEffect, useRef } from 'react';

export default function TestMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAPS_API_KEY;
    console.log('地图API密钥:', key);
    
    if (!key) {
      console.error('未找到地图API密钥');
      return;
    }

    const securityJsCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE;
    if (securityJsCode) {
      window._AMapSecurityConfig = { securityJsCode };
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
    script.async = true;
    
    script.onerror = () => {
      console.error('高德地图脚本加载失败');
    };
    
    script.onload = () => {
      console.log('高德地图脚本加载成功');
      
      if (mapRef.current && window.AMap) {
        console.log('开始初始化地图...');
        try {
          const map = new window.AMap.Map(mapRef.current, {
            zoom: 11,
            center: [116.397428, 39.90923], // 北京天安门
            viewMode: '2D',
            mapStyle: 'amap://styles/normal',
          });
          
          console.log('地图初始化成功');
          
          // 通过后端 API 获取周边 POI 并动态标注，避免硬编码
          const center = '116.397428,39.90923';
          const params = new URLSearchParams({
            location: center,
            radius: '1500',
            keywords: '美食',
            offset: '10',
            page: '1',
          });
          fetch(`/api/amap/placeAround?${params.toString()}`)
            .then((resp) => resp.json())
            .then((data) => {
              if (!data || !data.ok) {
                console.warn('POI 接口返回异常:', data?.error || data);
                return;
              }
              const pois = data.data?.pois || [];
              if (!Array.isArray(pois) || pois.length === 0) {
                console.log('周边无可用 POI');
                return;
              }
              const markers = [];
              pois.forEach((poi) => {
                const loc = poi.location;
                if (!loc || typeof loc !== 'string' || !loc.includes(',')) return;
                const [lngStr, latStr] = loc.split(',');
                const lng = parseFloat(lngStr);
                const lat = parseFloat(latStr);
                if (Number.isNaN(lng) || Number.isNaN(lat)) return;
                const m = new window.AMap.Marker({
                  position: [lng, lat],
                  title: poi.name || 'POI',
                });
                m.on('click', () => {
                  const info = new window.AMap.InfoWindow({
                    offset: new window.AMap.Pixel(0, -30),
                    content: `<div style="min-width:200px;">`
                      + `<div style="font-weight:600;">${poi.name || 'POI'}</div>`
                      + `<div style="color:#666;">${poi.address || ''}</div>`
                      + `</div>`,
                  });
                  info.open(map, m.getPosition());
                });
                markers.push(m);
              });
              if (markers.length) {
                map.add(markers);
                // 调整视野以包含所有标注
                map.setFitView(markers);
              }
            })
            .catch((err) => {
              console.error('获取 POI 失败:', err);
            });
          
        } catch (error) {
          console.error('地图初始化错误:', error);
        }
      } else {
        console.error('地图容器或AMap对象不存在');
        console.log('mapRef.current:', mapRef.current);
        console.log('window.AMap:', window.AMap);
      }
    };

    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <h1>地图测试页面</h1>
      <p>环境变量: NEXT_PUBLIC_MAPS_API_KEY = {process.env.NEXT_PUBLIC_MAPS_API_KEY}</p>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '500px', 
          border: '2px solid #ccc',
          borderRadius: '8px'
        }}
      />
    </div>
  );
}
