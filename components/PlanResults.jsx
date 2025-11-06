import React, { useState } from 'react';

export default function PlanResults({
  plan,
  expandedActivity,
  setExpandedActivity,
  routePalette,
  highlightDay,
  onPrev,
  onNext,
}) {
  const [compact, setCompact] = useState(true);
  const days = Array.isArray(plan?.itinerary) ? plan.itinerary : [];
  const visibleDays = compact ? days.slice(0, 2) : days;
  return (
    <div className="results-section">
      {plan && (
        <>
          <div className="card plan-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>📋 行程安排{compact ? '（简版）' : ''}</h3>
              {days.length > 2 && (
                <button
                  className="btn btn-small"
                  onClick={() => setCompact(!compact)}
                >
                  {compact ? '展开全部' : '收起到简版'}
                </button>
              )}
            </div>
            {visibleDays.map((day) => (
              <div key={day.day} className="day-plan">
                <div className="day-header">
                  <strong>第 {day.day} 天</strong>
                  {day.transportation && (
                    <span className="transport-info">🚗 {day.transportation}</span>
                  )}
                  {day.accommodation && (
                    <span className="accommodation-info">🏨 {day.accommodation}</span>
                  )}
                </div>
                <ul className="itinerary-items" style={{ maxHeight: compact ? 220 : 'none', overflow: compact ? 'auto' : 'visible' }}>
                  {day.items.map((it, idx) => {
                    const isExpanded =
                      expandedActivity?.day === day.day &&
                      expandedActivity?.time === it.time;
                    return (
                      <li
                        key={idx}
                        className={`itinerary-item ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => {
                          setExpandedActivity(
                            isExpanded ? null : { day: day.day, time: it.time }
                          );
                          highlightDay(day.day);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="time-badge">{it.time}</span>
                        <div className="activity-details">
                          <strong>{it.title}</strong>
                          {it.description && (
                            <span className="activity-desc"> - {it.description}</span>
                          )}
                          {it.type && <span className="activity-type">{it.type}</span>}
                          {isExpanded && it.details && (
                            <div className="activity-details-expanded">
                              <p>{it.details}</p>
                              {it.location && (
                                <p>
                                  <strong>📍 地点：</strong>
                                  {it.location}
                                </p>
                              )}
                              {it.duration && (
                                <p>
                                  <strong>⏱️ 时长：</strong>
                                  {it.duration}
                                </p>
                              )}
                              {it.tips && (
                                <p>
                                  <strong>💡 小贴士：</strong>
                                  {it.tips}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="cost-estimate">
                          ¥
                          {typeof it.costEstimate === 'number' && !isNaN(it.costEstimate)
                            ? it.costEstimate
                            : '--'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {days.length ? (
            <div className="card legend-card" style={{ marginTop: 12 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>🧭 路线图例</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {days.map((day, i) => (
                  <div
                    key={day.day}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 6,
                        background: routePalette[i % routePalette.length],
                        display: 'inline-block',
                        borderRadius: 3,
                      }}
                    ></span>
                    <span style={{ fontSize: 12 }}>第{day.day}天</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
      <div className="action-buttons" style={{ marginTop: 12 }}>
        {onPrev && (
          <button className="btn btn-secondary" onClick={onPrev}>上一步</button>
        )}
        {onNext && (
          <button className="btn btn-primary" onClick={onNext} disabled={!plan}>下一步</button>
        )}
      </div>
    </div>
  );
}
