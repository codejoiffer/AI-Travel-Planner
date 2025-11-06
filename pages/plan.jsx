import React, { useState } from 'react';
import Link from 'next/link';

export default function PlanWizard() {
  const [destination, setDestination] = useState('南京');
  const [days, setDays] = useState(4);
  const [budget, setBudget] = useState(8000);
  const [people, setPeople] = useState(2);
  const [preferences, setPreferences] = useState('美食, 文化, 亲子');
  const [text, setText] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/plan/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days, budget, people, preferences, text })
      });
      const data = await res.json();
      setPlan(data);
      setStep(4);
    } catch (e) {
      setError('生成行程失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    const accessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_access_token') : null;
    if (!accessToken) {
      alert('请先登录后再保存行程');
      window.location.href = '/';
      return;
    }
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ plan, name: `${destination}-${new Date().toISOString().slice(0,10)}` })
      });
      if (!res.ok) throw new Error('保存失败');
      const saved = await res.json();
      if (saved?.id) {
        window.location.href = `/?trip_id=${encodeURIComponent(saved.id)}`;
      } else {
        alert('保存成功，但未返回ID，请前往首页查看');
      }
    } catch (e) {
      alert('保存失败，请稍后重试');
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
          <Link href="/" className="">首页</Link>
          <Link href="/plan" className="active">计划</Link>
          <Link href="/trips" className="">行程</Link>
          <Link href="/expenses" className="">费用</Link>
        </nav>
      </header>

      <main className="main-content">
        <h2 className="page-title">旅行计划向导</h2>
        <div className="steps">
          <div className={`step ${step === 1 ? 'active' : ''}`}>基础信息</div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>偏好与说明</div>
          <div className={`step ${step === 3 ? 'active' : ''}`}>生成确认</div>
          <div className={`step ${step === 4 ? 'active' : ''}`}>结果与操作</div>
        </div>

        {step === 1 && (
          <div className="card">
            <div className="grid-two-cols">
              <div className="input-group">
                <label>目的地</label>
                <input value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div className="input-group">
                <label>天数</label>
                <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid-two-cols">
              <div className="input-group">
                <label>预算(¥)</label>
                <input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label>人数</label>
                <input type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} />
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={nextStep}>下一步</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <div className="input-group">
              <label>偏好标签（逗号分隔）</label>
              <input value={preferences} onChange={(e) => setPreferences(e.target.value)} />
            </div>
            <div className="input-group">
              <label>说明/语音识别文本</label>
              <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={prevStep}>上一步</button>
              <button className="btn btn-primary" onClick={() => { setStep(3); }}>下一步</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card">
            <p>确认无误后点击生成。系统将智能匹配POI并构建行程，同时根据城市半径进行范围过滤，避免越界。</p>
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={prevStep}>上一步</button>
              <button className="btn btn-success" onClick={generatePlan} disabled={loading}>
                {loading ? '生成中...' : '生成行程'}
              </button>
            </div>
            {error && <div className="empty-hint" style={{ marginTop: 12 }}>{error}</div>}
          </div>
        )}

        {step === 4 && (
          <div className="card">
            {!plan ? (
              <div className="empty-hint">尚未生成行程，请返回上一步。</div>
            ) : (
              <>
                <h3>生成结果</h3>
                <p>目的地：<strong>{plan.destination || destination}</strong> · 天数：<strong>{plan.days || days}</strong></p>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(plan.itinerary || []).map((d) => (
                    <div key={d.day} className="day-plan">
                      <div className="day-header">第{d.day}天</div>
                      <div className="itinerary-items">
                        {(d.items || []).map((it, idx) => (
                          <div key={idx} className="itinerary-item">
                            <div className="time">{it.time}</div>
                            <div className="title">{it.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="action-buttons" style={{ marginTop: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>返回修改</button>
                  <button className="btn btn-primary" onClick={savePlan}>保存并在地图中打开</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

