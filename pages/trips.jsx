import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadSavedTrips } from '../utils/trips';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const list = await loadSavedTrips();
      setTrips(list || []);
      setLoading(false);
    };
    run();
  }, []);

  const deleteTrip = async (id) => {
    if (!confirm('确定删除该行程？')) return;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_access_token') : null;
    if (!token) {
      alert('请先登录后再进行删除');
      return;
    }
    try {
      const res = await fetch(`/api/trips?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('删除失败');
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert('删除失败，请稍后重试');
    }
  };

  const tokenExists = typeof localStorage !== 'undefined' && !!localStorage.getItem('supabase_access_token');

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">✈️ AI 旅行规划师</h1>
          <div className="header-actions">
            <Link href="/" className="btn btn-secondary">返回首页</Link>
          </div>
        </div>
        <nav className="subheader-nav">
          <Link href="/">首页</Link>
          <Link href="/plan">计划</Link>
          <Link href="/trips" className="active">行程</Link>
          <Link href="/expenses">费用</Link>
        </nav>
      </header>

      <main className="main-content">
        <h2 className="page-title">已保存的行程</h2>
        {loading && (
          <div className="empty-hint">加载中...</div>
        )}
        {!loading && !tokenExists && (
          <div className="empty-hint">尚未登录，请前往首页登录后查看行程。</div>
        )}
        {!loading && tokenExists && !trips.length && (
          <div className="empty-hint">暂无已保存行程。请先在“计划”页生成并保存。</div>
        )}
        {!loading && tokenExists && !!trips.length && (
          <div className="card saved-trips-card">
            <div className="trips-list">
              {trips.map(t => (
                <div key={t.id} className="trip-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="trip-info">
                    <strong>{t.name}</strong>
                    <span className="trip-date" style={{ marginLeft: 8 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="trip-actions" style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/?trip_id=${encodeURIComponent(t.id)}`} className="btn btn-small">📍 地图查看</Link>
                    <button className="btn btn-small btn-danger" onClick={() => deleteTrip(t.id)}>🗑️ 删除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
