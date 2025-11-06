
export const loadSavedTrips = async () => {
  try {
    const accessToken = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('supabase_access_token')
      : null;

    // 未登录或无令牌时直接返回空列表，避免不必要的请求与错误日志
    if (!accessToken) return [];

    const res = await fetch('/api/trips', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      // 开发模式下避免缓存与 HMR 影响
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];

  } catch (error) {
    // 对网络中断/热更新中止进行温和处理
    console.warn('加载行程未完成（可能为网络或热更新中止）:', error?.message || error);
    return [];
  }
};
