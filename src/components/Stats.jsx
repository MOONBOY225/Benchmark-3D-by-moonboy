export default function Stats({
  fps, averageFps, meshCount, memory, elapsed, duration, score, stability, mode,
  minFps, maxFps, onePercentLow, throttled, cpuMops, workerCount, sceneLabel, sceneIcon, breakdown,
}) {
  const fpsClass = fps > 50 ? 'good' : fps > 30 ? 'ok' : 'bad';
  const maxBreakdownScore = Math.max(...(breakdown || []).map((item) => item.score || 0), 1);

  return (
    <div className="stats">
      <div className="result-heading">
        {sceneIcon && <span className="scene-icon">{sceneIcon}</span>}
        {mode === 'suite' ? 'Suite complète' : sceneLabel} — Résultats {elapsed >= duration ? 'finaux' : 'en direct'}
      </div>
      {throttled && <div className="throttle-badge">⚠ Ralentissement thermique détecté</div>}
      <div className="score-hero">{score?.toLocaleString('fr-FR') ?? '--'}</div>
      <div className="stat-grid">
        <div className="stat-item"><span className="stat-label">FPS actuels</span><strong className={`stat-value ${fpsClass}`}>{fps || '--'}</strong></div>
        <div className="stat-item"><span className="stat-label">FPS moyen</span><strong className="stat-value">{averageFps || '--'}</strong></div>
        {mode !== 'cpu' && (
          <>
            <div className="stat-item"><span className="stat-label">FPS min / max</span><strong className="stat-value small">{minFps ?? '--'} / {maxFps ?? '--'}</strong></div>
            <div className="stat-item"><span className="stat-label">1% low</span><strong className="stat-value small">{onePercentLow ?? '--'} FPS</strong></div>
          </>
        )}
        {mode === 'stability' && <div className="stat-item"><span className="stat-label">Stabilité</span><strong className="stat-value">{stability}%</strong></div>}
        {mode === 'cpu' && workerCount > 0 && <div className="stat-item"><span className="stat-label">Cœurs sollicités</span><strong className="stat-value">{workerCount}</strong></div>}
        {mode === 'cpu' && cpuMops > 0 && <div className="stat-item"><span className="stat-label">Débit</span><strong className="stat-value small">{cpuMops} M ops/s</strong></div>}
        {mode !== 'cpu' && mode !== 'stability' && <div className="stat-item"><span className="stat-label">Charge scène</span><strong className="stat-value">{meshCount?.toLocaleString('fr-FR') ?? '--'}</strong></div>}
        <div className="stat-item"><span className="stat-label">Progression</span><strong className="stat-value small">{elapsed}s / {duration}s</strong></div>
        <div className="stat-item"><span className="stat-label">Mémoire JS</span><strong className="stat-value small">{memory}</strong></div>
      </div>
      {breakdown?.length > 0 && (
        <div className="breakdown">
          <div className="breakdown-title">Détail par scène</div>
          {breakdown.map((item) => (
            <div key={item.id} className="breakdown-row">
              <span className="breakdown-label">{item.icon} {item.label}</span>
              <span className="breakdown-bar">
                <i style={{ width: `${Math.round(((item.score || 0) / maxBreakdownScore) * 100)}%` }} />
              </span>
              <strong>{item.score?.toLocaleString('fr-FR') ?? '--'}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
