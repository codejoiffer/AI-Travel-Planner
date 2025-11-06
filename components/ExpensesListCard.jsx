import React from 'react';

export default function ExpensesListCard({
  expenseDraft,
  setExpenseDraft,
  recognizedText,
  parseSpeechToExpense,
  saveExpense,
  expenses,
  deleteExpense,
  onPrev,
  onNext,
}) {
  return (
    <div className="card budget-card">
      <h3>🧾 费用记录</h3>
      <div className="row">
        <div className="input-group">
          <label>金额（元）</label>
          <input
            type="number"
            min={0}
            value={expenseDraft.amount}
            onChange={(e) => setExpenseDraft({ ...expenseDraft, amount: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label>类别</label>
          <select
            value={expenseDraft.category}
            onChange={(e) => setExpenseDraft({ ...expenseDraft, category: e.target.value })}
          >
            <option value="transport">交通</option>
            <option value="accommodation">住宿</option>
            <option value="food">餐饮</option>
            <option value="tickets">门票</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>
      <div className="row">
        <div className="input-group">
          <label>描述</label>
          <input
            value={expenseDraft.description}
            onChange={(e) => setExpenseDraft({ ...expenseDraft, description: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label>关联天数</label>
          <input
            type="number"
            min={1}
            value={expenseDraft.day}
            onChange={(e) => setExpenseDraft({ ...expenseDraft, day: e.target.value })}
          />
        </div>
      </div>
      <div className="action-buttons">
        <button
          className="btn btn-secondary"
          onClick={() => {
            const exp = parseSpeechToExpense(recognizedText);
            if (exp)
              setExpenseDraft({
                amount: String(exp.amount),
                category: exp.category,
                description: exp.description || '',
                day: exp.day ? String(exp.day) : '',
                time: exp.time || '',
              });
            else alert('识别文本未检测到消费信息');
          }}
        >
          🗣️ 从识别文本提取
        </button>
        <button className="btn btn-primary" onClick={saveExpense}>➕ 添加支出</button>
      </div>

      {/* 汇总与列表 */}
      <div className="budget-content" style={{ marginTop: 12 }}>
        {(() => {
          const sum = expenses.reduce((s, e) => s + (e.amount || 0), 0);
          const catSum = expenses.reduce((acc, e) => {
            const k = e.category || 'other';
            acc[k] = (acc[k] || 0) + (e.amount || 0);
            return acc;
          }, {});
          return (
            <ul>
              <li><strong>本次行程已记录支出：</strong>¥{sum}</li>
              <li>交通：¥{catSum.transport || 0} · 住宿：¥{catSum.accommodation || 0}</li>
              <li>餐饮：¥{catSum.food || 0} · 门票：¥{catSum.tickets || 0} · 其他：¥{catSum.other || 0}</li>
            </ul>
          );
        })()}
      </div>
      {!!expenses.length && (
        <div style={{ marginTop: 8 }}>
          {expenses.map((e) => (
            <div
              key={e.id || `${e.amount}-${e.created_at}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div>
                <strong>¥{e.amount}</strong> · {e.category} · {e.description || '—'}{' '}
                {e.day ? `· 第${e.day}天` : ''} {e.time ? `· ${e.time}` : ''}
              </div>
              <button className="btn btn-small btn-danger" onClick={() => deleteExpense(e.id)}>
                删除
              </button>
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
