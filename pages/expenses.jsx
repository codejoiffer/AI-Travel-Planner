import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadSavedTrips } from '../utils/trips';

export default function ExpensesPage() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [draft, setDraft] = useState({ amount: '', category: 'other', description: '', day: '', time: '' });

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_access_token') : null;

  useEffect(() => {
    const run = async () => {
      setLoadingTrips(true);
      const list = await loadSavedTrips();
      setTrips(list || []);
      setLoadingTrips(false);
    };
    run();
  }, []);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!selectedTripId || !token) return;
      setLoadingExpenses(true);
      try {
        const res = await fetch(`/api/expenses?trip_id=${encodeURIComponent(selectedTripId)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const list = await res.json();
        setExpenses(Array.isArray(list) ? list : []);
      } catch (e) {
        setExpenses([]);
      } finally {
        setLoadingExpenses(false);
      }
    };
    fetchExpenses();
  }, [selectedTripId, token]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const byCategory = useMemo(() => {
    const m = {};
    for (const e of expenses) {
      const c = e.category || 'other';
      m[c] = (m[c] || 0) + (Number(e.amount) || 0);
    }
    return m;
  }, [expenses]);

  const addExpense = async () => {
    if (!selectedTripId) { alert('请先选择行程'); return; }
    if (!token) { alert('请先登录后再添加费用'); return; }
    const payload = { ...draft, amount: Number(draft.amount), trip_id: selectedTripId };
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('添加失败');
      const item = await res.json();
      setExpenses(prev => [item, ...prev]);
      setDraft({ amount: '', category: 'other', description: '', day: '', time: '' });
    } catch (e) {
      alert('添加失败，请稍后重试');
    }
  };

  const deleteExpense = async (id) => {
    if (!id) return;
    if (!token) { alert('请先登录后再删除费用'); return; }
    try {
      const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('删除失败');
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert('删除失败，请稍后重试');
    }
  };

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
          <Link href="/trips">行程</Link>
          <Link href="/expenses" className="active">费用</Link>
        </nav>
      </header>

      <main className="main-content">
        <h2 className="page-title">旅行费用管理</h2>
        {loadingTrips ? (
          <div className="empty-hint">行程加载中...</div>
        ) : (!trips.length ? (
          <div className="empty-hint">暂无行程，请先保存一个行程后再管理费用。</div>
        ) : (
          <div className="card">
            <div className="input-group">
              <label>选择行程</label>
              <select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
                <option value="">请选择行程</option>
                {trips.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>

            {selectedTripId && (
              <>
                <div className="grid-two-cols">
                  <div className="input-group">
                    <label>金额(¥)</label>
                    <input type="number" min={0} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>类别</label>
                    <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                      <option value="transport">交通</option>
                      <option value="accommodation">住宿</option>
                      <option value="food">餐饮</option>
                      <option value="tickets">门票</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
                <div className="grid-two-cols">
                  <div className="input-group">
                    <label>描述</label>
                    <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>关联天数</label>
                    <input type="number" min={1} value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>时间（如 上午/下午/晚间 或具体时间）</label>
                  <input value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
                </div>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={addExpense}>新增费用</button>
                </div>

                <div style={{ marginTop: 16 }}>
                  <strong>总计：</strong>¥{total}
                  <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Object.entries(byCategory).map(([k, v]) => (
                      <span key={k} style={{ background: 'rgba(0,0,0,0.05)', padding: '6px 10px', borderRadius: 8 }}>{k}: ¥{v}</span>
                    ))}
                  </div>
                </div>

                {loadingExpenses ? (
                  <div className="empty-hint" style={{ marginTop: 12 }}>费用加载中...</div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    {expenses.map(e => (
                      <div key={e.id || `${e.amount}-${e.created_at}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <div>
                          <strong>¥{e.amount}</strong> · {e.category} · {e.description || '—'} {e.day ? `· 第${e.day}天` : ''} {e.time ? `· ${e.time}` : ''}
                        </div>
                        <button className="btn btn-small btn-danger" onClick={() => deleteExpense(e.id)}>删除</button>
                      </div>
                    ))}
                    {!expenses.length && <div className="empty-hint">暂无费用记录</div>}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

