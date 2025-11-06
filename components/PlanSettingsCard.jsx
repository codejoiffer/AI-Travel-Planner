import React from 'react';

export default function PlanSettingsCard({
  destination, setDestination,
  days, setDays,
  budget, setBudget,
  people, setPeople,
  preferences, setPreferences,
  routeMode, setRouteMode,
  showDailyRoutes, setShowDailyRoutes,
  generatePlan, loadingPlan,
  plan,
  savePlan,
  onPrev,
  onNext,
}) {
  return (
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
      <div className="row">
        <div className="input-group">
          <label>交通模式</label>
          <select value={routeMode} onChange={(e) => setRouteMode(e.target.value)}>
            <option value="driving">驾车</option>
            <option value="walking">步行</option>
            <option value="transit">公交/地铁</option>
          </select>
        </div>
        <div className="input-group" style={{ alignItems: 'center' }}>
          <label style={{ marginRight: 8 }}>显示每日路线</label>
          <input type="checkbox" checked={showDailyRoutes} onChange={(e) => setShowDailyRoutes(e.target.checked)} />
        </div>
      </div>
      <div className="action-buttons">
        {onPrev && (
          <button className="btn btn-secondary" onClick={onPrev}>上一步</button>
        )}
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
            onClick={() => {
              savePlan();
              if (onNext) onNext();
            }} 
            disabled={!plan}
          >
            💾 保存行程
          </button>
        )}
        {onNext && (
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (plan) onNext(); else generatePlan();
            }}
            disabled={loadingPlan && !plan}
          >
            下一步
          </button>
        )}
      </div>
    </div>
  );
}
