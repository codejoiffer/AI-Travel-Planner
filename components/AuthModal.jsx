import React from 'react';

export default function AuthModal({
  visible,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authLoading,
  onSignIn,
  onSignUp,
  onClose,
}) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '300px' }}>
        <h3>{authMode === 'login' ? '登录' : '注册'}</h3>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="email"
            placeholder="邮箱"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
          />
          <input
            type="password"
            placeholder="密码"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          <button onClick={authMode === 'login' ? onSignIn : onSignUp} disabled={authLoading}>
            {authLoading ? '处理中...' : (authMode === 'login' ? '登录' : '注册')}
          </button>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#666' }}>
            {authMode === 'login' ? '没有账号？注册' : '已有账号？登录'}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666' }}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

