import React from 'react';
import Link from 'next/link';

export default function HeaderBar({ user, onSignOut, onShowAuth, pathname }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">✈️ AI 旅行规划师</h1>
        <div className="header-actions">
          {user ? (
            <div className="user-info">
              <span className="welcome-text">欢迎, {user.email}</span>
              <button className="btn btn-secondary" onClick={onSignOut}>退出</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onShowAuth}>
              登录/注册
            </button>
          )}
        </div>
      </div>
      <nav className="subheader-nav">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>首页</Link>
        <Link href="/plan" className={pathname === '/plan' ? 'active' : ''}>计划</Link>
        <Link href="/trips" className={pathname === '/trips' ? 'active' : ''}>行程</Link>
        <Link href="/expenses" className={pathname === '/expenses' ? 'active' : ''}>费用</Link>
      </nav>
    </header>
  );
}

