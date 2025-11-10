import React from 'react';

// 轻量控件组件（内联定义，避免额外文件导入开销）
function MapControls({
  disabled,
  showTraffic,
  showSatellite,
  showRoadNet,
  onToggleTraffic,
  onToggleSatellite,
  onToggleRoadNet,
  onLocate,
  onResetView,
  onToggleSidebar,
  sidebarOpen,
  routeMode,
  setRouteMode,
  showDailyRoutes,
  setShowDailyRoutes,
  daysCount,
  selectedDay,
  onSelectDay,
  searchQuery,
  setSearchQuery,
  suggestions = [],
  onPickSuggestion,
}) {
  return (
    <div className="map-controls">
      {/* 左上：搜索框 */}
      <div className="map-controls__search">
        <input
          type="text"
          placeholder="搜索地点或地址..."
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery?.(e.target.value)}
          disabled={disabled}
        />
        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <div className="map-controls__suggestions">
            {suggestions.slice(0, 6).map((sug, idx) => (
              <div
                key={idx}
                className="map-controls__suggestion"
                onClick={() => onPickSuggestion?.(sug)}
              >
                {sug?.name || sug?.address || sug}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右上：图层与定位组 */}
      <div className="map-controls__group top-right">
        <button className={`btn btn-small ${showTraffic ? 'btn-primary' : ''}`} disabled={disabled} onClick={onToggleTraffic}>交通</button>
        <button className={`btn btn-small ${showSatellite ? 'btn-primary' : ''}`} disabled={disabled} onClick={onToggleSatellite}>卫星</button>
        <button className={`btn btn-small ${showRoadNet ? 'btn-primary' : ''}`} disabled={disabled} onClick={onToggleRoadNet}>路网</button>
        <button className="btn btn-small" disabled={disabled} onClick={onLocate}>定位</button>
        <button className="btn btn-small" disabled={disabled} onClick={onResetView}>重置</button>
        <button className={`btn btn-small ${sidebarOpen ? 'btn-primary' : ''}`} disabled={disabled} onClick={onToggleSidebar}>面板</button>
      </div>

      {/* 右下：路线模式与按日高亮 */}
      <div className="map-controls__group bottom-right">
        <div className="map-controls__row">
          <span className="map-controls__label">路线模式</span>
          <div className="map-controls__segmented">
            <button className={`seg-btn ${routeMode === 'driving' ? 'active' : ''}`} disabled={disabled} onClick={() => setRouteMode?.('driving')}>驾车</button>
            <button className={`seg-btn ${routeMode === 'walking' ? 'active' : ''}`} disabled={disabled} onClick={() => setRouteMode?.('walking')}>步行</button>
            <button className={`seg-btn ${routeMode === 'transit' ? 'active' : ''}`} disabled={disabled} onClick={() => setRouteMode?.('transit')}>公交</button>
          </div>
        </div>
        <div className="map-controls__row">
          <span className="map-controls__label">路线显隐</span>
          <div className="map-controls__segmented">
            <button className={`seg-btn ${showDailyRoutes ? 'active' : ''}`} disabled={disabled} onClick={() => setShowDailyRoutes?.(true)}>显示</button>
            <button className={`seg-btn ${!showDailyRoutes ? 'active' : ''}`} disabled={disabled} onClick={() => setShowDailyRoutes?.(false)}>隐藏</button>
          </div>
        </div>
        {Number.isFinite(daysCount) && daysCount > 0 && (
          <div className="map-controls__row">
            <span className="map-controls__label">按日高亮</span>
            <div className="map-controls__days">
              {Array.from({ length: daysCount }).map((_, i) => (
                <button
                  key={i}
                  className={`day-chip ${selectedDay === (i + 1) ? 'active' : ''}`}
                  disabled={disabled}
                  onClick={() => onSelectDay?.(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="day-chip" disabled={disabled} onClick={() => onSelectDay?.(null)}>清除</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapPanel({
  mapRef,
  loading,
  controlsProps = {},
}) {
  const {
    disabled,
    showTraffic,
    showSatellite,
    showRoadNet,
    onToggleTraffic,
    onToggleSatellite,
    onToggleRoadNet,
    onLocate,
    onResetView,
    onToggleSidebar,
    sidebarOpen,
    routeMode,
    setRouteMode,
    daysCount,
    selectedDay,
    onSelectDay,
    showDailyRoutes,
    setShowDailyRoutes,
    searchQuery,
    setSearchQuery,
    suggestions,
    onPickSuggestion,
  } = controlsProps || {};

  return (
    <div className="map-section">
      <div ref={mapRef} className="map map-container">
        {loading && (
          <div className="map-overlay">
            <div className="loading-spinner"></div>
            <span>地图加载中...</span>
          </div>
        )}
        {/* 控件浮层 */}
        <MapControls
          disabled={disabled}
          showTraffic={showTraffic}
          showSatellite={showSatellite}
          showRoadNet={showRoadNet}
          onToggleTraffic={onToggleTraffic}
          onToggleSatellite={onToggleSatellite}
          onToggleRoadNet={onToggleRoadNet}
          onLocate={onLocate}
          onResetView={onResetView}
          onToggleSidebar={onToggleSidebar}
          sidebarOpen={sidebarOpen}
          routeMode={routeMode}
          setRouteMode={setRouteMode}
          showDailyRoutes={showDailyRoutes}
          setShowDailyRoutes={setShowDailyRoutes}
          daysCount={daysCount}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          suggestions={suggestions}
          onPickSuggestion={onPickSuggestion}
        />
      </div>
    </div>
  );
}
