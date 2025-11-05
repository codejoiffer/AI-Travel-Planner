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
