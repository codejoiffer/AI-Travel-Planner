import React from 'react';

export default function BudgetSummaryCard({ budgetEstimate, expenses, onPrev, onNext }) {
  if (!budgetEstimate) return null;
  return (
    <div className="card budget-card">
      <h3>💰 费用预算</h3>
      <ul>
        <li>交通：¥{budgetEstimate.transport}</li>
        <li>住宿：¥{budgetEstimate.accommodation}</li>
        <li>餐饮：¥{budgetEstimate.food}</li>
        <li>门票：¥{budgetEstimate.tickets}</li>
        <li><strong>合计：¥{budgetEstimate.total}</strong></li>
      </ul>
      <div className="budget-content" style={{ marginTop: 8 }}>
        {(() => {
          const sum = expenses.reduce((s, e) => s + (e.amount || 0), 0);
          const catSum = expenses.reduce((acc, e) => {
            const k = e.category || 'other';
            acc[k] = (acc[k] || 0) + (e.amount || 0);
            return acc;
          }, {});
          return (
            <ul>
              <li><strong>已记录支出：</strong>¥{sum}</li>
              <li>交通：¥{catSum.transport || 0} · 住宿：¥{catSum.accommodation || 0}</li>
              <li>餐饮：¥{catSum.food || 0} · 门票：¥{catSum.tickets || 0} · 其他：¥{catSum.other || 0}</li>
            </ul>
          );
        })()}
      </div>
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
