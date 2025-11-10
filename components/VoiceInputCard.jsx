import React from 'react';

export default function VoiceInputCard({
  recognizedText,
  setRecognizedText,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  onPrev,
  onNext,
}) {
  return (
    <div className="card">
      <h3>语音输入</h3>
      <label>识别文本</label>
      <textarea
        rows={3}
        value={recognizedText}
        onChange={(e) => setRecognizedText(e.target.value)}
        placeholder="例如：我想去南京，5天，预算1万元，喜欢美食和风景，带孩子"
      />
      <div className="voice-controls">
        <button
          className={`btn btn-secondary ${isRecording ? 'recording' : ''}`}
          onClick={startRecording}
          disabled={isRecording}
        >
          🎤 {isRecording ? '录音中...' : '开始语音'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          ⏹️ 停止语音
        </button>
        {isRecording && (
          <div className="recording-timer">
            <span className="timer-text">⏱️ {recordingTime}秒</span>
            <div className="timer-progress">
              <div
                className="timer-progress-bar"
                style={{ width: `${(recordingTime / 60) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <div className="action-buttons" style={{ marginTop: 8 }}>
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
