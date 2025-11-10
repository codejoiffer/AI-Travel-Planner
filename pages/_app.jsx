import React from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        /* 全局样式 */
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; 
          margin: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .container { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 20px;
        }
        
        /* 头部样式 */
        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 16px 0;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        /* 顶部子导航 */
        .subheader-nav {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px 12px 20px;
          display: flex;
          gap: 12px;
        }
        .subheader-nav a {
          color: #555;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .subheader-nav a:hover {
          background: rgba(0,0,0,0.06);
        }
        .subheader-nav a.active {
          color: #333;
          background: #fff;
          border-color: rgba(0,0,0,0.1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .welcome-text {
          color: #666;
          font-size: 14px;
        }
        
        /* 按钮样式 */
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #e9ecef;
        }
        
        .btn-secondary:hover {
          background: #e9ecef;
        }
        
        .btn-success {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }
        
        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
        }
        
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        
        .btn-danger:hover {
          background: #c82333;
        }

        /* 页面标题与网格 */
        .page-title {
          margin: 16px 0 8px 0;
          color: #222;
        }
        .grid-two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* 首页网格布局 */
        .main-content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin: 20px 0;
        }

        .map-section {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          background: #fff;
        }

        .map-container {
          width: 100%;
          height: 600px;
          position: relative;
        }

        .map-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .tools-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* 向导步骤条 */
        .steps {
          display: flex;
          gap: 8px;
          margin: 12px 0 16px 0;
        }
        .step {
          flex: 1;
          text-align: center;
          padding: 10px 12px;
          background: rgba(255,255,255,0.85);
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.08);
          color: #666;
          font-weight: 600;
        }
        .step.active {
          background: #fff;
          color: #333;
          border-color: rgba(0,0,0,0.12);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        /* 卡片列表与空态 */
        .empty-hint {
          color: #666;
          background: rgba(255,255,255,0.8);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.06);
          text-align: center;
        }
        
        /* 地图标记动画 */
        @keyframes markerPulse {
          0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
          50% { transform: scale(1.05); box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
          100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        }
        
        @keyframes iconBounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-2px); }
        }
        
        @keyframes routeFlow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        /* 信息窗口动画 */
        @keyframes infoWindowFadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        /* 高德地图信息窗口自定义样式 */
        .amap-info {
          animation: infoWindowFadeIn 0.3s ease-out !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          border: none !important;
        }
        
        .amap-info-content {
          border-radius: 12px !important;
          padding: 0 !important;
          background: transparent !important;
        }
        
        /* 地图加载动画 */
        @keyframes mapFadeIn {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .map-container {
          animation: mapFadeIn 0.8s ease-out;
          transition: all 0.3s ease;
        }
        
        .map-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: 600;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .btn-small {
          padding: 8px 16px;
          font-size: 12px;
        }
        
        .btn-large {
          padding: 16px 32px;
          font-size: 16px;
        }
        
        /* 主内容区域 */
        .main-content {
          padding: 40px 0;
        }
        
        /* 欢迎页面 */
        .welcome-section {
          text-align: center;
          color: white;
        }
        
        .hero {
          margin-bottom: 60px;
        }
        
        .hero h2 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .hero p {
          font-size: 20px;
          margin-bottom: 32px;
          opacity: 0.9;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-top: 60px;
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .feature-card h3 {
          font-size: 20px;
          margin-bottom: 12px;
          color: white;
        }
        
        .feature-card p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
        }
        
        /* 工具区域 */
        .tool-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        
        /* 卡片样式 */
        .card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }
        
        .card h3 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #333;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 12px;
        }
        
        /* 输入组 */
        .input-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        input, textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
        }
        
        textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        /* 操作按钮 */
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        
        .voice-controls {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        
        /* 结果区域 */
        .results-section {
          display: grid;
          gap: 24px;
        }
        
        .plan-card, .budget-card, .saved-trips-card {
          margin-bottom: 0;
        }
        
        .plan-content, .budget-content {
          line-height: 1.6;
        }
        
        .plan-content ul, .budget-content ul {
          padding-left: 20px;
          margin: 0;
        }
        
        .plan-content li, .budget-content li {
          margin-bottom: 8px;
          position: relative;
        }
        
        .plan-content li::before {
          content: '📍';
          position: absolute;
          left: -24px;
          top: 2px;
        }
        
        .budget-content li::before {
          content: '💰';
          position: absolute;
          left: -24px;
          top: 2px;
        }
        
        /* 行程卡片美化 */
        .plan-card, .budget-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .plan-card h3, .budget-card h3 {
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          border-bottom: 2px solid rgba(102, 126, 234, 0.2);
        }
        
        /* 费用总计突出显示 */
        .budget-content li:last-child {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-weight: 600;
          border-left: 4px solid #667eea;
        }

        /* 详细行程样式 */
        .day-plan {
          margin-bottom: 32px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .day-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .day-header strong {
          font-size: 20px;
          color: #1f2937;
        }

        .transport-info,
        .accommodation-info {
          font-size: 14px;
          color: #6b7280;
          background: rgba(59, 130, 246, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .accommodation-info {
          background: rgba(234, 88, 12, 0.1);
        }

        .itinerary-items {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .itinerary-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          margin-bottom: 12px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          border: 1px solid rgba(229, 231, 235, 0.8);
          transition: all 0.2s ease;
        }

        .itinerary-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.itinerary-item.expanded {
  background: rgba(248, 250, 252, 0.95);
  border-color: #3b82f6;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
}

.activity-details-expanded {
  margin-top: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.activity-details-expanded p {
  margin: 8px 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.activity-details-expanded strong {
  color: #1f2937;
  font-weight: 600;
}

        .time-badge {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          min-width: 60px;
          text-align: center;
        }

        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-details strong {
          color: #1f2937;
          font-size: 16px;
        }

        .activity-desc {
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
        }

        .activity-type {
          background: rgba(139, 92, 246, 0.1);
          color: #7c3aed;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          align-self: flex-start;
        }

        .cost-estimate {
          font-weight: 600;
          color: #059669;
          font-size: 16px;
        }
        
        /* 已保存行程 */
        .trips-list {
          display: grid;
          gap: 12px;
        }
        
        .trip-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .trip-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .trip-date {
          font-size: 12px;
          color: #666;
        }
        
        .trip-actions {
          display: flex;
          gap: 8px;
        }
        
        /* 地图 */
        .map { 
          height: 500px; 
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          margin-bottom: 24px;
          position: relative; /* 支持覆盖层 */
        }

        /* 地图加载覆盖层 */
        .map-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
          color: white;
          font-size: 18px;
          font-weight: 600;
          z-index: 10;
          pointer-events: none;
        }

        /* 地图交互控件浮层 */
        .map-controls {
          position: absolute;
          inset: 0;
          pointer-events: none; /* 默认不阻挡地图，仅控件区域可点击 */
        }
        .map-controls__group {
          position: absolute;
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 10px;
          padding: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          z-index: 20;
          pointer-events: auto; /* 可点击 */
        }
        .map-controls__group.top-right { top: 12px; right: 12px; }
        .map-controls__group.bottom-right { bottom: 12px; right: 12px; flex-direction: column; gap: 10px; }

        .map-controls__row { display: flex; align-items: center; gap: 8px; }
        .map-controls__label { font-size: 12px; color: #333; opacity: 0.8; }
        .map-controls__segmented { display: inline-flex; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .seg-btn { padding: 6px 10px; font-size: 12px; background: white; border: none; border-right: 1px solid #e9ecef; cursor: pointer; }
        .seg-btn:last-child { border-right: none; }
        .seg-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .seg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .map-controls__days { display: flex; gap: 6px; flex-wrap: wrap; }
        .day-chip { padding: 4px 8px; font-size: 12px; border-radius: 16px; border: 1px solid #e9ecef; background: white; cursor: pointer; }
        .day-chip.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .day-chip:disabled { opacity: 0.6; cursor: not-allowed; }

        .map-controls__search { position: absolute; top: 12px; left: 12px; z-index: 20; pointer-events: auto; }
        .map-controls__search input {
          width: 280px;
          padding: 10px 12px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .map-controls__search input:disabled { opacity: 0.6; cursor: not-allowed; }

        .map-controls__suggestions {
          margin-top: 6px;
          width: 280px;
          max-height: 220px;
          overflow: auto;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e9ecef;
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        }
        .map-controls__suggestion { padding: 8px 10px; font-size: 13px; cursor: pointer; }
        .map-controls__suggestion:hover { background: #f3f4f6; }
        
        /* 地图标记样式 */
        .amap-marker {
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
        }
        
        /* 地图控制按钮 */
        .amap-controls {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* 地图信息窗口 */
        .amap-info {
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
          backdrop-filter: blur(10px) !important;
        }
        
        .amap-info-content {
          border-radius: 12px !important;
          padding: 16px !important;
          font-family: inherit !important;
        }
        
        /* 模态框 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal {
          background: white;
          padding: 32px;
          border-radius: 16px;
          min-width: 400px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .modal h3 {
          margin-bottom: 24px;
          text-align: center;
          color: #333;
        }
        
        .modal-input-group {
          margin-bottom: 16px;
        }
        
        .modal-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .modal-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
          .tool-section {
            grid-template-columns: 1fr;
          }
          
          .row {
            grid-template-columns: 1fr;
          }
          
          .features {
            grid-template-columns: 1fr;
          }
          
          .hero h2 {
            font-size: 32px;
          }
          
          .hero p {
            font-size: 16px;
          }
          
          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .trip-item {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .trip-actions {
            justify-content: center;
          }
        }
        /* 全屏首页与侧边栏 */
        .main-content--fullscreen { padding: 8px 0; }
        .map-fullscreen { position: relative; }
        .map-fullscreen .map-container { height: calc(100vh - 140px); }
        .sidebar-panel {
          position: absolute;
          top: 12px;
          left: calc(12px + var(--nav-rail-width, 56px) + 8px);
          bottom: 12px;
          width: var(--sidebar-width, 400px);
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          transform: translateX(-110%);
          transition: transform 0.25s ease;
          display: flex;
          flex-direction: column;
          z-index: 30;
        }
        .sidebar-panel.open { transform: translateX(0); }
        .sidebar-content { display: flex; flex-direction: column; overflow: hidden; padding: 12px; height: 100%; position: relative; }
        .sidebar-header { position: sticky; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(6px); z-index: 1; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.06); }
        .sidebar-body { flex: 1; overflow-y: auto; padding-top: 10px; }
        .sidebar-panel .steps { display: flex; flex-direction: column; gap: 8px; margin: 4px 0 0; }
        .sidebar-panel .step { display: flex; align-items: center; gap: 8px; text-align: left; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.06); }
        .sidebar-panel .step:hover { background: rgba(255,255,255,0.95); }
        .sidebar-panel .step.active { border-left: 3px solid #667eea; background: #fff; border-color: rgba(0,0,0,0.12); }
        .sidebar-panel .step.done { border-left: 3px solid #52c41a; }
        .sidebar-panel .step.todo { border-left: 3px solid transparent; }
        .step-icon { width: 20px; text-align: center; }
        .step-label { font-weight: 600; color: #333; }
        .step-status { margin-left: auto; font-size: 12px; padding: 2px 8px; border-radius: 12px; background: #eef2ff; color: #4f46e5; }
        .step.done .step-status { background: #edf7ed; color: #1a7f37; }
        .step.todo .step-status { background: #f5f5f5; color: #666; }
        .sidebar-resizer { position: absolute; top: 0; right: 0; bottom: 0; width: 8px; cursor: ew-resize; background: linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.08)); border-radius: 0 12px 12px 0; }
        .sidebar-resizer::after { content: ''; position: absolute; top: 50%; left: 2px; width: 4px; height: 24px; border-radius: 2px; background: rgba(0,0,0,0.12); transform: translateY(-50%); }
        .sidebar-footer { display: none; gap: 8px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.92); }
        .sidebar-footer .btn { flex: 1; }

        /* 左侧窄导航栏 */
        .nav-rail {
          position: absolute;
          top: 12px;
          left: 12px;
          bottom: 12px;
          width: var(--nav-rail-width, 56px);
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 6px;
          gap: 8px;
          z-index: 31;
        }
        .nav-item {
          width: 100%;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(0,0,0,0.06);
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease;
          position: relative;
        }
        .nav-item:hover { background: rgba(255,255,255,0.95); }
        .nav-item.active { border: 2px solid #667eea; background: #fff; }
        .nav-item.done { border: 2px solid #52c41a; }
        .nav-item.todo { border: 1px solid rgba(0,0,0,0.06); }
        .nav-icon { font-size: 18px; }

        /* 窄导航气泡提示 */
        .nav-tooltip {
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%) translateX(-6px);
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.12);
          padding: 6px 10px;
          display: flex;
          gap: 6px;
          align-items: center;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 32;
        }
        .nav-item:hover .nav-tooltip { opacity: 1; transform: translateY(-50%) translateX(0); }
        .nav-tip-label { font-weight: 600; color: #333; }
        .nav-tip-status { font-size: 12px; padding: 2px 8px; border-radius: 12px; background: #eef2ff; color: #4f46e5; }
        .nav-item.done .nav-tip-status { background: #edf7ed; color: #1a7f37; }
        .nav-item.todo .nav-tip-status { background: #f5f5f5; color: #666; }

        /* 解除宽度限制的容器（可用于需要全屏内容的页面） */
        .container-fluid { width: 100%; max-width: none; margin: 0; padding: 0; }

        @media (max-width: 768px) {
          .map-fullscreen .map-container { height: calc(100vh - 180px); }
          .sidebar-panel {
            width: min(92vw, 420px);
            left: 12px; /* 移动端侧栏底部显示，不受左侧窄导航影响 */
            right: auto;
            top: auto;
            bottom: 12px;
            height: 60vh;
          }
          .nav-rail { width: 48px; top: 12px; left: 12px; bottom: auto; }
          .sidebar-header { top: 0; }
          .sidebar-resizer { display: none; }
          .sidebar-footer { position: sticky; bottom: 0; display: flex; }
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
