import React from 'react';

export default function MapPanel({ mapRef, loading }) {
  return (
    <div className="map-section">
      <div ref={mapRef} className="map map-container">
        {loading && (
          <div className="map-overlay">
            <div className="loading-spinner"></div>
            <span>地图加载中...</span>
          </div>
        )}
      </div>
    </div>
  );
}

