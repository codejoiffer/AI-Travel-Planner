import React from 'react';

export default function WelcomeSection({ onGetStarted }) {
  return (
    <div className="welcome-section">
      <div className="hero">
        <h2>开启您的智能旅行规划之旅</h2>
        <p>AI 驱动的个性化旅行规划，为您量身定制完美行程</p>
        <button className="btn btn-primary btn-large" onClick={onGetStarted}>
          立即开始
        </button>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🗺️</div>
          <h3>智能行程规划</h3>
          <p>基于AI算法为您生成个性化的旅行路线</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>预算管理</h3>
          <p>智能预算分配，让旅行更经济实惠</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💾</div>
          <h3>行程保存</h3>
          <p>登录后可保存和管理多个旅行计划</p>
        </div>
      </div>
    </div>
  );
}

