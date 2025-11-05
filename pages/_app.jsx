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
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
