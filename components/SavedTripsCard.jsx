import React from 'react';

export default function SavedTripsCard({ savedTrips, loadTrip, deleteTrip, canSave, onSavePlan, onPrev, onNext }) {
  return (
    <div className="card saved-trips-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>📁 已保存行程</h3>
        {canSave && (
          <button className="btn btn-success" onClick={onSavePlan}>
            💾 保存当前行程
          </button>
        )}
      </div>

      {!savedTrips?.length && (
        <div className="empty-hint" style={{ marginTop: 8 }}>暂无已保存行程。</div>
      )}

      {!!savedTrips?.length && (
        <div className="trips-list">
          {savedTrips.map((t) => (
            <div key={t.id} className="trip-item">
              <div className="trip-info">
                <strong>{t.name}</strong>
                <span className="trip-date">{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <div className="trip-actions">
                <button className="btn btn-small" onClick={() => loadTrip(t)}>
                  📂 加载
                </button>
                <button className="btn btn-small btn-danger" onClick={() => deleteTrip(t.id)}>
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons" style={{ marginTop: 12 }}>
        {onPrev && (
          <button className="btn btn-secondary" onClick={onPrev}>上一步</button>
        )}
        {onNext && (
          <button className="btn btn-primary" onClick={onNext}>下一步</button>
        )}
      </div>
    </div>
  );
}
