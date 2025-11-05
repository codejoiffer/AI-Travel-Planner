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
          
          // 添加一个标记点
          const marker = new window.AMap.Marker({
            position: [116.397428, 39.90923],
            title: '天安门'
          });
          map.add(marker);
          
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