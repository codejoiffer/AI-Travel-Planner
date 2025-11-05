
export const loadSavedTrips = async () => {
  try {
    const accessToken = localStorage.getItem('supabase_access_token');
    const res = await fetch('/api/trips', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }
    
    const data = await res.json();
    return data;

  } catch (error) {
    console.error("加载行程失败:", error);
    return null; 
  }
};
